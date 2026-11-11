const id = new URLSearchParams(window.location.search).get('id');
const campoArquivo = document.querySelector('#arquivo');
const campoObservacao = document.querySelector('#observacao');
const aviso = document.querySelector('#aviso');
const textosStatus = { pendente: 'Pendente', entregue: 'Entregue', avaliada: 'Avaliada' };

function dataLonga(texto) {
  const data = new Date(texto);
  return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function mostrarHistorico(entrega, atividade) {
  const caixa = document.querySelector('#historico');

  if (!entrega || entrega.status == 'rascunho') {
    caixa.innerHTML = '<div class="historico-vazio">' + icone('pasta', 44) + 'Nenhuma entrega realizada ainda.</div>';
    return;
  }

  let html = '<div class="historico-item"><b>' + (entrega.status == 'avaliada' ? 'Avaliada' : 'Entregue') + '</b><br>' +
    '<small>' + dataLonga(entrega.data_entrega) + '</small>';
  if (entrega.arquivo_nome) {
    html += '<br>' + icone('arquivo', 14) + ' ' + limpar(entrega.arquivo_nome);
  }
  if (entrega.observacao) {
    html += '<br><small>Observação: ' + limpar(entrega.observacao) + '</small>';
  }
  if (entrega.status == 'avaliada') {
    html += '<br><b>Nota: ' + entrega.nota + ' de ' + atividade.pontuacao + '</b><br><small>Feedback: ' + limpar(entrega.feedback || '-') + '</small>';
  }
  caixa.innerHTML = html + '</div>';
}

async function carregar() {
  const resposta = await api('/atividades/' + id);
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    window.location.href = 'salas.html';
    return;
  }

  const atividade = resposta.dados.atividade;
  const entrega = resposta.dados.entrega;

  document.querySelector('#titulo').innerHTML = 'Atividade ' + String(atividade.numero).padStart(2, '0') + ' - <span>' + limpar(atividade.titulo) + '</span>';
  document.querySelector('#professor').textContent = 'Professor(a): ' + atividade.professor;
  document.querySelector('#voltar').href = 'sala.html?id=' + atividade.id_sala;
  document.querySelector('#enunciado').innerHTML = formatarTexto(atividade.descricao || 'Esta atividade não tem instruções escritas.');
  document.querySelector('#prazo').textContent = dataLonga(atividade.prazo);
  document.querySelector('#pontuacao').textContent = atividade.pontuacao + ' pontos';

  const status = document.querySelector('#status');
  status.textContent = textosStatus[resposta.dados.status];
  status.className = resposta.dados.status;

  if (atividade.arquivo) {
    const botao = document.createElement('button');
    botao.className = 'cinza';
    botao.innerHTML = icone('baixar', 16) + ' Baixar anexo: ' + limpar(atividade.arquivo_nome);
    botao.addEventListener('click', function () {
      baixarArquivo('/atividades/' + id + '/arquivo', atividade.arquivo_nome);
    });
    document.querySelector('#anexo').appendChild(botao);
  }

  mostrarHistorico(entrega, atividade);

  if (entrega) {
    campoObservacao.value = entrega.observacao || '';
    campoObservacao.dispatchEvent(new Event('input'));
  }
  if (entrega && entrega.status == 'rascunho') {
    aviso.hidden = false;
    aviso.textContent = 'Você tem um rascunho salvo em ' + dataLonga(entrega.data_entrega) + '. A atividade continua pendente.';
  }

  if (!resposta.dados.pode_entregar) {
    document.querySelector('#blocoEntrega').hidden = true;
    if (resposta.dados.prazo_encerrado && !(entrega && entrega.status != 'rascunho')) {
      document.querySelector('#historico').innerHTML += '<p class="erro">O prazo da atividade foi encerrado e o professor não permite entregas após o prazo.</p>';
    }
  } else if (resposta.dados.prazo_encerrado) {
    aviso.hidden = false;
    aviso.textContent = 'O prazo foi encerrado, mas o professor permite entregas após o prazo.';
  }
}

async function enviar(rascunho) {
  const arquivo = campoArquivo.files[0];
  const observacao = campoObservacao.value.trim();
  if (!arquivo && observacao == '' && !rascunho) {
    alert('Envie um arquivo ou escreva uma observação.');
    return;
  }

  const dados = new FormData();
  if (arquivo) {
    dados.append('arquivo', arquivo);
  }
  dados.append('observacao', observacao);
  dados.append('rascunho', rascunho);

  const resposta = await api('/atividades/' + id + '/entregar', 'POST', dados);
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    return;
  }

  alert(resposta.dados.mensagem);
  window.location.reload();
}

document.querySelector('#rascunho').addEventListener('click', function () {
  enviar(true);
});
document.querySelector('#enviar').addEventListener('click', function () {
  enviar(false);
});

ligarDropzone(document.querySelector('#zona'), campoArquivo);
ligarContador(campoObservacao, document.querySelector('#contador'), 300);
iniciarPagina('aluno');
carregar();
