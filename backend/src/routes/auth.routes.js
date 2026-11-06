const { Router } = require('express');
const auth = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth');

const router = Router();

router.post('/cadastro', auth.cadastrar);
router.post('/login', auth.login);
router.get('/me', autenticar, auth.me);

module.exports = router;
