// Material de Apoio (aluno): busca, filtro por tipo, ordem, paginação e download
//   materiais.html?sala=2 mostra só os materiais daquela sala
(async function () {
  var fmt = Codify.fmt;
  var esc = fmt.esc;
  await Codify.iniciar();

  var form = document.querySelector('.toolbar');
  var lista = document.querySelector('.mats');
  var paginacao = document.querySelector('.pagination');
  var idSala = Codify.parametro('sala');
  var pagina = 1;

  // Ícone e cor de cada material
  function visual(m) {
    var ext = (m.extensao || '').toLowerCase();
    if (m.tipo === 'video') return { cor: 'purple', icone: 'i-play-box', acao: 'i-play', rotulo: 'Assistir' };
    if (m.tipo === 'link') return { cor: 'teal', icone: 'i-link', acao: 'i-link', rotulo: 'Abrir' };
    if (m.tipo === 'imagem') return { cor: 'red', icone: 'i-image', acao: 'i-download', rotulo: 'Baixar' };
    if (ext === 'ppt' || ext === 'pptx') return { cor: 'orange', icone: 'i-slides', acao: 'i-download', rotulo: 'Baixar' };
    if (ext === 'pdf') return { cor: 'blue', icone: 'i-pdf', acao: 'i-download', rotulo: 'Baixar' };
    if (ext === 'c' || ext === 'h' || ext === 'zip') return { cor: 'teal', icone: 'i-code', acao: 'i-download', rotulo: 'Baixar' };
    return { cor: 'red', icone: 'i-doc', acao: 'i-download', rotulo: 'Baixar' };
  }

  function item(m) {
    var v = visual(m);
    var detalhe = m.eh_link ? (m.tipo === 'video' ? 'Vídeo' : 'Link') + '<i aria-hidden="true">•</i>' + esc(new URL(m.link).hostname)
      : m.tem_arquivo ? esc(m.extensao) + (m.tamanho ? '<i aria-hidden="true">•</i>' + fmt.tamanho(m.tamanho) : '')
        : 'Arquivo ainda não enviado';
    if (m.categoria) detalhe += '<i aria-hidden="true">•</i>' + esc(m.categoria);
    if (!idSala) detalhe += '<i aria-hidden="true">•</i>' + esc(m.sala);

    var acao;
    if (m.eh_link) {
      acao = '<a class="mat__action" href="' + esc(m.link) + '" target="_blank" rel="noopener" aria-label="' + v.rotulo + ': ' + esc(m.titulo) + '"><svg aria-hidden="true"><use href="#' + v.acao + '"/></svg></a>';
    } else {
      var abrir = !m.permitir_download;
      acao = '<button type="button" class="mat__action" data-id="' + m.id_material + '" aria-label="' + (abrir ? 'Abrir' : v.rotulo) + ': ' + esc(m.titulo) + '">'
        + '<svg aria-hidden="true"><use href="#' + (abrir ? 'i-eye' : v.acao) + '"/></svg></button>';
    }
    return '<li class="mat mat--' + v.cor + (!m.eh_link && !m.tem_arquivo ? ' mat--sem-arquivo' : '') + '">'
      + '<span class="mat__icon"><svg aria-hidden="true"><use href="#' + v.icone + '"/></svg></span>'
      + '<div class="mat__info"><h2>' + esc(m.titulo) + (m.destaque ? ' <span class="tag">Destaque</span>' : '') + '</h2>'
      + '<p>' + esc(m.descricao || '') + '</p><small>' + detalhe + '</small></div>'
      + '<time class="mat__date" datetime="' + esc(m.criado_em) + '">' + fmt.dataRelativa(m.criado_em) + '</time>'
      + acao + '</li>';
  }

  function montarPaginacao(r) {
    var html = '<a href="#" data-pagina="' + Math.max(1, r.pagina - 1) + '" aria-label="Página anterior"><svg aria-hidden="true"><use href="#i-chev-left"/></svg></a>';
    for (var p = 1; p <= r.total_paginas; p += 1) {
      html += '<a href="#" data-pagina="' + p + '"' + (p === r.pagina ? ' class="is-active" aria-current="page"' : '') + '>' + p + '</a>';
    }
    html += '<a href="#" data-pagina="' + Math.min(r.total_paginas, r.pagina + 1) + '" aria-label="Próxima página"><svg aria-hidden="true"><use href="#i-chev-right"/></svg></a>';
    paginacao.innerHTML = html;
    paginacao.hidden = r.total_paginas <= 1;
  }

  async function carregar() {
    var q = new URLSearchParams({
      pagina: pagina,
      limite: 5,
      busca: form.q.value.trim(),
      tipo: form.tipo.value,
      ordem: form.ordem.value,
    });
    if (idSala) q.set('sala', idSala);
    lista.innerHTML = '<li class="carregando">Carregando materiais…</li>';
    try {
      var r = await Codify.api('/materiais?' + q);
      lista.innerHTML = r.dados.length ? r.dados.map(item).join('')
        : '<li class="vazio"><strong>Nenhum material encontrado.</strong>Tente outra busca ou outro filtro.</li>';
      montarPaginacao(r);
    } catch (e) {
      lista.innerHTML = '<li class="vazio">' + esc(e.message) + '</li>';
    }
  }

  // Valores do select de ordem que a API entende
  var ordens = form.ordem.options;
  ordens[0].value = 'recentes';
  ordens[1].value = 'antigos';
  ordens[2].value = 'az';

  form.addEventListener('submit', function (e) { e.preventDefault(); pagina = 1; carregar(); });
  form.tipo.addEventListener('change', function () { pagina = 1; carregar(); });
  form.ordem.addEventListener('change', function () { pagina = 1; carregar(); });
  var espera;
  form.q.addEventListener('input', function () {
    clearTimeout(espera);
    espera = setTimeout(function () { pagina = 1; carregar(); }, 300);
  });

  paginacao.addEventListener('click', function (e) {
    var link = e.target.closest('[data-pagina]');
    if (!link) return;
    e.preventDefault();
    pagina = Number(link.dataset.pagina);
    carregar();
  });

  lista.addEventListener('click', function (e) {
    var botao = e.target.closest('button.mat__action');
    if (botao) Codify.baixar('/materiais/' + botao.dataset.id + '/arquivo');
  });

  // Grade / lista
  var botoes = document.querySelectorAll('.view-toggle button');
  botoes.forEach(function (b, i) {
    b.addEventListener('click', function () {
      botoes.forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      lista.classList.toggle('mats--lista', i === 1);
    });
  });

  if (idSala) {
    try {
      var sala = await Codify.api('/salas/' + encodeURIComponent(idSala));
      document.querySelector('.page-sub').textContent = 'Materiais da sala ' + sala.nome + '.';
    } catch (e) { /* segue com o texto padrão */ }
  }
  carregar();
})();
