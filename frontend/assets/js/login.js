// Tela de login: POST /api/auth/login e vai para a página do tipo de usuário
(function () {
  var form = document.querySelector('.form');
  var usuario = Codify.sessao.usuario();
  if (Codify.sessao.token() && usuario) location.href = Codify.inicioDo(usuario.tipo); // já logado

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var botao = form.querySelector('button[type=submit]');
    try {
      await Codify.carregando(botao, async function () {
        var r = await Codify.api('/auth/login', {
          method: 'POST',
          body: { email: form.querySelector('#email').value, senha: form.querySelector('#senha').value },
        });
        Codify.sessao.salvar(r.token, r.usuario);
        location.href = Codify.inicioDo(r.usuario.tipo);
      });
    } catch (erro) {
      Codify.aviso(erro.message, 'erro');
    }
  });
})();
