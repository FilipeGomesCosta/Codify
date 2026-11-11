const mysql = require('mysql2/promise');

const configuracao = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'codify',
  charset: 'utf8mb4',
  dateStrings: true
};

const conexao = mysql.createPool(configuracao);
conexao.configuracao = configuracao;

module.exports = conexao;
