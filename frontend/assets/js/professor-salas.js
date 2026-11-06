// Professor – Criar Sala de Aula (POST /api/salas)
(async function () {
  await Codify.iniciar('professor');

  var form = document.querySelector('form.main');
  var saidaCodigo = form.querySelector('output[name=codigo]');
  var resumo = form.querySelector('.summary__card');
  var dd = resumo.querySelectorAll('dd');
  var botao = form.querySelector('button[type=submit]');
  var codigo = '';

  // Código mostrado antes de criar (o servidor confirma que está livre)
  async function novoCodigo() {
    try {
      codigo = (await Codify.api('/salas/codigo')).codigo_acesso;
    } catch (e) {
      codigo = '';
      Codify.aviso(e.message, 'erro');
    }
    atualizarResumo();
  }
  form.querySelector('.room-code button').addEventListener('click', novoCodigo);

  form.querySelector('.copy-btn').addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(codigo);
      Codify.aviso('Código copiado: ' + codigo);
    } catch (e) {
      Codify.aviso('Não foi possível copiar. Código: ' + codigo, 'erro');
    }
  });

  // Resumo da sala ao lado
  function atualizarResumo() {
    saidaCodigo.textContent = codigo || '----';
    dd[0].textContent = form.nome.value.trim() || 'Nome da sala';
    dd[2].textContent = form.nivel.value || '-';
    dd[3].firstChild.textContent = (codigo || '----') + ' ';
    var privada = form.privada.checked;
    dd[4].firstChild.textContent = (privada ? 'Privada' : 'Pública') + ' ';
    var arte = form.querySelector('input[name=imagem]:checked').closest('.art-card').querySelector('.art');
    resumo.querySelector('.art').outerHTML = arte.outerHTML;
  }
  form.addEventListener('input', atualizarResumo);
  form.addEventListener('change', atualizarResumo);
  form.addEventListener('reset', function () { setTimeout(atualizarResumo); });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    try {
      await Codify.carregando(botao, async function () {
        var sala = await Codify.api('/salas', {
          method: 'POST',
          body: {
            nome: form.nome.value,
            descricao: form.descricao.value,
            nivel: form.nivel.value,
            imagem: form.querySelector('input[name=imagem]:checked').value,
            codigo_acesso: codigo,
          },
        });
        Codify.aviso('Sala criada! Código de acesso: ' + sala.codigo_acesso);
        setTimeout(function () { location.href = 'turmas.html?sala=' + sala.id_sala; }, 1200);
      });
    } catch (erro) {
      Codify.aviso(erro.message, 'erro');
    }
  });

  await novoCodigo();
})();
