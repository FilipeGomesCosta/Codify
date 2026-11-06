// Tela de cadastro: POST /api/auth/cadastro (aluno ou professor)
(function () {
  var form = document.querySelector('.form');

  form.addEventListener('submit', async function (e) {
    e.preventDefault(); // a validação dos campos (senhas iguais etc.) roda antes, no script da página
    if (!form.checkValidity()) return;

    var perfil = form.querySelector('input[name=perfil]:checked').value;
    var botao = e.submitter || form.querySelector('button[type=submit]');
    try {
      await Codify.carregando(botao, async function () {
        var r = await Codify.api('/auth/cadastro', {
          method: 'POST',
          body: {
            tipo: perfil,
            nome: form.querySelector('#nome').value,
            email: form.querySelector('#email').value,
            senha: form.querySelector('#senha').value,
          },
        });
        Codify.sessao.salvar(r.token, r.usuario);
        location.href = Codify.inicioDo(r.usuario.tipo);
      });
    } catch (erro) {
      Codify.aviso(erro.message, 'erro');
    }
  });
})();
