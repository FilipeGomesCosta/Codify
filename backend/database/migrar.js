// Atualiza um banco JÁ EXISTENTE com as colunas novas (sem apagar dados).
// Pode rodar quantas vezes quiser: só cria o que estiver faltando.
// Uso: npm run db:migrate
require('dotenv').config({ quiet: true });
const { pool } = require('../src/config/db');

// [tabela, coluna, definição]
const COLUNAS = [
  ['sala_aula', 'descricao', 'VARCHAR(150) NULL'],
  ['sala_aula', 'nivel', "ENUM('iniciante', 'medio', 'avancado') NOT NULL DEFAULT 'iniciante'"],
  ['sala_aula', 'imagem', "VARCHAR(20) NOT NULL DEFAULT 'codigo'"],
  ['sala_aula', 'criado_em', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'],

  ['atividade', 'arquivo', 'VARCHAR(255) NULL'],
  ['atividade', 'arquivo_nome', 'VARCHAR(255) NULL'],
  ['atividade', 'disponivel_em', 'DATETIME NULL'],
  ['atividade', 'criado_em', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'],

  ['material_apoio', 'arquivo_nome', 'VARCHAR(255) NULL'],
  ['material_apoio', 'tamanho', 'INT UNSIGNED NULL'],
  ['material_apoio', 'tipo', "ENUM('documento', 'video', 'link', 'imagem', 'outro') NOT NULL DEFAULT 'documento'"],
  ['material_apoio', 'categoria', 'VARCHAR(60) NULL'],
  ['material_apoio', 'permitir_download', 'TINYINT(1) NOT NULL DEFAULT 1'],
  ['material_apoio', 'destaque', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['material_apoio', 'disponivel_em', 'DATETIME NULL'],
  ['material_apoio', 'criado_em', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'],

  ['entrega', 'arquivo_nome', 'VARCHAR(255) NULL AFTER arquivo'],
];

async function main() {
  const banco = process.env.DB_NAME || 'codify';
  let criadas = 0;
  for (const [tabela, coluna, definicao] of COLUNAS) {
    const [[existe]] = await pool.query(
      'SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?',
      [banco, tabela, coluna],
    );
    if (existe) continue;
    await pool.query(`ALTER TABLE \`${tabela}\` ADD COLUMN \`${coluna}\` ${definicao}`);
    console.log(`+ ${tabela}.${coluna}`);
    criadas += 1;
  }
  console.log(criadas ? `${criadas} coluna(s) criada(s).` : 'O banco já está atualizado.');
}

main()
  .catch((erro) => {
    console.error('Erro ao atualizar o banco:', erro.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
