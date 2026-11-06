// Salas de aula (SALA_AULA, PROFESSOR CRIA SALA, ALUNO PARTICIPA SALA)
const crypto = require('node:crypto');
const { query } = require('../config/db');
const HttpError = require('../utils/HttpError');
const { lerTexto, lerId, lerOpcao, exigirCampos } = require('../utils/validacao');
const { exigirAcessoSala, exigirDonoSala } = require('../utils/acesso');
const { apagarUpload, ehLink } = require('../utils/arquivos');

/** Gera um código no formato XXXX-XXXX (ex.: C4D7-9B2A). */
function gerarCodigo() {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

/** Executa "salvar" com um código novo, tentando de novo se ele já existir. */
async function comCodigoUnico(salvar) {
  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    try {
      return await salvar(gerarCodigo());
    } catch (erro) {
      if (erro.code !== 'ER_DUP_ENTRY') throw erro;
    }
  }
  throw new HttpError(500, 'Não foi possível gerar um código de sala. Tente novamente.');
}

const NIVEIS = ['iniciante', 'medio', 'avancado'];
const IMAGENS = ['codigo', 'programacao', 'computador', 'inovacao', 'robotica', 'personalizada'];
const FORMATO_CODIGO = /^[0-9A-F]{4}-[0-9A-F]{4}$/;

/** Aceita "Médio", "medio", "Avançado"... e devolve o valor do banco. */
function lerNivel(valor, padrao) {
  const v = String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return lerOpcao(v || undefined, 'nivel', NIVEIS, padrao);
}

function lerDadosSala(body, atual = {}) {
  return {
    nome: lerTexto(body.nome ?? atual.nome, 'nome', { max: 100, obrigatorio: true }),
    descricao: lerTexto(body.descricao ?? atual.descricao, 'descricao', { max: 150 }),
    nivel: lerNivel(body.nivel, atual.nivel ?? 'iniciante'),
    imagem: lerOpcao(body.imagem || undefined, 'imagem', IMAGENS, atual.imagem ?? 'codigo'),
  };
}

// Campos devolvidos para os cartões de sala.
// "ultima_atividade" = data da atividade mais recente já disponível.
const CAMPOS_SALA = `
  s.id_sala, s.nome, s.descricao, s.nivel, s.imagem, s.codigo_acesso, s.id_professor, s.criado_em,
  u.nome AS professor,
  (SELECT COUNT(*) FROM participa p WHERE p.id_sala = s.id_sala) AS total_alunos,
  (SELECT COUNT(*) FROM atividade a WHERE a.id_sala = s.id_sala) AS total_atividades,
  (SELECT COUNT(*) FROM material_apoio m WHERE m.id_sala = s.id_sala) AS total_materiais,
  (SELECT MAX(COALESCE(a.disponivel_em, a.criado_em)) FROM atividade a
    WHERE a.id_sala = s.id_sala AND (a.disponivel_em IS NULL OR a.disponivel_em <= NOW())) AS ultima_atividade`;

async function buscarSala(idSala) {
  const [sala] = await query(
    `SELECT ${CAMPOS_SALA} FROM sala_aula s JOIN usuario u ON u.id_usuario = s.id_professor WHERE s.id_sala = ?`,
    [idSala],
  );
  return sala;
}

// GET /api/salas?busca=logica
// Professor: salas que criou. Aluno: salas em que participa.
async function listar(req, res) {
  const params = [req.usuario.id];
  let filtro = '';
  if (req.query.busca) {
    filtro = 'AND s.nome LIKE ?';
    params.push(`%${req.query.busca}%`);
  }

  const salas = req.usuario.tipo === 'professor'
    ? await query(
      `SELECT ${CAMPOS_SALA}
         FROM sala_aula s JOIN usuario u ON u.id_usuario = s.id_professor
        WHERE s.id_professor = ? ${filtro}
        ORDER BY s.nome`,
      params,
    )
    : await query(
      `SELECT ${CAMPOS_SALA}
         FROM participa pa
         JOIN sala_aula s ON s.id_sala = pa.id_sala
         JOIN usuario u ON u.id_usuario = s.id_professor
        WHERE pa.id_aluno = ? ${filtro}
        ORDER BY s.nome`,
      params,
    );
  res.json(salas);
}

// GET /api/salas/:idSala
async function obter(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  await exigirAcessoSala(idSala, req.usuario);
  res.json(await buscarSala(idSala));
}

// POST /api/salas  { nome, descricao?, nivel?, imagem?, codigo_acesso? }  (professor) — tela "Criar Sala de Aula"
//   codigo_acesso é opcional: se vier (o código mostrado na tela) e estiver livre, é usado;
//   senão o servidor gera um.
async function criar(req, res) {
  const body = req.body ?? {};
  const sala = lerDadosSala(body);
  const inserir = async (codigo) => {
    const r = await query(
      'INSERT INTO sala_aula (nome, descricao, nivel, imagem, codigo_acesso, id_professor) VALUES (?, ?, ?, ?, ?, ?)',
      [sala.nome, sala.descricao, sala.nivel, sala.imagem, codigo, req.usuario.id],
    );
    return r.insertId;
  };

  let idSala;
  const sugerido = String(body.codigo_acesso ?? body.codigo ?? '').trim().toUpperCase();
  if (FORMATO_CODIGO.test(sugerido)) {
    try {
      idSala = await inserir(sugerido);
    } catch (erro) {
      if (erro.code !== 'ER_DUP_ENTRY') throw erro;
    }
  }
  idSala ??= await comCodigoUnico(inserir);
  res.status(201).json(await buscarSala(idSala));
}

