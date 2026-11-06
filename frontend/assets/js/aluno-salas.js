// Aluno – Salas de Aula: lista as salas, busca, entra com código e sai da sala
(async function () {
  var fmt = Codify.fmt;
  await Codify.iniciar('aluno');

  var lista = document.getElementById('minhas-salas');
  var busca = document.querySelector('.salas__search input');
  var modal = document.getElementById('entrar-sala');
  var formCodigo = modal.querySelector('form');

  // Arte do cartão conforme a imagem escolhida pelo professor
  function thumb(imagem) {
    var emojis = { computador: '💻', inovacao: '💡', robotica: '🤖' };
    if (emojis[imagem]) {
      return '<div class="room__thumb room__thumb--braces room__thumb--emoji" aria-hidden="true"><span class="room__glyph">' + emojis[imagem] + '</span></div>';
    }
    if (imagem === 'programacao') {
      return '<div class="room__thumb room__thumb--braces" aria-hidden="true"><span class="room__glyph">{ }</span></div>';
    }
    return '<div class="room__thumb room__thumb--window" aria-hidden="true"><span class="room__dots"><i></i><i></i><i></i></span><span class="room__glyph">&lt;/&gt;</span></div>';
  }

  function cartao(s) {
    var ultima = s.ultima_atividade ? fmt.dataRelativa(s.ultima_atividade) : 'nenhuma';
    return '<li class="room" data-id="' + s.id_sala + '">'
      + thumb(s.imagem)
      + '<div class="room__info">'
      + '<h2>' + fmt.esc(s.nome) + '</h2>'
      + '<p class="room__prof">Prof. ' + fmt.esc(s.professor) + '</p>'
      + '<p class="room__level">Nível: ' + (fmt.NIVEIS[s.nivel] || 'Iniciante') + '</p>'
      + '<p class="room__meta">'
      + '<span><svg aria-hidden="true"><use href="#i-users"/></svg>' + s.total_alunos + (s.total_alunos === 1 ? ' aluno' : ' alunos') + '</span>'
      + '<span><svg aria-hidden="true"><use href="#i-calendar"/></svg>Última atividade: ' + ultima + '</span>'
      + '</p></div>'
      + '<a class="btn btn--primary room__btn" href="atividades.html?sala=' + s.id_sala + '">Entrar</a>'
      + '<button class="room__menu" type="button" aria-haspopup="true" aria-label="Mais opções da sala ' + fmt.esc(s.nome) + '"><svg aria-hidden="true"><use href="#i-dots-v"/></svg></button>'
      + '</li>';
  }

  async function carregar() {
    lista.innerHTML = '<li class="carregando">Carregando salas…</li>';
    try {
      var termo = busca.value.trim();
      var salas = await Codify.api('/salas' + (termo ? '?busca=' + encodeURIComponent(termo) : ''));
      lista.innerHTML = salas.length
        ? salas.map(cartao).join('')
        : '<li class="vazio"><strong>' + (termo ? 'Nenhuma sala encontrada.' : 'Você ainda não participa de nenhuma sala.')
          + '</strong>Peça o código ao seu professor e clique em “Entrar em Sala”.</li>';
    } catch (e) {
      lista.innerHTML = '<li class="vazio">' + fmt.esc(e.message) + '</li>';
    }
  }

  // Busca com pequena espera enquanto digita
  var espera;
  busca.addEventListener('input', function () {
    clearTimeout(espera);
    espera = setTimeout(carregar, 300);
  });

  // Menu "⋮" de cada sala
  function fecharMenus() {
    document.querySelectorAll('.room-pop').forEach(function (m) { m.remove(); });
  }
  document.addEventListener('click', fecharMenus);
  lista.addEventListener('click', function (e) {
    var botao = e.target.closest('.room__menu');
    if (!botao) return;
    e.stopPropagation();
    fecharMenus();
    var sala = botao.closest('.room');
    var nome = sala.querySelector('h2').textContent;
    var menu = document.createElement('div');
    menu.className = 'room-pop';
    menu.innerHTML = '<button type="button" data-acao="atividades">Ver atividades</button>'
      + '<button type="button" data-acao="materiais">Material de apoio</button>'
      + '<button type="button" data-acao="sair" class="perigo">Sair da sala</button>';
    sala.appendChild(menu);
    menu.addEventListener('click', async function (ev) {
      var acao = ev.target.dataset.acao;
      var id = sala.dataset.id;
      if (acao === 'atividades') location.href = 'atividades.html?sala=' + id;
      if (acao === 'materiais') location.href = 'materiais.html?sala=' + id;
      if (acao === 'sair' && confirm('Sair da sala "' + nome + '"? Você poderá voltar com o código.')) {
        try {
          await Codify.api('/salas/' + id + '/sair', { method: 'DELETE' });
          Codify.aviso('Você saiu da sala ' + nome + '.');
          carregar();
        } catch (erro) { Codify.aviso(erro.message, 'erro'); }
      }
    });
  });

  // Modal "Acessar Sala de Aula"
  formCodigo.addEventListener('submit', async function (e) {
    e.preventDefault();
    var campo = formCodigo.querySelector('#codigo');
    try {
      await Codify.carregando(formCodigo.querySelector('button'), async function () {
        var sala = await Codify.api('/salas/entrar', { method: 'POST', body: { codigo_acesso: campo.value } });
        Codify.aviso('Bem-vindo(a) à sala ' + sala.nome + '!');
        campo.value = '';
        location.hash = ''; // fecha o modal (ele abre com #entrar-sala)
        carregar();
      });
    } catch (erro) {
      Codify.aviso(erro.message, 'erro');
    }
  });

  // Ações rápidas: mostra quantas atividades estão pendentes
  try {
    var pendentes = await Codify.api('/atividades/pendentes');
    var item = document.querySelector('.quick__list a[href="atividades.html"] small');
    if (item) {
      item.textContent = pendentes.length
        ? pendentes.length + (pendentes.length === 1 ? ' atividade pendente' : ' atividades pendentes')
        : 'Nenhuma atividade pendente';
    }
  } catch (e) { /* não impede a tela */ }

  carregar();
})();
