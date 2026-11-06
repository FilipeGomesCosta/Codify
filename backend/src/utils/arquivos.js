// Caminhos, envio e limpeza dos arquivos enviados (pasta backend/uploads)
const fs = require('node:fs/promises');
const path = require('node:path');

const PASTA_UPLOADS = path.resolve(__dirname, '..', '..', 'uploads');

const caminhoUpload = (pasta, nomeArquivo) => path.join(PASTA_UPLOADS, pasta, path.basename(nomeArquivo));

/** Apaga um arquivo enviado. Ignora se ele já não existir. */
async function apagarUpload(pasta, nomeArquivo) {
  if (!nomeArquivo) return;
  await fs.rm(caminhoUpload(pasta, nomeArquivo), { force: true });
}

const ehLink = (valor) => /^https?:\/\//i.test(valor || '');

/**
 * Nome original do arquivo enviado, limpo para guardar no banco.
 * Os navegadores mandam o nome em UTF-8, mas o multer o lê como latin1
 * ("FunÃ§Ãµes.pdf"). Se for o caso, converte de volta ("Funções.pdf").
 */
function nomeOriginal(file) {
  if (!file) return null;
  let nome = path.basename(file.originalname);
  if (/[\x80-\xff]/.test(nome) && !/[^\x00-\xff]/.test(nome)) {
    const utf8 = Buffer.from(nome, 'latin1').toString('utf8');
    if (!utf8.includes('\uFFFD')) nome = utf8;
  }
  return nome.slice(0, 255);
}

/**
 * Envia um arquivo da pasta uploads.
 *   baixar = true  → força o download (Content-Disposition: attachment)
 *   baixar = false → abre no navegador (inline), ex.: PDF, imagem, vídeo
 */
function enviarArquivo(res, pasta, nomeArquivo, nomeDownload, baixar = true) {
  const caminho = caminhoUpload(pasta, nomeArquivo);
  if (baixar) return res.download(caminho, nomeDownload);
  res.attachment(nomeDownload); // define o nome e o Content-Type…
  res.set('Content-Disposition', res.get('Content-Disposition').replace(/^attachment/, 'inline')); // …mas abre na tela
  return res.sendFile(caminho);
}

module.exports = { PASTA_UPLOADS, caminhoUpload, apagarUpload, ehLink, nomeOriginal, enviarArquivo };
