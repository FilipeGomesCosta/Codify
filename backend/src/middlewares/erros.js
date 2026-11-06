// Respostas de erro padronizadas: { "erro": "mensagem" }
const fs = require('node:fs/promises');
const multer = require('multer');
const HttpError = require('../utils/HttpError');

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

// eslint-disable-next-line no-unused-vars
async function tratarErros(erro, req, res, next) {
  // se a requisição falhou depois do upload, apaga o arquivo que sobrou
  if (req.file?.path) await fs.rm(req.file.path, { force: true });

  if (erro instanceof HttpError) {
    return res.status(erro.status).json({ erro: erro.message, ...erro.detalhes });
  }
  if (erro instanceof multer.MulterError) {
    const mensagem = erro.code === 'LIMIT_FILE_SIZE' ? 'O arquivo deve ter no máximo 50 MB.' : 'Falha no envio do arquivo.';
    return res.status(400).json({ erro: mensagem });
  }
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }
  if (erro.code === 'ENOENT' && erro.path) {
    return res.status(404).json({ erro: 'Arquivo não encontrado no servidor.' });
  }
  if (erro.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Registro já existe.' });
  }
  if (erro.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ erro: 'Registro relacionado não existe.' });
  }

  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, tratarErros };
