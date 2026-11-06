// Loja
const { Router } = require('express');
const itens = require('../controllers/itens.controller');
const { autenticar, permitir } = require('../middlewares/auth');

const router = Router();
router.use(autenticar);

router.get('/', itens.listar);
router.get('/:id', itens.obter);
router.post('/', permitir('professor'), itens.criar);
router.put('/:id', permitir('professor'), itens.atualizar);
router.delete('/:id', permitir('professor'), itens.remover);
router.post('/:id/comprar', permitir('aluno'), itens.comprar);

module.exports = router;
