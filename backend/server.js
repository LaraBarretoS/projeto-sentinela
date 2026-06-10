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

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);

// =========================
// BANCO DE DADOS
// =========================

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {

    if (!fs.existsSync(DB_FILE)) {

        const initialData = {

            usuarios: [
                {
                    usuario: "atendimento",
                    senha: "123",
                    tipo: "atendimento"
                },
                {
                    usuario: "triagem",
                    senha: "123",
                    tipo: "triagem"
                },
                {
                    usuario: "medico",
                    senha: "123",
                    tipo: "medico"
                }
            ],

            pacientes: [],
            triagens: [],
            consultas: []

        };

        fs.writeFileSync(
            DB_FILE,
            JSON.stringify(initialData, null, 2)
        );

        return initialData;
    }

    return JSON.parse(
        fs.readFileSync(DB_FILE, "utf8")
    );
}

function writeDB(data) {

    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(data, null, 2)
    );

}

// =========================
// LOGIN
// =========================

app.post("/login", (req, res) => {

    const db = readDB();

    const user = db.usuarios.find(
        u =>
            u.usuario === req.body.usuario &&
            u.senha === req.body.senha
    );

    if (!user) {

        return res.status(401).json({
            erro: "Usuário ou senha inválidos"
        });

    }

    res.json(user);

});

// =========================
// ATENDIMENTO
// =========================

app.post("/atendimento", (req, res) => {

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

});

// =========================
// TRIAGEM
// =========================

app.post("/triagem", (req, res) => {

    const db = readDB();

    let risco = req.body.risco || "verde";

    if (Number(req.body.temperatura) > 39) {
        risco = "vermelho";
    } else if (Number(req.body.temperatura) >= 38) {
        risco = "amarelo";
    }

    const triagem = {

        id: Date.now(),
        nome: req.body.nome,
        sintoma: req.body.sintoma,
        temperatura: req.body.temperatura,
        alergia: req.body.alergia,
        observacao: req.body.observacao,
        risco,
        status: "aguardando_medico",
        createdAt: new Date().toISOString()

    };

    db.triagens.push(triagem);

    writeDB(db);

    res.json(triagem);

});

// =========================
// LISTAR TRIAGENS
// =========================

app.get("/triagens", (req, res) => {

    const db = readDB();

    res.json(db.triagens);

});

// =========================
// CONSULTA
// =========================

app.post("/consulta", (req, res) => {

    const db = readDB();

    const consulta = {

        id: Date.now(),
        paciente: req.body.paciente,
        diagnostico: req.body.diagnostico,
        medicacao: req.body.medicacao,
        obs: req.body.obs,
        createdAt: new Date().toISOString()

    };

    db.consultas.push(consulta);

    writeDB(db);

    res.json(consulta);

});

// =========================
// MEDICAÇÕES
// =========================

app.get("/medicacoes", (req, res) => {

    const db = readDB();

    res.json(db.consultas);

});

// =========================
// STATUS API
// =========================

app.get("/api/status", (req, res) => {

    res.json({

        status: "online",
        mensagem: "Servidor funcionando"

    });

});

// =========================
// ROTA PRINCIPAL
// =========================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../frontend/index.html"
        )
    );

});

// =========================
// EXPORTAÇÃO VERCEL
// =========================

module.exports = app;

// =========================
// EXECUÇÃO LOCAL
// =========================

if (require.main === module) {

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {

        console.log(`Servidor rodando na porta ${PORT}`);

    });

}
