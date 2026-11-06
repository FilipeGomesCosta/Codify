const { Router } = require('express');
const materiais = require('../controllers/materiais.controller');
const { autenticar, permitir } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = Router();
router.use(autenticar);

router.get('/', materiais.listar); // ?busca=&tipo=&ordem=&sala=&pagina=&limite=
router.get('/:id', materiais.obter);
router.get('/:id/arquivo', materiais.baixar);
router.put('/:id', permitir('professor'), upload('materiais').single('arquivo'), materiais.atualizar);
router.delete('/:id', permitir('professor'), materiais.remover);

module.exports = router;
