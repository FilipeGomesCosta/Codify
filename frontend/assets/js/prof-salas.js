const lista = document.querySelector('#lista');
const nomesNivel = { iniciante: 'Iniciante', intermediario: 'Médio', avancado: 'Avançado' };
let salas = [];

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
      '<p class="professor">Código de acesso: <b>' + sala.codigo_acesso + '</b></p>' +
      '<p class="nivel">Nível: ' + nomesNivel[sala.nivel] + ' | ' + limpar(sala.linguagem) + '</p>' +
      '<div class="meta"><span>' + icone('grupo', 18) + sala.total_alunos + (sala.total_alunos == 1 ? ' aluno' : ' alunos') + '</span>' +
      '<span>' + icone('cadeado', 18) + (sala.acesso == 'aberta' ? 'Sala aberta' : 'Sala fechada') + '</span></div></div>' +
      '<a class="botao entrar" href="sala.html?id=' + sala.id_sala + '">Gerenciar</a>';
    lista.appendChild(linha);
  }

  if (lista.innerHTML == '') {
    lista.innerHTML = '<p class="cinza-texto">Você ainda não criou nenhuma sala.</p>';
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

document.querySelector('#busca').addEventListener('input', mostrarSalas);

iniciarPagina('professor');
carregar();
