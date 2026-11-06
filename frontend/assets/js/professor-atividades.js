// Professor – Adicionar Atividade (POST /api/salas/:idSala/atividades, multipart)
//   atividades.html?sala=2    → já deixa a sala escolhida
//   atividades.html?editar=5  → edita uma atividade existente (PUT /api/atividades/5)
(async function () {
  var fmt = Codify.fmt;
  await Codify.iniciar('professor');

  var form = document.querySelector('form.main');
  var selSala = form.querySelector('#sala');
  var campoTitulo = form.querySelector('#titulo');
  var campoTexto = form.querySelector('#instrucoes');
  var campoArquivo = form.querySelector('#anexo');
  var campoEntrega = form.querySelector('#entrega');
  var campoData = form.querySelector('input[name=data]');
  var campoHora = form.querySelector('input[name=hora]');
  var botao = form.querySelector('button[type=submit]');
  var idEditar = Codify.parametro('editar');
  var atual = null;

  // ---------- Salas do professor no select ----------
  try {
    var salas = await Codify.api('/salas');
    selSala.innerHTML = '<option value="" disabled>Selecione uma sala</option>'
      + salas.map(function (s) { return '<option value="' + s.id_sala + '">' + fmt.esc(s.nome) + '</option>'; }).join('');
    selSala.value = Codify.parametro('sala') || '';
    if (!salas.length) Codify.aviso('Crie uma sala antes de adicionar atividades.', 'erro');
  } catch (e) {
    Codify.aviso(e.message, 'erro');
  }

  // ---------- Modo edição ----------
  if (idEditar) {
    try {
      atual = await Codify.api('/atividades/' + encodeURIComponent(idEditar));
      document.title = 'Codify – Editar Atividade';
      form.querySelector('.page-title').innerHTML = 'Editar <span>Atividade</span>';
      form.querySelector('.page-sub').textContent = 'Altere as informações da atividade. As entregas dos alunos são mantidas.';
      botao.textContent = 'Salvar alterações';
      campoTitulo.value = atual.titulo;
      campoTexto.value = atual.descricao || '';
      campoTexto.removeAttribute('maxlength'); // textos antigos podem ser maiores
      campoEntrega.type = 'date';
      campoEntrega.value = fmt.paraInputData(atual.prazo);
      selSala.value = atual.id_sala;
      selSala.disabled = true; // a atividade não muda de sala
      if (atual.disponivel_em) {
        form.querySelector('input[name=visibilidade][value=agendar]').checked = true;
        campoData.type = 'date';
        campoData.value = fmt.paraInputData(atual.disponivel_em);
        campoHora.type = 'time';
        var d = new Date(atual.disponivel_em);
        campoHora.value = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      }
      if (atual.tem_arquivo) {
        var aviso = document.createElement('p');
        aviso.className = 'panel__text';
        aviso.innerHTML = 'Anexo atual: <strong>' + fmt.esc(atual.arquivo_nome || 'arquivo') + '</strong> '
          + '<label><input type="checkbox" name="remover_arquivo" value="true"> remover anexo</label>'
          + ' <small>(ou escolha outro arquivo para trocar)</small>';
        campoArquivo.closest('.group').appendChild(aviso);
      }
      form.querySelectorAll('.back, .actions .btn--ghost').forEach(function (a) {
        a.href = 'turmas.html?sala=' + atual.id_sala + '&atividade=' + atual.id_atividade;
      });
      Codify.ligarContadores(form);
    } catch (e) {
      Codify.aviso(e.message, 'erro');
    }
  } else if (selSala.value) {
    form.querySelectorAll('.back, .actions .btn--ghost').forEach(function (a) { a.href = 'turmas.html?sala=' + selSala.value; });
  }

  // ---------- Barra de formatação das instruções ----------
  var barra = form.querySelector('.editor-bar');
  barra.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var ini = campoTexto.selectionStart;
    var fim = campoTexto.selectionEnd;
    var sel = campoTexto.value.slice(ini, fim);
    var rotulo = b.getAttribute('aria-label');
    var novo;
    if (rotulo === 'Negrito') novo = '**' + (sel || 'texto') + '**';
    else if (rotulo === 'Sublinhado') novo = '__' + (sel || 'texto') + '__';
    else if (rotulo === 'Lista com marcadores') novo = (sel || 'item').split('\n').map(function (l) { return '• ' + l; }).join('\n');
    else if (rotulo === 'Lista numerada') novo = (sel || 'item').split('\n').map(function (l, i) { return (i + 1) + '. ' + l; }).join('\n');
    else if (rotulo === 'Inserir link') {
      var url = prompt('Endereço do link (http:// ou https://):', 'https://');
      if (!url || !/^https?:\/\//i.test(url)) return;
      novo = (sel ? sel + ' ' : '') + url;
    }
    campoTexto.setRangeText(novo, ini, fim, 'end');
    campoTexto.focus();
    campoTexto.dispatchEvent(new Event('input'));
  });

  // ---------- Visibilidade ----------
  function atualizarVisibilidade() {
    var agendar = form.querySelector('input[name=visibilidade]:checked').value === 'agendar';
    campoData.disabled = !agendar;
    campoHora.disabled = !agendar;
    campoData.required = agendar;
  }
  form.querySelectorAll('input[name=visibilidade]').forEach(function (r) { r.addEventListener('change', atualizarVisibilidade); });
  atualizarVisibilidade();

  // ---------- Pré-visualização ----------
  var prevTitulo = form.querySelector('.preview strong');
  var prevPrazo = form.querySelector('.preview__due');
  var prevArquivo = form.querySelector('.preview__file');
  function atualizarPrevia() {
    prevTitulo.textContent = campoTitulo.value.trim() || 'Título da atividade';
    prevPrazo.textContent = 'Prazo: ' + (campoEntrega.value ? fmt.data(campoEntrega.value + 'T23:59') : 'dd/mm/aaaa');
    var temArquivo = campoArquivo.files.length || (atual && atual.tem_arquivo);
    prevArquivo.lastChild.textContent = temArquivo ? 'Com arquivo' : 'Sem arquivo';
  }
  [campoTitulo, campoEntrega, campoArquivo].forEach(function (c) {
    c.addEventListener('input', atualizarPrevia);
    c.addEventListener('change', atualizarPrevia);
  });
  atualizarPrevia();

  // ---------- Envio ----------
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var dados = new FormData(form);
    if (!campoArquivo.files.length) dados.delete('arquivo');
    if (dados.get('visibilidade') !== 'agendar') { dados.delete('data'); dados.delete('hora'); }

    try {
      await Codify.carregando(botao, async function () {
        var a = idEditar
          ? await Codify.api('/atividades/' + atual.id_atividade, { method: 'PUT', body: dados })
          : await Codify.api('/salas/' + selSala.value + '/atividades', { method: 'POST', body: dados });
        Codify.aviso(idEditar ? 'Atividade atualizada!' : 'Atividade adicionada!');
        setTimeout(function () {
          location.href = 'turmas.html?sala=' + a.id_sala + '&atividade=' + a.id_atividade;
        }, 900);
      });
    } catch (erro) {
      Codify.aviso(erro.message, 'erro');
    }
  });
})();
