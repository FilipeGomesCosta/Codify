const { Router } = require('express');
const inventario = require('../controllers/inventario.controller');
const { autenticar, permitir } = require('../middlewares/auth');

const router = Router();
router.use(autenticar, permitir('aluno'));

router.get('/', inventario.listar);
router.post('/:idItem/usar', inventario.usar);

module.exports = router;
