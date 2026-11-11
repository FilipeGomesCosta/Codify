const mensagem = document.querySelector('#mensagem');
const campoNome = document.querySelector('#nome');
const campoDescricao = document.querySelector('#descricao');
const campoNivel = document.querySelector('#nivel');
const campoLinguagem = document.querySelector('#linguagem');
const campoAberta = document.querySelector('#aberta');
const campoAprovacao = document.querySelector('#aprovacao');

let codigo = '';
let imagemPersonalizada = null;
const campoImagem = document.querySelector('#arquivoImagem');

function atualizarResumo() {
  document.querySelector('#contador').textContent = campoDescricao.value.length + '/150';
  document.querySelector('#resumoNome').textContent = campoNome.value || '-';
  document.querySelector('#resumoLinguagem').textContent = campoLinguagem.value;
  document.querySelector('#resumoNivel').textContent = campoNivel.value ? campoNivel.options[campoNivel.selectedIndex].text : '-';
  document.querySelector('#resumoCodigo').textContent = codigo || '-';
  document.querySelector('#resumoTipo').textContent = campoAberta.checked ? 'Aberta' : 'Fechada';

  const imagem = document.querySelector('input[name=imagem]:checked').value;
  if (imagem == 'personalizada' && imagemPersonalizada) {
    document.querySelector('#resumoImagem').innerHTML = '<img src="' + imagemPersonalizada + '" alt="">';
  } else {
    document.querySelector('#resumoImagem').innerHTML = arte(imagem == 'personalizada' ? 'codigo' : imagem);
  }
}

async function novoCodigo() {
  const resposta = await api('/salas/codigo');
  if (!resposta.ok) {
    mensagem.textContent = resposta.dados.erro;
    return;
  }
  codigo = resposta.dados.codigo;
  document.querySelector('#codigo').textContent = codigo;
  atualizarResumo();
}

for (const campo of [campoNome, campoDescricao, campoNivel, campoLinguagem, campoAberta]) {
  campo.addEventListener('input', atualizarResumo);
  campo.addEventListener('change', atualizarResumo);
}
for (const imagem of document.querySelectorAll('input[name=imagem]')) {
  imagem.addEventListener('change', atualizarResumo);
}

document.querySelector('#novoCodigo').addEventListener('click', novoCodigo);

document.querySelector('.personalizada').addEventListener('click', function (evento) {
  if (evento.target != campoImagem) {
    campoImagem.click();
  }
});

campoImagem.addEventListener('change', function () {
  const arquivo = campoImagem.files[0];
  if (!arquivo) {
    return;
  }
  const extensao = arquivo.name.split('.').pop().toLowerCase();
  if (extensao != 'png' && extensao != 'jpg') {
    alert('Escolha uma imagem PNG ou JPG.');
    campoImagem.value = '';
    return;
  }

  const leitor = new FileReader();
  leitor.onload = function () {
    imagemPersonalizada = leitor.result;
    document.querySelector('#tilePersonalizada').innerHTML = '<img src="' + imagemPersonalizada + '" alt="">';
    document.querySelector('input[name=imagem][value=personalizada]').checked = true;
    atualizarResumo();
  };
  leitor.readAsDataURL(arquivo);
});

document.querySelector('#cancelar').addEventListener('click', function () {
  window.location.href = 'salas.html';
});

document.querySelector('#criar').addEventListener('click', async function () {
  mensagem.textContent = '';
  const faltando = [];
  if (campoNome.value.trim() == '') faltando.push('nome da sala');
  if (campoNivel.value == '') faltando.push('nível de ensino');
  if (faltando.length > 0) {
    mensagem.textContent = 'Preencha os campos obrigatórios: ' + faltando.join(', ') + '.';
    return;
  }

  const imagem = document.querySelector('input[name=imagem]:checked').value;
  if (imagem == 'personalizada' && campoImagem.files.length == 0) {
    mensagem.textContent = 'Escolha o arquivo da imagem personalizada ou selecione outra imagem.';
    return;
  }

  const dados = new FormData();
  dados.append('nome', campoNome.value.trim());
  dados.append('descricao', campoDescricao.value.trim());
  dados.append('nivel', campoNivel.value);
  dados.append('linguagem', campoLinguagem.value);
  dados.append('acesso', campoAberta.checked ? 'aberta' : 'fechada');
  dados.append('aprovacao', campoAprovacao.checked);
  dados.append('imagem', imagem);
  dados.append('codigo_acesso', codigo);
  if (imagem == 'personalizada') {
    dados.append('imagem_arquivo', campoImagem.files[0]);
  }

  const resposta = await api('/salas', 'POST', dados);
  if (!resposta.ok) {
    mensagem.textContent = 'Não foi possível criar a sala. ' + resposta.dados.erro;
    return;
  }

  alert(resposta.dados.mensagem + '\nCódigo de acesso: ' + resposta.dados.codigo_acesso + '\nCompartilhe esse código com os alunos.');
  window.location.href = 'sala.html?id=' + resposta.dados.id_sala;
});

iniciarPagina('professor');
atualizarResumo();
novoCodigo();