// GET /api/salas/codigo  (professor) — código sugerido para mostrar na tela antes de criar
async function sugerirCodigo(req, res) {
  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    const codigo = gerarCodigo();
    const [existe] = await query('SELECT 1 FROM sala_aula WHERE codigo_acesso = ?', [codigo]);
    if (!existe) return res.json({ codigo_acesso: codigo });
  }
  throw new HttpError(500, 'Não foi possível gerar um código de sala. Tente novamente.');
}

// PUT /api/salas/:idSala  { nome?, descricao?, nivel?, imagem? }  (professor dono)
async function atualizar(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  const atual = await exigirDonoSala(idSala, req.usuario);
  const [completa] = await query('SELECT * FROM sala_aula WHERE id_sala = ?', [atual.id_sala]);
  const sala = lerDadosSala(req.body ?? {}, completa);
  await query(
    'UPDATE sala_aula SET nome = ?, descricao = ?, nivel = ?, imagem = ? WHERE id_sala = ?',
    [sala.nome, sala.descricao, sala.nivel, sala.imagem, idSala],
  );
  res.json(await buscarSala(idSala));
}

// DELETE /api/salas/:idSala  (professor dono) — apaga atividades, materiais, entregas e participações
async function remover(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  await exigirDonoSala(idSala, req.usuario);
  // guarda os arquivos antes: o banco apaga as linhas em cascata
  const arquivos = await query(
    `SELECT 'atividades' AS pasta, arquivo FROM atividade WHERE id_sala = ? AND arquivo IS NOT NULL
     UNION ALL
     SELECT 'materiais', arquivo FROM material_apoio WHERE id_sala = ? AND arquivo IS NOT NULL
     UNION ALL
     SELECT 'entregas', e.arquivo FROM entrega e JOIN atividade a ON a.id_atividade = e.id_atividade
      WHERE a.id_sala = ? AND e.arquivo IS NOT NULL`,
    [idSala, idSala, idSala],
  );
  await query('DELETE FROM sala_aula WHERE id_sala = ?', [idSala]);
  await Promise.all(arquivos.filter((a) => !ehLink(a.arquivo)).map((a) => apagarUpload(a.pasta, a.arquivo)));
  res.status(204).end();
}

// POST /api/salas/:idSala/novo-codigo  (professor dono) — botão de "gerar novo código"
async function novoCodigo(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  await exigirDonoSala(idSala, req.usuario);
  await comCodigoUnico((codigo) => query('UPDATE sala_aula SET codigo_acesso = ? WHERE id_sala = ?', [codigo, idSala]));
  res.json(await buscarSala(idSala));
}

// POST /api/salas/entrar  { codigo_acesso }  (aluno) — modal "Acessar Sala de Aula"
async function entrar(req, res) {
  exigirCampos(req.body, ['codigo_acesso']);
  let codigo = String(req.body.codigo_acesso).trim().toUpperCase().replace(/\s+/g, '');
  if (/^[0-9A-F]{8}$/.test(codigo)) codigo = `${codigo.slice(0, 4)}-${codigo.slice(4)}`; // aceita sem o traço

  const [sala] = await query('SELECT id_sala FROM sala_aula WHERE codigo_acesso = ?', [codigo]);
  if (!sala) throw new HttpError(404, 'Código de sala inválido.');

  try {
    await query('INSERT INTO participa (id_aluno, id_sala) VALUES (?, ?)', [req.usuario.id, sala.id_sala]);
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Você já participa desta sala.');
    throw erro;
  }
  res.status(201).json(await buscarSala(sala.id_sala));
}

// DELETE /api/salas/:idSala/sair  (aluno)
async function sair(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  const r = await query('DELETE FROM participa WHERE id_aluno = ? AND id_sala = ?', [req.usuario.id, idSala]);
  if (!r.affectedRows) throw new HttpError(404, 'Você não participa desta sala.');
  res.status(204).end();
}

// GET /api/salas/:idSala/alunos  (professor dono)
async function listarAlunos(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  await exigirDonoSala(idSala, req.usuario);
  const alunos = await query(
    `SELECT u.id_usuario, u.nome, u.email, a.nivel, a.pontuacao_xp
       FROM participa p
       JOIN usuario u ON u.id_usuario = p.id_aluno
       JOIN aluno a ON a.id_usuario = p.id_aluno
      WHERE p.id_sala = ?
      ORDER BY u.nome`,
    [idSala],
  );
  res.json(alunos);
}

// DELETE /api/salas/:idSala/alunos/:idAluno  (professor dono)
async function removerAluno(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  const idAluno = lerId(req.params.idAluno, 'idAluno');
  await exigirDonoSala(idSala, req.usuario);
  const r = await query('DELETE FROM participa WHERE id_aluno = ? AND id_sala = ?', [idAluno, idSala]);
  if (!r.affectedRows) throw new HttpError(404, 'Este aluno não participa da sala.');
  res.status(204).end();
}

module.exports = {
  listar, obter, criar, sugerirCodigo, atualizar, remover, novoCodigo, entrar, sair, listarAlunos, removerAluno,
};
