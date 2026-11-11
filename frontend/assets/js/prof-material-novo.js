const campoSala = document.querySelector('#sala');
const idSala = new URLSearchParams(window.location.search).get('sala');
const mensagem = document.querySelector('#mensagem');
const campoArquivo = document.querySelector('#arquivo');

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

function tipoEscolhido() {
  return document.querySelector('input[name=tipo]:checked').value;
}

for (const tipo of document.querySelectorAll('input[name=tipo]')) {
  tipo.addEventListener('change', function () {
    const tipoAtual = tipoEscolhido();
    document.querySelector('#blocoLink').hidden = tipoAtual != 'link' && tipoAtual != 'video';
    document.querySelector('#blocoArquivo').hidden = tipoAtual == 'link';
    document.querySelector('#rotuloLink').textContent = tipoAtual == 'video' ? 'Ou informe o link do vídeo (YouTube, etc.)' : 'Endereço do link';
  });
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

document.querySelector('#enviar').addEventListener('click', async function () {
  mensagem.textContent = '';
  const titulo = document.querySelector('#titulo').value.trim();
  const tipo = tipoEscolhido();
  const agendar = document.querySelector('input[name=visibilidade]:checked').value == 'agendar';

  if (campoSala.value == '') {
    mensagem.textContent = 'Crie uma sala antes de adicionar materiais.';
    return;
  }
  if (titulo == '') {
    mensagem.textContent = 'O título é obrigatório.';
    return;
  }
  if (tipo == 'link' && document.querySelector('#link').value.trim() == '') {
    mensagem.textContent = 'Informe o endereço do link.';
    return;
  }
  if (tipo == 'video' && campoArquivo.files.length == 0 && document.querySelector('#link').value.trim() == '') {
    mensagem.textContent = 'Anexe o arquivo de vídeo ou informe o link do vídeo.';
    return;
  }
  if (tipo != 'link' && tipo != 'video' && campoArquivo.files.length == 0) {
    mensagem.textContent = 'O arquivo é obrigatório.';
    return;
  }
  if (agendar && document.querySelector('#data').value == '') {
    mensagem.textContent = 'Informe a data de disponibilização.';
    return;
  }

  const dados = new FormData();
  dados.append('id_sala', campoSala.value);
  dados.append('titulo', titulo);
  dados.append('descricao', document.querySelector('#descricao').value);
  dados.append('categoria', document.querySelector('#categoria').value);
  dados.append('tipo', tipo);
  dados.append('link', document.querySelector('#link').value.trim());
  dados.append('permitir_download', document.querySelector('#download').checked);
  dados.append('destaque', document.querySelector('#destaque').checked);
  if (agendar) {
    dados.append('disponivel_em', document.querySelector('#data').value + ' ' + (document.querySelector('#hora').value || '00:00') + ':00');
  }
  if (tipo != 'link' && campoArquivo.files.length > 0) {
    dados.append('arquivo', campoArquivo.files[0]);
  }

  const resposta = await api('/materiais', 'POST', dados);
  if (!resposta.ok) {
    mensagem.textContent = resposta.dados.erro;
    return;
  }

  alert(resposta.dados.mensagem);
  voltar();
});

ligarDropzone(document.querySelector('#zona'), campoArquivo);
ligarContador(document.querySelector('#descricao'), document.querySelector('#contador'), 300);
iniciarPagina('professor');
carregarSalas();
