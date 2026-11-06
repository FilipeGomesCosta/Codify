// Trilha de Missões (MISSÃO e ALUNO REALIZA MISSÃO)
const { query, transacao } = require('../config/db');
const HttpError = require('../utils/HttpError');
const { lerTexto, lerInteiro, lerId, lerOpcao } = require('../utils/validacao');
const { nivelPorXp, progresso } = require('../utils/nivel');

const DIFICULDADES = ['iniciante', 'intermediario', 'avancado'];

async function buscarMissao(id, conn) {
  const executor = conn ? (sql, p) => conn.query(sql, p).then(([r]) => r) : query;
  const [missao] = await executor('SELECT * FROM missao WHERE id_missao = ?', [id]);
  if (!missao) throw new HttpError(404, 'Missão não encontrada.');
  return missao;
}

function lerDadosMissao(body, parcial = false) {
  return {
    titulo: lerTexto(body.titulo, 'titulo', { max: 150, obrigatorio: !parcial }),
    descricao: lerTexto(body.descricao, 'descricao', { max: 5000 }),
    nivel_dificuldade: lerOpcao(body.nivel_dificuldade, 'nivel_dificuldade', DIFICULDADES, 'iniciante'),
    recompensa_xp: lerInteiro(body.recompensa_xp, 'recompensa_xp', { min: 0, max: 100000, padrao: 0 }),
    recompensa_moedas: lerInteiro(body.recompensa_moedas, 'recompensa_moedas', { min: 0, max: 100000, padrao: 0 }),
  };
}

// GET /api/missoes?dificuldade=iniciante
// Para o aluno, cada missão vem com o status dele: nao_iniciada | em_andamento | concluida
async function listar(req, res) {
  const filtros = [];
  const params = [];
  if (req.usuario.tipo === 'aluno') params.push(req.usuario.id);
  if (req.query.dificuldade) {
    filtros.push('m.nivel_dificuldade = ?');
    params.push(lerOpcao(req.query.dificuldade, 'dificuldade', DIFICULDADES));
  }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const sql = req.usuario.tipo === 'aluno'
    ? `SELECT m.*, COALESCE(r.status, 'nao_iniciada') AS status
         FROM missao m
         LEFT JOIN realiza r ON r.id_missao = m.id_missao AND r.id_aluno = ?
         ${where} ORDER BY m.id_missao`
    : `SELECT m.* FROM missao m ${where} ORDER BY m.id_missao`;

  res.json(await query(sql, params));
}

// GET /api/missoes/:id
async function obter(req, res) {
  const missao = await buscarMissao(lerId(req.params.id));
  if (req.usuario.tipo === 'aluno') {
    const [r] = await query('SELECT status FROM realiza WHERE id_aluno = ? AND id_missao = ?', [req.usuario.id, missao.id_missao]);
    missao.status = r?.status ?? 'nao_iniciada';
  }
  res.json(missao);
}

// POST /api/missoes  (professor)
async function criar(req, res) {
  const m = lerDadosMissao(req.body ?? {});
  const r = await query(
    `INSERT INTO missao (titulo, descricao, nivel_dificuldade, recompensa_xp, recompensa_moedas)
     VALUES (?, ?, ?, ?, ?)`,
    [m.titulo, m.descricao, m.nivel_dificuldade, m.recompensa_xp, m.recompensa_moedas],
  );
  res.status(201).json(await buscarMissao(r.insertId));
}

// PUT /api/missoes/:id  (professor)
async function atualizar(req, res) {
  const id = lerId(req.params.id);
  const atual = await buscarMissao(id);
  const m = lerDadosMissao({ ...atual, ...req.body });
  await query(
    `UPDATE missao SET titulo = ?, descricao = ?, nivel_dificuldade = ?, recompensa_xp = ?, recompensa_moedas = ?
      WHERE id_missao = ?`,
    [m.titulo, m.descricao, m.nivel_dificuldade, m.recompensa_xp, m.recompensa_moedas, id],
  );
  res.json(await buscarMissao(id));
}

// DELETE /api/missoes/:id  (professor)
async function remover(req, res) {
  const id = lerId(req.params.id);
  await buscarMissao(id);
  await query('DELETE FROM missao WHERE id_missao = ?', [id]);
  res.status(204).end();
}

// POST /api/missoes/:id/iniciar  (aluno)
async function iniciar(req, res) {
  const id = lerId(req.params.id);
  await buscarMissao(id);
  // se já existir, mantém o status atual (não "desconclui" a missão)
  await query(
    `INSERT INTO realiza (id_aluno, id_missao, status) VALUES (?, ?, 'em_andamento')
     ON DUPLICATE KEY UPDATE status = status`,
    [req.usuario.id, id],
  );
  const [r] = await query('SELECT status FROM realiza WHERE id_aluno = ? AND id_missao = ?', [req.usuario.id, id]);
  res.json({ id_missao: id, status: r.status });
}

// POST /api/missoes/:id/concluir  (aluno)
// Marca como concluída e entrega a recompensa (XP + moedas) uma única vez.
async function concluir(req, res) {
  const id = lerId(req.params.id);

  const resultado = await transacao(async (conn) => {
    const missao = await buscarMissao(id, conn);

    const [[realiza]] = await conn.query(
      'SELECT status FROM realiza WHERE id_aluno = ? AND id_missao = ? FOR UPDATE',
      [req.usuario.id, id],
    );
    if (realiza?.status === 'concluida') throw new HttpError(409, 'Você já concluiu esta missão.');

    await conn.query(
      `INSERT INTO realiza (id_aluno, id_missao, status) VALUES (?, ?, 'concluida')
       ON DUPLICATE KEY UPDATE status = 'concluida'`,
      [req.usuario.id, id],
    );

    // trava a linha do aluno para não somar recompensas em paralelo
    const [[aluno]] = await conn.query(
      'SELECT pontuacao_xp, moedas FROM aluno WHERE id_usuario = ? FOR UPDATE',
      [req.usuario.id],
    );
    const xp = aluno.pontuacao_xp + missao.recompensa_xp;
    const moedas = aluno.moedas + missao.recompensa_moedas;
    await conn.query(
      'UPDATE aluno SET pontuacao_xp = ?, nivel = ?, moedas = ? WHERE id_usuario = ?',
      [xp, nivelPorXp(xp), moedas, req.usuario.id],
    );

    return {
      mensagem: 'Missão concluída!',
      recompensa: { xp: missao.recompensa_xp, moedas: missao.recompensa_moedas },
      subiu_de_nivel: nivelPorXp(xp) > nivelPorXp(aluno.pontuacao_xp),
      progresso: progresso({ pontuacao_xp: xp, moedas }),
    };
  });

  res.json(resultado);
}

module.exports = { listar, obter, criar, atualizar, remover, iniciar, concluir };
