// Professor – Minhas Salas
// Lista as salas do professor e, para a sala escolhida, mostra:
//   Atividades → entregas de cada aluno (baixar arquivo, dar nota e feedback)
//   Materiais  → baixar / abrir / excluir
//   Alunos     → remover da sala
// turmas.html?sala=2&atividade=5 abre direto numa sala/atividade.
(async function () {
  var fmt = Codify.fmt;
  var esc = fmt.esc;
  await Codify.iniciar('professor');

  var listaSalas = document.getElementById('turmas');
  var detalhe = document.getElementById('detalhe');
  var salas = [];
  var sala = null;
  var aba = 'atividades';

  function setUrl(params) {
    var q = new URLSearchParams(params);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }

  // ---------------- Salas ----------------
  async function carregarSalas(idEscolhida, idAtividade) {
    try {
      salas = await Codify.api('/salas');
    } catch (e) {
      listaSalas.innerHTML = '<p class="vazio">' + esc(e.message) + '</p>';
      return;
    }
    if (!salas.length) {
      listaSalas.innerHTML = '<p class="vazio"><strong>Você ainda não criou salas.</strong></p>'
        + '<a class="btn btn--primary" href="salas.html">Criar sala</a>';
      detalhe.innerHTML = '';
      return;
    }
    listaSalas.innerHTML = salas.map(function (s) {
      return '<button type="button" class="turma" data-id="' + s.id_sala + '">'
        + '<strong>' + esc(s.nome) + '</strong>'
        + '<small>' + s.total_alunos + (s.total_alunos === 1 ? ' aluno' : ' alunos') + ' · '
        + s.total_atividades + (s.total_atividades === 1 ? ' atividade' : ' atividades') + ' · '
        + s.total_materiais + (s.total_materiais === 1 ? ' material' : ' materiais') + '</small>'
        + '</button>';
    }).join('') + '<a class="btn btn--ghost" href="salas.html">+ Criar nova sala</a>';

    var achada = salas.find(function (s) { return String(s.id_sala) === String(idEscolhida); });
    abrirSala((achada || salas[0]).id_sala, achada ? idAtividade : null);
  }

  listaSalas.addEventListener('click', function (e) {
    var b = e.target.closest('.turma');
    if (b) { aba = 'atividades'; abrirSala(b.dataset.id); }
  });

  function abrirSala(id, idAtividade) {
    sala = salas.find(function (s) { return String(s.id_sala) === String(id); });
    listaSalas.querySelectorAll('.turma').forEach(function (b) { b.classList.toggle('is-active', b.dataset.id === String(sala.id_sala)); });
    setUrl({ sala: sala.id_sala });

    detalhe.innerHTML = '<div class="turma-head"><div>'
      + '<h2>' + esc(sala.nome) + '</h2>'
      + '<p>' + (sala.descricao ? esc(sala.descricao) + ' · ' : '') + 'Nível ' + (fmt.NIVEIS[sala.nivel] || '-') + '</p>'
      + '<p style="margin-top:8px">Código: <span class="codigo-sala" id="codigo">' + esc(sala.codigo_acesso) + '</span> '
      + '<button type="button" class="link-btn" data-acao="copiar">copiar</button> · '
      + '<button type="button" class="link-btn" data-acao="novo-codigo">gerar novo</button></p>'
      + '</div><div class="turma-head__acoes">'
      + '<a class="btn btn--primary btn--sm" href="atividades.html?sala=' + sala.id_sala + '">+ Atividade</a>'
      + '<a class="btn btn--outline-sm" href="materiais.html?sala=' + sala.id_sala + '">+ Material</a>'
      + '<button type="button" class="btn btn--outline-sm" data-acao="excluir-sala">Excluir sala</button>'
      + '</div></div>'
      + '<div class="abas" role="tablist">'
      + '<button type="button" data-aba="atividades">Atividades</button>'
      + '<button type="button" data-aba="materiais">Materiais</button>'
      + '<button type="button" data-aba="alunos">Alunos</button>'
      + '</div><div id="conteudo-aba"></div>';
    mostrarAba(aba, idAtividade);
  }

  detalhe.addEventListener('click', async function (e) {
    var alvo = e.target.closest('[data-acao], [data-aba]');
    if (!alvo) return;
    if (alvo.dataset.aba) return mostrarAba(alvo.dataset.aba);

    var acao = alvo.dataset.acao;
    try {
      if (acao === 'copiar') {
        await navigator.clipboard.writeText(sala.codigo_acesso);
        Codify.aviso('Código copiado: ' + sala.codigo_acesso);
      } else if (acao === 'novo-codigo') {
        if (!confirm('Gerar um novo código? O código atual deixará de funcionar.')) return;
        var atualizada = await Codify.api('/salas/' + sala.id_sala + '/novo-codigo', { method: 'POST' });
        sala.codigo_acesso = atualizada.codigo_acesso;
        document.getElementById('codigo').textContent = sala.codigo_acesso;
        Codify.aviso('Novo código: ' + sala.codigo_acesso);
      } else if (acao === 'excluir-sala') {
        if (!confirm('Excluir a sala "' + sala.nome + '"? Atividades, entregas e materiais serão apagados.')) return;
        await Codify.api('/salas/' + sala.id_sala, { method: 'DELETE' });
        Codify.aviso('Sala excluída.');
        carregarSalas();
      } else if (acao === 'abrir-atividade') {
        mostrarEntregas(alvo.dataset.id);
      } else if (acao === 'voltar') {
        mostrarAba('atividades');
      } else if (acao === 'anexo') {
        Codify.baixar('/atividades/' + alvo.dataset.id + '/arquivo');
      } else if (acao === 'excluir-atividade') {
        if (!confirm('Excluir esta atividade e todas as entregas dos alunos?')) return;
        await Codify.api('/atividades/' + alvo.dataset.id, { method: 'DELETE' });
        Codify.aviso('Atividade excluída.');
        sala.total_atividades -= 1;
        mostrarAba('atividades');
      } else if (acao === 'baixar-entrega') {
        Codify.baixar('/atividades/' + alvo.dataset.atividade + '/entregas/' + alvo.dataset.aluno + '/arquivo');
      } else if (acao === 'material') {
        Codify.baixar('/materiais/' + alvo.dataset.id + '/arquivo');
      } else if (acao === 'excluir-material') {
        if (!confirm('Excluir este material?')) return;
        await Codify.api('/materiais/' + alvo.dataset.id, { method: 'DELETE' });
        Codify.aviso('Material excluído.');
        mostrarAba('materiais');
      } else if (acao === 'remover-aluno') {
        if (!confirm('Remover ' + alvo.dataset.nome + ' da sala?')) return;
        await Codify.api('/salas/' + sala.id_sala + '/alunos/' + alvo.dataset.id, { method: 'DELETE' });
        Codify.aviso('Aluno removido.');
        mostrarAba('alunos');
      }
    } catch (erro) {
      Codify.aviso(erro.message, 'erro');
    }
  });

  function mostrarAba(nome, idAtividade) {
    aba = nome;
    detalhe.querySelectorAll('[data-aba]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.aba === nome);
      b.setAttribute('aria-selected', String(b.dataset.aba === nome));
    });
    var caixa = document.getElementById('conteudo-aba');
    caixa.innerHTML = '<p class="carregando">Carregando…</p>';
    if (idAtividade) return mostrarEntregas(idAtividade);
    if (nome === 'atividades') return abaAtividades(caixa);
    if (nome === 'materiais') return abaMateriais(caixa);
    return abaAlunos(caixa);
  }

  // ---------------- Atividades ----------------
  async function abaAtividades(caixa) {
    setUrl({ sala: sala.id_sala });
    try {
      var atividades = await Codify.api('/salas/' + sala.id_sala + '/atividades');
      if (!atividades.length) {
        caixa.innerHTML = '<p class="vazio"><strong>Nenhuma atividade nesta sala.</strong>'
          + '<a class="link-btn" href="atividades.html?sala=' + sala.id_sala + '">Adicionar a primeira atividade</a></p>';
        return;
      }
      caixa.innerHTML = '<ul class="tasks">' + atividades.map(function (a) {
        var faltam = a.total_entregas - a.total_avaliadas;
        return '<li><div class="task" role="button" tabindex="0" data-acao="abrir-atividade" data-id="' + a.id_atividade + '">'
          + '<span class="task__icon"><svg aria-hidden="true"><use href="#i-doc"/></svg></span>'
          + '<div><h3>' + esc(a.titulo) + '</h3><p class="task__meta">'
          + '<span>Entrega: ' + fmt.dataHora(a.prazo) + '</span>'
          + (a.agendada ? '<span class="tag tag--warn">Disponível em ' + fmt.dataHora(a.disponivel_em) + '</span>' : '')
          + (a.encerrada ? '<span class="tag">Prazo encerrado</span>' : '')
          + (a.tem_arquivo ? '<span class="tag">Com arquivo</span>' : '')
          + '</p></div>'
          + '<div class="task__side"><span>' + a.total_entregas + ' de ' + a.total_alunos + ' entregas</span>'
          + (faltam > 0 ? '<em class="status-dot status-dot--pending">' + faltam + ' para avaliar</em>' : '')
          + '</div></div></li>';
      }).join('') + '</ul>';
    } catch (e) {
      caixa.innerHTML = '<p class="vazio">' + esc(e.message) + '</p>';
    }
  }

  // Enter/Espaço nos cartões de atividade
  detalhe.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.task[data-acao]')) {
      e.preventDefault();
      e.target.click();
    }
  });

  // ---------------- Entregas de uma atividade ----------------
  async function mostrarEntregas(idAtividade) {
    var caixa = document.getElementById('conteudo-aba');
    caixa.innerHTML = '<p class="carregando">Carregando entregas…</p>';
    setUrl({ sala: sala.id_sala, atividade: idAtividade });
    try {
      var a = await Codify.api('/atividades/' + idAtividade);
      var entregas = await Codify.api('/atividades/' + idAtividade + '/entregas');

      caixa.innerHTML = '<button type="button" class="back link-btn" data-acao="voltar"><svg aria-hidden="true"><use href="#i-arrow-left"/></svg>Voltar às atividades</button>'
        + '<section class="panel" style="margin:14px 0 18px">'
        + '<div class="hist__linha"><h3 style="margin:0">' + esc(a.titulo) + '</h3>'
        + '<div class="mini-acoes">'
        + '<a class="link-btn" href="atividades.html?editar=' + a.id_atividade + '">Editar</a>'
        + '<button type="button" class="link-btn link-btn--perigo" data-acao="excluir-atividade" data-id="' + a.id_atividade + '">Excluir</button>'
        + '</div></div>'
        + '<p class="panel__text">Entrega até ' + fmt.dataHora(a.prazo)
        + (a.agendada ? ' · <span class="tag tag--warn">Disponível para os alunos em ' + fmt.dataHora(a.disponivel_em) + '</span>' : '')
        + ' · ' + a.total_entregas + ' de ' + a.total_alunos + ' alunos entregaram · ' + a.total_avaliadas + ' avaliadas</p>'
        + (a.descricao ? '<div class="statement__text">' + fmt.paragrafos(a.descricao) + '</div>' : '')
        + (a.tem_arquivo ? '<button type="button" class="anexo" data-acao="anexo" data-id="' + a.id_atividade + '"><svg aria-hidden="true"><use href="#i-download"/></svg>' + esc(a.arquivo_nome || 'Anexo') + '</button>' : '')
        + '</section>'
        + '<h3 class="section-title">Entregas dos alunos</h3>';

      if (!entregas.length) {
        caixa.innerHTML += '<p class="vazio">Nenhum aluno nesta sala ainda. Compartilhe o código <strong>' + esc(sala.codigo_acesso) + '</strong>.</p>';
        return;
      }

      caixa.innerHTML += '<div class="tabela-rolagem"><table class="entregas"><thead><tr>'
        + '<th>Aluno</th><th>Status</th><th>Resposta</th><th>Avaliação</th></tr></thead><tbody>'
        + entregas.map(function (e) {
          var enviada = e.status !== 'pendente';
          return '<tr><td><strong>' + esc(e.aluno) + '</strong><small>' + esc(e.email) + '</small></td>'
            + '<td>' + fmt.statusHtml(e.status)
            + (e.data_entrega ? '<small>' + fmt.dataHora(e.data_entrega) + '</small>' : '')
            + (e.atrasada ? '<span class="tag tag--warn">Atrasada</span>' : '') + '</td>'
            + '<td class="obs">' + (e.tem_arquivo
              ? '<button type="button" class="link-btn" data-acao="baixar-entrega" data-atividade="' + a.id_atividade + '" data-aluno="' + e.id_aluno + '">' + esc(e.arquivo_nome || 'arquivo') + '</button>'
              : enviada ? '<small>Sem arquivo</small>' : '<small>—</small>')
            + (e.observacao ? '<small>“' + esc(e.observacao) + '”</small>' : '') + '</td>'
            + '<td>' + (enviada
              ? '<form class="avaliar" data-aluno="' + e.id_aluno + '">'
                + '<input name="nota" type="number" min="0" max="10" step="0.1" placeholder="Nota" aria-label="Nota de 0 a 10" value="' + (e.nota != null ? e.nota : '') + '" required>'
                + '<textarea name="feedback" rows="1" maxlength="5000" placeholder="Feedback (opcional)" aria-label="Feedback">' + esc(e.feedback || '') + '</textarea>'
                + '<button class="btn btn--primary btn--sm" type="submit">' + (e.status === 'avaliada' ? 'Atualizar' : 'Avaliar') + '</button>'
                + '</form>'
              : '<small>Aguardando entrega</small>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';

      caixa.querySelectorAll('form.avaliar').forEach(function (form) {
        form.addEventListener('submit', async function (ev) {
          ev.preventDefault();
          var botao = form.querySelector('button');
          try {
            await Codify.carregando(botao, function () {
              return Codify.api('/atividades/' + a.id_atividade + '/entregas/' + form.dataset.aluno + '/avaliacao', {
                method: 'PUT',
                body: { nota: form.nota.value, feedback: form.feedback.value },
              });
            });
            Codify.aviso('Avaliação salva.');
            mostrarEntregas(a.id_atividade);
          } catch (erro) {
            Codify.aviso(erro.message, 'erro');
          }
        });
      });
    } catch (e) {
      caixa.innerHTML = '<p class="vazio">' + esc(e.message) + '</p>';
    }
  }

  // ---------------- Materiais ----------------
  async function abaMateriais(caixa) {
    setUrl({ sala: sala.id_sala });
    try {
      var mats = await Codify.api('/salas/' + sala.id_sala + '/materiais');
      if (!mats.length) {
        caixa.innerHTML = '<p class="vazio"><strong>Nenhum material nesta sala.</strong>'
          + '<a class="link-btn" href="materiais.html?sala=' + sala.id_sala + '">Adicionar material</a></p>';
        return;
      }
      var tipos = { documento: 'Documento', video: 'Vídeo', link: 'Link', imagem: 'Imagem', outro: 'Outro' };
      caixa.innerHTML = '<ul class="tasks">' + mats.map(function (m) {
        var abrir = m.eh_link
          ? '<a class="link-btn" href="' + esc(m.link) + '" target="_blank" rel="noopener">Abrir link</a>'
          : m.tem_arquivo ? '<button type="button" class="link-btn" data-acao="material" data-id="' + m.id_material + '">Baixar ' + esc(m.extensao || '') + '</button>'
            : '<small>Sem arquivo</small>';
        return '<li><div class="task">'
          + '<span class="task__icon"><svg aria-hidden="true"><use href="#' + (m.eh_link ? 'i-link' : m.tipo === 'video' ? 'i-play-box' : m.tipo === 'imagem' ? 'i-image' : 'i-doc') + '"/></svg></span>'
          + '<div><h3>' + esc(m.titulo) + '</h3><p>' + esc(m.descricao || '') + '</p><p class="task__meta">'
          + '<span class="tag">' + tipos[m.tipo] + '</span>'
          + (m.categoria ? '<span>' + esc(m.categoria) + '</span>' : '')
          + (m.tamanho ? '<span>' + fmt.tamanho(m.tamanho) + '</span>' : '')
          + (m.destaque ? '<span class="tag">Destaque</span>' : '')
          + (!m.permitir_download && !m.eh_link ? '<span class="tag tag--warn">Sem download</span>' : '')
          + (m.agendado ? '<span class="tag tag--warn">Disponível em ' + fmt.dataHora(m.disponivel_em) + '</span>' : '')
          + '</p></div>'
          + '<div class="task__side">' + abrir
          + '<button type="button" class="link-btn link-btn--perigo" data-acao="excluir-material" data-id="' + m.id_material + '">Excluir</button>'
          + '</div></div></li>';
      }).join('') + '</ul>';
    } catch (e) {
      caixa.innerHTML = '<p class="vazio">' + esc(e.message) + '</p>';
    }
  }

  // ---------------- Alunos ----------------
  async function abaAlunos(caixa) {
    setUrl({ sala: sala.id_sala });
    try {
      var alunos = await Codify.api('/salas/' + sala.id_sala + '/alunos');
      if (!alunos.length) {
        caixa.innerHTML = '<p class="vazio"><strong>Nenhum aluno ainda.</strong>Compartilhe o código <span class="codigo-sala">' + esc(sala.codigo_acesso) + '</span> com a turma.</p>';
        return;
      }
      caixa.innerHTML = '<div class="tabela-rolagem"><table class="entregas"><thead><tr><th>Aluno</th><th>Nível</th><th>XP</th><th></th></tr></thead><tbody>'
        + alunos.map(function (al) {
          return '<tr><td><strong>' + esc(al.nome) + '</strong><small>' + esc(al.email) + '</small></td>'
            + '<td>' + al.nivel + '</td><td>' + fmt.numero(al.pontuacao_xp) + '</td>'
            + '<td><button type="button" class="link-btn link-btn--perigo" data-acao="remover-aluno" data-id="' + al.id_usuario + '" data-nome="' + esc(al.nome) + '">Remover</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    } catch (e) {
      caixa.innerHTML = '<p class="vazio">' + esc(e.message) + '</p>';
    }
  }

  // Abre a sala/atividade indicada na URL
  carregarSalas(Codify.parametro('sala'), Codify.parametro('atividade'));
})();
