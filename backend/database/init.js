// Cria o banco e as tabelas executando database/schema.sql.
// ATENÇÃO: apaga as tabelas existentes. Uso: npm run db:init
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function main() {
  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    multipleStatements: true, // o schema tem vários comandos
  });

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await conexao.query(sql);
  await conexao.end();
  console.log('Banco "codify" criado com sucesso.');
}

main().catch((erro) => {
  console.error('Erro ao criar o banco:', erro.message);
  process.exit(1);
});
