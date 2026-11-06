const { Router } = require('express');
const missoes = require('../controllers/missoes.controller');
const { autenticar, permitir } = require('../middlewares/auth');

const router = Router();
router.use(autenticar);

router.get('/', missoes.listar);
router.get('/:id', missoes.obter);
router.post('/', permitir('professor'), missoes.criar);
router.put('/:id', permitir('professor'), missoes.atualizar);
router.delete('/:id', permitir('professor'), missoes.remover);
router.post('/:id/iniciar', permitir('aluno'), missoes.iniciar);
router.post('/:id/concluir', permitir('aluno'), missoes.concluir);

module.exports = router;
