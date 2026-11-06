const { Router } = require('express');
const salas = require('../controllers/salas.controller');
const atividades = require('../controllers/atividades.controller');
const materiais = require('../controllers/materiais.controller');
const { autenticar, permitir } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = Router();
router.use(autenticar);

// Salas
router.get('/', salas.listar);
router.post('/', permitir('professor'), salas.criar);
router.post('/entrar', permitir('aluno'), salas.entrar);
router.get('/codigo', permitir('professor'), salas.sugerirCodigo);
router.get('/:idSala', salas.obter);
router.put('/:idSala', permitir('professor'), salas.atualizar);
router.delete('/:idSala', permitir('professor'), salas.remover);
router.post('/:idSala/novo-codigo', permitir('professor'), salas.novoCodigo);
router.delete('/:idSala/sair', permitir('aluno'), salas.sair);

// Alunos da sala
router.get('/:idSala/alunos', permitir('professor'), salas.listarAlunos);
router.delete('/:idSala/alunos/:idAluno', permitir('professor'), salas.removerAluno);

// Atividades e materiais de uma sala
router.get('/:idSala/atividades', atividades.listarDaSala);
router.post('/:idSala/atividades', permitir('professor'), upload('atividades').single('arquivo'), atividades.criar);
router.get('/:idSala/materiais', materiais.listarDaSala);
router.post('/:idSala/materiais', permitir('professor'), upload('materiais').single('arquivo'), materiais.criar);

module.exports = router;
