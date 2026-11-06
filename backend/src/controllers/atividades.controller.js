// Atividades das salas (ATIVIDADE e SALA_AULA CONTÉM ATIVIDADE)
const path = require('node:path');
const { query } = require('../config/db');
const HttpError = require('../utils/HttpError');
const { lerTexto, lerId, lerData, lerDisponibilidade, lerBooleano } = require('../utils/validacao');
const {
  exigirAcessoSala, exigirDonoSala, exigirAcessoAtividade, SQL_DISPONIVEL,
} = require('../utils/acesso');
const { apagarUpload, nomeOriginal, enviarArquivo } = require('../utils/arquivos');

const PASTA = 'atividades';

// Campos de formulário aceitos com nomes alternativos (os da tela e os do banco)
function lerDadosAtividade(body) {
  return {
    titulo: lerTexto(body.titulo, 'titulo', { max: 150, obrigatorio: true }),
    descricao: lerTexto(body.descricao ?? body.instrucoes, 'descricao', { max: 20000 }),
    prazo: lerData(body.prazo ?? body.entrega, 'prazo (data de entrega)'),
  };
}

/** Campos extras calculados para o front-end. */
function formatar(a) {
  if (!a) return a;
  const agendada = Boolean(a.disponivel_em) && new Date(a.disponivel_em) > new Date();
  return {
    ...a,
    tem_arquivo: Boolean(a.arquivo),
    arquivo: undefined, // nome interno no disco: não precisa ir para o navegador
    agendada,
    encerrada: new Date(a.prazo) < new Date(),
  };
}

const buscar = async (id) => (await query('SELECT * FROM atividade WHERE id_atividade = ?', [id]))[0];

// GET /api/atividades?sala=ID
// Lista de atividades de todas as salas do usuário (ou de uma só, com ?sala=).
// Aluno: com o status da entrega dele e só as já disponíveis.
// Professor: com o total de entregas e de alunos.
async function buscarLista(usuario, idSala) {
  const params = [usuario.id];
  let filtroSala = '';
  if (idSala) {
    filtroSala = 'AND a.id_sala = ?';
    params.push(idSala);
  }

  const atividades = usuario.tipo === 'aluno'
    ? await query(
      `SELECT a.*, s.nome AS sala, u.nome AS professor,
              COALESCE(e.status, 'pendente') AS status_entrega, e.nota, e.data_entrega
         FROM participa p
         JOIN atividade a ON a.id_sala = p.id_sala
         JOIN sala_aula s ON s.id_sala = a.id_sala
         JOIN usuario u ON u.id_usuario = s.id_professor
         LEFT JOIN entrega e ON e.id_atividade = a.id_atividade AND e.id_aluno = p.id_aluno
        WHERE p.id_aluno = ? ${filtroSala} AND ${SQL_DISPONIVEL('a')}
        ORDER BY a.prazo`,
      params,
    )
    : await query(
      `SELECT a.*, s.nome AS sala,
              (SELECT COUNT(*) FROM entrega e
                WHERE e.id_atividade = a.id_atividade AND e.status IN ('entregue', 'avaliada')) AS total_entregas,
              (SELECT COUNT(*) FROM entrega e
                WHERE e.id_atividade = a.id_atividade AND e.status = 'avaliada') AS total_avaliadas,
              (SELECT COUNT(*) FROM participa p WHERE p.id_sala = a.id_sala) AS total_alunos
         FROM atividade a
         JOIN sala_aula s ON s.id_sala = a.id_sala
        WHERE s.id_professor = ? ${filtroSala}
        ORDER BY a.prazo DESC`,
      params,
    );
  return atividades.map(formatar);
}

async function listar(req, res) {
  const idSala = req.query.sala ? lerId(req.query.sala, 'sala') : null;
  res.json(await buscarLista(req.usuario, idSala));
}

// GET /api/salas/:idSala/atividades — mesma lista, de uma sala (confere o acesso)
async function listarDaSala(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  await exigirAcessoSala(idSala, req.usuario);
  res.json(await buscarLista(req.usuario, idSala));
}

// GET /api/atividades/pendentes  (aluno) — "Atividades pendentes" das Ações Rápidas
async function pendentes(req, res) {
  const atividades = await query(
    `SELECT a.*, s.nome AS sala, COALESCE(e.status, 'pendente') AS status_entrega
       FROM participa p
       JOIN atividade a ON a.id_sala = p.id_sala
       JOIN sala_aula s ON s.id_sala = a.id_sala
       LEFT JOIN entrega e ON e.id_atividade = a.id_atividade AND e.id_aluno = p.id_aluno
      WHERE p.id_aluno = ?
        AND (e.status IS NULL OR e.status = 'rascunho')
        AND a.prazo >= NOW()
        AND ${SQL_DISPONIVEL('a')}
      ORDER BY a.prazo`,
    [req.usuario.id],
  );
  res.json(atividades.map(formatar));
}

