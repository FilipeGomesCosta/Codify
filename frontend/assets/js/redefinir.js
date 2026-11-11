const mensagem = document.querySelector('#mensagem');
const token = new URLSearchParams(window.location.search).get('token');

document.querySelector('#formulario').addEventListener('submit', async function (evento) {
  evento.preventDefault();

  const senha = document.querySelector('#senha').value;
  if (senha.length < 8) {
    mensagem.textContent = 'A senha precisa ter no mínimo 8 caracteres.';
    return;
  }
  if (senha != document.querySelector('#confirmar').value) {
    mensagem.textContent = 'A confirmação da senha não confere.';
    return;
  }

  const resposta = await api('/redefinir-senha', 'POST', { token: token, senha: senha });
  if (!resposta.ok) {
    mensagem.textContent = resposta.dados.erro;
    return;
  }

  alert(resposta.dados.mensagem);
  window.location.href = RAIZ + 'login.html';
});
