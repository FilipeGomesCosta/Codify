const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const permitidos = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.mp4', '.png', '.jpg', '.c', '.h', '.zip', '.txt'];

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: function (req, file, cb) {
      cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase());
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const extensao = path.extname(file.originalname).toLowerCase();
    if (!permitidos.includes(extensao)) {
      return cb(new Error('Esse arquivo não pode ser anexado. Use: ' + permitidos.join(', ')));
    }
    cb(null, true);
  }
});

function tipoDoArquivo(nome) {
  const extensao = path.extname(nome).toLowerCase();
  if (extensao == '.mp4') return 'video';
  if (extensao == '.png' || extensao == '.jpg') return 'imagem';
  if (extensao == '.zip') return 'outro';
  return 'documento';
}

function nomeOriginal(arquivo) {
  return Buffer.from(arquivo.originalname, 'latin1').toString('utf8');
}

module.exports = { upload, tipoDoArquivo, nomeOriginal };
