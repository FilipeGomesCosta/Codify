const lista = document.querySelector('#lista');
const abas = document.querySelectorAll('#abas button');
const ordemRaridade = { Comum: 1, Raro: 2, Épico: 3, Lendário: 4 };

let itens = [];
let categoria = '';

function mostrarResumo() {
  const raridades = { Comum: 0, Raro: 0, Épico: 0, Lendário: 0 };
  for (const item of itens) {
    raridades[item.raridade]++;
  }

  document.querySelector('#resumo').innerHTML =
    '<div class="circulo-mochila">' + icone('mochila', 38) + '</div>' +
    '<div class="total">Total de itens<br><b>' + itens.length + '</b>itens</div>' +
    '<div class="raridade Comum">Comuns<span>' + raridades.Comum + '</span></div>' +
    '<div class="raridade Raro">Raros<span>' + raridades.Raro + '</span></div>' +
    '<div class="raridade Épico">Épicos<span>' + raridades.Épico + '</span></div>' +
    '<div class="raridade Lendário">Lendários<span>' + raridades.Lendário + '</span></div>';
}

function mostrarItens() {
  const ordem = document.querySelector('#ordem').value;
  const visiveis = itens.filter(function (item) {
    return categoria == '' || item.categoria == categoria;
  });

  visiveis.sort(function (a, b) {
    if (ordem == 'quantidade') return b.quantidade - a.quantidade;
    if (ordem == 'raridade') return ordemRaridade[b.raridade] - ordemRaridade[a.raridade];
    if (ordem == 'nome') return a.nome.localeCompare(b.nome);
    return new Date(b.data_adquirido) - new Date(a.data_adquirido);
  });

  lista.innerHTML = '';
  for (const item of visiveis) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.innerHTML =
      '<div class="imagem">' + arte(item.icone) + '</div>' +
      '<b>' + limpar(item.nome) + '</b>' +
      '<span class="nivel-raridade ' + item.raridade + '">' + item.raridade + '</span>' +
      '<small>x' + item.quantidade + '</small>';
    slot.addEventListener('click', function () {
      abrirDialogo('Detalhes do item',
        '<div class="imagem">' + arte(item.icone) + '</div><p class="centro"><b>' + limpar(item.nome) + '</b></p>' +
        '<p class="centro cinza-texto">' + limpar(item.descricao) + '</p>' +
        '<p class="centro">' + item.categoria + ' | ' + item.raridade + ' | Quantidade: ' + item.quantidade + '</p>' +
        '<p class="centro cinza-texto">Este item só pode ser usado durante uma missão.</p>',
        [{ texto: 'Fechar', classe: 'cinza' }]);
    });
    lista.appendChild(slot);
  }

  if (visiveis.length == 0) {
    lista.textContent = 'Nenhum item nesta categoria.';
  }
}

async function carregar() {
  const resposta = await api('/inventario');
  if (!resposta.ok) {
    lista.textContent = resposta.dados.erro;
    return;
  }

  if (resposta.dados.length == 0) {
    document.querySelector('#resumo').hidden = true;
    lista.innerHTML = '<p>Não existem itens no seu inventário. <a href="loja.html">Visite a loja!</a></p>';
    return;
  }
  itens = resposta.dados;
  mostrarResumo();
  mostrarItens();
}

for (const aba of abas) {
  aba.addEventListener('click', function () {
    categoria = aba.dataset.categoria;
    for (const outra of abas) {
      outra.classList.remove('ativa');
    }
    aba.classList.add('ativa');
    mostrarItens();
  });
}
document.querySelector('#ordem').addEventListener('change', mostrarItens);

iniciarPagina('aluno');
carregar();
