const formulario = document.querySelector('#formulario');
const campoSenha = document.querySelector('#senha');
const campoConfirmar = document.querySelector('#confirmar');
const mensagem = document.querySelector('#mensagem');

document.querySelector('#mostrar').addEventListener('click', function () {
  if (campoSenha.type == 'password') {
    campoSenha.type = 'text';
    campoConfirmar.type = 'text';
  } else {
    campoSenha.type = 'password';
    campoConfirmar.type = 'password';
  }
});

formulario.addEventListener('submit', async function (evento) {
  evento.preventDefault();

  const nome = document.querySelector('#nome').value.trim();
  const email = document.querySelector('#email').value.trim();
  const senha = campoSenha.value;
  const tipo = document.querySelector('input[name=tipo]:checked').value;

  if (nome == '' || email == '' || senha == '') {
    mensagem.textContent = 'Preencha todos os campos.';
    return;
  }
  if (senha.length < 8) {
    mensagem.textContent = 'A senha precisa ter no mínimo 8 caracteres.';
    return;
  }
  if (senha != campoConfirmar.value) {
    mensagem.textContent = 'A confirmação da senha não confere.';
    return;
  }
  if (!document.querySelector('#termos').checked) {
    mensagem.textContent = 'Você precisa concordar com os Termos de Uso e a Política de Privacidade.';
    return;
  }

  const resposta = await api('/cadastro', 'POST', { nome: nome, email: email, senha: senha, tipo: tipo, termos: true });
  if (!resposta.ok) {
    mensagem.textContent = resposta.dados.erro;
    return;
  }

  alert(resposta.dados.mensagem);
  window.location.href = RAIZ + 'login.html';
});

document.querySelector('#google').addEventListener('click', function () {
  alert('O acesso com Google estará disponível em breve. Use seu e-mail e senha.');
});
