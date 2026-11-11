const lista = document.querySelector('#lista');
const janela = document.querySelector('#janelaEntrar');

const nomesNivel = { iniciante: 'Iniciante', intermediario: 'Médio', avancado: 'Avançado' };
let salas = [];

function ultimaAtividade(data) {
  if (!data) {
    return 'Nenhuma ainda';
  }
  const dias = Math.floor((new Date() - new Date(data)) / 86400000);
  if (dias <= 0) return 'Hoje';
  if (dias == 1) return 'Ontem';
  return 'Há ' + dias + ' dias';
}

function mostrarSalas() {
  const busca = document.querySelector('#busca').value.toLowerCase();
  lista.innerHTML = '';

  for (const sala of salas) {
    if (!sala.nome.toLowerCase().includes(busca)) {
      continue;
    }

    const linha = document.createElement('div');
    linha.className = 'sala-linha';
    linha.innerHTML =
      '<div class="imagem">' + imagemSala(sala) + '</div>' +
      '<div class="dados"><h3>' + limpar(sala.nome) + '</h3>' +
      '<p class="professor">Prof. ' + limpar(sala.professor) + '</p>' +
      '<p class="nivel">Nível: ' + nomesNivel[sala.nivel] + '</p>' +
      '<div class="meta"><span>' + icone('grupo', 18) + sala.total_alunos + (sala.total_alunos == 1 ? ' aluno' : ' alunos') + '</span>' +
      '<span>' + icone('calendario', 18) + 'Última atividade: ' + ultimaAtividade(sala.ultima_atividade) + '</span></div>' +
      '<button class="pontos" title="Opções">' + icone('pontos', 20) + '</button></div>';
    linha.querySelector('.pontos').addEventListener('click', function () {
      opcoesSala(sala);
    });

    if (sala.situacao == 'pendente') {
      linha.innerHTML += '<span class="aguardando">Aguardando aprovação</span>';
    } else {
      linha.innerHTML += '<a class="botao entrar" href="sala.html?id=' + sala.id_sala + '">Entrar</a>';
    }
    lista.appendChild(linha);
  }

  if (lista.innerHTML == '') {
    lista.innerHTML = '<p class="cinza-texto">Você ainda não participa de nenhuma sala. Use o código do professor para entrar.</p>';
  }
}

async function carregar() {
  const resposta = await api('/salas');
  if (!resposta.ok) {
    lista.textContent = resposta.dados.erro;
    return;
  }
  salas = resposta.dados;
  mostrarSalas();
}

async function mostrarPendentes() {
  const resposta = await api('/atividades/pendentes');
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    return;
  }

  let corpo = '<div class="lista-pendentes">';
  for (const a of resposta.dados) {
    corpo += '<p><span>' + limpar(a.titulo) + '<br><small class="cinza-texto">' + limpar(a.sala) + ' - prazo ' + formatarData(a.prazo) +
      '</small></span><a href="atividade.html?id=' + a.id_atividade + '">Abrir</a></p>';
  }
  if (resposta.dados.length == 0) {
    corpo += '<p>Você não tem atividades pendentes.</p>';
  }
  abrirDialogo('Atividades pendentes', corpo + '</div>', [{ texto: 'Fechar', classe: 'cinza' }]);
}

function opcoesSala(sala) {
  abrirDialogo('Opções da sala', '<p class="centro">' + limpar(sala.nome) + '</p>', [
    { texto: 'Sair da sala', classe: 'vermelho', acao: function () { sairDaSala(sala); } },
    { texto: 'Fechar', classe: 'cinza' }
  ]);
}

async function sairDaSala(sala) {
  if (!confirm('Deseja realmente sair da sala "' + sala.nome + '"?')) {
    return;
  }
  const resposta = await api('/salas/' + sala.id_sala + '/sair', 'POST');
  alert(resposta.ok ? resposta.dados.mensagem : resposta.dados.erro);
  carregar();
}

async function mostrarAgenda() {
  const resposta = await api('/agenda');
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    return;
  }

  let corpo = '<div class="lista-pendentes">';
  for (const a of resposta.dados) {
    corpo += '<p><span><b>' + formatarData(a.prazo) + '</b><br>' + limpar(a.titulo) + '<br><small class="cinza-texto">' + limpar(a.sala) +
      ' - ' + (a.status == 'pendente' ? 'pendente' : 'entregue') + '</small></span><a href="atividade.html?id=' + a.id_atividade + '">Abrir</a></p>';
  }
  if (resposta.dados.length == 0) {
    corpo += '<p>Nenhum prazo de entrega próximo.</p>';
  }
  abrirDialogo('Calendário de aulas', corpo + '</div>', [{ texto: 'Fechar', classe: 'cinza' }]);
}

function abrirEntrar() {
  janela.showModal();
}

document.querySelector('#abrirEntrar').addEventListener('click', abrirEntrar);
document.querySelector('#acaoCodigo').addEventListener('click', abrirEntrar);
document.querySelector('#acaoCalendario').addEventListener('click', mostrarAgenda);
document.querySelector('#acaoPendentes').addEventListener('click', mostrarPendentes);
document.querySelector('#fecharEntrar').addEventListener('click', function () {
  janela.close();
});
document.querySelector('#busca').addEventListener('input', mostrarSalas);

document.querySelector('#formulario').addEventListener('submit', async function (evento) {
  evento.preventDefault();

  const codigo = document.querySelector('#codigo').value.trim();
  if (codigo == '') {
    alert('Digite o código da sala.');
    return;
  }

  const resposta = await api('/salas/entrar', 'POST', { codigo: codigo });
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    return;
  }

  alert(resposta.dados.mensagem);
  janela.close();
  if (resposta.dados.id_sala) {
    window.location.href = 'sala.html?id=' + resposta.dados.id_sala;
  } else {
    carregar();
  }
});

iniciarPagina('aluno');
carregar();
