const id = new URLSearchParams(window.location.search).get('id');
const textosStatus = { pendente: 'Pendente', entregue: 'Entregue', avaliada: 'Avaliada' };

async function carregar() {
  const resposta = await api('/atividades/' + id + '/entregas');
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    window.location.href = 'salas.html';
    return;
  }

  const atividade = resposta.dados.atividade;
  document.querySelector('#titulo').textContent = atividade.titulo;
  document.querySelector('#info').textContent = 'Sala: ' + atividade.sala + ' | Prazo: ' + formatarData(atividade.prazo);
  document.querySelector('#voltar').href = 'sala.html?id=' + atividade.id_sala;

  const tabela = document.querySelector('#alunos');
  tabela.innerHTML = '';
  if (resposta.dados.alunos.length == 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum aluno na sala.</td></tr>';
  }

  for (const aluno of resposta.dados.alunos) {
    const linha = document.createElement('tr');
    linha.innerHTML = '<td>' + limpar(aluno.nome) + '</td><td class="' + aluno.status + '">' + textosStatus[aluno.status] + '</td>';

    const colunaEntrega = document.createElement('td');
    const colunaNota = document.createElement('td');
    const colunaFeedback = document.createElement('td');
    const colunaBotao = document.createElement('td');

    if (aluno.id_entrega) {
      colunaEntrega.innerHTML = formatarData(aluno.data_entrega) + '<br>' + limpar(aluno.observacao) + '<br>';
      if (aluno.arquivo_nome) {
        const baixar = document.createElement('button');
        baixar.className = 'cinza';
        baixar.textContent = 'Baixar ' + aluno.arquivo_nome;
        baixar.addEventListener('click', function () {
          baixarArquivo('/entregas/' + aluno.id_entrega + '/arquivo', aluno.arquivo_nome);
        });
        colunaEntrega.appendChild(baixar);
      }

      const campoNota = document.createElement('input');
      campoNota.type = 'number';
      campoNota.min = 0;
      campoNota.max = atividade.pontuacao;
      campoNota.step = 0.5;
      campoNota.value = aluno.nota === null ? '' : aluno.nota;
      colunaNota.appendChild(campoNota);

      const campoFeedback = document.createElement('input');
      campoFeedback.type = 'text';
      campoFeedback.value = aluno.feedback || '';
      colunaFeedback.appendChild(campoFeedback);

      const salvar = document.createElement('button');
      salvar.textContent = 'Salvar';
      salvar.addEventListener('click', async function () {
        const resposta = await api('/entregas/' + aluno.id_entrega + '/avaliar', 'POST', {
          nota: campoNota.value,
          feedback: campoFeedback.value
        });
        alert(resposta.ok ? resposta.dados.mensagem : resposta.dados.erro);
        if (resposta.ok) {
          carregar();
        }
      });
      colunaBotao.appendChild(salvar);
    } else {
      colunaEntrega.textContent = '-';
    }

    linha.appendChild(colunaEntrega);
    linha.appendChild(colunaNota);
    linha.appendChild(colunaFeedback);
    linha.appendChild(colunaBotao);
    tabela.appendChild(linha);
  }
}

iniciarPagina('professor');
carregar();
