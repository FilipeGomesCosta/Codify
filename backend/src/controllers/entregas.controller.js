// Entregas das atividades (ALUNO ENTREGA ATIVIDADE)
const path = require('node:path');
const { query } = require('../config/db');
const HttpError = require('../utils/HttpError');
const { lerTexto, lerId, lerOpcao } = require('../utils/validacao');
const { exigirAcessoAtividade } = require('../utils/acesso');
const { apagarUpload, nomeOriginal, enviarArquivo } = require('../utils/arquivos');

const PASTA = 'entregas';

/** Esconde o nome interno do arquivo no disco e avisa se há arquivo. */
const formatar = (e) => (e ? { ...e, tem_arquivo: Boolean(e.arquivo), arquivo: undefined } : e);

const buscar = async (idAluno, idAtividade) => (await query(
  'SELECT * FROM entrega WHERE id_aluno = ? AND id_atividade = ?',
  [idAluno, idAtividade],
))[0];

// POST /api/atividades/:id/entregas  (aluno, multipart/form-data)
//   arquivo     → arquivo da resposta (opcional se já houver um salvo)
//   observacao  → texto para o professor (até 300 caracteres)
//   acao        → "rascunho" (Salvar rascunho) ou "enviar" (Enviar a atividade)
//   remover_arquivo=true → tira o arquivo salvo no rascunho
async function enviar(req, res) {
  const idAtividade = lerId(req.params.id);
  const { atividade } = await exigirAcessoAtividade(idAtividade, req.usuario);

  const body = req.body ?? {};
  const acao = lerOpcao(body.acao, 'acao', ['rascunho', 'enviar'], 'enviar');
  const observacao = lerTexto(body.observacao, 'observacao', { max: 300 });

  const anterior = await buscar(req.usuario.id, idAtividade);
  if (anterior?.status === 'avaliada') {
    throw new HttpError(409, 'Esta atividade já foi avaliada e não pode ser alterada.');
  }
  if (anterior?.status === 'entregue' && acao === 'rascunho') {
    throw new HttpError(409, 'Esta atividade já foi enviada. Para alterar, envie novamente.');
  }
  if (new Date(atividade.prazo) < new Date()) {
    throw new HttpError(400, 'O prazo de entrega desta atividade já terminou.');
  }

  let arquivo = anterior?.arquivo ?? null;
  let arquivoNome = anterior?.arquivo_nome ?? null;
  if (req.file) {
    arquivo = req.file.filename;
    arquivoNome = nomeOriginal(req.file);
  } else if (['true', 'on', '1'].includes(String(body.remover_arquivo))) {
    arquivo = null;
    arquivoNome = null;
  }
  if (acao === 'enviar' && !arquivo && !observacao) {
    throw new HttpError(400, 'Anexe um arquivo ou escreva uma observação antes de enviar.');
  }

  const status = acao === 'enviar' ? 'entregue' : 'rascunho';
  await query(
    `INSERT INTO entrega (id_aluno, id_atividade, status, arquivo, arquivo_nome, observacao, data_entrega)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), arquivo = VALUES(arquivo), arquivo_nome = VALUES(arquivo_nome),
                             observacao = VALUES(observacao), data_entrega = VALUES(data_entrega)`,
    [req.usuario.id, idAtividade, status, arquivo, arquivoNome, observacao, status === 'entregue' ? new Date() : null],
  );

  // trocou ou removeu o arquivo: apaga o antigo do disco
  if (anterior?.arquivo && anterior.arquivo !== arquivo) {
    await apagarUpload(PASTA, anterior.arquivo);
  }

  res.status(anterior ? 200 : 201).json({
    mensagem: status === 'entregue' ? 'Atividade enviada!' : 'Rascunho salvo.',
    entrega: formatar(await buscar(req.usuario.id, idAtividade)),
  });
}

// DELETE /api/atividades/:id/entregas  (aluno) — desfaz a entrega/rascunho enquanto não for avaliada
async function cancelar(req, res) {
  const idAtividade = lerId(req.params.id);
  const { atividade } = await exigirAcessoAtividade(idAtividade, req.usuario);
  const entrega = await buscar(req.usuario.id, idAtividade);
  if (!entrega) throw new HttpError(404, 'Você ainda não entregou esta atividade.');
  if (entrega.status === 'avaliada') throw new HttpError(409, 'Esta atividade já foi avaliada e não pode ser alterada.');
  if (new Date(atividade.prazo) < new Date()) throw new HttpError(400, 'O prazo de entrega desta atividade já terminou.');

  await query('DELETE FROM entrega WHERE id_aluno = ? AND id_atividade = ?', [req.usuario.id, idAtividade]);
  await apagarUpload(PASTA, entrega.arquivo);
  res.status(204).end();
}

