const mensagem = document.querySelector('#mensagem');

document.querySelector('#formulario').addEventListener('submit', async function (evento) {
  evento.preventDefault();

  const email = document.querySelector('#email').value.trim();
  if (email == '') {
    mensagem.textContent = 'Digite o e-mail cadastrado.';
    return;
  }

  const resposta = await api('/esqueci-senha', 'POST', { email: email });
  if (!resposta.ok) {
    mensagem.textContent = resposta.dados.erro;
    return;
  }

  mensagem.className = 'sucesso';
  mensagem.textContent = resposta.dados.mensagem;
});
