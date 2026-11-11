const express = require('express');
const banco = require('../config/banco');
const { logado, soAluno } = require('../middlewares/auth');

const rotas = express.Router();

rotas.get('/itens', logado, soAluno, async (req, res) => {
  const [itens] = await banco.query('SELECT * FROM item ORDER BY id_item');
  res.json(itens);
});

rotas.post('/itens/:id/comprar', logado, soAluno, async (req, res) => {
  const [itens] = await banco.query('SELECT * FROM item WHERE id_item = ?', [req.params.id]);
  if (itens.length == 0) {
    return res.status(404).json({ erro: 'Item não encontrado.' });
  }
  const item = itens[0];

  const conexao = await banco.getConnection();
  try {
    await conexao.beginTransaction();

    const [alunos] = await conexao.query('SELECT moedas FROM aluno WHERE id_usuario = ? FOR UPDATE', [req.usuario.id]);
    if (alunos[0].moedas < item.preco) {
      await conexao.rollback();
      return res.status(400).json({ erro: 'Você não tem moedas suficientes para comprar este item.' });
    }

    const [inventarios] = await conexao.query('SELECT id_inventario FROM inventario WHERE id_aluno = ?', [req.usuario.id]);
    const idInventario = inventarios[0].id_inventario;

    await conexao.query('UPDATE aluno SET moedas = moedas - ? WHERE id_usuario = ?', [item.preco, req.usuario.id]);
    await conexao.query('INSERT INTO compra (id_aluno, id_item, quantidade) VALUES (?, ?, 1)', [req.usuario.id, item.id_item]);
    await conexao.query(
      `INSERT INTO item_inventario (id_inventario, id_item, quantidade) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE quantidade = quantidade + 1, data_adquirido = NOW()`, [idInventario, item.id_item]);

    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }

  res.json({ mensagem: 'Compra realizada! "' + item.nome + '" foi para o seu inventário.' });
});

rotas.get('/inventario', logado, soAluno, async (req, res) => {
  const [itens] = await banco.query(
    `SELECT i.id_item, i.nome, i.descricao, i.tipo, i.raridade, i.categoria, i.icone, ii.quantidade, ii.data_adquirido
     FROM item_inventario ii
     JOIN inventario inv ON inv.id_inventario = ii.id_inventario
     JOIN item i ON i.id_item = ii.id_item
     WHERE inv.id_aluno = ?
     ORDER BY i.nome`, [req.usuario.id]);
  res.json(itens);
});

rotas.post('/inventario/usar', logado, soAluno, async (req, res) => {
  const { id_item, id_missao } = req.body;

  if (!id_missao) {
    return res.status(400).json({ erro: 'Os itens só podem ser usados durante uma missão.' });
  }

  const [progresso] = await banco.query(
    "SELECT * FROM progresso_missao WHERE id_aluno = ? AND id_missao = ? AND status = 'em_andamento'",
    [req.usuario.id, id_missao]);
  if (progresso.length == 0) {
    return res.status(400).json({ erro: 'Você precisa estar em uma missão em andamento para usar itens.' });
  }

  const [linhas] = await banco.query(
    `SELECT ii.quantidade, i.efeito, i.nome, inv.id_inventario
     FROM item_inventario ii
     JOIN inventario inv ON inv.id_inventario = ii.id_inventario
     JOIN item i ON i.id_item = ii.id_item
     WHERE inv.id_aluno = ? AND ii.id_item = ?`, [req.usuario.id, id_item]);
  if (linhas.length == 0 || linhas[0].quantidade < 1) {
    return res.status(400).json({ erro: 'Esse item não está disponível no seu inventário.' });
  }
  const item = linhas[0];

  if (item.efeito == 'nenhum') {
    return res.status(400).json({ erro: 'O item "' + item.nome + '" não pode ser usado nas missões.' });
  }

  const [missoes] = await banco.query('SELECT dica, pista FROM missao WHERE id_missao = ?', [id_missao]);
  const texto = missoes[0][item.efeito];
  if (!texto) {
    return res.status(400).json({ erro: 'Esta missão não tem esse tipo de ajuda.' });
  }

  if (item.quantidade > 1) {
    await banco.query('UPDATE item_inventario SET quantidade = quantidade - 1 WHERE id_inventario = ? AND id_item = ?',
      [item.id_inventario, id_item]);
  } else {
    await banco.query('DELETE FROM item_inventario WHERE id_inventario = ? AND id_item = ?',
      [item.id_inventario, id_item]);
  }

  res.json({ mensagem: 'Item usado com sucesso!', texto: texto });
});

module.exports = rotas;