// GET /api/atividades/:id  — tela da atividade (aluno) / detalhes (professor)
async function obter(req, res) {
  const { atividade, sala } = await exigirAcessoAtividade(lerId(req.params.id), req.usuario);
  const resposta = formatar({ ...atividade, sala: sala.nome, professor: sala.professor });

  if (req.usuario.tipo === 'aluno') {
    const [entrega] = await query(
      'SELECT * FROM entrega WHERE id_aluno = ? AND id_atividade = ?',
      [req.usuario.id, atividade.id_atividade],
    );
    resposta.status_entrega = entrega?.status ?? 'pendente';
    resposta.minha_entrega = entrega ? { ...entrega, tem_arquivo: Boolean(entrega.arquivo), arquivo: undefined } : null;
  } else {
    const [totais] = await query(
      `SELECT (SELECT COUNT(*) FROM participa WHERE id_sala = ?) AS total_alunos,
              (SELECT COUNT(*) FROM entrega WHERE id_atividade = ? AND status IN ('entregue', 'avaliada')) AS total_entregas,
              (SELECT COUNT(*) FROM entrega WHERE id_atividade = ? AND status = 'avaliada') AS total_avaliadas`,
      [atividade.id_sala, atividade.id_atividade, atividade.id_atividade],
    );
    Object.assign(resposta, totais);
  }
  res.json(resposta);
}

// POST /api/salas/:idSala/atividades  (professor dono, JSON ou multipart/form-data)
//   titulo, descricao|instrucoes, prazo|entrega, arquivo? (anexo),
//   visibilidade ("agora" | "agendar") + data + hora, ou disponivel_em
async function criar(req, res) {
  const idSala = lerId(req.params.idSala ?? req.body?.sala, 'idSala');
  await exigirDonoSala(idSala, req.usuario);

  const body = req.body ?? {};
  const a = lerDadosAtividade(body);
  const disponivelEm = lerDisponibilidade(body);
  if (disponivelEm && disponivelEm > a.prazo) {
    throw new HttpError(400, 'A data de disponibilização deve ser antes da data de entrega.');
  }

  const r = await query(
    `INSERT INTO atividade (titulo, descricao, prazo, id_sala, arquivo, arquivo_nome, disponivel_em)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [a.titulo, a.descricao, a.prazo, idSala, req.file?.filename ?? null, nomeOriginal(req.file), disponivelEm],
  );
  res.status(201).json(formatar(await buscar(r.insertId)));
}

// PUT /api/atividades/:id  (professor dono, JSON ou multipart/form-data)
//   Campos iguais ao criar; todos opcionais. remover_arquivo=true tira o anexo.
async function atualizar(req, res) {
  const id = lerId(req.params.id);
  if (req.usuario.tipo !== 'professor') throw new HttpError(403, 'Apenas o professor pode editar atividades.');
  const { atividade } = await exigirAcessoAtividade(id, req.usuario);

  const body = req.body ?? {};
  const a = lerDadosAtividade({
    titulo: body.titulo ?? atividade.titulo,
    descricao: body.descricao ?? body.instrucoes ?? atividade.descricao,
    prazo: body.prazo ?? body.entrega ?? atividade.prazo,
  });
  const mudouVisibilidade = ['visibilidade', 'disponivel_em', 'data'].some((c) => c in body);
  const disponivelEm = mudouVisibilidade ? lerDisponibilidade(body) : atividade.disponivel_em;

  let { arquivo, arquivo_nome: arquivoNome } = atividade;
  if (req.file) {
    arquivo = req.file.filename;
    arquivoNome = nomeOriginal(req.file);
  } else if (lerBooleano(body.remover_arquivo)) {
    arquivo = null;
    arquivoNome = null;
  }

  await query(
    `UPDATE atividade SET titulo = ?, descricao = ?, prazo = ?, disponivel_em = ?, arquivo = ?, arquivo_nome = ?
      WHERE id_atividade = ?`,
    [a.titulo, a.descricao, a.prazo, disponivelEm, arquivo, arquivoNome, id],
  );
  if (atividade.arquivo && atividade.arquivo !== arquivo) await apagarUpload(PASTA, atividade.arquivo);
  res.json(formatar(await buscar(id)));
}

// DELETE /api/atividades/:id  (professor dono) — apaga também o anexo e os arquivos das entregas
async function remover(req, res) {
  const id = lerId(req.params.id);
  if (req.usuario.tipo !== 'professor') throw new HttpError(403, 'Apenas o professor pode remover atividades.');
  const { atividade } = await exigirAcessoAtividade(id, req.usuario);
  const entregas = await query('SELECT arquivo FROM entrega WHERE id_atividade = ? AND arquivo IS NOT NULL', [id]);

  await query('DELETE FROM atividade WHERE id_atividade = ?', [id]);
  await apagarUpload(PASTA, atividade.arquivo);
  await Promise.all(entregas.map((e) => apagarUpload('entregas', e.arquivo)));
  res.status(204).end();
}

// GET /api/atividades/:id/arquivo  — anexo do professor (?baixar=0 abre no navegador)
async function baixarArquivo(req, res) {
  const { atividade } = await exigirAcessoAtividade(lerId(req.params.id), req.usuario);
  if (!atividade.arquivo) throw new HttpError(404, 'Esta atividade não tem arquivo anexado.');
  const nome = atividade.arquivo_nome || `atividade-${atividade.id_atividade}${path.extname(atividade.arquivo)}`;
  enviarArquivo(res, PASTA, atividade.arquivo, nome, req.query.baixar !== '0');
}

module.exports = {
  listar, listarDaSala, pendentes, obter, criar, atualizar, remover, baixarArquivo,
};
