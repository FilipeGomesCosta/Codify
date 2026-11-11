const RAIZ = document.currentScript.src.replace('assets/js/api.js', '');
const SERVIDOR = 'http://localhost:3000';

function limiteNivel(nivel) {
  if (nivel <= 1) return 0;
  return 250 * 2 ** (nivel - 2);
}

function nomeNivel(nivel) {
  const nomes = ['Iniciante', 'Aprendiz', 'Dedicado', 'Focado', 'Expert', 'Mestre'];
  return nomes[Math.min(nivel, 6) - 1];
}

function pegarUsuario() {
  return JSON.parse(localStorage.getItem('usuario'));
}

function paginaInicial(usuario) {
  if (usuario.tipo == 'aluno') {
    return RAIZ + 'aluno/missoes.html';
  }
  return RAIZ + 'professor/salas.html';
}

async function api(url, metodo, dados) {
  const opcoes = { method: metodo || 'GET', headers: { token: localStorage.getItem('token') || '' } };

  if (dados instanceof FormData) {
    opcoes.body = dados;
  } else if (dados) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(dados);
  }

  let resposta;
  try {
    resposta = await fetch(SERVIDOR + '/api' + url, opcoes);
  } catch (erro) {
    return {
      ok: false,
      offline: true,
      dados: { erro: 'Sem conexão com a Internet. Não foi possível concluir a operação, verifique sua conexão e tente novamente.' }
    };
  }

  const corpo = await resposta.json().catch(() => ({}));
  if (resposta.status == 401 && url != '/login') {
    sair();
  }
  return { ok: resposta.ok, dados: corpo };
}

function sair() {
  localStorage.clear();
  window.location.href = RAIZ + 'login.html';
}

function limpar(texto) {
  const div = document.createElement('div');
  div.textContent = texto || '';
  return div.innerHTML;
}

function formatarData(texto) {
  return new Date(texto).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatarTamanho(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  }
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + 'Kb';
  }
  return (bytes / 1024 / 1024).toFixed(1) + 'Mb';
}

function arquivoValido(arquivo) {
  const permitidos = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'png', 'jpg', 'c', 'h', 'zip', 'txt'];
  const extensao = arquivo.name.split('.').pop().toLowerCase();

  if (!permitidos.includes(extensao)) {
    alert('Esse arquivo não pode ser anexado. Tipos aceitos: ' + permitidos.join(', '));
    return false;
  }
  if (arquivo.size > 50 * 1024 * 1024) {
    alert('O arquivo é muito grande (máximo de 50 MB).');
    return false;
  }
  return true;
}

async function baixarArquivo(url, nome, visualizar) {
  let resposta;
  try {
    resposta = await fetch(SERVIDOR + '/api' + url, { headers: { token: localStorage.getItem('token') } });
  } catch (erro) {
    alert('Sem conexão com a Internet. Não foi possível acessar o arquivo.');
    return;
  }

  if (!resposta.ok) {
    alert('Não foi possível acessar ou baixar o arquivo. Tente novamente.');
    return;
  }

  const endereco = URL.createObjectURL(await resposta.blob());
  if (visualizar) {
    window.open(endereco);
    return;
  }
  const link = document.createElement('a');
  link.href = endereco;
  link.download = nome;
  link.click();
}

function abrirDialogo(titulo, corpo, botoes, estilo) {
  let janela = document.querySelector('#dialogo');
  if (!janela) {
    janela = document.createElement('dialog');
    janela.id = 'dialogo';
    document.body.appendChild(janela);
  }

  janela.className = estilo || '';
  janela.innerHTML = '<h3>' + titulo + '</h3><div>' + corpo + '</div><div class="botoes-dialogo"></div>';
  for (const botao of botoes) {
    const elemento = document.createElement('button');
    elemento.textContent = botao.texto;
    elemento.className = botao.classe || '';
    elemento.addEventListener('click', function () {
      janela.close();
      if (botao.acao) {
        botao.acao();
      }
    });
    janela.querySelector('.botoes-dialogo').appendChild(elemento);
  }
  janela.showModal();
}

