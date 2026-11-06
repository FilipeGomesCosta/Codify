// Ponto de entrada: carrega o .env, testa o banco e sobe o servidor
require('dotenv').config({ quiet: true });

const app = require('./app');
const { pool } = require('./config/db');

const PORTA = Number(process.env.PORT) || 3000;

async function iniciar() {
  if (!process.env.JWT_SECRET) {
    console.error('Defina JWT_SECRET no arquivo .env (veja .env.example).');
    process.exit(1);
  }

  try {
    await pool.query('SELECT 1');
  } catch (erro) {
    console.error(`Não foi possível conectar ao MySQL: ${erro.message}`);
    console.error('Confira DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no .env e se o banco foi criado (npm run db:reset).');
    process.exit(1);
  }

  app.listen(PORTA, () => {
    console.log(`Codify rodando em http://localhost:${PORTA}`);
    console.log(`API disponível em http://localhost:${PORTA}/api`);
  });
}

iniciar();
