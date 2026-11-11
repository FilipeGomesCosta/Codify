const nodemailer = require('nodemailer');
const configuracao = require('../config/email');

async function enviarEmail(para, assunto, texto) {
  if (configuracao.host == '') {
    console.log('E-mail não configurado (veja backend/src/config/email.js). Mensagem para ' + para + ':');
    console.log(texto);
    return;
  }

  const transporte = nodemailer.createTransport({
    host: configuracao.host,
    port: configuracao.port,
    secure: configuracao.port == 465,
    auth: { user: configuracao.usuario, pass: configuracao.senha }
  });
  await transporte.sendMail({ from: configuracao.remetente, to: para, subject: assunto, text: texto });
}

module.exports = enviarEmail;
