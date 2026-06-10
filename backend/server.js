const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../frontend")));

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        return {
            usuarios: [],
            pacientes: [],
            triagens: [],
            consultas: []
        };
    }

    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// LOGIN
app.post("/login", (req, res) => {
    const db = readDB();

    const user = db.usuarios.find(
        u =>
            u.usuario === req.body.usuario &&
            u.senha === req.body.senha
    );

    if (!user) {
        return res.status(401).json({
            erro: "Login inválido"
        });
    }

    res.json(user);
});

// ATENDIMENTO
app.post("/atendimento", (req, res) => {
    const db = readDB();

    const paciente = {
        id: Date.now(),
        ...req.body,
        status: "triagem",
        createdAt: new Date()
    };

    db.pacientes.push(paciente);

    writeDB(db);

    res.json(paciente);
});

// TRIAGEM
app.post("/triagem", (req, res) => {
    const db = readDB();

    let risco = req.body.risco;

    if (req.body.temperatura > 39) {
        risco = "vermelho";
    }

    if (req.body.temperatura < 38 && risco !== "vermelho") {
        risco = "amarelo";
    }

    const triagem = {
        id: Date.now(),
        ...req.body,
        risco,
        status: "aguardando_medico"
    };

    if (!db.triagens) {
        db.triagens = [];
    }

    db.triagens.push(triagem);

    writeDB(db);

    res.json(triagem);
});

// LISTAR TRIAGENS
app.get("/triagens", (req, res) => {
    const db = readDB();

    res.json(db.triagens || []);
});

// CONSULTA
app.post("/consulta", (req, res) => {
    const db = readDB();

    const consulta = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date()
    };

    if (!db.consultas) {
        db.consultas = [];
    }

    db.consultas.push(consulta);

    writeDB(db);

    res.json(consulta);
});

// MEDICAÇÕES
app.get("/medicacoes", (req, res) => {
    const db = readDB();

    res.json(db.consultas || []);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});
