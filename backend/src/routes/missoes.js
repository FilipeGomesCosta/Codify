const express = require('express');
const banco = require('../config/banco');
const compilarEExecutar = require('../services/compilador');
const { mensagemDeFalha } = compilarEExecutar;
const { logado, soAluno } = require('../middlewares/auth');

const rotas = express.Router();

function limiteNivel(nivel) {
  if (nivel <= 1) return 0;
  return 250 * 2 ** (nivel - 2);
}

function nivelPorXp(xp) {
  let nivel = 1;
  while (xp >= limiteNivel(nivel + 1)) {
    nivel++;
  }
  return nivel;
}

async function listarMissoes(idAluno) {
  const [missoes] = await banco.query(
    `SELECT m.id_missao, m.titulo, m.descricao, m.nivel_dificuldade, m.recompensa_xp,
            m.recompensa_moedas, m.descricao_entrada, m.descricao_saida, r.titulo AS requisito, p.status, pr.status AS status_requisito
     FROM missao m
     LEFT JOIN missao r ON r.id_missao = m.id_requisito
     LEFT JOIN progresso_missao p ON p.id_missao = m.id_missao AND p.id_aluno = ?
     LEFT JOIN progresso_missao pr ON pr.id_missao = m.id_requisito AND pr.id_aluno = ?
     ORDER BY m.id_missao`, [idAluno, idAluno]);

  for (let i = 0; i < missoes.length; i++) {
    const m = missoes[i];
    if (m.status == 'concluida') {
      m.situacao = 'concluida';
    } else if (m.requisito && m.status_requisito != 'concluida') {
      m.situacao = 'bloqueada';
    } else if (m.status == 'em_andamento') {
      m.situacao = 'em_andamento';
    } else {
      m.situacao = 'disponivel';
    }
  }
  return missoes;
}

rotas.get('/missoes', logado, soAluno, async (req, res) => {
  const missoes = await listarMissoes(req.usuario.id);
  const [aluno] = await banco.query('SELECT pontuacao_xp, nivel, moedas, sequencia FROM aluno WHERE id_usuario = ?', [req.usuario.id]);
  const [semana] = await banco.query(
    `SELECT COALESCE(SUM(m.recompensa_xp), 0) AS total FROM progresso_missao p
     JOIN missao m ON m.id_missao = p.id_missao
     WHERE p.id_aluno = ? AND p.status = 'concluida' AND p.data_conclusao >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, [req.usuario.id]);

  let concluidas = 0;
  for (const m of missoes) {
    if (m.situacao == 'concluida') concluidas++;
  }
  res.json({ missoes: missoes, concluidas: concluidas, aluno: aluno[0], xp_semana: semana[0].total });
});

rotas.post('/missoes/:id/iniciar', logado, soAluno, async (req, res) => {
  const missoes = await listarMissoes(req.usuario.id);
  const missao = missoes.find((m) => m.id_missao == req.params.id);

  if (!missao) {
    return res.status(404).json({ erro: 'Missão não encontrada.' });
  }
  if (missao.situacao == 'bloqueada') {
    return res.status(403).json({ erro: 'Missão bloqueada. Para desbloqueá-la, conclua a missão "' + missao.requisito + '".' });
  }

  await banco.query(
    "INSERT IGNORE INTO progresso_missao (id_aluno, id_missao, status) VALUES (?, ?, 'em_andamento')",
    [req.usuario.id, missao.id_missao]);
  res.json({ ok: true });
});

rotas.get('/missoes/:id', logado, soAluno, async (req, res) => {
  const missoes = await listarMissoes(req.usuario.id);
  const missao = missoes.find((m) => m.id_missao == req.params.id);

  if (!missao || missao.situacao == 'bloqueada') {
    return res.status(403).json({ erro: 'Essa missão não está disponível.' });
  }
  const [dados] = await banco.query('SELECT entrada_teste FROM missao WHERE id_missao = ?', [missao.id_missao]);
  missao.entrada_teste = dados[0].entrada_teste;
  res.json(missao);
});

rotas.post('/missoes/:id/finalizar', logado, soAluno, async (req, res) => {
  const codigo = req.body.codigo;
  if (!codigo || codigo.trim() == '') {
    return res.status(400).json({ erro: 'Escreva seu código antes de finalizar a missão.' });
  }

  const missoes = await listarMissoes(req.usuario.id);
  const missao = missoes.find((m) => m.id_missao == req.params.id);
  if (!missao || missao.situacao == 'bloqueada') {
    return res.status(403).json({ erro: 'Essa missão não está disponível.' });
  }

  const [dados] = await banco.query('SELECT entrada_teste, saida_esperada FROM missao WHERE id_missao = ?', [missao.id_missao]);
  const resultado = await compilarEExecutar(codigo, dados[0].entrada_teste);
  if (resultado.falhaServico) {
    return res.status(500).json({ erro: mensagemDeFalha(resultado) });
  }
  if (!resultado.compilou) {
    return res.json({ concluida: false, mensagem: 'Seu código tem erros de compilação.', erros: resultado.erros });
  }

  const obtida = resultado.saida.trim().replace(/\s+/g, ' ');
  const esperada = dados[0].saida_esperada.trim().replace(/\s+/g, ' ');
  if (obtida != esperada) {
    return res.json({ concluida: false, mensagem: 'A saída do seu programa não está correta. Tente de novo!', saida: resultado.saida });
  }

  if (missao.situacao == 'concluida') {
    return res.json({ concluida: true, mensagem: 'Você já tinha concluído esta missão. Nenhuma recompensa nova.', desbloqueadas: [] });
  }

  const [antes] = await banco.query('SELECT nivel FROM aluno WHERE id_usuario = ?', [req.usuario.id]);
  await banco.query("UPDATE progresso_missao SET status = 'concluida', data_conclusao = NOW() WHERE id_aluno = ? AND id_missao = ?",
    [req.usuario.id, missao.id_missao]);
  await banco.query('UPDATE aluno SET pontuacao_xp = pontuacao_xp + ?, moedas = moedas + ? WHERE id_usuario = ?',
    [missao.recompensa_xp, missao.recompensa_moedas, req.usuario.id]);
  const [alunoAtual] = await banco.query('SELECT pontuacao_xp FROM aluno WHERE id_usuario = ?', [req.usuario.id]);
  const nivelNovo = nivelPorXp(alunoAtual[0].pontuacao_xp);
  await banco.query('UPDATE aluno SET nivel = ? WHERE id_usuario = ?', [nivelNovo, req.usuario.id]);

  const [desbloqueadas] = await banco.query('SELECT titulo FROM missao WHERE id_requisito = ?', [missao.id_missao]);
  res.json({
    concluida: true,
    mensagem: 'Missão concluída!',
    xp: missao.recompensa_xp,
    moedas: missao.recompensa_moedas,
    nivel: nivelNovo,
    subiu_de_nivel: nivelNovo > antes[0].nivel,
    desbloqueadas: desbloqueadas.map((d) => d.titulo)
  });
});

module.exports = rotas;
