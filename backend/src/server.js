const express = require('express');
const path = require('path');
const banco = require('./config/banco');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, token');
  if (req.method == 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

app.use('/api', require('./routes/usuarios'));
app.use('/api', require('./routes/missoes'));
app.use('/api', require('./routes/loja'));
app.use('/api', require('./routes/compilador'));
app.use('/api', require('./routes/salas'));
app.use('/api', require('./routes/atividades'));
app.use('/api', require('./routes/materiais'));
app.use('/api', require('./routes/extras'));

app.use((erro, req, res, next) => {
  console.log(erro);
  if (erro.code == 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ erro: 'O arquivo é muito grande (máximo de 50 MB).' });
  }
  if (erro.message.startsWith('Esse arquivo')) {
    return res.status(400).json({ erro: erro.message });
  }
  res.status(500).json({ erro: 'Erro no servidor. Tente novamente.' });
});

async function conferirBanco() {
  const testes = [
    'SELECT status FROM participa LIMIT 1',
    'SELECT disponivel_em FROM atividade_sala LIMIT 1',
    'SELECT categoria FROM item LIMIT 1',
    'SELECT link FROM material_apoio LIMIT 1',
    'SELECT id_inventario FROM inventario LIMIT 1'
  ];

  try {
    for (const teste of testes) {
      await banco.query(teste);
    }
  } catch (erro) {
    if (erro.code == 'ECONNREFUSED' || erro.code == 'ER_ACCESS_DENIED_ERROR') {
      console.log('Não foi possível conectar ao MySQL (' + erro.message + ').');
      console.log('Confira se o MySQL está ligado e se o usuário e a senha em backend/src/config/banco.js estão corretos.');
    } else {
      console.log('O banco de dados está desatualizado (' + erro.message + ').');
      console.log('Rode este comando na pasta backend para recriar o banco:');
      console.log('');
      console.log('    npm run banco');
      console.log('');
    }
    process.exit(1);
  }
}

conferirBanco().then(() => {
  app.listen(3000, () => {
    console.log('Codify rodando em http://localhost:3000');
  });
});
