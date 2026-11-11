const express = require('express');
const banco = require('../config/banco');
const { logado, soAluno } = require('../middlewares/auth');

const rotas = express.Router();

rotas.get('/notificacoes', logado, async (req, res) => {
  const notificacoes = [];

  if (req.usuario.tipo == 'aluno') {
    const [pendentes] = await banco.query(
      `SELECT a.id_atividade, a.titulo, a.prazo, s.nome AS sala
       FROM atividade_sala a
       JOIN sala_aula s ON s.id_sala = a.id_sala
       JOIN participa p ON p.id_sala = a.id_sala AND p.id_aluno = ? AND p.status = 'ativo'
       LEFT JOIN entrega_atividade e ON e.id_atividade = a.id_atividade AND e.id_aluno = ? AND e.status <> 'rascunho'
       WHERE e.id_entrega IS NULL AND a.prazo > NOW() AND (a.disponivel_em IS NULL OR a.disponivel_em <= NOW())
       ORDER BY a.prazo LIMIT 10`, [req.usuario.id, req.usuario.id]);
    for (const a of pendentes) {
      notificacoes.push({ texto: 'Atividade pendente: ' + a.titulo + ' (' + a.sala + ')', data: a.prazo, link: 'atividade.html?id=' + a.id_atividade });
    }

    const [avaliadas] = await banco.query(
      `SELECT a.id_atividade, a.titulo, e.nota FROM entrega_atividade e
       JOIN atividade_sala a ON a.id_atividade = e.id_atividade
       WHERE e.id_aluno = ? AND e.status = 'avaliada' ORDER BY e.id_entrega DESC LIMIT 5`, [req.usuario.id]);
    for (const a of avaliadas) {
      notificacoes.push({ texto: 'Atividade avaliada: ' + a.titulo + ' (nota ' + a.nota + ')', link: 'atividade.html?id=' + a.id_atividade });
    }
  } else {
    const [solicitacoes] = await banco.query(
      `SELECT s.id_sala, s.nome AS sala, u.nome FROM participa p
       JOIN sala_aula s ON s.id_sala = p.id_sala
       JOIN usuario u ON u.id_usuario = p.id_aluno
       WHERE s.id_professor = ? AND p.status = 'pendente'`, [req.usuario.id]);
    for (const s of solicitacoes) {
      notificacoes.push({ texto: s.nome + ' quer entrar na sala ' + s.sala, link: 'sala.html?id=' + s.id_sala });
    }
  }

  res.json(notificacoes);
});

rotas.get('/agenda', logado, soAluno, async (req, res) => {
  const [atividades] = await banco.query(
    `SELECT a.id_atividade, a.titulo, a.prazo, s.nome AS sala,
            COALESCE(e.status, 'pendente') AS status
     FROM atividade_sala a
     JOIN sala_aula s ON s.id_sala = a.id_sala
     JOIN participa p ON p.id_sala = a.id_sala AND p.id_aluno = ? AND p.status = 'ativo'
     LEFT JOIN entrega_atividade e ON e.id_atividade = a.id_atividade AND e.id_aluno = ? AND e.status <> 'rascunho'
     WHERE a.prazo >= NOW() AND (a.disponivel_em IS NULL OR a.disponivel_em <= NOW()) ORDER BY a.prazo`, [req.usuario.id, req.usuario.id]);
  res.json(atividades);
});

async function contar(sql, valores) {
  const [linhas] = await banco.query(sql, valores);
  return linhas[0].total;
}

rotas.get('/conquistas', logado, soAluno, async (req, res) => {
  const id = req.usuario.id;
  const concluidas = await contar("SELECT COUNT(*) AS total FROM progresso_missao WHERE id_aluno = ? AND status = 'concluida'", [id]);
  const totalMissoes = await contar('SELECT COUNT(*) AS total FROM missao', []);
  const compras = await contar('SELECT COUNT(*) AS total FROM compra WHERE id_aluno = ?', [id]);
  const entregas = await contar('SELECT COUNT(*) AS total FROM entrega_atividade WHERE id_aluno = ?', [id]);
  const codigos = await contar('SELECT COUNT(*) AS total FROM codigo WHERE id_aluno = ?', [id]);
  const salas = await contar("SELECT COUNT(*) AS total FROM participa WHERE id_aluno = ? AND status = 'ativo'", [id]);
  const nivel = await contar('SELECT nivel AS total FROM aluno WHERE id_usuario = ?', [id]);

  res.json([
    { nome: 'Primeiros passos', descricao: 'Conclua sua primeira missão.', icone: 'bandeira', atual: concluidas, meta: 1 },
    { nome: 'Trilheiro', descricao: 'Conclua 3 missões.', icone: 'foguete', atual: concluidas, meta: 3 },
    { nome: 'Mestre da trilha', descricao: 'Conclua todas as missões.', icone: 'trofeu', atual: concluidas, meta: totalMissoes },
    { nome: 'Comprador', descricao: 'Faça sua primeira compra na loja.', icone: 'carrinho', atual: compras, meta: 1 },
    { nome: 'Colecionador', descricao: 'Faça 5 compras na loja.', icone: 'mochila', atual: compras, meta: 5 },
    { nome: 'Programador', descricao: 'Salve 3 códigos no compilador.', icone: 'janela', atual: codigos, meta: 3 },
    { nome: 'Turma formada', descricao: 'Entre em uma sala de aula.', icone: 'monitor', atual: salas, meta: 1 },
    { nome: 'Dever cumprido', descricao: 'Entregue uma atividade.', icone: 'prancheta', atual: entregas, meta: 1 },
    { nome: 'Veterano', descricao: 'Alcance o nível 4.', icone: 'escudo', atual: nivel, meta: 4 }
  ]);
});

module.exports = rotas;
