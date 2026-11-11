const crypto = require('crypto');

const sessoes = {};

function criarSessao(usuario) {
  const token = crypto.randomUUID();
  sessoes[token] = usuario;
  return token;
}

function logado(req, res, next) {
  const usuario = sessoes[req.headers.token];
  if (!usuario) {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }
  req.usuario = usuario;
  next();
}

function soAluno(req, res, next) {
  if (req.usuario.tipo != 'aluno') {
    return res.status(403).json({ erro: 'Essa função é só para alunos.' });
  }
  next();
}

function soProfessor(req, res, next) {
  if (req.usuario.tipo != 'professor') {
    return res.status(403).json({ erro: 'Essa função é só para professores.' });
  }
  next();
}

module.exports = { criarSessao, logado, soAluno, soProfessor };
