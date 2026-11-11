const lista = document.querySelector('#lista');
const POR_PAGINA = 6;

let itens = [];
let pagina = 1;

function mostrarItens() {
  const busca = document.querySelector('#busca').value.toLowerCase();
  const tipo = document.querySelector('#tipo').value;

  const filtrados = itens.filter(function (item) {
    const achou = item.nome.toLowerCase().includes(busca) || item.descricao.toLowerCase().includes(busca);
    return achou && (tipo == '' || item.tipo == tipo);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  if (pagina > totalPaginas) {
    pagina = 1;
  }

  lista.innerHTML = '';
  for (const item of filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)) {
    const cartao = document.createElement('div');
    cartao.className = 'item';
    cartao.innerHTML =
      '<div class="hexagono">' + arte(item.icone) + '</div>' +
      '<span class="etiqueta ' + item.tipo + '">' + item.tipo.toUpperCase() + '</span>' +
      '<h3>' + limpar(item.nome) + '</h3>' +
      '<p>' + limpar(item.descricao) + '</p>' +
      '<div class="preco">' + icone('moeda', 24) + item.preco + '</div>';
    cartao.addEventListener('click', function () {
      mostrarDetalhes(item);
    });
    lista.appendChild(cartao);
  }

  if (filtrados.length == 0) {
    lista.textContent = 'Nenhum item encontrado.';
  }
  criarPaginas(document.querySelector('#paginas'), totalPaginas, pagina, function (nova) {
    pagina = nova;
    mostrarItens();
  });
}

async function mostrarDetalhes(item) {
  const resposta = await api('/eu');
  if (!resposta.ok) {
    erroCompra(item, resposta);
    return;
  }

  abrirDialogo('Detalhes do item',
    '<div class="item-dialogo"><div class="hexagono">' + arte(item.icone) + '</div><div><b>' + limpar(item.nome) + '</b><br>' +
    '<span class="cinza-texto">' + limpar(item.descricao) + '</span></div></div>' +
    '<div class="preco"><span>Preço do item</span>' + item.preco + icone('moeda', 22) + '</div>' +
    '<div class="preco"><span>Suas moedas</span>' + resposta.dados.moedas + icone('moeda', 22) + '</div>',
    [
      { texto: 'Comprar', acao: function () { verificarCompra(item); } },
      { texto: 'Fechar', classe: 'cinza' }
    ]);
}

async function verificarCompra(item) {
  const resposta = await api('/eu');
  if (!resposta.ok) {
    erroCompra(item, resposta);
    return;
  }

  const saldo = resposta.dados.moedas;
  if (saldo < item.preco) {
    abrirDialogo('Moedas insuficientes',
      '<p class="centro">' + icone('dinheiro', 40) + '</p><p>Você não possui moedas suficientes para comprar este item.</p>' +
      '<div class="preco"><span>Preço do item</span>' + item.preco + icone('moeda', 22) + '</div>' +
      '<div class="preco"><span>Seu saldo</span>' + saldo + icone('moeda', 22) + '</div>',
      [{ texto: 'OK' }], 'vermelho-dlg');
    return;
  }

  abrirDialogo('Confirmar compra',
    '<p class="centro">Deseja comprar<br><b>' + limpar(item.nome) + '</b>?</p>' +
    '<div class="preco"><span>Custo</span>' + item.preco + icone('moeda', 22) + '</div>' +
    '<div class="preco"><span>Seu saldo</span>' + saldo + icone('moeda', 22) + '</div>',
    [
      { texto: 'OK', acao: function () { comprar(item); } },
      { texto: 'Cancelar', classe: 'cinza' }
    ]);
}

async function comprar(item) {
  const resposta = await api('/itens/' + item.id_item + '/comprar', 'POST');
  if (!resposta.ok) {
    erroCompra(item, resposta);
    return;
  }

  atualizarProgresso();
  const eu = await api('/eu');
  const saldo = eu.ok ? eu.dados.moedas : '';
  abrirDialogo('Compra realizada!',
    '<p class="centro">' + icone('check', 40) + '</p><p>Parabéns! Você adquiriu <b>' + limpar(item.nome) + '</b>.</p>' +
    '<div class="preco"><span>Seu saldo atual</span>' + saldo + icone('moeda', 22) + '</div>',
    [
      { texto: 'Continuar comprando' },
      { texto: 'Ver inventário', classe: 'cinza', acao: function () { window.location.href = 'inventario.html'; } }
    ], 'verde-dlg');
}

function erroCompra(item, resposta) {
  if (resposta.offline) {
    abrirDialogo('Sem conexão',
      '<p class="centro">' + icone('semwifi', 40) + '</p><p>Você está offline. Verifique sua conexão com a Internet e tente novamente.</p>',
      [
        { texto: 'Tentar novamente', acao: function () { verificarCompra(item); } },
        { texto: 'Voltar para a loja', classe: 'cinza' }
      ], 'verde-dlg');
    return;
  }

  abrirDialogo('Erro na compra',
    '<p class="centro">' + icone('aviso', 40) + '</p><p>Não foi possível realizar a compra no momento. Tente novamente.</p>',
    [
      { texto: 'Tentar novamente', acao: function () { verificarCompra(item); } },
      { texto: 'Voltar para a loja', classe: 'cinza' }
    ], 'laranja-dlg');
}

async function carregar() {
  const resposta = await api('/itens');
  if (!resposta.ok) {
    lista.textContent = resposta.dados.erro;
    return;
  }
  itens = resposta.dados;
  mostrarItens();
}

document.querySelector('#busca').addEventListener('input', mostrarItens);
document.querySelector('#tipo').addEventListener('change', mostrarItens);

iniciarPagina('aluno');
carregar();
