// Progresso e ranking dos alunos (ALUNO)
const { query } = require('../config/db');
const HttpError = require('../utils/HttpError');
const { progresso } = require('../utils/nivel');
const { lerInteiro } = require('../utils/validacao');

// GET /api/alunos/me/progresso  — cartão "Seu progresso" do menu lateral
async function meuProgresso(req, res) {
  const [aluno] = await query('SELECT pontuacao_xp, moedas FROM aluno WHERE id_usuario = ?', [req.usuario.id]);
  if (!aluno) throw new HttpError(404, 'Aluno não encontrado.');
  res.json(progresso(aluno));
}

// GET /api/alunos/ranking?limite=10
async function ranking(req, res) {
  const limite = lerInteiro(req.query.limite, 'limite', { min: 1, max: 50, padrao: 10 });
  const linhas = await query(
    `SELECT u.id_usuario, u.nome, a.pontuacao_xp, a.nivel
       FROM aluno a
       JOIN usuario u ON u.id_usuario = a.id_usuario
      ORDER BY a.pontuacao_xp DESC, u.nome
      LIMIT ?`,
    [limite],
  );
  res.json(linhas.map((l, i) => ({ posicao: i + 1, ...l })));
}

module.exports = { meuProgresso, ranking };
