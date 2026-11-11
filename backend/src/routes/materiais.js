const express = require('express');
const path = require('path');
const fs = require('fs');
const banco = require('../config/banco');
const { upload, nomeOriginal } = require('../middlewares/upload');
const { logado, soProfessor } = require('../middlewares/auth');

const rotas = express.Router();
const tipos = ['documento', 'video', 'link', 'imagem', 'outro'];

rotas.post('/materiais', logado, soProfessor, upload.single('arquivo'), async (req, res) => {
  const { id_sala, titulo, descricao, categoria, tipo, link, disponivel_em } = req.body;

  if (!titulo || titulo.trim() == '') {
    return res.status(400).json({ erro: 'O título é obrigatório.' });
  }
  if (!tipos.includes(tipo)) {
    return res.status(400).json({ erro: 'Escolha o tipo do material.' });
  }
  const temLink = link && link.trim() != '';
  if (temLink && !/^https?:\/\//.test(link)) {
    return res.status(400).json({ erro: 'Informe um link válido (começando com http:// ou https://).' });
  }
  if (tipo == 'link' && !temLink) {
    return res.status(400).json({ erro: 'Informe o endereço do link.' });
  }
  if (tipo == 'video' && !temLink && !req.file) {
    return res.status(400).json({ erro: 'Anexe o arquivo de vídeo ou informe o link do vídeo.' });
  }
  if (tipo != 'link' && tipo != 'video' && !req.file) {
    return res.status(400).json({ erro: 'O arquivo é obrigatório.' });
  }

  const [salas] = await banco.query('SELECT id_sala FROM sala_aula WHERE id_sala = ? AND id_professor = ?',
    [id_sala, req.usuario.id]);
  if (salas.length == 0) {
    return res.status(403).json({ erro: 'Escolha uma das suas salas.' });
  }

  let arquivo = null;
  let nome = null;
  let tamanho = 0;
  if (req.file && tipo != 'link') {
    arquivo = req.file.filename;
    nome = nomeOriginal(req.file);
    tamanho = req.file.size;
  }

  await banco.query(
    `INSERT INTO material_apoio (id_sala, titulo, descricao, categoria, tipo, arquivo, arquivo_nome, link, tamanho,
                                 permitir_download, destaque, disponivel_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_sala, titulo, descricao, categoria || null, tipo, arquivo, nome, temLink ? link : null, tamanho,
      req.body.permitir_download == 'false' ? 0 : 1, req.body.destaque == 'true' ? 1 : 0, disponivel_em || null]);
  res.json({ mensagem: 'Material adicionado com sucesso!' });
});

rotas.get('/materiais', logado, async (req, res) => {
  const { busca, tipo, sala, ordem } = req.query;

  let sql = `SELECT m.id_material, m.titulo, m.descricao, m.categoria, m.tipo, m.tamanho, m.arquivo_nome, m.link,
                    m.permitir_download, m.destaque, m.data_envio, m.disponivel_em, s.nome AS sala, s.id_sala
             FROM material_apoio m JOIN sala_aula s ON s.id_sala = m.id_sala `;
  const valores = [];

  if (req.usuario.tipo == 'aluno') {
    sql += `JOIN participa p ON p.id_sala = s.id_sala WHERE p.status = 'ativo' AND p.id_aluno = ?
            AND (m.disponivel_em IS NULL OR m.disponivel_em <= NOW()) `;
  } else {
    sql += 'WHERE s.id_professor = ? ';
  }
  valores.push(req.usuario.id);

  if (busca) {
    sql += 'AND (m.titulo LIKE ? OR m.descricao LIKE ?) ';
    valores.push('%' + busca + '%', '%' + busca + '%');
  }
  if (tipo) {
    sql += 'AND m.tipo = ? ';
    valores.push(tipo);
  }
  if (sala) {
    sql += 'AND s.id_sala = ? ';
    valores.push(sala);
  }

  if (ordem == 'antigos') {
    sql += 'ORDER BY m.data_envio ASC';
  } else if (ordem == 'titulo') {
    sql += 'ORDER BY m.titulo ASC';
  } else {
    sql += 'ORDER BY m.data_envio DESC';
  }

  const [materiais] = await banco.query(sql, valores);
  res.json(materiais);
});

rotas.get('/materiais/:id/arquivo', logado, async (req, res) => {
  const [materiais] = await banco.query(
    `SELECT m.arquivo, m.arquivo_nome, m.permitir_download, s.id_professor,
            (SELECT COUNT(*) FROM participa p WHERE p.id_sala = m.id_sala AND p.id_aluno = ? AND p.status = 'ativo') AS participa
     FROM material_apoio m JOIN sala_aula s ON s.id_sala = m.id_sala
     WHERE m.id_material = ?`, [req.usuario.id, req.params.id]);
  if (materiais.length == 0) {
    return res.status(404).json({ erro: 'Material não encontrado.' });
  }
  const material = materiais[0];

  if (material.id_professor != req.usuario.id && material.participa == 0) {
    return res.status(403).json({ erro: 'Você não tem acesso a este material.' });
  }
  const caminho = path.join(__dirname, '..', '..', 'uploads', material.arquivo || 'x');
  if (!material.arquivo || !fs.existsSync(caminho)) {
    return res.status(404).json({ erro: 'O arquivo não foi encontrado no servidor.' });
  }

  if (req.query.inline) {
    return res.sendFile(caminho);
  }
  if (!material.permitir_download && material.id_professor != req.usuario.id) {
    return res.status(403).json({ erro: 'O professor não permitiu o download deste material. Use a opção de visualizar.' });
  }
  res.download(caminho, material.arquivo_nome);
});

module.exports = rotas;
