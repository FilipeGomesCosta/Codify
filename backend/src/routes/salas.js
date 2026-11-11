const express = require('express');
const path = require('path');
const fs = require('fs');
const { upload } = require('../middlewares/upload');
const banco = require('../config/banco');
const { logado, soAluno, soProfessor } = require('../middlewares/auth');

const rotas = express.Router();

const imagens = ['codigo', 'programacao', 'computador', 'inovacao', 'robotica'];

function gerarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += letras[Math.floor(Math.random() * letras.length)];
    if (i == 3) codigo += '-';
  }
  return codigo;
}

async function codigoLivre() {
  let codigo = gerarCodigo();
  let [existe] = await banco.query('SELECT id_sala FROM sala_aula WHERE codigo_acesso = ?', [codigo]);
  while (existe.length > 0) {
    codigo = gerarCodigo();
    [existe] = await banco.query('SELECT id_sala FROM sala_aula WHERE codigo_acesso = ?', [codigo]);
  }
  return codigo;
}

rotas.get('/salas/codigo', logado, soProfessor, async (req, res) => {
  res.json({ codigo: await codigoLivre() });
});

rotas.post('/salas', logado, soProfessor, upload.single('imagem_arquivo'), async (req, res) => {
  const { nome, descricao, nivel, linguagem, acesso, imagem } = req.body;
  const aprovacao = req.body.aprovacao == 'true';

  if (!nome || !nivel || !linguagem || !acesso) {
    return res.status(400).json({ erro: 'Preencha o nome, o nível, a linguagem e o acesso da sala.' });
  }
  if (descricao && descricao.length > 150) {
    return res.status(400).json({ erro: 'A descrição pode ter no máximo 150 caracteres.' });
  }

  let imagemArquivo = null;
  if (imagem == 'personalizada') {
    const extensao = req.file ? path.extname(req.file.filename) : '';
    if (extensao != '.png' && extensao != '.jpg') {
      return res.status(400).json({ erro: 'Para a imagem personalizada, envie um arquivo PNG ou JPG.' });
    }
    imagemArquivo = req.file.filename;
  }

  let codigo = req.body.codigo_acesso;
  const [existe] = await banco.query('SELECT id_sala FROM sala_aula WHERE codigo_acesso = ?', [codigo || '']);
  if (!codigo || existe.length > 0) {
    codigo = await codigoLivre();
  }

  const [resultado] = await banco.query(
    `INSERT INTO sala_aula (nome, descricao, nivel, linguagem, acesso, codigo_acesso, imagem, imagem_arquivo, aprovacao, id_professor)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, descricao, nivel, linguagem, acesso, codigo, imagens.concat('personalizada').includes(imagem) ? imagem : 'codigo',
      imagemArquivo, aprovacao ? 1 : 0, req.usuario.id]);

  res.json({ mensagem: 'Sala criada com sucesso!', id_sala: resultado.insertId, codigo_acesso: codigo });
});

rotas.get('/salas/:id/imagem', async (req, res) => {
  const [salas] = await banco.query('SELECT imagem_arquivo FROM sala_aula WHERE id_sala = ?', [req.params.id]);
  if (salas.length == 0 || !salas[0].imagem_arquivo) {
    return res.status(404).json({ erro: 'Imagem não encontrada.' });
  }
  const caminho = path.join(__dirname, '..', '..', 'uploads', salas[0].imagem_arquivo);
  if (!fs.existsSync(caminho)) {
    return res.status(404).json({ erro: 'Imagem não encontrada.' });
  }
  res.sendFile(caminho);
});

rotas.get('/salas', logado, async (req, res) => {
  const resumo = `(SELECT COUNT(*) FROM participa p WHERE p.id_sala = s.id_sala AND p.status = 'ativo') AS total_alunos,
                  (SELECT MAX(a.data_criacao) FROM atividade_sala a WHERE a.id_sala = s.id_sala) AS ultima_atividade`;
  let salas;
  if (req.usuario.tipo == 'professor') {
    [salas] = await banco.query(
      `SELECT s.*, u.nome AS professor, 'ativo' AS situacao, ${resumo}
       FROM sala_aula s JOIN usuario u ON u.id_usuario = s.id_professor
       WHERE s.id_professor = ? ORDER BY s.id_sala ASC`, [req.usuario.id]);
  } else {
    [salas] = await banco.query(
      `SELECT s.*, u.nome AS professor, p.status AS situacao, ${resumo}
       FROM sala_aula s
       JOIN participa p ON p.id_sala = s.id_sala
       JOIN usuario u ON u.id_usuario = s.id_professor
       WHERE p.id_aluno = ? ORDER BY s.id_sala ASC`, [req.usuario.id]);
  }
  res.json(salas);
});

rotas.post('/salas/entrar', logado, soAluno, async (req, res) => {
  let codigo = (req.body.codigo || '').trim().toUpperCase();
  if (codigo.length == 8) {
    codigo = codigo.slice(0, 4) + '-' + codigo.slice(4);
  }

  const [salas] = await banco.query('SELECT * FROM sala_aula WHERE codigo_acesso = ?', [codigo]);
  if (salas.length == 0) {
    return res.status(404).json({ erro: 'Código inválido ou inexistente. Confira o código e tente novamente.' });
  }
  const sala = salas[0];

  const [participa] = await banco.query('SELECT status FROM participa WHERE id_aluno = ? AND id_sala = ?',
    [req.usuario.id, sala.id_sala]);
  if (participa.length > 0 && participa[0].status == 'ativo') {
    return res.json({ mensagem: 'Você já participa desta sala.', id_sala: sala.id_sala });
  }
  if (participa.length > 0) {
    return res.json({ mensagem: 'Sua solicitação já foi enviada. Aguarde a aprovação do professor.' });
  }

  if (sala.acesso == 'fechada') {
    return res.status(403).json({ erro: 'Esta sala não está aceitando novos alunos.' });
  }

  const status = sala.aprovacao ? 'pendente' : 'ativo';
  await banco.query('INSERT INTO participa (id_aluno, id_sala, status) VALUES (?, ?, ?)', [req.usuario.id, sala.id_sala, status]);

  if (status == 'pendente') {
    return res.json({ mensagem: 'Solicitação enviada! Aguarde a aprovação do professor.' });
  }
  res.json({ mensagem: 'Você entrou na sala "' + sala.nome + '"!', id_sala: sala.id_sala });
});

rotas.get('/salas/:id', logado, async (req, res) => {
  const id = req.params.id;

  const [salas] = await banco.query(
    `SELECT s.*, u.nome AS professor FROM sala_aula s
     JOIN usuario u ON u.id_usuario = s.id_professor WHERE s.id_sala = ?`, [id]);
  if (salas.length == 0) {
    return res.status(404).json({ erro: 'Sala não encontrada.' });
  }
  const sala = salas[0];

  if (req.usuario.tipo == 'professor' && sala.id_professor != req.usuario.id) {
    return res.status(403).json({ erro: 'Você não tem acesso a esta sala.' });
  }
  if (req.usuario.tipo == 'aluno') {
    const [participa] = await banco.query(
      "SELECT * FROM participa WHERE id_aluno = ? AND id_sala = ? AND status = 'ativo'", [req.usuario.id, id]);
    if (participa.length == 0) {
      return res.status(403).json({ erro: 'Você não participa desta sala.' });
    }
  }

  const [atividades] = await banco.query(
    `SELECT a.id_atividade, a.titulo, a.prazo,
            COALESCE(e.status, 'pendente') AS status,
            (SELECT COUNT(*) FROM entrega_atividade x WHERE x.id_atividade = a.id_atividade AND x.status <> 'rascunho') AS total_entregas
     FROM atividade_sala a
     LEFT JOIN entrega_atividade e ON e.id_atividade = a.id_atividade AND e.id_aluno = ? AND e.status <> 'rascunho'
     WHERE a.id_sala = ? AND (? = 'professor' OR a.disponivel_em IS NULL OR a.disponivel_em <= NOW())
     ORDER BY a.prazo`, [req.usuario.id, id, req.usuario.tipo]);

  const [materiais] = await banco.query(
    `SELECT id_material, titulo, tipo, arquivo_nome, link, permitir_download FROM material_apoio
     WHERE id_sala = ? AND (? = 'professor' OR disponivel_em IS NULL OR disponivel_em <= NOW())
     ORDER BY id_material DESC`, [id, req.usuario.tipo]);

  let alunos = [];
  let pendentes = [];
  if (req.usuario.tipo == 'professor') {
    [alunos] = await banco.query(
      `SELECT u.nome, u.email FROM participa p JOIN usuario u ON u.id_usuario = p.id_aluno
       WHERE p.id_sala = ? AND p.status = 'ativo' ORDER BY u.nome`, [id]);
    [pendentes] = await banco.query(
      `SELECT u.id_usuario, u.nome, u.email FROM participa p JOIN usuario u ON u.id_usuario = p.id_aluno
       WHERE p.id_sala = ? AND p.status = 'pendente' ORDER BY u.nome`, [id]);
  }

  res.json({ sala: sala, atividades: atividades, materiais: materiais, alunos: alunos, pendentes: pendentes });
});

rotas.post('/salas/:id/sair', logado, soAluno, async (req, res) => {
  await banco.query('DELETE FROM participa WHERE id_aluno = ? AND id_sala = ?', [req.usuario.id, req.params.id]);
  res.json({ mensagem: 'Você saiu da sala.' });
});

rotas.post('/salas/:id/aprovar', logado, soProfessor, async (req, res) => {
  const { id_aluno, aceitar } = req.body;

  const [salas] = await banco.query('SELECT id_sala FROM sala_aula WHERE id_sala = ? AND id_professor = ?',
    [req.params.id, req.usuario.id]);
  if (salas.length == 0) {
    return res.status(403).json({ erro: 'Você não tem acesso a esta sala.' });
  }

  if (aceitar) {
    await banco.query("UPDATE participa SET status = 'ativo' WHERE id_aluno = ? AND id_sala = ?", [id_aluno, req.params.id]);
  } else {
    await banco.query('DELETE FROM participa WHERE id_aluno = ? AND id_sala = ?', [id_aluno, req.params.id]);
  }
  res.json({ mensagem: aceitar ? 'Aluno aprovado!' : 'Solicitação recusada.' });
});

module.exports = rotas;
