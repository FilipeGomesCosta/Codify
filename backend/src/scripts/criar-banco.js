const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const banco = require('../config/banco');

async function criar() {
  const c = banco.configuracao;
  console.log('Conectando em ' + c.host + ':' + c.port + ' com o usuário ' + c.user + '...');

  const conexao = await mysql.createConnection({
    host: c.host,
    port: c.port,
    user: c.user,
    password: c.password,
    charset: c.charset,
    multipleStatements: true
  });

  const sql = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'database', 'codify.sql'), 'utf8');
  await conexao.query(sql);

  const [tabelas] = await conexao.query('SHOW TABLES FROM codify');
  console.log('Banco "codify" criado com ' + tabelas.length + ' tabelas e dados de exemplo.');
  await conexao.end();
  await banco.end();
}

criar().catch((erro) => {
  console.log('Não foi possível criar o banco: ' + erro.message);
  console.log('Confira se o MySQL está ligado e se o usuário e a senha em backend/src/config/banco.js estão corretos.');
  process.exit(1);
});
