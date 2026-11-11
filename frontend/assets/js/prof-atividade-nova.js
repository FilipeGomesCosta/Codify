const campoSala = document.querySelector('#sala');
const idSala = new URLSearchParams(window.location.search).get('sala');
const mensagem = document.querySelector('#mensagem');
const campoArquivo = document.querySelector('#arquivo');
const campoTitulo = document.querySelector('#titulo');
const campoPrazo = document.querySelector('#prazo');

function voltar() {
  window.location.href = idSala ? 'sala.html?id=' + idSala : 'salas.html';
}

async function carregarSalas() {
  const resposta = await api('/salas');
  if (!resposta.ok) {
    mensagem.textContent = resposta.dados.erro;
    return;
  }

  for (const sala of resposta.dados) {
    const opcao = document.createElement('option');
    opcao.value = sala.id_sala;
    opcao.textContent = sala.nome;
    campoSala.appendChild(opcao);
  }
  if (idSala) {
    campoSala.value = idSala;
  }
}

function atualizarPrevia() {
  document.querySelector('#previaTitulo').textContent = campoTitulo.value || 'Título da atividade';
  if (campoPrazo.value) {
    const partes = campoPrazo.value.split('-');
    document.querySelector('#previaPrazo').textContent = 'Prazo: ' + partes[2] + '/' + partes[1] + '/' + partes[0];
  } else {
    document.querySelector('#previaPrazo').textContent = 'Prazo: dd/mm/aaaa';
  }
  const arquivo = campoArquivo.files.length > 0 ? 'Com arquivo' : 'Sem arquivo';
  document.querySelector('#previaArquivo').innerHTML = icone('link', 14) + ' ' + arquivo;
}

for (const opcao of document.querySelectorAll('input[name=visibilidade]')) {
  opcao.addEventListener('change', function () {
    const agendar = document.querySelector('input[name=visibilidade]:checked').value == 'agendar';
    document.querySelector('#data').disabled = !agendar;
    document.querySelector('#hora').disabled = !agendar;
  });
}

document.querySelector('#voltar').addEventListener('click', function (evento) {
  evento.preventDefault();
  voltar();
});
document.querySelector('#cancelar').addEventListener('click', voltar);

campoTitulo.addEventListener('input', atualizarPrevia);
campoPrazo.addEventListener('change', atualizarPrevia);
campoArquivo.addEventListener('change', atualizarPrevia);

document.querySelector('#adicionar').addEventListener('click', async function () {
  mensagem.textContent = '';
  const titulo = campoTitulo.value.trim();
  const agendar = document.querySelector('input[name=visibilidade]:checked').value == 'agendar';

  if (campoSala.value == '') {
    mensagem.textContent = 'Crie uma sala antes de adicionar atividades.';
    return;
  }
  if (titulo == '') {
    mensagem.textContent = 'O título é obrigatório.';
    return;
  }
  if (campoPrazo.value == '') {
    mensagem.textContent = 'A data de entrega é obrigatória.';
    return;
  }
  if (agendar && document.querySelector('#data').value == '') {
    mensagem.textContent = 'Informe a data de disponibilização.';
    return;
  }

  const dados = new FormData();
  dados.append('titulo', titulo);
  dados.append('descricao', document.querySelector('#descricao').value);
  dados.append('prazo', campoPrazo.value);
  dados.append('pontuacao', document.querySelector('#pontuacao').value);
  dados.append('permite_atraso', document.querySelector('#atraso').checked);
  if (agendar) {
    dados.append('disponivel_em', document.querySelector('#data').value + ' ' + (document.querySelector('#hora').value || '00:00') + ':00');
  }
  if (campoArquivo.files.length > 0) {
    dados.append('arquivo', campoArquivo.files[0]);
  }

  const resposta = await api('/salas/' + campoSala.value + '/atividades', 'POST', dados);
  if (!resposta.ok) {
    mensagem.textContent = resposta.dados.erro;
    return;
  }

  alert(resposta.dados.mensagem);
  window.location.href = 'sala.html?id=' + campoSala.value;
});

ligarDropzone(document.querySelector('#zona'), campoArquivo);
ligarBarraTexto(document.querySelector('#descricao'));
ligarContador(document.querySelector('#descricao'), document.querySelector('#contador'), 2000);
iniciarPagina('professor');
carregarSalas();
