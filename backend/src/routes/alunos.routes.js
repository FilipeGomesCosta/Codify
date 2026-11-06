const { Router } = require('express');
const alunos = require('../controllers/alunos.controller');
const { autenticar, permitir } = require('../middlewares/auth');

const router = Router();
router.use(autenticar);

router.get('/me/progresso', permitir('aluno'), alunos.meuProgresso);
router.get('/ranking', alunos.ranking);

module.exports = router;
