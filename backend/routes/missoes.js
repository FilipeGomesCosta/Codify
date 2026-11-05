const express = require("express");
const router = express.Router();

const missoes = [
    {
        id: 1,
        nome: "Primeiros passos em JavaScript"
    },
    {
        id: 2,
        nome: "Aprendendo HTML"
    },
    {
        id: 3,
        nome: "Dominando CSS"
    }
];

router.get("/", (req, res) => {
    res.json({
        missoes: missoes
    });
});

router.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const missao = missoes.find((item) => item.id === id);

    if (!missao) {
        return res.status(404).json({
            mensagem: "Missão não encontrada!"
        });
    }

    res.json(missao);

});

module.exports = router;
