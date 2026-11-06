// Loja (ITEM e ALUNO COMPRA ITEM)
const { query, transacao } = require('../config/db');
const HttpError = require('../utils/HttpError');
const { lerTexto, lerInteiro, lerId } = require('../utils/validacao');
const { lerPaginacao, montarPagina } = require('../utils/paginacao');

async function buscarItem(id, conn) {
  const executor = conn ? (sql, p) => conn.query(sql, p).then(([r]) => r) : query;
  const [item] = await executor('SELECT * FROM item WHERE id_item = ?', [id]);
  if (!item) throw new HttpError(404, 'Item não encontrado.');
  return item;
}

function lerDadosItem(body, parcial = false) {
  return {
    nome: lerTexto(body.nome, 'nome', { max: 100, obrigatorio: !parcial }),
    descricao: lerTexto(body.descricao, 'descricao', { max: 2000 }),
    preco: lerInteiro(body.preco, 'preco', { min: 0, max: 1000000 }),
    tipo: lerTexto(body.tipo, 'tipo', { max: 30, obrigatorio: true }).toLowerCase(),
  };
}

// GET /api/itens?busca=dica&tipo=auxilio&pagina=1&limite=6
async function listar(req, res) {
  const pag = lerPaginacao(req.query, 6);
  const filtros = [];
  const params = [];
  if (req.query.busca) {
    filtros.push('(nome LIKE ? OR descricao LIKE ?)');
    params.push(`%${req.query.busca}%`, `%${req.query.busca}%`);
  }
  if (req.query.tipo) {
    filtros.push('tipo = ?');
    params.push(String(req.query.tipo).toLowerCase());
  }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM item ${where}`, params);
  const itens = await query(
    `SELECT * FROM item ${where} ORDER BY id_item LIMIT ? OFFSET ?`,
    [...params, pag.limite, pag.offset],
  );
  res.json(montarPagina(itens, total, pag));
}

// GET /api/itens/:id
async function obter(req, res) {
  res.json(await buscarItem(lerId(req.params.id)));
}

// POST /api/itens  (professor)
async function criar(req, res) {
  const i = lerDadosItem(req.body ?? {});
  const r = await query(
    'INSERT INTO item (nome, descricao, preco, tipo) VALUES (?, ?, ?, ?)',
    [i.nome, i.descricao, i.preco, i.tipo],
  );
  res.status(201).json(await buscarItem(r.insertId));
}

// PUT /api/itens/:id  (professor)
async function atualizar(req, res) {
  const id = lerId(req.params.id);
  const atual = await buscarItem(id);
  const i = lerDadosItem({ ...atual, ...req.body });
  await query(
    'UPDATE item SET nome = ?, descricao = ?, preco = ?, tipo = ? WHERE id_item = ?',
    [i.nome, i.descricao, i.preco, i.tipo, id],
  );
  res.json(await buscarItem(id));
}

// DELETE /api/itens/:id  (professor)
async function remover(req, res) {
  const id = lerId(req.params.id);
  await buscarItem(id);
  await query('DELETE FROM item WHERE id_item = ?', [id]);
  res.status(204).end();
}

// POST /api/itens/:id/comprar  { quantidade? }  (aluno)
// Erros possíveis (janelas da loja):
//   400 "Moedas insuficientes." → vem com preco_total e saldo
//   404 item não existe
async function comprar(req, res) {
  const id = lerId(req.params.id);
  const quantidade = lerInteiro(req.body?.quantidade, 'quantidade', { min: 1, max: 99, padrao: 1 });

  const resultado = await transacao(async (conn) => {
    const item = await buscarItem(id, conn);
    const precoTotal = item.preco * quantidade;

    // FOR UPDATE: impede duas compras simultâneas de gastarem o mesmo saldo
    const [[aluno]] = await conn.query(
      'SELECT moedas FROM aluno WHERE id_usuario = ? FOR UPDATE',
      [req.usuario.id],
    );
    if (aluno.moedas < precoTotal) {
      throw new HttpError(400, 'Moedas insuficientes.', { preco_total: precoTotal, saldo: aluno.moedas });
    }

    const saldo = aluno.moedas - precoTotal;
    await conn.query('UPDATE aluno SET moedas = ? WHERE id_usuario = ?', [saldo, req.usuario.id]);

    // COMPRA: total já comprado deste item
    await conn.query(
      `INSERT INTO compra (id_aluno, id_item, quantidade) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantidade = quantidade + ?`,
      [req.usuario.id, id, quantidade, quantidade],
    );
    // POSSUI: inventário atual
    await conn.query(
      `INSERT INTO possui (id_aluno, id_item, quantidade) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantidade = quantidade + ?`,
      [req.usuario.id, id, quantidade, quantidade],
    );

    return { mensagem: `Parabéns! Você adquiriu ${item.nome}.`, item, quantidade, preco_total: precoTotal, saldo };
  });

  res.status(201).json(resultado);
}

module.exports = { listar, obter, criar, atualizar, remover, comprar };
