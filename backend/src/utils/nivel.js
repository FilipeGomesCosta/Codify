// Regras de nível do aluno.
// O XP necessário dobra a cada nível: 0, 250, 500, 1000, 2000, 4000...
// Ex.: 1.250 XP = Nível 4, próximo nível em 2.000 XP (igual ao protótipo).
const XP_BASE = 250;

/** XP mínimo para estar no nível informado. */
function xpDoNivel(nivel) {
  return nivel <= 1 ? 0 : XP_BASE * 2 ** (nivel - 2);
}

function nivelPorXp(xp) {
  let nivel = 1;
  while (xp >= xpDoNivel(nivel + 1)) nivel += 1;
  return nivel;
}

/** Dados prontos para o cartão "Seu progresso". */
function progresso(aluno) {
  const nivel = nivelPorXp(aluno.pontuacao_xp);
  return {
    pontuacao_xp: aluno.pontuacao_xp,
    nivel,
    moedas: aluno.moedas,
    xp_nivel_atual: xpDoNivel(nivel),
    xp_proximo_nivel: xpDoNivel(nivel + 1),
  };
}

module.exports = { nivelPorXp, xpDoNivel, progresso };
