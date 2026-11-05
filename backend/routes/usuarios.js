const express = require("express")
const router = express.Router()

router.post("/", (req, res) =>{
    const {nome, email} = req.body

    res.json({
        mensagem:"Dados recebidos com sucesso!",
        usuario: {
            nome: nome,
            email: email
        }
    })
})

module.exports = router