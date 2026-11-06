// Inventário do aluno (ALUNO POSSUI ITEM)
const { query, transacao } = require('../config/db');
const HttpError = require('../utils/HttpError');
const { lerId } = require('../utils/validacao');

const ORDENACOES = {
  nome: 'i.nome ASC',
  quantidade: 'p.quantidade DESC, i.nome ASC',
  tipo: 'i.tipo ASC, i.nome ASC',
};

// GET /api/inventario?tipo=auxilio&ordem=nome|quantidade|tipo
async function listar(req, res) {
  const params = [req.usuario.id];
  let filtro = '';
  if (req.query.tipo) {
    filtro = 'AND i.tipo = ?';
    params.push(String(req.query.tipo).toLowerCase());
  }
  const ordem = ORDENACOES[req.query.ordem] ?? ORDENACOES.nome;

  const itens = await query(
    `SELECT i.id_item, i.nome, i.descricao, i.tipo, p.quantidade
       FROM possui p
       JOIN item i ON i.id_item = p.id_item
      WHERE p.id_aluno = ? ${filtro}
      ORDER BY ${ordem}`,
    params,
  );

  // resumo do topo da página (total e contagem por tipo)
  const porTipo = {};
  for (const item of itens) porTipo[item.tipo] = (porTipo[item.tipo] ?? 0) + item.quantidade;

  res.json({
    resumo: {
      itens_diferentes: itens.length,
      total_itens: itens.reduce((soma, i) => soma + i.quantidade, 0),
      por_tipo: porTipo,
    },
    itens,
  });
}

// POST /api/inventario/:idItem/usar  — consome 1 unidade do item
async function usar(req, res) {
  const idItem = lerId(req.params.idItem, 'idItem');

  const restante = await transacao(async (conn) => {
    const [[posse]] = await conn.query(
      'SELECT quantidade FROM possui WHERE id_aluno = ? AND id_item = ? FOR UPDATE',
      [req.usuario.id, idItem],
    );
    if (!posse) throw new HttpError(404, 'Você não possui este item.');

    if (posse.quantidade > 1) {
      await conn.query(
        'UPDATE possui SET quantidade = quantidade - 1 WHERE id_aluno = ? AND id_item = ?',
        [req.usuario.id, idItem],
      );
    } else {
      await conn.query('DELETE FROM possui WHERE id_aluno = ? AND id_item = ?', [req.usuario.id, idItem]);
    }
    return posse.quantidade - 1;
  });

  res.json({ mensagem: 'Item usado.', id_item: idItem, quantidade_restante: restante });
}

module.exports = { listar, usar };
