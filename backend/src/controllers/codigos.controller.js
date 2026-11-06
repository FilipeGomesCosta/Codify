// Códigos escritos pelo aluno no Compilador (ALUNO ESCREVE CÓDIGO)
const { query } = require('../config/db');
const HttpError = require('../utils/HttpError');
const { lerTexto, lerId } = require('../utils/validacao');
const compilador = require('../services/compilador');

const MAX_CODIGO = 100000; // 100 mil caracteres

async function buscarDoAluno(idCodigo, idAluno) {
  const [codigo] = await query(
    'SELECT * FROM codigo WHERE id_codigo = ? AND id_aluno = ?',
    [idCodigo, idAluno],
  );
  if (!codigo) throw new HttpError(404, 'Código não encontrado.');
  return codigo;
}

// GET /api/codigos
async function listar(req, res) {
  const codigos = await query(
    `SELECT id_codigo, LEFT(conteudo, 200) AS previa, status, criado_em, atualizado_em
       FROM codigo
      WHERE id_aluno = ?
      ORDER BY atualizado_em DESC`,
    [req.usuario.id],
  );
  res.json(codigos);
}

// GET /api/codigos/:id
async function obter(req, res) {
  res.json(await buscarDoAluno(lerId(req.params.id), req.usuario.id));
}

// POST /api/codigos  { conteudo }
async function criar(req, res) {
  const conteudo = lerTexto(req.body?.conteudo, 'conteudo', { max: MAX_CODIGO, obrigatorio: true });
  const r = await query('INSERT INTO codigo (id_aluno, conteudo) VALUES (?, ?)', [req.usuario.id, conteudo]);
  res.status(201).json(await buscarDoAluno(r.insertId, req.usuario.id));
}

// PUT /api/codigos/:id  { conteudo }
async function atualizar(req, res) {
  const id = lerId(req.params.id);
  await buscarDoAluno(id, req.usuario.id);
  const conteudo = lerTexto(req.body?.conteudo, 'conteudo', { max: MAX_CODIGO, obrigatorio: true });
  // código alterado volta a ser rascunho até ser executado de novo
  await query("UPDATE codigo SET conteudo = ?, status = 'rascunho' WHERE id_codigo = ?", [conteudo, id]);
  res.json(await buscarDoAluno(id, req.usuario.id));
}

// DELETE /api/codigos/:id
async function remover(req, res) {
  const id = lerId(req.params.id);
  await buscarDoAluno(id, req.usuario.id);
  await query('DELETE FROM codigo WHERE id_codigo = ?', [id]);
  res.status(204).end();
}

// POST /api/codigos/executar  { conteudo, entrada?, id_codigo? }
// Botão "Executar código". Se id_codigo vier, atualiza o status do código salvo.
async function executar(req, res) {
  const body = req.body ?? {};
  const conteudo = lerTexto(body.conteudo, 'conteudo', { max: MAX_CODIGO, obrigatorio: true });
  const entrada = lerTexto(body.entrada, 'entrada', { max: 10000 }) ?? '';

  let idCodigo = null;
  if (body.id_codigo) {
    idCodigo = lerId(body.id_codigo, 'id_codigo');
    await buscarDoAluno(idCodigo, req.usuario.id);
  }

  const resultado = await compilador.compilarEExecutar(conteudo, entrada);

  if (idCodigo) {
    await query('UPDATE codigo SET conteudo = ?, status = ? WHERE id_codigo = ?', [conteudo, resultado.status, idCodigo]);
  }
  res.json(resultado);
}

module.exports = { listar, obter, criar, atualizar, remover, executar };
