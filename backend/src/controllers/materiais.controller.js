// Material de apoio (MATERIAL_APOIO e SALA_AULA DISPONIBILIZA MATERIAL_APOIO)
const path = require('node:path');
const { query } = require('../config/db');
const HttpError = require('../utils/HttpError');
const {
  lerTexto, lerId, lerOpcao, lerDisponibilidade, lerBooleano,
} = require('../utils/validacao');
const { lerPaginacao, montarPagina } = require('../utils/paginacao');
const {
  exigirAcessoSala, exigirDonoSala, exigirAcessoMaterial, SQL_DISPONIVEL,
} = require('../utils/acesso');
const {
  apagarUpload, ehLink, nomeOriginal, enviarArquivo,
} = require('../utils/arquivos');

const PASTA = 'materiais';
const TIPOS = ['documento', 'video', 'link', 'imagem', 'outro'];

// Tipo sugerido pela extensão, quando o professor não escolhe
const TIPO_POR_EXTENSAO = {
  '.pdf': 'documento', '.doc': 'documento', '.docx': 'documento', '.ppt': 'documento', '.pptx': 'documento', '.txt': 'documento',
  '.mp4': 'video', '.png': 'imagem', '.jpg': 'imagem', '.jpeg': 'imagem',
};

/** Acrescenta campos úteis para o front-end e esconde o nome interno do arquivo. */
function formatar(m) {
  const link = ehLink(m.arquivo);
  const extensao = m.arquivo && !link ? path.extname(m.arquivo_nome || m.arquivo).slice(1).toUpperCase() : null;
  return {
    ...m,
    arquivo: link ? m.arquivo : undefined,
    link: link ? m.arquivo : null,
    tem_arquivo: Boolean(m.arquivo) && !link,
    eh_link: link,
    extensao,
    permitir_download: Boolean(m.permitir_download),
    destaque: Boolean(m.destaque),
    agendado: Boolean(m.disponivel_em) && new Date(m.disponivel_em) > new Date(),
  };
}

const buscar = async (id) => (await query(
  'SELECT m.*, s.nome AS sala FROM material_apoio m JOIN sala_aula s ON s.id_sala = m.id_sala WHERE m.id_material = ?',
  [id],
))[0];

// Filtro "Todos os tipos | PDF | Vídeo | Slides | Link" da tela do aluno
function filtroTipo(valor, params) {
  const v = String(valor || '').toLowerCase();
  if (!v || v.startsWith('todos')) return '';
  if (v === 'pdf') { params.push('%.pdf'); return 'AND m.arquivo_nome LIKE ?'; }
  if (v === 'slides') { params.push('%.ppt', '%.pptx'); return 'AND (m.arquivo_nome LIKE ? OR m.arquivo_nome LIKE ?)'; }
  const mapa = { 'vídeo': 'video', video: 'video', link: 'link', imagem: 'imagem', documento: 'documento', outro: 'outro' };
  if (!mapa[v]) return '';
  params.push(mapa[v]);
  return 'AND m.tipo = ?';
}

const ORDENS = {
  recentes: 'm.destaque DESC, m.criado_em DESC, m.id_material DESC',
  antigos: 'm.criado_em ASC, m.id_material ASC',
  az: 'm.titulo ASC',
};
function lerOrdem(valor) {
  const v = String(valor || '').toLowerCase();
  if (v.includes('antig')) return ORDENS.antigos;
  if (v === 'az' || v.includes('a–z') || v.includes('a-z')) return ORDENS.az;
  return ORDENS.recentes;
}

