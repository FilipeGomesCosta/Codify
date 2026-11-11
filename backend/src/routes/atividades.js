const express = require('express');
const path = require('path');
const fs = require('fs');
const banco = require('../config/banco');
const { upload, nomeOriginal } = require('../middlewares/upload');
const { logado, soAluno, soProfessor } = require('../middlewares/auth');

const rotas = express.Router();

function enviarArquivo(res, arquivo, nome) {
  if (!arquivo || !fs.existsSync(path.join(__dirname, '..', '..', 'uploads', arquivo))) {
    return res.status(404).json({ erro: 'Arquivo não encontrado.' });
  }
  res.download(path.join(__dirname, '..', '..', 'uploads', arquivo), nome);
}

function normalizarPrazo(prazo) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(prazo)) {
    return prazo + ' 23:59:00';
  }
  return prazo;
}

rotas.post('/salas/:id/atividades', logado, soProfessor, upload.single('arquivo'), async (req, res) => {
  const { titulo, descricao, prazo, permite_atraso, pontuacao, disponivel_em } = req.body;

  const [salas] = await banco.query('SELECT * FROM sala_aula WHERE id_sala = ? AND id_professor = ?', [req.params.id, req.usuario.id]);
  if (salas.length == 0) {
    return res.status(403).json({ erro: 'Você não tem acesso a esta sala.' });
  }
  if (!titulo || titulo.trim() == '') {
    return res.status(400).json({ erro: 'O título é obrigatório.' });
  }
  if (!prazo) {
    return res.status(400).json({ erro: 'A data de entrega é obrigatória.' });
  }

  let arquivo = null;
  let arquivoNome = null;
  if (req.file) {
    arquivo = req.file.filename;
    arquivoNome = nomeOriginal(req.file);
  }

  await banco.query(
    `INSERT INTO atividade_sala (id_sala, titulo, descricao, arquivo, arquivo_nome, prazo, permite_atraso, pontuacao, disponivel_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, titulo, descricao, arquivo, arquivoNome, normalizarPrazo(prazo),
      permite_atraso == 'true' ? 1 : 0, pontuacao || 10, disponivel_em || null]);
  res.json({ mensagem: 'Atividade adicionada com sucesso!' });
});

rotas.get('/atividades/pendentes', logado, soAluno, async (req, res) => {
  const [atividades] = await banco.query(
    `SELECT a.id_atividade, a.titulo, a.prazo, s.nome AS sala
     FROM atividade_sala a
     JOIN sala_aula s ON s.id_sala = a.id_sala
     JOIN participa p ON p.id_sala = a.id_sala AND p.id_aluno = ? AND p.status = 'ativo'
     LEFT JOIN entrega_atividade e ON e.id_atividade = a.id_atividade AND e.id_aluno = ? AND e.status <> 'rascunho'
     WHERE e.id_entrega IS NULL AND (a.prazo > NOW() OR a.permite_atraso = 1)
       AND (a.disponivel_em IS NULL OR a.disponivel_em <= NOW())
     ORDER BY a.prazo`, [req.usuario.id, req.usuario.id]);
  res.json(atividades);
});

rotas.get('/atividades/:id', logado, async (req, res) => {
  const [atividades] = await banco.query(
    `SELECT a.*, s.nome AS sala, s.id_professor, u.nome AS professor,
            (SELECT COUNT(*) FROM atividade_sala x WHERE x.id_sala = a.id_sala AND x.id_atividade <= a.id_atividade) AS numero
     FROM atividade_sala a
     JOIN sala_aula s ON s.id_sala = a.id_sala
     JOIN usuario u ON u.id_usuario = s.id_professor
     WHERE a.id_atividade = ?`, [req.params.id]);
  if (atividades.length == 0) {
    return res.status(404).json({ erro: 'Atividade não encontrada.' });
  }
  const atividade = atividades[0];

  if (req.usuario.tipo == 'professor') {
    if (atividade.id_professor != req.usuario.id) {
      return res.status(403).json({ erro: 'Você não tem acesso a esta atividade.' });
    }
    return res.json({ atividade: atividade });
  }

  const [participa] = await banco.query(
    "SELECT * FROM participa WHERE id_aluno = ? AND id_sala = ? AND status = 'ativo'", [req.usuario.id, atividade.id_sala]);
  if (participa.length == 0) {
    return res.status(403).json({ erro: 'Você não participa desta sala.' });
  }
  if (atividade.disponivel_em && new Date(atividade.disponivel_em) > new Date()) {
    return res.status(403).json({ erro: 'Esta atividade ainda não está disponível.' });
  }

  const [entregas] = await banco.query('SELECT * FROM entrega_atividade WHERE id_atividade = ? AND id_aluno = ?',
    [req.params.id, req.usuario.id]);
  const entrega = entregas[0];
  const atrasado = new Date() > new Date(atividade.prazo);
  let status = 'pendente';
  if (entrega && entrega.status != 'rascunho') {
    status = entrega.status;
  }

  res.json({
    atividade: atividade,
    entrega: entrega || null,
    status: status,
    prazo_encerrado: atrasado,
    pode_entregar: !(atrasado && !atividade.permite_atraso) && !(entrega && entrega.status == 'avaliada')
  });
});

rotas.get('/atividades/:id/arquivo', logado, async (req, res) => {
  const [atividades] = await banco.query('SELECT arquivo, arquivo_nome FROM atividade_sala WHERE id_atividade = ?', [req.params.id]);
  if (atividades.length == 0) {
    return res.status(404).json({ erro: 'Atividade não encontrada.' });
  }
  enviarArquivo(res, atividades[0].arquivo, atividades[0].arquivo_nome);
});

rotas.post('/atividades/:id/entregar', logado, soAluno, upload.single('arquivo'), async (req, res) => {
  const [atividades] = await banco.query(
    `SELECT a.* FROM atividade_sala a JOIN participa p ON p.id_sala = a.id_sala
     WHERE a.id_atividade = ? AND p.id_aluno = ? AND p.status = 'ativo'`, [req.params.id, req.usuario.id]);
  if (atividades.length == 0) {
    return res.status(403).json({ erro: 'Você não tem acesso a esta atividade.' });
  }
  const atividade = atividades[0];
  const rascunho = req.body.rascunho == 'true';

  if (new Date() > new Date(atividade.prazo) && !atividade.permite_atraso) {
    return res.status(403).json({ erro: 'O prazo da atividade foi encerrado e o professor não permite entregas após o prazo.' });
  }

  const [entregas] = await banco.query('SELECT * FROM entrega_atividade WHERE id_atividade = ? AND id_aluno = ?',
    [req.params.id, req.usuario.id]);
  const anterior = entregas[0];

  if (!req.file && !req.body.observacao && !(anterior && anterior.arquivo)) {
    return res.status(400).json({ erro: 'Envie um arquivo ou escreva uma resposta.' });
  }
  if (anterior && anterior.status == 'avaliada') {
    return res.status(403).json({ erro: 'Esta atividade já foi avaliada e não pode ser reenviada.' });
  }
  if (anterior && anterior.status == 'entregue' && rascunho) {
    return res.status(400).json({ erro: 'Esta atividade já foi entregue.' });
  }

  let arquivo = anterior ? anterior.arquivo : null;
  let arquivoNome = anterior ? anterior.arquivo_nome : null;
  if (req.file) {
    arquivo = req.file.filename;
    arquivoNome = nomeOriginal(req.file);
  }
  const status = rascunho ? 'rascunho' : 'entregue';

  if (!anterior) {
    await banco.query(
      `INSERT INTO entrega_atividade (id_atividade, id_aluno, arquivo, arquivo_nome, observacao, data_entrega, status)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [req.params.id, req.usuario.id, arquivo, arquivoNome, req.body.observacao, status]);
  } else {
    await banco.query(
      `UPDATE entrega_atividade SET arquivo = ?, arquivo_nome = ?, observacao = ?, data_entrega = NOW(), status = ?
       WHERE id_entrega = ?`,
      [arquivo, arquivoNome, req.body.observacao, status, anterior.id_entrega]);
  }

  res.json({ mensagem: rascunho ? 'Rascunho salvo! A atividade continua pendente.' : 'Atividade entregue com sucesso!' });
});

