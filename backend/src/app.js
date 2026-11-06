// Configuração do Express: middlewares, rotas da API e arquivos do front-end
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const rotas = require('./routes');
const { rotaNaoEncontrada, tratarErros } = require('./middlewares/erros');

const app = express();

// Permite chamadas de outra origem (ex.: Live Server na porta 5500).
// CORS_ORIGIN vazio = libera qualquer origem (bom para desenvolvimento).
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

// API
app.use('/api', rotas);
app.use('/api', rotaNaoEncontrada);

// Front-end (pasta ../frontend): http://localhost:3000/login.html
const PASTA_FRONTEND = path.resolve(__dirname, '..', process.env.FRONTEND_DIR || '../frontend');
app.use(express.static(PASTA_FRONTEND));

app.use(rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
