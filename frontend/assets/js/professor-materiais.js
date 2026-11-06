// Professor – Adicionar Material de Apoio (POST /api/salas/:idSala/materiais, multipart)
//   materiais.html?sala=2 → já deixa a sala escolhida
(async function () {
  var fmt = Codify.fmt;
  await Codify.iniciar('professor');

  var form = document.querySelector('form.main');
  var selSala = form.querySelector('#sala');
  var campoArquivo = form.querySelector('#arquivo');
  var grupoArquivo = campoArquivo.closest('.group');
  var campoData = form.querySelector('input[name=data]');
  var campoHora = form.querySelector('input[name=hora]');
  var botao = form.querySelector('button[type=submit]');

  // ---------- Salas ----------
  try {
    var salas = await Codify.api('/salas');
    selSala.innerHTML = '<option value="" disabled>Selecione uma sala</option>'
      + salas.map(function (s) { return '<option value="' + s.id_sala + '">' + fmt.esc(s.nome) + '</option>'; }).join('');
    selSala.value = Codify.parametro('sala') || '';
    if (!salas.length) Codify.aviso('Crie uma sala antes de adicionar materiais.', 'erro');
  } catch (e) {
    Codify.aviso(e.message, 'erro');
  }
  if (selSala.value) form.querySelector('.back').href = 'turmas.html?sala=' + selSala.value;

  // ---------- Campo de link (para os tipos Link e Vídeo) ----------
  var grupoLink = document.createElement('div');
  grupoLink.className = 'group campo-link';
  grupoLink.innerHTML = '<label class="field-label" for="link">Endereço (URL)</label>'
    + '<input class="input" id="link" name="link" type="url" placeholder="https://www.youtube.com/watch?v=..." maxlength="500">'
    + '<p class="panel__text" id="link-dica"></p>';
  grupoArquivo.after(grupoLink);
  var campoLink = grupoLink.querySelector('#link');

  var ACEITOS = {
    documento: '.pdf,.doc,.docx,.ppt,.pptx,.txt',
    video: '.mp4',
    imagem: '.png,.jpg,.jpeg',
    outro: '.pdf,.doc,.docx,.ppt,.pptx,.mp4,.png,.jpg,.jpeg,.c,.h,.zip,.txt',
  };
  function atualizarTipo() {
    var tipo = form.querySelector('input[name=tipo]:checked').value;
    grupoArquivo.hidden = tipo === 'link';
    grupoLink.hidden = tipo !== 'link' && tipo !== 'video';
    campoLink.required = tipo === 'link';
    grupoLink.querySelector('#link-dica').textContent = tipo === 'video'
      ? 'Envie um arquivo MP4 ou cole o link do vídeo (YouTube, etc.).'
      : 'Cole o endereço do site ou página.';
    if (ACEITOS[tipo]) campoArquivo.accept = ACEITOS[tipo];
  }
  form.querySelectorAll('input[name=tipo]').forEach(function (r) { r.addEventListener('change', atualizarTipo); });
  atualizarTipo();

  // ---------- Visibilidade ----------
  function atualizarVisibilidade() {
    var agendar = form.querySelector('input[name=visibilidade]:checked').value === 'agendar';
    campoData.disabled = !agendar;
    campoHora.disabled = !agendar;
    campoData.required = agendar;
  }
  form.querySelectorAll('input[name=visibilidade]').forEach(function (r) { r.addEventListener('change', atualizarVisibilidade); });
  atualizarVisibilidade();

  // ---------- Envio ----------
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var tipo = form.querySelector('input[name=tipo]:checked').value;
    var dados = new FormData(form);

    if (tipo === 'link' || !campoArquivo.files.length) dados.delete('arquivo');
    if (tipo !== 'link' && tipo !== 'video') dados.delete('link');
    if (!dados.get('arquivo') && !campoLink.value.trim()) {
      Codify.aviso(tipo === 'video' ? 'Envie o vídeo ou informe o link.' : 'Selecione o arquivo do material.', 'erro');
      return;
    }
    if (dados.get('visibilidade') !== 'agendar') { dados.delete('data'); dados.delete('hora'); }
    // checkbox desmarcado não vai no formulário: mandamos true/false explicitamente
    dados.set('download', String(form.querySelector('input[name=download]').checked));
    dados.set('destaque', String(form.querySelector('input[name=destaque]').checked));

    try {
      await Codify.carregando(botao, async function () {
        var m = await Codify.api('/salas/' + selSala.value + '/materiais', { method: 'POST', body: dados });
        Codify.aviso('Material "' + m.titulo + '" enviado!');
        var sala = selSala.value;
        form.reset();
        selSala.value = sala;
        atualizarTipo();
        atualizarVisibilidade();
        Codify.ligarContadores(form);
      });
    } catch (erro) {
      Codify.aviso(erro.message, 'erro');
    }
  });

  // Link "ver materiais da sala" depois de enviar
  var acoes = form.querySelector('.actions');
  var ver = document.createElement('a');
  ver.className = 'btn btn--ghost';
  ver.textContent = 'Ver materiais da sala';
  ver.href = '#';
  ver.addEventListener('click', function (e) {
    e.preventDefault();
    location.href = 'turmas.html' + (selSala.value ? '?sala=' + selSala.value : '');
  });
  acoes.prepend(ver);
})();
