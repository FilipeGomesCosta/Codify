const lista = document.querySelector('#lista');
const campoSala = document.querySelector('#sala');
const POR_PAGINA = 5;

let materiais = [];
let pagina = 1;

function extensao(m) {
  if (!m.arquivo_nome) return '';
  return m.arquivo_nome.split('.').pop().toLowerCase();
}

function aparencia(m) {
  const ext = extensao(m);
  if (m.tipo == 'link') return { classe: 'tipo-link', icone: 'link', rotulo: 'LINK' };
  if (m.tipo == 'video') return { classe: 'tipo-video', icone: 'video', rotulo: 'VÍDEO' };
  if (m.tipo == 'imagem') return { classe: 'tipo-imagem', icone: 'imagem', rotulo: ext.toUpperCase() };
  if (ext == 'pdf') return { classe: 'tipo-pdf', icone: 'arquivo', rotulo: 'PDF' };
  if (ext == 'doc' || ext == 'docx') return { classe: 'tipo-doc', icone: 'arquivo', rotulo: 'DOC' };
  if (ext == 'ppt' || ext == 'pptx') return { classe: 'tipo-slides', icone: 'quadro', rotulo: 'PPT' };
  if (ext == 'c' || ext == 'h' || ext == 'txt') return { classe: 'tipo-codigo', icone: 'codigo', rotulo: ext.toUpperCase() };
  return { classe: 'tipo-outro', icone: 'arquivo', rotulo: ext.toUpperCase() || 'ARQUIVO' };
}

function dataRelativa(texto) {
  const dias = Math.floor((new Date() - new Date(texto)) / 86400000);
  if (dias <= 0) return 'Hoje';
  if (dias == 1) return 'Ontem';
  return new Date(texto).toLocaleDateString('pt-BR');
}

function abrir(m, visualizar) {
  if (m.link) {
    window.open(m.link);
    return;
  }
  baixarArquivo('/materiais/' + m.id_material + '/arquivo' + (visualizar ? '?inline=1' : ''), m.arquivo_nome, visualizar);
}

function mostrar() {
  lista.innerHTML = '';
  const totalPaginas = Math.max(1, Math.ceil(materiais.length / POR_PAGINA));
  if (pagina > totalPaginas) {
    pagina = 1;
  }

  if (materiais.length == 0) {
    lista.innerHTML = '<div class="vazio">Nenhum material foi encontrado. Altere os termos da pesquisa ou remova os filtros.<br><br>' +
      '<button id="limparFiltros">Remover filtros</button></div>';
    document.querySelector('#limparFiltros').addEventListener('click', function () {
      document.querySelector('#busca').value = '';
      document.querySelector('#tipo').value = '';
      campoSala.value = '';
      document.querySelector('#ordem').value = 'recentes';
      carregar();
    });
  }

  for (const m of materiais.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)) {
    const visual = aparencia(m);
    const detalhe = m.link ? 'Link externo' : formatarTamanho(m.tamanho);

    const linha = document.createElement('div');
    linha.className = 'material';
    linha.innerHTML =
      '<div class="tile ' + visual.classe + '">' + icone(visual.icone, 30) + '<span>' + visual.rotulo + '</span></div>' +
      '<div class="dados"><h3>' + limpar(m.titulo) + '</h3><p>' + limpar(m.descricao) + '</p>' +
      '<div class="meta"><span>' + visual.rotulo + '</span><i></i><span>' + detalhe + '</span><i></i><span>' + limpar(m.sala) + '</span>' +
      (m.destaque ? '<span class="destaque-selo">Destaque</span>' : '') + '</div></div>' +
      '<div class="data">' + dataRelativa(m.data_envio) + '</div>';

    const acao = document.createElement('button');
    acao.className = 'acao-icone ' + visual.classe;
    if (m.link || m.tipo == 'video') {
      acao.innerHTML = icone(m.link ? 'link' : 'play', 24);
      acao.title = 'Abrir';
      acao.addEventListener('click', function () {
        abrir(m, true);
      });
    } else if (m.permitir_download) {
      acao.innerHTML = icone('baixar', 24);
      acao.title = 'Baixar';
      acao.addEventListener('click', function () {
        abrir(m, false);
      });
    } else {
      acao.innerHTML = icone('olho', 24);
      acao.title = 'Visualizar';
      acao.addEventListener('click', function () {
        abrir(m, true);
      });
    }

    linha.querySelector('.dados h3').style.cursor = 'pointer';
    linha.querySelector('.dados h3').addEventListener('click', function () {
      abrir(m, true);
    });
    linha.appendChild(acao);
    lista.appendChild(linha);
  }

  criarPaginas(document.querySelector('#paginas'), totalPaginas, pagina, function (nova) {
    pagina = nova;
    mostrar();
  });
}

async function carregarSalas() {
  const resposta = await api('/salas');
  if (!resposta.ok) return;

  for (const sala of resposta.dados) {
    if (sala.situacao != 'ativo') continue;
    const opcao = document.createElement('option');
    opcao.value = sala.id_sala;
    opcao.textContent = sala.nome;
    campoSala.appendChild(opcao);
  }
}

async function carregar() {
  const parametros = new URLSearchParams({
    busca: document.querySelector('#busca').value,
    tipo: document.querySelector('#tipo').value,
    sala: campoSala.value,
    ordem: document.querySelector('#ordem').value
  });

  const resposta = await api('/materiais?' + parametros);
  if (!resposta.ok) {
    lista.textContent = resposta.dados.erro;
    return;
  }
  materiais = resposta.dados;
  pagina = 1;
  mostrar();
}

function trocarVisao(grade) {
  lista.classList.toggle('grade', grade);
  document.querySelector('#vGrade').classList.toggle('ativa', grade);
  document.querySelector('#vLista').classList.toggle('ativa', !grade);
}

document.querySelector('#vLista').addEventListener('click', function () {
  trocarVisao(false);
});
document.querySelector('#vGrade').addEventListener('click', function () {
  trocarVisao(true);
});
document.querySelector('#busca').addEventListener('input', carregar);
document.querySelector('#tipo').addEventListener('change', carregar);
campoSala.addEventListener('change', carregar);
document.querySelector('#ordem').addEventListener('change', carregar);

iniciarPagina('aluno');
carregarSalas();
carregar();
