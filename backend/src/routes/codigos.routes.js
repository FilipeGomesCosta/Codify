const { Router } = require('express');
const codigos = require('../controllers/codigos.controller');
const { autenticar, permitir } = require('../middlewares/auth');

const router = Router();
router.use(autenticar, permitir('aluno'));

router.get('/', codigos.listar);
router.post('/', codigos.criar);
router.post('/executar', codigos.executar);
router.get('/:id', codigos.obter);
router.put('/:id', codigos.atualizar);
router.delete('/:id', codigos.remover);

module.exports = router;
