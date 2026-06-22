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
// Força o caminho do arquivo a ser absoluto e correto na estrutura do Render
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
// ATENDIMENTO
// =========================
app.post("/atendimentos", (req, res) => {
    try {
        const db = readDB();
        const paciente = {
            id: Date.now(),
            nome: req.body.nome,
            cpf: req.body.cpf,
            tipo: req.body.tipo,
            status: "triagem",
            createdAt: new Date().toISOString()
        };

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

        // CORRIGIDO: Aceita tanto 'observacao' vindo do front quanto 'observacoes'
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

        // Garante que o array existe antes de dar o push
        if (!db.triagens) db.triagens = [];
        
        db.triagens.push(triagem);
        writeDB(db);

        res.json(triagem);
    } catch (error) {
        console.error("Erro interno na rota /triagens:", error);
        res.status(500).json({ erro: "Erro interno ao processar triagem no servidor." });
    }
});

// =========================
// CONSULTA
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
        writeDB(db);

        res.json(consulta);
    } catch (e) {
        res.status(500).json({ erro: "Falha ao salvar consulta" });
    }
});

// =========================
// MEDICAÇÕES
// =========================
app.get("/medicacoes", (req, res) => {
    const db = readDB();
    res.json(db.consultas || []);
});

// =========================
// CONFIGURAÇÃO DA PORTA DINÂMICA
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
