// Conexão com o MySQL (pool de conexões reutilizáveis)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codify',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL (ex.: nota) volta como número, não como texto
});

/**
 * Executa uma consulta e devolve só as linhas.
 * Sempre passe os valores em "params" (nunca concatene na string):
 * o driver escapa tudo e evita SQL injection.
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Executa várias consultas como uma única operação: ou tudo é salvo,
 * ou nada é salvo. Recebe uma função que usa a conexão "conn".
 */
async function transacao(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, transacao };
