function ferramentasTopo(tipo) {
  const paginas = tipo == 'aluno'
    ? [['Trilha de Missões', 'aluno/missoes.html'], ['Sala de Aula', 'aluno/salas.html'], ['Material de Apoio', 'aluno/materiais.html'],
       ['Inventário', 'aluno/inventario.html'], ['Loja', 'aluno/loja.html'], ['Conquistas', 'aluno/conquistas.html'], ['Compilador', 'aluno/compilador.html']]
    : [['Sala de Aula', 'professor/salas.html'], ['Criar Sala de Aula', 'professor/criar-sala.html'], ['Material de Apoio', 'professor/material-novo.html']];

  async function carregarSelo() {
    const resposta = await api('/notificacoes');
    const selo = document.querySelector('#seloSino');
    if (resposta.ok && resposta.dados.length > 0) {
      selo.hidden = false;
      selo.textContent = resposta.dados.length;
    }
  }

  document.querySelector('#btnSino').addEventListener('click', async function () {
    const resposta = await api('/notificacoes');
    let corpo = '<div class="lista-simples">';
    if (resposta.ok) {
      for (const n of resposta.dados) {
        corpo += '<p><a href="' + RAIZ + tipo + '/' + n.link + '">' + limpar(n.texto) + '</a></p>';
      }
      if (resposta.dados.length == 0) {
        corpo += '<p class="cinza-texto">Você não tem notificações.</p>';
      }
    } else {
      corpo += '<p>' + limpar(resposta.dados.erro) + '</p>';
    }
    abrirDialogo('Notificações', corpo + '</div>', [{ texto: 'Fechar', classe: 'cinza' }]);
  });

  document.querySelector('#btnBusca').addEventListener('click', function () {
    abrirDialogo('Buscar no Codify',
      '<input type="text" id="campoBusca" placeholder="Digite o nome de uma página..."><div class="lista-simples" id="resultadosBusca"></div>',
      [{ texto: 'Fechar', classe: 'cinza' }]);

    const campo = document.querySelector('#campoBusca');
    const resultados = document.querySelector('#resultadosBusca');

    function filtrar() {
      resultados.innerHTML = '';
      for (const pagina of paginas) {
        if (pagina[0].toLowerCase().includes(campo.value.toLowerCase())) {
          resultados.innerHTML += '<p><a href="' + RAIZ + pagina[1] + '">' + pagina[0] + '</a></p>';
        }
      }
    }
    campo.addEventListener('input', filtrar);
    filtrar();
    campo.focus();
  });

  document.querySelector('#btnConfig').addEventListener('click', function () {
    const usuario = pegarUsuario();
    abrirDialogo('Configurações',
      '<label style="margin-top: 0">Nome</label><input type="text" id="cfgNome" value="' + limpar(usuario.nome) + '">' +
      '<label>Nova senha (opcional)</label><input type="password" id="cfgSenha" placeholder="Mínimo de 8 caracteres">' +
      '<p class="erro" id="cfgErro"></p>',
      [{ texto: 'Salvar', acao: null }, { texto: 'Cancelar', classe: 'cinza' }]);

    const salvar = document.querySelector('#dialogo .botoes-dialogo button');
    salvar.addEventListener('click', async function () {
      const resposta = await api('/eu', 'PUT', {
        nome: document.querySelector('#cfgNome').value,
        nova_senha: document.querySelector('#cfgSenha').value
      });
      if (!resposta.ok) {
        alert(resposta.dados.erro);
        return;
      }
      localStorage.setItem('usuario', JSON.stringify(resposta.dados.usuario));
      alert(resposta.dados.mensagem);
      window.location.reload();
    });
  });

  carregarSelo();
}
