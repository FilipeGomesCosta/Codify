// Funções de validação dos dados que chegam nas requisições
const HttpError = require('./HttpError');

const vazio = (v) => v === undefined || v === null || String(v).trim() === '';

/** Lança 400 se algum dos campos estiver vazio. */
function exigirCampos(obj, campos) {
  const faltando = campos.filter((c) => vazio(obj?.[c]));
  if (faltando.length) {
    throw new HttpError(400, `Campos obrigatórios: ${faltando.join(', ')}.`);
  }
}

/** Texto com tamanho máximo. Devolve o texto sem espaços nas pontas (ou null). */
function lerTexto(valor, nome, { max = 255, obrigatorio = false } = {}) {
  if (vazio(valor)) {
    if (obrigatorio) throw new HttpError(400, `O campo ${nome} é obrigatório.`);
    return null;
  }
  const texto = String(valor).trim();
  if (texto.length > max) {
    throw new HttpError(400, `O campo ${nome} aceita no máximo ${max} caracteres.`);
  }
  return texto;
}

/** Número inteiro dentro de um intervalo. */
function lerInteiro(valor, nome, { min = 0, max = 2147483647, padrao } = {}) {
  if (vazio(valor) && padrao !== undefined) return padrao;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${nome} deve ser um número inteiro entre ${min} e ${max}.`);
  }
  return n;
}

/** Id vindo da URL (ex.: /salas/:idSala). */
const lerId = (valor, nome = 'id') => lerInteiro(valor, nome, { min: 1 });

/** Valor que precisa estar numa lista de opções. */
function lerOpcao(valor, nome, opcoes, padrao) {
  if (vazio(valor) && padrao !== undefined) return padrao;
  if (!opcoes.includes(valor)) {
    throw new HttpError(400, `${nome} deve ser: ${opcoes.join(', ')}.`);
  }
  return valor;
}

/** Data/hora válida. Aceita "2026-09-28 23:59" ou ISO. Devolve Date. */
function lerData(valor, nome) {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor; // já veio do banco
  let texto = String(valor ?? '').trim();
  // só a data (ex.: campo "Data de entrega"): vale até o fim do dia
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) texto += 'T23:59';
  // formato brasileiro dd/mm/aaaa [hh:mm]
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}))?$/);
  if (br) texto = `${br[3]}-${br[2]}-${br[1]}T${br[4] || '23:59'}`;
  const data = new Date(texto.replace(' ', 'T'));
  if (vazio(valor) || Number.isNaN(data.getTime())) {
    throw new HttpError(400, `${nome} deve ser uma data válida (ex.: 2026-09-28 23:59).`);
  }
  return data;
}

/** Data/hora opcional (vazio = null). */
const lerDataOpcional = (valor, nome) => (vazio(valor) ? null : lerData(valor, nome));

/**
 * Lê a "Visibilidade" das telas de cadastro:
 *   visibilidade = "agora"   → null (já disponível)
 *   visibilidade = "agendar" → data + hora (ou disponivel_em) viram uma data
 */
function lerDisponibilidade(body) {
  if (!vazio(body.disponivel_em)) return lerData(body.disponivel_em, 'disponivel_em');
  if (body.visibilidade !== 'agendar') return null;
  if (vazio(body.data)) throw new HttpError(400, 'Informe a data para agendar a disponibilização.');
  return lerData(`${body.data} ${vazio(body.hora) ? '00:00' : body.hora}`, 'data/hora de disponibilização');
}

/** Checkbox de formulário: "on", "true", "1", true → true. */
function lerBooleano(valor, padrao = false) {
  if (vazio(valor)) return padrao;
  return ['on', 'true', '1', 'sim', 'yes'].includes(String(valor).toLowerCase()) || valor === true;
}

const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

module.exports = {
  exigirCampos, lerTexto, lerInteiro, lerId, lerOpcao, lerData, lerDataOpcional,
  lerDisponibilidade, lerBooleano, emailValido,
};