function ativarTab(campo) {
  campo.addEventListener('keydown', function (evento) {
    if (evento.key == 'Tab') {
      evento.preventDefault();
      campo.setRangeText('    ', campo.selectionStart, campo.selectionEnd, 'end');
    }
  });
}

function realcarC(codigo) {
  const texto = limpar(codigo);
  const padrao = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|(#\s*\w+)|(&lt;[\w.\/]+&gt;)|\b(int|char|float|double|void|return|if|else|for|while|do|break|continue|struct|long|short|unsigned|const|switch|case|default|sizeof)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)(?=\()/g;
  const classes = ['', 'cod-comentario', 'cod-texto', 'cod-azul', 'cod-texto', 'cod-azul', 'cod-texto', 'cod-funcao'];

  return texto.replace(padrao, function () {
    for (let i = 1; i <= 7; i++) {
      if (arguments[i] !== undefined) {
        return '<span class="' + classes[i] + '">' + arguments[i] + '</span>';
      }
    }
  }) + ' \n';
}

function criarEditor(campo) {
  const caixa = document.createElement('div');
  caixa.className = 'editor';
  const numeros = document.createElement('div');
  numeros.className = 'numeros';
  const area = document.createElement('div');
  area.className = 'codigo-area';
  const realce = document.createElement('pre');
  realce.className = 'realce';

  campo.parentNode.insertBefore(caixa, campo);
  caixa.appendChild(numeros);
  caixa.appendChild(area);
  area.appendChild(realce);
  area.appendChild(campo);

  function atualizar() {
    const total = Math.max(campo.value.split('\n').length, 12);
    let texto = '';
    for (let i = 1; i <= total; i++) {
      texto += i + '\n';
    }
    numeros.textContent = texto;
    realce.innerHTML = realcarC(campo.value);
    sincronizar();
  }

  function sincronizar() {
    numeros.scrollTop = campo.scrollTop;
    realce.scrollTop = campo.scrollTop;
    realce.scrollLeft = campo.scrollLeft;
  }

  campo.addEventListener('input', atualizar);
  campo.addEventListener('scroll', sincronizar);
  ativarTab(campo);
  atualizar();
  return atualizar;
}

function imagemSala(sala) {
  if (sala.imagem == 'personalizada' && sala.imagem_arquivo) {
    return '<img src="' + SERVIDOR + '/api/salas/' + sala.id_sala + '/imagem" alt="">';
  }
  return arte(sala.imagem);
}

async function atualizarProgresso() {
  const resposta = await api('/eu');
  if (!resposta.ok) return;

  const aluno = resposta.dados;
  const inicio = limiteNivel(aluno.nivel);
  const fim = limiteNivel(aluno.nivel + 1);
  const porcento = (aluno.pontuacao_xp - inicio) / (fim - inicio) * 100;

  document.querySelector('#progresso').innerHTML =
    '<b>SEU PROGRESSO</b>' +
    '<div class="linha-xp">' + icone('xp', 34) + '<span>' + aluno.pontuacao_xp.toLocaleString('pt-BR') + ' / ' + fim + '</span></div>' +
    '<div class="barra"><div style="width: ' + porcento + '%"></div></div>' +
    '<small>Nível ' + aluno.nivel + '</small>' +
    '<div class="linha-moedas">' + icone('moeda', 38) + '<span><b>MOEDAS</b>' + aluno.moedas.toLocaleString('pt-BR') + '</span></div>';
  document.querySelector('#nivel').textContent = 'Nível ' + aluno.nivel;
}

function criarPaginas(caixa, total, atual, aoMudar) {
  caixa.innerHTML = '';
  if (total < 2) {
    return;
  }

  function botao(conteudo, pagina, ativa) {
    const b = document.createElement('button');
    b.innerHTML = conteudo;
    if (ativa) {
      b.className = 'ativa';
    }
    b.addEventListener('click', function () {
      aoMudar(Math.min(Math.max(pagina, 1), total));
    });
    caixa.appendChild(b);
  }

  botao(icone('esquerda', 18), atual - 1, false);
  for (let i = 1; i <= total; i++) {
    botao(i, i, i == atual);
  }
  botao(icone('direita', 18), atual + 1, false);
}

async function iniciarPagina(tipo) {
  const usuario = pegarUsuario();
  if (!usuario) {
    window.location.href = RAIZ + 'login.html';
    return null;
  }
  if (usuario.tipo != tipo) {
    window.location.href = paginaInicial(usuario);
    return null;
  }

  document.querySelector('#topo').innerHTML =
    '<a href="' + RAIZ + 'index.html"><img src="' + RAIZ + 'assets/img/logo.png"></a>' +
    '<div class="direita-topo"><div class="ferramentas-topo">' +
    '<button id="btnConfig" title="Configurações">' + icone('engrenagem', 26) + '</button>' +
    '<button id="btnBusca" title="Buscar">' + icone('lupa', 26) + '</button>' +
    '<button id="btnSino" title="Notificações">' + icone('sino', 26) + '<span class="selo-sino" id="seloSino" hidden></span></button></div>' +
    '<div class="usuario" id="usuario"><div class="avatar">' + icone('usuario', 26) + '</div>' +
    '<div class="nome-usuario">' + limpar(usuario.nome) + '<small id="nivel">' + (tipo == 'aluno' ? 'Nível ' + usuario.nivel : 'Professor') + '</small></div>' +
    icone('baixo', 18) + '<div class="menu-usuario" id="menuUsuario"><a href="#" id="sair">' + icone('sair', 18) + ' Sair</a></div></div></div>';
  document.querySelector('#usuario').addEventListener('click', function () {
    document.querySelector('#menuUsuario').classList.toggle('aberto');
  });
  document.querySelector('#sair').addEventListener('click', function (evento) {
    evento.preventDefault();
    sair();
  });

  if (typeof ferramentasTopo == 'function') {
    ferramentasTopo(tipo);
  }

  let links;
  if (tipo == 'aluno') {
    links = [
      ['bandeira', 'Trilha de Missões', 'aluno/missoes.html'],
      ['monitor', 'Sala de Aula', 'aluno/salas.html'],
      ['livro', 'Material de Apoio', 'aluno/materiais.html'],
      ['mochila', 'Inventário', 'aluno/inventario.html'],
      ['carrinho', 'Loja', 'aluno/loja.html'],
      ['trofeu', 'Conquistas', 'aluno/conquistas.html'],
      ['janela', 'Compilador', 'aluno/compilador.html']
    ];
  } else {
    links = [
      ['monitor', 'Sala de Aula', 'professor/salas.html'],
      ['livro', 'Material de Apoio', 'professor/material-novo.html']
    ];
  }

  let html = '';
  for (const link of links) {
    html += '<a href="' + RAIZ + link[2] + '">' + icone(link[0], 22) + '<span>' + link[1] + '</span></a>';
  }
  if (tipo == 'aluno') {
    html += '<div id="progresso"></div>';
  }
  document.querySelector('#menu').innerHTML = html;

  const agrupar = { missao: 'missoes', sala: 'salas', atividade: 'salas', entregas: 'salas', 'atividade-nova': 'salas' };
  const pagina = window.location.pathname.split('/').pop().replace('.html', '');
  const alvo = '/' + tipo + '/' + (agrupar[pagina] || pagina) + '.html';
  for (const a of document.querySelectorAll('#menu a')) {
    if (a.href.endsWith(alvo)) {
      a.classList.add('ativo');
    }
  }

  if (tipo == 'aluno') {
    atualizarProgresso();
  }
  return usuario;
}

async function compilarCodigo(codigo, entrada, saida, status) {
  saida.textContent = 'Compilando...';
  const resposta = await api('/compilar', 'POST', { codigo: codigo, entrada: entrada });

  if (!resposta.ok) {
    saida.textContent = resposta.dados.erro;
    if (status) {
      status.className = 'status falha';
      status.textContent = 'Não foi possível compilar';
    }
    return null;
  }

  const resultado = resposta.dados;
  if (status) {
    status.className = resultado.compilou ? 'status ok' : 'status falha';
    status.innerHTML = resultado.compilou ? icone('check', 16) + ' Compilação bem-sucedida' : icone('aviso', 16) + ' Erros de compilação';
  }
  if (!resultado.compilou) {
    saida.textContent = 'Erros de compilação:\n' + resultado.erros;
  } else {
    saida.textContent = resultado.saida + resultado.erros;
    if (saida.textContent == '') {
      saida.textContent = '(o programa não exibiu nada)';
    }
  }
  return resultado;
}

function ligarFerramentasEditor(campo) {
  document.querySelector('#copiar').addEventListener('click', function () {
    navigator.clipboard.writeText(campo.value);
    alert('Código copiado!');
  });
  document.querySelector('#tema').addEventListener('click', function () {
    campo.parentNode.classList.toggle('claro');
  });
  document.querySelector('#tela').addEventListener('click', function () {
    campo.parentNode.classList.toggle('cheio');
  });
}

function formatarTexto(texto) {
  const linhas = limpar(texto || '').split('\n');
  let html = '';
  let lista = '';

  function fechar() {
    if (lista != '') {
      html += '</' + lista + '>';
      lista = '';
    }
  }

  for (let linha of linhas) {
    linha = linha.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    linha = linha.replace(/__(.+?)__/g, '<u>$1</u>');
    linha = linha.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    if (linha.startsWith('- ') || linha.startsWith('1. ')) {
      const tipo = linha.startsWith('- ') ? 'ul' : 'ol';
      if (lista != tipo) {
        fechar();
        html += '<' + tipo + '>';
        lista = tipo;
      }
      html += '<li>' + linha.replace(/^(- |1\. )/, '') + '</li>';
    } else {
      fechar();
      html += linha == '' ? '<br>' : '<p>' + linha + '</p>';
    }
  }
  fechar();
  return html;
}

function ligarBarraTexto(campo) {
  const marcas = { negrito: ['**', '**'], sublinhado: ['__', '__'], lista: ['\n- ', ''], ordenada: ['\n1. ', ''], link: ['[', '](https://)'] };

  for (const botao of document.querySelectorAll('[data-formato]')) {
    botao.addEventListener('click', function () {
      const marca = marcas[botao.dataset.formato];
      const selecionado = campo.value.substring(campo.selectionStart, campo.selectionEnd);
      campo.setRangeText(marca[0] + selecionado + marca[1], campo.selectionStart, campo.selectionEnd, 'end');
      campo.focus();
      campo.dispatchEvent(new Event('input'));
    });
  }
}

function ligarContador(campo, contador, maximo) {
  function atualizar() {
    contador.textContent = campo.value.length + '/' + maximo;
  }
  campo.addEventListener('input', atualizar);
  atualizar();
}

function ligarDropzone(zona, campoArquivo) {
  const nome = zona.querySelector('.nome-arquivo');

  function mostrar() {
    nome.textContent = campoArquivo.files.length > 0 ? campoArquivo.files[0].name : '';
  }

  zona.querySelector('button').addEventListener('click', function () {
    campoArquivo.click();
  });
  campoArquivo.addEventListener('change', function () {
    if (campoArquivo.files.length > 0 && !arquivoValido(campoArquivo.files[0])) {
      campoArquivo.value = '';
    }
    mostrar();
  });
  zona.addEventListener('dragover', function (evento) {
    evento.preventDefault();
    zona.classList.add('sobre');
  });
  zona.addEventListener('dragleave', function () {
    zona.classList.remove('sobre');
  });
  zona.addEventListener('drop', function (evento) {
    evento.preventDefault();
    zona.classList.remove('sobre');
    campoArquivo.files = evento.dataTransfer.files;
    campoArquivo.dispatchEvent(new Event('change'));
  });
}