// GET /api/materiais?busca=&tipo=&ordem=&sala=&pagina=&limite=
// Tela "Material de Apoio": materiais de todas as salas do usuário.
async function listar(req, res) {
  const pag = lerPaginacao(req.query, 5);
  const params = [req.usuario.id];
  let filtro = '';
  const busca = req.query.busca ?? req.query.q;
  if (busca) {
    filtro += ' AND (m.titulo LIKE ? OR m.descricao LIKE ? OR m.categoria LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }
  if (req.query.sala) {
    filtro += ' AND m.id_sala = ?';
    params.push(lerId(req.query.sala, 'sala'));
  }
  filtro += ` ${filtroTipo(req.query.tipo, params)}`;

  const origem = req.usuario.tipo === 'professor'
    ? `FROM material_apoio m JOIN sala_aula s ON s.id_sala = m.id_sala
       WHERE s.id_professor = ? ${filtro}`
    : `FROM material_apoio m JOIN sala_aula s ON s.id_sala = m.id_sala
       JOIN participa p ON p.id_sala = m.id_sala
       WHERE p.id_aluno = ? AND ${SQL_DISPONIVEL('m')} ${filtro}`;

  const [{ total }] = await query(`SELECT COUNT(*) AS total ${origem}`, params);
  const materiais = await query(
    `SELECT m.*, s.nome AS sala ${origem} ORDER BY ${lerOrdem(req.query.ordem)} LIMIT ? OFFSET ?`,
    [...params, pag.limite, pag.offset],
  );
  res.json(montarPagina(materiais.map(formatar), total, pag));
}

// GET /api/salas/:idSala/materiais  — destaques primeiro
async function listarDaSala(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  await exigirAcessoSala(idSala, req.usuario);
  const soDisponiveis = req.usuario.tipo === 'aluno' ? `AND ${SQL_DISPONIVEL('m')}` : '';
  const materiais = await query(
    `SELECT m.* FROM material_apoio m WHERE m.id_sala = ? ${soDisponiveis} ORDER BY ${ORDENS.recentes}`,
    [idSala],
  );
  res.json(materiais.map(formatar));
}

// GET /api/materiais/:id
async function obter(req, res) {
  const { material } = await exigirAcessoMaterial(lerId(req.params.id), req.usuario);
  res.json(formatar(await buscar(material.id_material)));
}

// POST /api/salas/:idSala/materiais  (professor dono, multipart/form-data)
//   titulo, descricao?, categoria?, tipo? (documento|video|link|imagem|outro),
//   arquivo (upload) OU link (http/https),
//   visibilidade ("agora" | "agendar") + data + hora, ou disponivel_em,
//   download (permitir download, padrão sim), destaque (padrão não)
async function criar(req, res) {
  const idSala = lerId(req.params.idSala, 'idSala');
  await exigirDonoSala(idSala, req.usuario);

  const body = req.body ?? {};
  const titulo = lerTexto(body.titulo, 'titulo', { max: 150, obrigatorio: true });
  const descricao = lerTexto(body.descricao, 'descricao', { max: 5000 });
  const categoria = lerTexto(body.categoria, 'categoria', { max: 60 });
  const link = lerTexto(body.link, 'link', { max: 500 });
  const disponivelEm = lerDisponibilidade(body);

  if (link && !ehLink(link)) throw new HttpError(400, 'O link deve começar com http:// ou https://.');
  if (!req.file && !link) throw new HttpError(400, 'Envie um arquivo ou informe um link.');

  const tipoPadrao = req.file
    ? TIPO_POR_EXTENSAO[path.extname(req.file.originalname).toLowerCase()] ?? 'outro'
    : 'link';
  const tipo = lerOpcao(body.tipo, 'tipo', TIPOS, tipoPadrao);

  const r = await query(
    `INSERT INTO material_apoio
       (titulo, descricao, arquivo, id_sala, arquivo_nome, tamanho, tipo, categoria, permitir_download, destaque, disponivel_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      titulo, descricao, req.file?.filename ?? link, idSala, nomeOriginal(req.file), req.file?.size ?? null,
      tipo, categoria, lerBooleano(body.download ?? body.permitir_download, true),
      lerBooleano(body.destaque, false), disponivelEm,
    ],
  );
  res.status(201).json(formatar(await buscar(r.insertId)));
}

// PUT /api/materiais/:id  (professor dono, JSON ou multipart/form-data) — campos do criar, todos opcionais
async function atualizar(req, res) {
  const id = lerId(req.params.id);
  if (req.usuario.tipo !== 'professor') throw new HttpError(403, 'Apenas o professor pode editar materiais.');
  const { material } = await exigirAcessoMaterial(id, req.usuario);
  const body = req.body ?? {};

  const titulo = lerTexto(body.titulo ?? material.titulo, 'titulo', { max: 150, obrigatorio: true });
  const descricao = lerTexto(body.descricao ?? material.descricao, 'descricao', { max: 5000 });
  const categoria = lerTexto(body.categoria ?? material.categoria, 'categoria', { max: 60 });
  const tipo = lerOpcao(body.tipo ?? material.tipo, 'tipo', TIPOS);
  const mudouVisibilidade = ['visibilidade', 'disponivel_em', 'data'].some((c) => c in body);
  const disponivelEm = mudouVisibilidade ? lerDisponibilidade(body) : material.disponivel_em;
  const permitirDownload = lerBooleano(body.download ?? body.permitir_download, Boolean(material.permitir_download));
  const destaque = lerBooleano(body.destaque, Boolean(material.destaque));

  // troca de arquivo/link (opcional)
  let { arquivo, arquivo_nome: arquivoNome, tamanho } = material;
  const link = lerTexto(body.link, 'link', { max: 500 });
  if (link && !ehLink(link)) throw new HttpError(400, 'O link deve começar com http:// ou https://.');
  if (req.file) {
    arquivo = req.file.filename;
    arquivoNome = nomeOriginal(req.file);
    tamanho = req.file.size;
  } else if (link) {
    arquivo = link;
    arquivoNome = null;
    tamanho = null;
  }

  await query(
    `UPDATE material_apoio
        SET titulo = ?, descricao = ?, categoria = ?, tipo = ?, disponivel_em = ?, permitir_download = ?, destaque = ?,
            arquivo = ?, arquivo_nome = ?, tamanho = ?
      WHERE id_material = ?`,
    [titulo, descricao, categoria, tipo, disponivelEm, permitirDownload, destaque, arquivo, arquivoNome, tamanho, id],
  );
  if (material.arquivo !== arquivo && !ehLink(material.arquivo)) await apagarUpload(PASTA, material.arquivo);
  res.json(formatar(await buscar(id)));
}

// DELETE /api/materiais/:id  (professor dono)
async function remover(req, res) {
  const id = lerId(req.params.id);
  if (req.usuario.tipo !== 'professor') throw new HttpError(403, 'Apenas o professor pode remover materiais.');
  const { material } = await exigirAcessoMaterial(id, req.usuario);
  await query('DELETE FROM material_apoio WHERE id_material = ?', [id]);
  if (!ehLink(material.arquivo)) await apagarUpload(PASTA, material.arquivo);
  res.status(204).end();
}

// GET /api/materiais/:id/arquivo  — botão de download (ou redireciona, se for link)
//   ?baixar=0 abre no navegador. Se o professor desligou "Permitir download",
//   o aluno só consegue abrir no navegador.
async function baixar(req, res) {
  const { material } = await exigirAcessoMaterial(lerId(req.params.id), req.usuario);
  if (!material.arquivo) throw new HttpError(404, 'Este material não tem arquivo.');
  if (ehLink(material.arquivo)) return res.redirect(material.arquivo);

  const podeBaixar = req.usuario.tipo === 'professor' || Boolean(material.permitir_download);
  const ext = path.extname(material.arquivo);
  const nome = material.arquivo_nome
    || `${material.titulo.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'material'}${ext}`;
  enviarArquivo(res, PASTA, material.arquivo, nome, podeBaixar && req.query.baixar !== '0');
}

module.exports = {
  listar, listarDaSala, obter, criar, atualizar, remover, baixar,
};
