if (pegarUsuario()) {
  window.location.href = paginaInicial(pegarUsuario());
}

const formulario = document.querySelector('#formulario');
const campoSenha = document.querySelector('#senha');
const mensagem = document.querySelector('#mensagem');

document.querySelector('#mostrar').addEventListener('click', function () {
  if (campoSenha.type == 'password') {
    campoSenha.type = 'text';
  } else {
    campoSenha.type = 'password';
  }
});

formulario.addEventListener('submit', async function (evento) {
  evento.preventDefault();

  const email = document.querySelector('#email').value.trim();
  const senha = campoSenha.value;

  if (email == '' || senha == '') {
    mensagem.textContent = 'Preencha o e-mail e a senha.';
    return;
  }

  const resposta = await api('/login', 'POST', { email: email, senha: senha });
  if (!resposta.ok) {
    mensagem.textContent = resposta.dados.erro;
    return;
  }

  localStorage.setItem('token', resposta.dados.token);
  localStorage.setItem('usuario', JSON.stringify(resposta.dados.usuario));

  if (resposta.dados.usuario.tipo == 'aluno') {
    window.location.href = RAIZ + 'aluno/missoes.html';
  } else {
    window.location.href = RAIZ + 'professor/salas.html';
  }
});

document.querySelector('#google').addEventListener('click', function () {
  alert('O acesso com Google estará disponível em breve. Use seu e-mail e senha.');
});