rotas.get('/atividades/:id/entregas', logado, soProfessor, async (req, res) => {
  const [atividades] = await banco.query(
    `SELECT a.*, s.nome AS sala FROM atividade_sala a JOIN sala_aula s ON s.id_sala = a.id_sala
     WHERE a.id_atividade = ? AND s.id_professor = ?`, [req.params.id, req.usuario.id]);
  if (atividades.length == 0) {
    return res.status(403).json({ erro: 'Você não tem acesso a esta atividade.' });
  }

  const [alunos] = await banco.query(
    `SELECT u.nome, e.id_entrega, e.arquivo_nome, e.observacao, e.data_entrega, e.nota, e.feedback,
            COALESCE(e.status, 'pendente') AS status
     FROM participa p
     JOIN usuario u ON u.id_usuario = p.id_aluno
     LEFT JOIN entrega_atividade e ON e.id_aluno = p.id_aluno AND e.id_atividade = ? AND e.status <> 'rascunho'
     WHERE p.id_sala = ? AND p.status = 'ativo' ORDER BY u.nome`, [req.params.id, atividades[0].id_sala]);

  res.json({ atividade: atividades[0], alunos: alunos });
});

rotas.get('/entregas/:id/arquivo', logado, soProfessor, async (req, res) => {
  const [entregas] = await banco.query(
    `SELECT e.arquivo, e.arquivo_nome FROM entrega_atividade e
     JOIN atividade_sala a ON a.id_atividade = e.id_atividade
     JOIN sala_aula s ON s.id_sala = a.id_sala
     WHERE e.id_entrega = ? AND s.id_professor = ?`, [req.params.id, req.usuario.id]);
  if (entregas.length == 0) {
    return res.status(404).json({ erro: 'Entrega não encontrada.' });
  }
  enviarArquivo(res, entregas[0].arquivo, entregas[0].arquivo_nome);
});

rotas.post('/entregas/:id/avaliar', logado, soProfessor, async (req, res) => {
  const { nota, feedback } = req.body;

  const [entregas] = await banco.query(
    `SELECT e.id_entrega, a.pontuacao FROM entrega_atividade e
     JOIN atividade_sala a ON a.id_atividade = e.id_atividade
     JOIN sala_aula s ON s.id_sala = a.id_sala
     WHERE e.id_entrega = ? AND s.id_professor = ?`, [req.params.id, req.usuario.id]);
  if (entregas.length == 0) {
    return res.status(404).json({ erro: 'Entrega não encontrada.' });
  }
  if (nota === '' || isNaN(nota) || nota < 0 || nota > entregas[0].pontuacao) {
    return res.status(400).json({ erro: 'A nota precisa ser um número de 0 a ' + entregas[0].pontuacao + '.' });
  }

  await banco.query("UPDATE entrega_atividade SET nota = ?, feedback = ?, status = 'avaliada' WHERE id_entrega = ?",
    [nota, feedback, req.params.id]);
  res.json({ mensagem: 'Avaliação salva!' });
});

module.exports = rotas;
