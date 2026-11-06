// Cadastro, login e dados do usuário logado (USUÁRIO / ALUNO / PROFESSOR)
const bcrypt = require('bcryptjs');
const { query, transacao } = require('../config/db');
const HttpError = require('../utils/HttpError');
const { gerarToken } = require('../middlewares/auth');
const { exigirCampos, lerTexto, lerOpcao, emailValido } = require('../utils/validacao');
const { progresso } = require('../utils/nivel');

/** Monta o objeto de usuário devolvido ao front-end (nunca inclui a senha). */
async function buscarPerfil(idUsuario) {
  const [u] = await query(
    `SELECT u.id_usuario, u.nome, u.email, u.tipo, a.pontuacao_xp, a.moedas
       FROM usuario u
       LEFT JOIN aluno a ON a.id_usuario = u.id_usuario
      WHERE u.id_usuario = ?`,
    [idUsuario],
  );
  if (!u) throw new HttpError(404, 'Usuário não encontrado.');

  const perfil = { id_usuario: u.id_usuario, nome: u.nome, email: u.email, tipo: u.tipo };
  if (u.tipo === 'aluno') perfil.progresso = progresso(u);
  return perfil;
}

// POST /api/auth/cadastro
async function cadastrar(req, res) {
  const body = req.body ?? {};
  exigirCampos(body, ['nome', 'email', 'senha', 'tipo']);

  const nome = lerTexto(body.nome, 'nome', { max: 100, obrigatorio: true });
  const email = lerTexto(body.email, 'email', { max: 150, obrigatorio: true }).toLowerCase();
  const tipo = lerOpcao(body.tipo, 'tipo', ['aluno', 'professor']);
  if (!emailValido(email)) throw new HttpError(400, 'E-mail inválido.');
  if (String(body.senha).length < 6) throw new HttpError(400, 'A senha deve ter pelo menos 6 caracteres.');

  const [existe] = await query('SELECT 1 FROM usuario WHERE email = ?', [email]);
  if (existe) throw new HttpError(409, 'Este e-mail já está cadastrado.');

  const hash = await bcrypt.hash(String(body.senha), 10);

  // usuário + especialização na mesma transação (especialização total)
  const idUsuario = await transacao(async (conn) => {
    const [r] = await conn.query(
      'INSERT INTO usuario (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
      [nome, email, hash, tipo],
    );
    const tabela = tipo === 'aluno' ? 'aluno' : 'professor';
    await conn.query(`INSERT INTO ${tabela} (id_usuario) VALUES (?)`, [r.insertId]);
    return r.insertId;
  });

  const usuario = await buscarPerfil(idUsuario);
  res.status(201).json({ token: gerarToken(usuario), usuario });
}

// POST /api/auth/login
async function login(req, res) {
  const body = req.body ?? {};
  exigirCampos(body, ['email', 'senha']);

  const email = String(body.email).trim().toLowerCase();
  const [u] = await query('SELECT id_usuario, senha FROM usuario WHERE email = ?', [email]);
  const senhaOk = u && (await bcrypt.compare(String(body.senha), u.senha));
  if (!senhaOk) throw new HttpError(401, 'E-mail ou senha incorretos.');

  const usuario = await buscarPerfil(u.id_usuario);
  res.json({ token: gerarToken(usuario), usuario });
}

// GET /api/auth/me
async function me(req, res) {
  res.json(await buscarPerfil(req.usuario.id));
}

module.exports = { cadastrar, login, me, buscarPerfil };
