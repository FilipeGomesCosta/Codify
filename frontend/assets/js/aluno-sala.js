const id = new URLSearchParams(window.location.search).get('id');
const textosStatus = { pendente: 'Pendente', entregue: 'Entregue', avaliada: 'Avaliada' };
const nomesNivel = { iniciante: 'Iniciante', intermediario: 'Médio', avancado: 'Avançado' };

async function carregar() {
  const resposta = await api('/salas/' + id);
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    window.location.href = 'salas.html';
    return;
  }

  const sala = resposta.dados.sala;
  document.querySelector('#imagem').innerHTML = imagemSala(sala);
  document.querySelector('#nome').textContent = sala.nome;
  document.querySelector('#info').textContent = 'Prof. ' + sala.professor + ' | Nível: ' + nomesNivel[sala.nivel] + ' | ' + sala.linguagem;

  const atividades = document.querySelector('#atividades');
  if (resposta.dados.atividades.length == 0) {
    atividades.innerHTML = '<tr><td colspan="4">Nenhuma atividade por enquanto.</td></tr>';
  }
  for (const a of resposta.dados.atividades) {
    atividades.innerHTML +=
      '<tr><td>' + limpar(a.titulo) + '</td><td>' + formatarData(a.prazo) + '</td>' +
      '<td class="' + a.status + '">' + textosStatus[a.status] + '</td>' +
      '<td><a href="atividade.html?id=' + a.id_atividade + '">Abrir</a></td></tr>';
  }

  const materiais = document.querySelector('#materiais');
  if (resposta.dados.materiais.length == 0) {
    materiais.innerHTML = '<tr><td colspan="3">Nenhum material por enquanto.</td></tr>';
  }
  for (const m of resposta.dados.materiais) {
    const linha = document.createElement('tr');
    linha.innerHTML = '<td>' + limpar(m.titulo) + '</td><td>' + m.tipo + '</td>';

    const botao = document.createElement('button');
    botao.className = 'cinza';
    if (m.link) {
      botao.innerHTML = icone('link', 16) + ' Abrir';
      botao.addEventListener('click', function () {
        window.open(m.link);
      });
    } else if (!m.permitir_download) {
      botao.innerHTML = icone('olho', 16) + ' Visualizar';
      botao.addEventListener('click', function () {
        baixarArquivo('/materiais/' + m.id_material + '/arquivo?inline=1', m.arquivo_nome, true);
      });
    } else {
      botao.innerHTML = icone('baixar', 16) + ' Baixar';
      botao.addEventListener('click', function () {
        baixarArquivo('/materiais/' + m.id_material + '/arquivo', m.arquivo_nome);
      });
    }
    const coluna = document.createElement('td');
    coluna.appendChild(botao);
    linha.appendChild(coluna);
    materiais.appendChild(linha);
  }
}

iniciarPagina('aluno');
carregar();
