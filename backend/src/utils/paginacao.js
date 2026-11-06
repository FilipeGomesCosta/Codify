// Paginação: ?pagina=1&limite=10
function lerPaginacao(query, limitePadrao = 10) {
  const pagina = Math.max(1, parseInt(query.pagina, 10) || 1);
  const limite = Math.min(50, Math.max(1, parseInt(query.limite, 10) || limitePadrao));
  return { pagina, limite, offset: (pagina - 1) * limite };
}

function montarPagina(dados, total, { pagina, limite }) {
  return {
    dados,
    pagina,
    limite,
    total,
    total_paginas: Math.max(1, Math.ceil(total / limite)),
  };
}

module.exports = { lerPaginacao, montarPagina };
