const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const banco = require('../config/banco');
const enviarEmail = require('../services/email');
const { criarSessao, logado } = require('../middlewares/auth');

const rotas = express.Router();

async function buscarUsuario(id) {
  const [linhas] = await banco.query(
    `SELECT u.id_usuario, u.nome, u.email, u.tipo, a.pontuacao_xp, a.nivel, a.moedas
     FROM usuario u LEFT JOIN aluno a ON a.id_usuario = u.id_usuario
     WHERE u.id_usuario = ?`, [id]);
  return linhas[0];
}

rotas.post('/cadastro', async (req, res) => {
  const { nome, email, senha, tipo, termos } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  }
  if (tipo != 'aluno' && tipo != 'professor') {
    return res.status(400).json({ erro: 'Escolha se você é aluno ou professor.' });
  }
  if (senha.length < 8) {
    return res.status(400).json({ erro: 'A senha precisa ter no mínimo 8 caracteres.' });
  }
  if (!termos) {
    return res.status(400).json({ erro: 'Você precisa concordar com os Termos de Uso e a Política de Privacidade.' });
  }

  const [existe] = await banco.query('SELECT id_usuario FROM usuario WHERE email = ?', [email]);
  if (existe.length > 0) {
    return res.status(409).json({ erro: 'Esse e-mail já está cadastrado. Informe outro.' });
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);
  const [resultado] = await banco.query(
    'INSERT INTO usuario (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
    [nome, email, senhaCriptografada, tipo]);
  const id = resultado.insertId;

  if (tipo == 'aluno') {
    await banco.query('INSERT INTO aluno (id_usuario) VALUES (?)', [id]);
    await banco.query('INSERT INTO inventario (id_aluno) VALUES (?)', [id]);
  } else {
    await banco.query('INSERT INTO professor (id_usuario) VALUES (?)', [id]);
  }

  res.json({ mensagem: 'Conta criada com sucesso! Faça login.' });
});

rotas.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  const [linhas] = await banco.query('SELECT * FROM usuario WHERE email = ?', [email]);
  if (linhas.length == 0 || !(await bcrypt.compare(senha || '', linhas[0].senha))) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  if (linhas[0].tipo == 'aluno') {
    await banco.query(
      `UPDATE aluno SET
         sequencia = CASE WHEN ultimo_dia = CURDATE() THEN sequencia
                          WHEN ultimo_dia = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN sequencia + 1
                          ELSE 1 END,
         ultimo_dia = CURDATE()
       WHERE id_usuario = ?`, [linhas[0].id_usuario]);
  }

  const usuario = await buscarUsuario(linhas[0].id_usuario);
  const token = criarSessao({ id: usuario.id_usuario, nome: usuario.nome, tipo: usuario.tipo });
  res.json({ token: token, usuario: usuario });
});

rotas.get('/eu', logado, async (req, res) => {
  res.json(await buscarUsuario(req.usuario.id));
});

rotas.put('/eu', logado, async (req, res) => {
  const { nome, nova_senha } = req.body;

  if (!nome || nome.trim() == '') {
    return res.status(400).json({ erro: 'O nome não pode ficar vazio.' });
  }
  if (nova_senha && nova_senha.length < 8) {
    return res.status(400).json({ erro: 'A nova senha precisa ter no mínimo 8 caracteres.' });
  }

  await banco.query('UPDATE usuario SET nome = ? WHERE id_usuario = ?', [nome.trim(), req.usuario.id]);
  if (nova_senha) {
    await banco.query('UPDATE usuario SET senha = ? WHERE id_usuario = ?', [await bcrypt.hash(nova_senha, 10), req.usuario.id]);
  }
  req.usuario.nome = nome.trim();
  res.json({ mensagem: 'Perfil atualizado!', usuario: await buscarUsuario(req.usuario.id) });
});

rotas.post('/esqueci-senha', async (req, res) => {
  const email = req.body.email;
  const [linhas] = await banco.query('SELECT id_usuario FROM usuario WHERE email = ?', [email]);

  if (linhas.length > 0) {
    const token = crypto.randomBytes(20).toString('hex');
    await banco.query('UPDATE usuario SET token_senha = ?, token_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id_usuario = ?',
      [token, linhas[0].id_usuario]);

    try {
      await enviarEmail(email, 'Codify - Redefinição de senha',
        'Olá! Para criar uma nova senha, acesse o link abaixo (válido por 1 hora):\n\nhttp://localhost:3000/redefinir.html?token=' + token);
    } catch (erro) {
      console.log(erro);
      return res.status(500).json({ erro: 'Não foi possível enviar o e-mail agora. Tente novamente.' });
    }
  }

  res.json({ mensagem: 'Se o e-mail estiver cadastrado, enviamos o link de redefinição.' });
});

rotas.post('/redefinir-senha', async (req, res) => {
  const { token, senha } = req.body;

  if (!senha || senha.length < 8) {
    return res.status(400).json({ erro: 'A senha precisa ter no mínimo 8 caracteres.' });
  }
  const [linhas] = await banco.query('SELECT id_usuario FROM usuario WHERE token_senha = ? AND token_expira > NOW()', [token || 'x']);
  if (linhas.length == 0) {
    return res.status(400).json({ erro: 'Link inválido, expirado ou já utilizado. Peça um novo link.' });
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);
  await banco.query('UPDATE usuario SET senha = ?, token_senha = NULL, token_expira = NULL WHERE id_usuario = ?',
    [senhaCriptografada, linhas[0].id_usuario]);
  res.json({ mensagem: 'Senha alterada com sucesso!' });
});

module.exports = rotas;
