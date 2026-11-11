const express = require('express');
const banco = require('../config/banco');
const compilarEExecutar = require('../services/compilador');
const { mensagemDeFalha } = compilarEExecutar;
const { logado, soAluno } = require('../middlewares/auth');

const rotas = express.Router();

rotas.post('/compilar', logado, soAluno, async (req, res) => {
  const { codigo, entrada } = req.body;

  if (!codigo || codigo.trim() == '') {
    return res.status(400).json({ erro: 'Não há código para compilar.' });
  }

  const resultado = await compilarEExecutar(codigo, entrada);
  if (resultado.falhaServico) {
    return res.status(500).json({ erro: mensagemDeFalha(resultado) });
  }
  res.json(resultado);
});

rotas.get('/codigos', logado, soAluno, async (req, res) => {
  const [codigos] = await banco.query(
    'SELECT id_codigo, conteudo, status, data_salvo FROM codigo WHERE id_aluno = ? ORDER BY id_codigo DESC',
    [req.usuario.id]);
  res.json(codigos);
});

rotas.post('/codigos', logado, soAluno, async (req, res) => {
  const { conteudo, status } = req.body;

  if (!conteudo || conteudo.trim() == '') {
    return res.status(400).json({ erro: 'Não há código para salvar.' });
  }
  await banco.query('INSERT INTO codigo (id_aluno, conteudo, status) VALUES (?, ?, ?)',
    [req.usuario.id, conteudo, status || 'rascunho']);
  res.json({ mensagem: 'Código salvo!' });
});

module.exports = rotas;
