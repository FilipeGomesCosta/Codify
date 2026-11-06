// Junta todas as rotas da API debaixo de /api
const { Router } = require('express');

const router = Router();

router.get('/saude', (req, res) => res.json({ status: 'ok' }));

router.use('/auth', require('./auth.routes'));
router.use('/alunos', require('./alunos.routes'));
router.use('/codigos', require('./codigos.routes'));
router.use('/missoes', require('./missoes.routes'));
router.use('/itens', require('./itens.routes'));
router.use('/inventario', require('./inventario.routes'));
router.use('/salas', require('./salas.routes'));
router.use('/atividades', require('./atividades.routes'));
router.use('/materiais', require('./materiais.routes'));

module.exports = router;
