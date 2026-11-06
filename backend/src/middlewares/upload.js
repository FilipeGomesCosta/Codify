// Upload de arquivos com multer (até 50 MB, formatos da tela de envio)
const crypto = require('node:crypto');
const path = require('node:path');
const multer = require('multer');
const HttpError = require('../utils/HttpError');
const { PASTA_UPLOADS } = require('../utils/arquivos');

const EXTENSOES = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.mp4', '.png', '.jpg', '.jpeg', '.c', '.h', '.zip', '.txt'];
const TAMANHO_MAXIMO = 50 * 1024 * 1024; // 50 MB

/**
 * Cria o middleware de upload para uma subpasta de uploads/.
 * Uso na rota: upload('materiais').single('arquivo')
 */
function upload(pasta) {
  return multer({
    storage: multer.diskStorage({
      destination: path.join(PASTA_UPLOADS, pasta),
      // nome aleatório: evita sobrescrever arquivos e nomes maliciosos
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: TAMANHO_MAXIMO, files: 1 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!EXTENSOES.includes(ext)) {
        return cb(new HttpError(400, `Formato não aceito. Use: ${EXTENSOES.join(', ')}.`));
      }
      cb(null, true);
    },
  });
}

module.exports = upload;
