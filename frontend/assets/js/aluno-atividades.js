// Aluno – Atividades
//   atividades.html?id=3    → tela da atividade + entrega (rascunho / envio) + histórico
//   atividades.html?sala=2  → atividades e materiais de uma sala
//   atividades.html         → todas as atividades das minhas salas (pendentes primeiro)
(async function () {
  var fmt = Codify.fmt;
  var esc = fmt.esc;
  await Codify.iniciar('aluno');

  var tela = document.getElementById('tela-atividade');
  var idAtividade = Codify.parametro('id');
  if (idAtividade) return mostrarAtividade(idAtividade);
  return mostrarLista(Codify.parametro('sala'));

  // ======================================================
  // Lista de atividades
  // ======================================================
  async function mostrarLista(idSala) {
    var main = tela.querySelector('.split__main');
    var aside = tela.querySelector('.split__aside');
    tela.classList.remove('atividade');

    main.innerHTML = '<header class="page-head"><h1 class="page-title" id="lista-titulo">Minhas <span>Atividades</span></h1>'
      + '<p class="page-sub" id="lista-sub">Acompanhe as atividades das suas salas.</p></header>'
      + '<a class="back" href="salas.html"><svg aria-hidden="true"><use href="#i-arrow-left"/></svg>Voltar</a>'
      + '<div id="lista"><p class="carregando">Carregando atividades…</p></div>';
    aside.innerHTML = '';

    try {
      var sala = idSala ? await Codify.api('/salas/' + encodeURIComponent(idSala)) : null;
      var atividades = await Codify.api('/atividades' + (sala ? '?sala=' + sala.id_sala : ''));

      if (sala) {
        document.title = 'Codify – ' + sala.nome;
        main.querySelector('#lista-titulo').innerHTML = esc(sala.nome);
        main.querySelector('#lista-sub').textContent = 'Prof. ' + sala.professor + (sala.descricao ? ' · ' + sala.descricao : '');
        aside.innerHTML = painelSala(sala) + '<section class="panel"><h2 class="panel__title">Material de apoio</h2><div id="mats-sala"><p class="carregando">Carregando…</p></div></section>';
        carregarMateriaisDaSala(sala.id_sala);
      } else {
        aside.innerHTML = '<section class="panel tip"><span class="tip__icon"><svg aria-hidden="true"><use href="#i-cap"/></svg></span>'
          + '<div><h2>Dica Codify</h2><p>Entregue antes do prazo: depois dele o envio é bloqueado.</p></div></section>';
      }

      // pendentes primeiro, depois as entregues/avaliadas
      var ordem = { pendente: 0, rascunho: 0, entregue: 1, avaliada: 2 };
      atividades.sort(function (a, b) {
        return (ordem[a.status_entrega] - ordem[b.status_entrega]) || (new Date(a.prazo) - new Date(b.prazo));
      });

      var lista = main.querySelector('#lista');
      if (!atividades.length) {
        lista.innerHTML = '<p class="vazio"><strong>Nenhuma atividade por aqui.</strong>Quando o professor publicar, ela aparece nesta lista.</p>';
        return;
      }
      lista.innerHTML = '<ul class="tasks">' + atividades.map(function (a) {
        var status = a.status_entrega;
        if ((status === 'pendente' || status === 'rascunho') && a.encerrada) status = 'encerrada';
        return '<li><a class="task" href="atividades.html?id=' + a.id_atividade + '">'
          + '<span class="task__icon"><svg aria-hidden="true"><use href="#i-doc"/></svg></span>'
          + '<div><h3>' + esc(a.titulo) + '</h3>'
          + '<p class="task__meta">' + (sala ? '' : '<span>' + esc(a.sala) + '</span>')
          + '<span>Entrega: ' + fmt.dataHora(a.prazo) + '</span>'
          + (a.tem_arquivo ? '<span class="tag">Com arquivo</span>' : '') + '</p></div>'
          + '<div class="task__side">' + fmt.statusHtml(status)
          + (a.nota != null && a.status_entrega === 'avaliada' ? '<span class="nota">Nota ' + String(a.nota).replace('.', ',') + '</span>' : '')
          + '</div></a></li>';
      }).join('') + '</ul>';
    } catch (e) {
      main.querySelector('#lista').innerHTML = '<p class="vazio">' + esc(e.message) + '</p>';
    }
  }

  function painelSala(s) {
    return '<section class="panel"><h2 class="panel__title">Sobre a sala</h2><ul class="facts">'
      + '<li><svg aria-hidden="true"><use href="#i-users"/></svg><span><strong>Professor(a)</strong>' + esc(s.professor) + '</span></li>'
      + '<li><svg aria-hidden="true"><use href="#i-cap"/></svg><span><strong>Nível</strong>' + (fmt.NIVEIS[s.nivel] || '-') + '</span></li>'
      + '<li><svg aria-hidden="true"><use href="#i-clipboard"/></svg><span><strong>Atividades</strong>' + s.total_atividades + '</span></li>'
      + '</ul></section>';
  }

  async function carregarMateriaisDaSala(idSala) {
    var caixa = document.getElementById('mats-sala');
    try {
      var mats = await Codify.api('/salas/' + idSala + '/materiais');
      if (!mats.length) {
        caixa.innerHTML = '<p class="panel__text">Nenhum material nesta sala.</p>';
        return;
      }
      caixa.innerHTML = '<ul class="hist">' + mats.slice(0, 5).map(function (m) {
        return '<li><div class="hist__linha"><strong>' + esc(m.titulo) + '</strong>'
          + (m.destaque ? '<span class="tag">Destaque</span>' : '') + '</div>'
          + (m.eh_link
            ? '<a class="link-btn" href="' + esc(m.link) + '" target="_blank" rel="noopener">Abrir link</a>'
            : m.tem_arquivo ? '<button type="button" class="link-btn" data-material="' + m.id_material + '">'
              + (m.permitir_download ? 'Baixar' : 'Abrir') + ' (' + esc(m.extensao) + ')</button>' : '<small>Sem arquivo</small>')
          + '</li>';
      }).join('') + '</ul><p><a class="link-btn" href="materiais.html?sala=' + idSala + '">Ver todos os materiais</a></p>';
      caixa.addEventListener('click', function (e) {
        var id = e.target.dataset.material;
        if (id) Codify.baixar('/materiais/' + id + '/arquivo');
      });
    } catch (e) {
      caixa.innerHTML = '<p class="panel__text">' + esc(e.message) + '</p>';
    }
  }

  // ======================================================
  // Tela da atividade + entrega
  // ======================================================
  async function mostrarAtividade(id) {
    var form = document.getElementById('form-entrega');
    var a;
    try {
      a = await Codify.api('/atividades/' + encodeURIComponent(id));
    } catch (e) {
      document.getElementById('tarefa-texto').innerHTML = '<p class="vazio">' + esc(e.message) + '</p>';
      document.getElementById('tarefa-prof').textContent = '';
      form.hidden = true;
      return;
    }
    renderizar(a);

    // Download do anexo do professor
    document.getElementById('tarefa-anexo').addEventListener('click', function (e) {
      if (e.target.closest('[data-anexo]')) Codify.baixar('/atividades/' + a.id_atividade + '/arquivo');
    });
    // Download / remoção do arquivo já salvo na entrega
    document.getElementById('tela-atividade').addEventListener('click', async function (e) {
      if (e.target.closest('[data-minha-entrega]')) {
        Codify.baixar('/atividades/' + a.id_atividade + '/entregas/' + a.minha_entrega.id_aluno + '/arquivo');
      }
      if (e.target.closest('[data-cancelar]') && confirm('Desfazer a entrega? O arquivo enviado será apagado.')) {
        try {
          await Codify.api('/atividades/' + a.id_atividade + '/entregas', { method: 'DELETE' });
          Codify.aviso('Entrega desfeita.');
          a = await Codify.api('/atividades/' + a.id_atividade);
          renderizar(a);
        } catch (erro) { Codify.aviso(erro.message, 'erro'); }
      }
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var botao = e.submitter;
      var acao = botao && botao.value === 'rascunho' ? 'rascunho' : 'enviar';
      var dados = new FormData(form);
      dados.set('acao', acao);
      if (!form.querySelector('#resposta').files.length) dados.delete('arquivo');
      if (acao === 'enviar' && !confirm('Enviar a atividade para o professor?')) return;

      try {
        await Codify.carregando(botao, async function () {
          var r = await Codify.api('/atividades/' + a.id_atividade + '/entregas', { method: 'POST', body: dados });
          Codify.aviso(r.mensagem);
          form.reset();
          a = await Codify.api('/atividades/' + a.id_atividade);
          renderizar(a);
        });
      } catch (erro) {
        Codify.aviso(erro.message, 'erro');
      }
    });
  }

  function renderizar(a) {
    document.title = 'Codify – ' + a.titulo;
    var partes = a.titulo.split(' - ');
    document.getElementById('tarefa-titulo').innerHTML = partes.length > 1
      ? esc(partes[0]) + ' <span>- ' + esc(partes.slice(1).join(' - ')) + '</span>'
      : esc(a.titulo);
    document.getElementById('tarefa-prof').textContent = 'Professor(a): ' + a.professor + ' · ' + a.sala;
    document.getElementById('tarefa-voltar').href = 'atividades.html?sala=' + a.id_sala;
    document.getElementById('tarefa-texto').innerHTML = a.descricao
      ? fmt.paragrafos(a.descricao)
      : '<p class="statement__lead">O professor não escreveu instruções para esta atividade.</p>';
    document.getElementById('tarefa-anexo').innerHTML = a.tem_arquivo
      ? '<button type="button" class="anexo" data-anexo><svg aria-hidden="true"><use href="#i-download"/></svg>'
        + 'Baixar anexo: ' + esc(a.arquivo_nome || 'arquivo') + '</button>'
      : '';

    var prazo = document.getElementById('f-prazo');
    prazo.textContent = fmt.dataHora(a.prazo);
    prazo.setAttribute('datetime', a.prazo);

    var e = a.minha_entrega;
    var status = a.status_entrega;
    if ((status === 'pendente' || status === 'rascunho') && a.encerrada) status = 'encerrada';
    document.getElementById('f-status').innerHTML = fmt.statusHtml(status);
    document.getElementById('f-pontos').textContent = status === 'avaliada'
      ? 'Nota ' + String(e.nota).replace('.', ',') + ' de 10'
      : '10 pontos';

    // Formulário de entrega
    var form = document.getElementById('form-entrega');
    var bloqueado = a.encerrada || a.status_entrega === 'avaliada';
    form.querySelectorAll('input, textarea, button').forEach(function (el) { el.disabled = bloqueado; });
    form.querySelector('button[value=rascunho]').disabled = bloqueado || a.status_entrega === 'entregue';
    form.querySelector('button[value=enviar]').lastChild.textContent = a.status_entrega === 'entregue' ? 'Enviar novamente' : 'Enviar a atividade';
    var lead = document.getElementById('entrega-lead');
    lead.textContent = a.status_entrega === 'avaliada' ? 'Atividade avaliada pelo professor.'
      : a.encerrada ? 'O prazo de entrega terminou.'
        : a.status_entrega === 'entregue' ? 'Já enviada. Você pode reenviar até o prazo.'
          : 'Anexe sua resposta ou arquivo';
    form.querySelector('#observacao').value = e && e.observacao ? e.observacao : '';
    Codify.ligarContadores(form);

    var atual = document.getElementById('arquivo-atual');
    atual.hidden = !(e && e.tem_arquivo);
    if (e && e.tem_arquivo) {
      atual.innerHTML = 'Arquivo salvo: <button type="button" class="link-btn" data-minha-entrega>' + esc(e.arquivo_nome || 'arquivo') + '</button>'
        + (bloqueado ? '' : ' <small>(escolha outro arquivo para trocar)</small>');
    }

    // Histórico
    var hist = document.getElementById('historico');
    if (!e) {
      hist.innerHTML = '<div class="empty"><svg aria-hidden="true"><use href="#i-folder"/></svg><p>Nenhuma entrega realizada ainda.</p></div>';
      return;
    }
    hist.innerHTML = '<ul class="hist"><li>'
      + '<div class="hist__linha">' + fmt.statusHtml(e.status)
      + (e.status === 'avaliada' ? '<span class="nota">Nota ' + String(e.nota).replace('.', ',') + ' / 10</span>' : '') + '</div>'
      + (e.data_entrega ? '<small>Enviada em ' + fmt.dataHora(e.data_entrega) + '</small>' : '<small>Rascunho (ainda não enviado)</small>')
      + (e.tem_arquivo ? '<span>Arquivo: <button type="button" class="link-btn" data-minha-entrega>' + esc(e.arquivo_nome || 'arquivo') + '</button></span>' : '')
      + (e.observacao ? '<span>Observação: ' + esc(e.observacao) + '</span>' : '')
      + (e.feedback ? '<p class="feedback"><strong>Feedback do professor:</strong> ' + esc(e.feedback) + '</p>' : '')
      + (!bloqueado ? '<span><button type="button" class="link-btn link-btn--perigo" data-cancelar>Desfazer entrega</button></span>' : '')
      + '</li></ul>';
  }
})();
