const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// =========================
// FRONTEND
// =========================
app.use(express.static(path.join(__dirname, "../frontend")));

// =========================
// BANCO DE DADOS
// =========================
const DB_FILE = path.resolve(__dirname, "db.json");

function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const initialData = {
                usuarios: [
                    { usuario: "atendimento", senha: "123", tipo: "atendimento" },
                    { usuario: "triagem", senha: "123", tipo: "triagem" },
                    { usuario: "medico", senha: "123", tipo: "medico" }
                ],
                pacientes: [],
                triagens: [],
                consultas: []
            };
            fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
            return initialData;
        }
        const data = fs.readFileSync(DB_FILE, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Erro ao ler banco de dados:", error);
        return { usuarios: [], pacientes: [], triagens: [], consultas: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
        console.error("Erro ao escrever no banco de dados:", error);
    }
}

// =========================
// LOGIN
// =========================
app.post("/login", (req, res) => {
    const { usuario, senha } = req.body;
    const db = readDB();
    const user = db.usuarios.find(u => u.usuario === usuario && u.senha === senha);

    if (user) {
        res.json({ tipo: user.tipo });
    } else {
        res.status(401).json({ erro: "Usuário ou senha inválidos" });
    }
});

// =========================
// ATENDIMENTO (Recepção)
// =========================
// Rota para listar os pacientes cadastrados que ainda NÃO passaram pela triagem
app.get("/pacientes", (req, res) => {
    const db = readDB();
    // Filtra para mostrar apenas pacientes com status "triagem" (aguardando)
    const aguardando = db.pacientes.filter(p => p.status === "triagem");
    res.json(aguardando);
});

app.post("/atendimentos", (req, res) => {
    try {
        const db = readDB();
        const paciente = {
            id: Date.now(),
            nome: req.body.nome,
            cpf: req.body.cpf,
            tipo: req.body.tipo,
            telefone: req.body.telefone || "",
            idade: Number(req.body.idade) || 0,
            responsavel: req.body.responsavel || "",
            status: "triagem", // Aguardando triagem
            createdAt: new Date().toISOString()
        };

        if (!db.pacientes) db.pacientes = [];
        db.pacientes.push(paciente);
        writeDB(db);
        res.json(paciente);
    } catch (e) {
        res.status(500).json({ erro: "Falha ao salvar atendimento" });
    }
});

// =========================
// TRIAGEM
// =========================
app.get("/triagens", (req, res) => {
    const db = readDB();
    res.json(db.triagens);
});

app.post("/triagens", (req, res) => {
    try {
        const db = readDB();

        const triagem = {
            id: Date.now(),
            nome: req.body.nome,
            sintoma: req.body.sintoma,
            temperatura: req.body.temperatura,
            alergia: req.body.alergia,
            observacao: req.body.observacao || req.body.observacoes || "",
            risco: req.body.risco,
            createdAt: new Date().toISOString()
        };

        if (!db.triagens) db.triagens = [];
        db.triagens.push(triagem);

        // REGRA DE INTEGRAÇÃO: Se o paciente existia na lista de espera, muda o status dele para "medico"
        if (db.pacientes) {
            const index = db.pacientes.findIndex(p => p.nome.toLowerCase() === req.body.nome.toLowerCase() && p.status === "triagem");
            if (index !== -1) {
                db.pacientes[index].status = "atendido";
            }
        }

        writeDB(db);
        res.json(triagem);
    } catch (error) {
        console.error("Erro interno na rota /triagens:", error);
        res.status(500).json({ erro: "Erro interno ao processar triagem no servidor." });
    }
});

// =========================
// CONSULTA (Médico) - ATUALIZADO
// =========================
app.post("/consulta", (req, res) => {
    try {
        const db = readDB();
        const consulta = {
            id: Date.now(),
            paciente: req.body.paciente,
            diagnostico: req.body.diagnostico,
            medicacao: req.body.medicacao,
            obs: req.body.obs,
            createdAt: new Date().toISOString()
        };

        if (!db.consultas) db.consultas = [];
        db.consultas.push(consulta);

        // REGRA DE SUMIR DA FILA: Procura o paciente na lista global pelo nome e muda o status dele
        if (db.pacientes) {
            // Buscamos o paciente que estava aguardando atendimento médico
            const index = db.pacientes.findIndex(p => p.nome.toLowerCase() === req.body.paciente.toLowerCase());
            if (index !== -1) {
                db.pacientes[index].status = "finalizado"; // Agora ele some de todas as filas ativos
            }
        }

        writeDB(db);
        res.json(consulta);
    } catch (e) {
        console.error("Erro ao salvar consulta:", e);
        res.status(500).json({ erro: "Falha ao salvar consulta" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
