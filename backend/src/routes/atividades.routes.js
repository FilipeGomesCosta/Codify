const { Router } = require('express');
const atividades = require('../controllers/atividades.controller');
const entregas = require('../controllers/entregas.controller');
const { autenticar, permitir } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = Router();
router.use(autenticar);

// Atividades
router.get('/', atividades.listar); // ?sala=ID
router.get('/pendentes', permitir('aluno'), atividades.pendentes);
router.get('/:id', atividades.obter);
router.put('/:id', permitir('professor'), upload('atividades').single('arquivo'), atividades.atualizar);
router.delete('/:id', permitir('professor'), atividades.remover);
router.get('/:id/arquivo', atividades.baixarArquivo);

// Entregas
router.get('/:id/entregas', entregas.listar);
router.post('/:id/entregas', permitir('aluno'), upload('entregas').single('arquivo'), entregas.enviar);
router.delete('/:id/entregas', permitir('aluno'), entregas.cancelar);
router.put('/:id/entregas/:idAluno/avaliacao', permitir('professor'), entregas.avaliar);
router.get('/:id/entregas/:idAluno/arquivo', entregas.baixarArquivo);

module.exports = router;
