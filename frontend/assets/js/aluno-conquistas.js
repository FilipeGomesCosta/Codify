const lista = document.querySelector('#lista');

async function carregar() {
  const resposta = await api('/conquistas');
  if (!resposta.ok) {
    lista.textContent = resposta.dados.erro;
    return;
  }

  let liberadas = 0;
  for (const c of resposta.dados) {
    const feita = c.atual >= c.meta;
    if (feita) {
      liberadas++;
    }
    const atual = Math.min(c.atual, c.meta);

    const cartao = document.createElement('div');
    cartao.className = 'conquista' + (feita ? ' feita' : '');
    cartao.innerHTML =
      '<div class="medalha">' + icone(feita ? c.icone : 'cadeado', 34) + '</div>' +
      '<h3>' + limpar(c.nome) + '</h3>' +
      '<p>' + limpar(c.descricao) + '</p>' +
      '<div class="barra"><div style="width: ' + (atual / c.meta * 100) + '%"></div></div>' +
      '<small>' + atual + ' / ' + c.meta + '</small>';
    lista.appendChild(cartao);
  }

  document.querySelector('#resumo').innerHTML =
    '<div class="circulo-mochila">' + icone('trofeu', 38) + '</div>' +
    '<div class="total">Conquistas desbloqueadas<br><b>' + liberadas + '</b>de ' + resposta.dados.length + '</div>';
}

iniciarPagina('aluno');
carregar();
