const express = require ("express");
const fs = require("fs");
const path = require ("path");
const cors = require ("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../frontend")));

const DB_FILE = path.join(__dirname, "db.json");

function readDB(){
    if (!fs.existsSync (DB_FILE)){
        return { usuarios: [], pacientes: [], triagens: [], consultas: [] };
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.post("/login", (req, res) => {
    const db = readDB();
    const user = db.usuarios.find(
        u => u.usuario === req.body.usuarios && u.senha === req.body.senha
    );

    if (!user) return res.status(401).json({ erro: "Login inválido" });
    
    res.json(user);
});


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

app.post("/triagem", (req, res) => {
    const db = readDB();

    let risco = req.body.risco;

    if (req.body.temperatura > 39) risco = "vermelho";
    if (req.bodu.temperatura < 38 && risco !== "vermelho") risco = "amarelo";

    const triagem = {
        id: Date.now(),
        ...req.body,
        risco,
        status: "aguardando_medico"
    };

    db.triagens.push(triagem);
    writeDB(db);

    res.json(triagem);
});

app.get("/triagens", (req, res) => {
    const db = readDB();
    res.json(db.triagens);
});

app.post("/consulta", (req, res) => {
    const db = readDB();

    const consulta = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date()
    };
    
    db.consultas.push(consulta);
    writeDB(db);

    res.json(consulta);
});

app.get("/medicacoes", (req, res) => {
    const db = readDB();
res.json(db.consultas);
});

app.listen(3000, () => {
    console.log ("🏥 Hospital Pro rodando em http://localhost:3000");
});
