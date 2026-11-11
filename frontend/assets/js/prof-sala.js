const id = new URLSearchParams(window.location.search).get('id');
const nomesNivel = { iniciante: 'Iniciante', intermediario: 'Médio', avancado: 'Avançado' };

async function responder(idAluno, aceitar) {
  const resposta = await api('/salas/' + id + '/aprovar', 'POST', { id_aluno: idAluno, aceitar: aceitar });
  alert(resposta.ok ? resposta.dados.mensagem : resposta.dados.erro);
  window.location.reload();
}

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
  document.querySelector('#info').textContent = sala.descricao + ' | ' + nomesNivel[sala.nivel] + ' | ' + sala.linguagem;
  document.querySelector('#codigo').textContent = sala.codigo_acesso;
  document.querySelector('#novaAtividade').href = 'atividade-nova.html?sala=' + id;
  document.querySelector('#novoMaterial').href = 'material-novo.html?sala=' + id;

  if (resposta.dados.pendentes.length > 0) {
    document.querySelector('#blocoPendentes').hidden = false;
    const caixa = document.querySelector('#pendentes');
    for (const aluno of resposta.dados.pendentes) {
      const linha = document.createElement('p');
      linha.innerHTML = '<span>' + limpar(aluno.nome) + ' (' + limpar(aluno.email) + ')</span>';

      const aceitar = document.createElement('button');
      aceitar.className = 'verde';
      aceitar.textContent = 'Aprovar';
      aceitar.addEventListener('click', function () {
        responder(aluno.id_usuario, true);
      });
      const recusar = document.createElement('button');
      recusar.className = 'cinza';
      recusar.textContent = 'Recusar';
      recusar.addEventListener('click', function () {
        responder(aluno.id_usuario, false);
      });

      const botoes = document.createElement('span');
      botoes.appendChild(aceitar);
      botoes.appendChild(recusar);
      linha.appendChild(botoes);
      caixa.appendChild(linha);
    }
  }

  const atividades = document.querySelector('#atividades');
  if (resposta.dados.atividades.length == 0) {
    atividades.innerHTML = '<tr><td colspan="4">Nenhuma atividade ainda.</td></tr>';
  }
  for (const a of resposta.dados.atividades) {
    atividades.innerHTML +=
      '<tr><td>' + limpar(a.titulo) + '</td><td>' + formatarData(a.prazo) + '</td>' +
      '<td>' + a.total_entregas + ' de ' + resposta.dados.alunos.length + '</td>' +
      '<td><a href="entregas.html?id=' + a.id_atividade + '">Ver entregas</a></td></tr>';
  }

  const materiais = document.querySelector('#materiais');
  if (resposta.dados.materiais.length == 0) {
    materiais.innerHTML = '<tr><td colspan="3">Nenhum material ainda.</td></tr>';
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

  const alunos = document.querySelector('#alunos');
  if (resposta.dados.alunos.length == 0) {
    alunos.innerHTML = '<tr><td colspan="2">Nenhum aluno entrou na sala ainda.</td></tr>';
  }
  for (const aluno of resposta.dados.alunos) {
    alunos.innerHTML += '<tr><td>' + limpar(aluno.nome) + '</td><td>' + limpar(aluno.email) + '</td></tr>';
  }
}

iniciarPagina('professor');
carregar();