// GET /api/atividades/:id/entregas
// Professor dono: todos os alunos da sala, com a entrega de cada um (status "pendente" se não entregou;
//   rascunhos não aparecem para o professor). ?status=entregue|avaliada|pendente filtra.
// Aluno: só a dele ("Histórico de entregas").
async function listar(req, res) {
  const idAtividade = lerId(req.params.id);
  const { atividade } = await exigirAcessoAtividade(idAtividade, req.usuario);

  if (req.usuario.tipo === 'aluno') {
    const entrega = await buscar(req.usuario.id, idAtividade);
    return res.json(entrega ? [formatar({ ...entrega, aluno: req.usuario.nome })] : []);
  }

  const linhas = await query(
    `SELECT u.id_usuario AS id_aluno, u.nome AS aluno, u.email,
            CASE WHEN e.status IN ('entregue', 'avaliada') THEN e.status ELSE 'pendente' END AS status,
            IF(e.status IN ('entregue', 'avaliada'), e.nota, NULL) AS nota,
            IF(e.status IN ('entregue', 'avaliada'), e.feedback, NULL) AS feedback,
            IF(e.status IN ('entregue', 'avaliada'), e.observacao, NULL) AS observacao,
            IF(e.status IN ('entregue', 'avaliada'), e.arquivo, NULL) AS arquivo,
            IF(e.status IN ('entregue', 'avaliada'), e.arquivo_nome, NULL) AS arquivo_nome,
            IF(e.status IN ('entregue', 'avaliada'), e.data_entrega, NULL) AS data_entrega
       FROM participa p
       JOIN usuario u ON u.id_usuario = p.id_aluno
       LEFT JOIN entrega e ON e.id_aluno = p.id_aluno AND e.id_atividade = ?
      WHERE p.id_sala = ?
      ORDER BY (e.status IN ('entregue', 'avaliada')) DESC, e.data_entrega DESC, u.nome`,
    [idAtividade, atividade.id_sala],
  );
  const filtro = req.query.status;
  const entregas = linhas
    .map((e) => formatar({ ...e, id_atividade: idAtividade, atrasada: Boolean(e.data_entrega) && new Date(e.data_entrega) > new Date(atividade.prazo) }))
    .filter((e) => !filtro || e.status === filtro);
  res.json(entregas);
}

// PUT /api/atividades/:id/entregas/:idAluno/avaliacao  { nota, feedback? }  (professor dono)
async function avaliar(req, res) {
  const idAtividade = lerId(req.params.id);
  const idAluno = lerId(req.params.idAluno, 'idAluno');
  if (req.usuario.tipo !== 'professor') throw new HttpError(403, 'Apenas o professor pode avaliar.');
  await exigirAcessoAtividade(idAtividade, req.usuario);

  const nota = Number(String(req.body?.nota ?? '').replace(',', '.'));
  if (req.body?.nota === undefined || String(req.body.nota).trim() === '' || Number.isNaN(nota) || nota < 0 || nota > 10) {
    throw new HttpError(400, 'A nota deve ser um número de 0 a 10.');
  }
  const feedback = lerTexto(req.body?.feedback, 'feedback', { max: 5000 });

  const r = await query(
    `UPDATE entrega SET nota = ?, feedback = ?, status = 'avaliada'
      WHERE id_aluno = ? AND id_atividade = ? AND status IN ('entregue', 'avaliada')`,
    [Math.round(nota * 100) / 100, feedback, idAluno, idAtividade],
  );
  if (!r.affectedRows) throw new HttpError(404, 'Entrega não encontrada ou ainda não enviada.');

  res.json(formatar(await buscar(idAluno, idAtividade)));
}

// GET /api/atividades/:id/entregas/:idAluno/arquivo  — professor dono ou o próprio aluno
async function baixarArquivo(req, res) {
  const idAtividade = lerId(req.params.id);
  const idAluno = lerId(req.params.idAluno, 'idAluno');
  await exigirAcessoAtividade(idAtividade, req.usuario);
  if (req.usuario.tipo === 'aluno' && req.usuario.id !== idAluno) {
    throw new HttpError(403, 'Você só pode baixar a sua própria entrega.');
  }

  const entrega = await buscar(idAluno, idAtividade);
  // o professor não vê rascunhos
  if (!entrega?.arquivo || (req.usuario.tipo === 'professor' && entrega.status === 'rascunho')) {
    throw new HttpError(404, 'Esta entrega não tem arquivo.');
  }
  const nome = entrega.arquivo_nome || `entrega-${idAtividade}-${idAluno}${path.extname(entrega.arquivo)}`;
  enviarArquivo(res, PASTA, entrega.arquivo, nome, req.query.baixar !== '0');
}

module.exports = { enviar, cancelar, listar, avaliar, baixarArquivo };
