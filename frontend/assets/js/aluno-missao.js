const id = new URLSearchParams(window.location.search).get('id');
const editor = document.querySelector('#editor');
const saida = document.querySelector('#saida');
const resultado = document.querySelector('#resultado');
const ajuda = document.querySelector('#ajuda');
const status = document.querySelector('#status');

const nomesCategoria = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };

async function carregarMissao() {
  const resposta = await api('/missoes/' + id);
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    window.location.href = 'missoes.html';
    return;
  }

  const missao = resposta.dados;
  document.querySelector('#titulo').textContent = 'Missão ' + missao.id_missao;
  document.querySelector('#categoria').textContent = 'Categoria: ' + nomesCategoria[missao.nivel_dificuldade];
  document.querySelector('#nomeMissao').textContent = missao.titulo;
  document.querySelector('#descricao').textContent = missao.descricao;
  document.querySelector('#descEntrada').textContent = missao.descricao_entrada;
  document.querySelector('#descSaida').textContent = missao.descricao_saida;
  document.querySelector('#recompensa').textContent = missao.recompensa_xp + ' XP';
  document.querySelector('#entrada').value = missao.entrada_teste;
}

async function carregarItens() {
  const itens = document.querySelector('#itens');
  const resposta = await api('/inventario');
  itens.innerHTML = '';

  if (!resposta.ok) {
    itens.textContent = resposta.dados.erro;
    return;
  }
  if (resposta.dados.length == 0) {
    itens.innerHTML = '<p class="cinza-texto">Você não tem itens no inventário. <a href="loja.html">Visite a loja!</a></p>';
    return;
  }

  for (const item of resposta.dados) {
    const linha = document.createElement('div');
    linha.className = 'linha-item';
    linha.innerHTML = '<div class="imagem">' + arte(item.icone) + '</div><span>' + limpar(item.nome) + ' (x' + item.quantidade + ')</span>';

    const botao = document.createElement('button');
    botao.textContent = 'Detalhes';
    botao.addEventListener('click', function () {
      abrirDialogo('Detalhes do item',
        '<div class="imagem-item">' + arte(item.icone) + '</div><p class="centro"><b>' + limpar(item.nome) + '</b></p>' +
        '<p class="centro cinza-texto">' + limpar(item.descricao) + '</p><p class="centro">Quantidade: ' + item.quantidade + '</p>',
        [
          { texto: 'Usar item', acao: function () { usarItem(item.id_item); } },
          { texto: 'Voltar para a missão', classe: 'cinza' }
        ]);
    });
    linha.appendChild(botao);
    itens.appendChild(linha);
  }
}

async function usarItem(idItem) {
  const resposta = await api('/inventario/usar', 'POST', { id_item: idItem, id_missao: id });
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    return;
  }

  ajuda.hidden = false;
  ajuda.textContent = resposta.dados.texto;
  alert(resposta.dados.mensagem);
  carregarItens();
}

document.querySelector('#executar').addEventListener('click', function () {
  compilarCodigo(editor.value, document.querySelector('#entrada').value, saida, status);
});

document.querySelector('#finalizar').addEventListener('click', async function () {
  resultado.className = '';
  resultado.textContent = 'Verificando...';
  const resposta = await api('/missoes/' + id + '/finalizar', 'POST', { codigo: editor.value });

  if (!resposta.ok) {
    resultado.className = 'erro';
    resultado.textContent = resposta.dados.erro;
    if (resposta.offline) {
      resultado.textContent += ' Seu código foi mantido: quando a conexão voltar, clique em "Finalizar missão" de novo.';
    }
    return;
  }

  const dados = resposta.dados;
  if (!dados.concluida) {
    resultado.className = 'erro';
    resultado.textContent = dados.mensagem;
    saida.textContent = dados.erros || dados.saida || '';
    return;
  }

  resultado.className = 'sucesso';
  resultado.textContent = dados.mensagem;

  let corpo = '<p class="centro">' + icone('check', 44) + '</p>';
  if (dados.xp) {
    corpo += '<div class="preco"><span>XP ganho</span>+' + dados.xp + icone('xp', 22) + '</div>' +
      '<div class="preco"><span>Moedas ganhas</span>+' + dados.moedas + icone('moeda', 22) + '</div>';
    if (dados.subiu_de_nivel) {
      corpo += '<p class="centro"><b>Parabéns! Você subiu para o nível ' + dados.nivel + '.</b></p>';
    }
  } else {
    corpo += '<p class="centro">' + dados.mensagem + '</p>';
  }
  if (dados.desbloqueadas.length > 0) {
    corpo += '<p class="centro">Missão desbloqueada: <b>' + limpar(dados.desbloqueadas.join(', ')) + '</b></p>';
  }

  abrirDialogo('Missão concluída!', corpo, [
    { texto: 'Voltar para a trilha', acao: function () { window.location.href = 'missoes.html'; } },
    { texto: 'Continuar nesta missão', classe: 'cinza' }
  ], 'verde-dlg');
  atualizarProgresso();
});

criarEditor(editor);
ligarFerramentasEditor(editor);
iniciarPagina('aluno');
carregarMissao();
carregarItens();
