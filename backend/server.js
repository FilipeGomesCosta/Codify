require("./config/database");
const express = require("express");
const app = express();
const usuariosRoutes =  require("./routes/usuarios")
const missoesRoutes = require("./routes/missoes")

app.use(express.json())
app.use("/api/usuarios", usuariosRoutes)
app.use("/api/missoes", missoesRoutes)

app.get("/", (req, res) => {
    res.send("Bem-vindo ao CODIFY!");
});

app.get("/api", (req, res) => {
    res.json({
        mensagem: "API do CODIFY funcionando!",
        status: "online"
    });
});

app.listen(3000, () => {
    console.log("CODIFY iniciado na porta 3000!");
});
