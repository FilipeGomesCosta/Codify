// Regras de permissão ligadas às salas de aula.
// Professor: só acessa as salas que criou.
// Aluno: só acessa as salas em que participa.
const { query } = require('../config/db');
const HttpError = require('./HttpError');

async function exigirAcessoSala(idSala, usuario) {
  const [sala] = await query(
    `SELECT s.id_sala, s.nome, s.codigo_acesso, s.id_professor, u.nome AS professor
       FROM sala_aula s
       JOIN usuario u ON u.id_usuario = s.id_professor
      WHERE s.id_sala = ?`,
    [idSala],
  );
  if (!sala) throw new HttpError(404, 'Sala não encontrada.');

  if (usuario.tipo === 'professor') {
    if (sala.id_professor !== usuario.id) {
      throw new HttpError(403, 'Você não é o professor desta sala.');
    }
  } else {
    const [participa] = await query(
      'SELECT 1 FROM participa WHERE id_aluno = ? AND id_sala = ?',
      [usuario.id, idSala],
    );
    if (!participa) throw new HttpError(403, 'Você não participa desta sala.');
  }
  return sala;
}

/** Só o professor dono da sala passa. */
async function exigirDonoSala(idSala, usuario) {
  if (usuario.tipo !== 'professor') {
    throw new HttpError(403, 'Apenas o professor da sala pode fazer isso.');
  }
  return exigirAcessoSala(idSala, usuario);
}

/** Atividade/material agendado ainda não liberado para os alunos? */
const aindaAgendado = (registro) => Boolean(registro.disponivel_em) && new Date(registro.disponivel_em) > new Date();

/**
 * Trecho SQL que esconde dos alunos o que foi agendado para depois.
 * Uso: `WHERE ... AND ${SQL_DISPONIVEL('a')}`
 */
const SQL_DISPONIVEL = (alias) => `(${alias}.disponivel_em IS NULL OR ${alias}.disponivel_em <= NOW())`;

/** Busca a atividade e confere o acesso à sala dela. */
async function exigirAcessoAtividade(idAtividade, usuario) {
  const [atividade] = await query('SELECT * FROM atividade WHERE id_atividade = ?', [idAtividade]);
  if (!atividade) throw new HttpError(404, 'Atividade não encontrada.');
  const sala = await exigirAcessoSala(atividade.id_sala, usuario);
  // aluno não vê atividade agendada antes da hora
  if (usuario.tipo === 'aluno' && aindaAgendado(atividade)) {
    throw new HttpError(404, 'Atividade não encontrada.');
  }
  return { atividade, sala };
}

/** Busca o material e confere o acesso à sala dele. */
async function exigirAcessoMaterial(idMaterial, usuario) {
  const [material] = await query('SELECT * FROM material_apoio WHERE id_material = ?', [idMaterial]);
  if (!material) throw new HttpError(404, 'Material não encontrado.');
  const sala = await exigirAcessoSala(material.id_sala, usuario);
  if (usuario.tipo === 'aluno' && aindaAgendado(material)) {
    throw new HttpError(404, 'Material não encontrado.');
  }
  return { material, sala };
}

module.exports = {
  exigirAcessoSala, exigirDonoSala, exigirAcessoAtividade, exigirAcessoMaterial, SQL_DISPONIVEL,
};
