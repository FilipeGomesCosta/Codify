/* =========================================================
   Codify – Ligação do front-end com a API
   Funções compartilhadas por todas as telas:
   token de login, chamadas à API, cabeçalho, downloads,
   avisos, contadores de caracteres e área de upload.
   ========================================================= */
(function () {
  'use strict';

  // Endereço da API:
  //  - front aberto pelo próprio backend (http://localhost:3000) → mesma origem
  //  - front aberto pelo Live Server ou direto do disco → http://localhost:3000
  //  - window.CODIFY_API permite trocar (defina antes de carregar este arquivo)
  var API = window.CODIFY_API
    || (location.protocol !== 'file:' && location.port === '3000' ? '/api' : 'http://localhost:3000/api');

  // Pastas: as telas logadas ficam em /aluno e /professor
  var RAIZ = /\/(aluno|professor)\//.test(location.pathname) ? '../' : '';

  var CHAVE_TOKEN = 'codify_token';
  var CHAVE_USUARIO = 'codify_usuario';

  function ler(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }
  function gravar(chave, valor) {
    try {
      if (valor === null) localStorage.removeItem(chave);
      else localStorage.setItem(chave, valor);
    } catch (e) { /* navegador sem armazenamento: segue sem salvar */ }
  }

  var sessao = {
    token: function () { return ler(CHAVE_TOKEN); },
    usuario: function () {
      try { return JSON.parse(ler(CHAVE_USUARIO)); } catch (e) { return null; }
    },
    salvar: function (token, usuario) {
      gravar(CHAVE_TOKEN, token);
      gravar(CHAVE_USUARIO, JSON.stringify(usuario));
    },
    limpar: function () {
      gravar(CHAVE_TOKEN, null);
      gravar(CHAVE_USUARIO, null);
    },
  };

  /** Página inicial de cada tipo de usuário. */
  function inicioDo(tipo) {
    return RAIZ + (tipo === 'professor' ? 'professor/turmas.html' : 'aluno/salas.html');
  }

  function irParaLogin() {
    sessao.limpar();
    location.href = RAIZ + 'login.html';
  }

  /**
   * Chama a API e devolve o JSON da resposta.
   *   api('/salas')                                → GET
   *   api('/salas', { method: 'POST', body: {...} }) → JSON
   *   api('/x', { method: 'POST', body: formData })  → multipart (upload)
   * Em caso de erro lança Error com a mensagem do servidor.
   */
  async function api(caminho, opcoes) {
    opcoes = opcoes || {};
    var headers = {};
    var token = sessao.token();
    if (token) headers.Authorization = 'Bearer ' + token;

    var body = opcoes.body;
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    var resposta;
    try {
      resposta = await fetch(API + caminho, { method: opcoes.method || 'GET', headers: headers, body: body });
    } catch (e) {
      throw new Error('Não foi possível falar com o servidor. Ele está ligado (npm start na pasta backend)?');
    }

    if (resposta.status === 401 && token) {
      irParaLogin();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    if (resposta.status === 204) return null;

    var dados = null;
    var tipo = resposta.headers.get('Content-Type') || '';
    if (tipo.indexOf('application/json') !== -1) dados = await resposta.json();
    if (!resposta.ok) {
      throw new Error((dados && dados.erro) || 'Erro ' + resposta.status + ' ao falar com o servidor.');
    }
    return dados;
  }

  /**
   * Baixa (ou abre em outra aba) um arquivo protegido por login.
   * Links <a href> não mandam o token, então buscamos o arquivo e criamos um link temporário.
   */
  async function baixar(caminho, abrir) {
    var aba = abrir ? window.open('', '_blank') : null;
    try {
      var resposta = await fetch(API + caminho + (abrir ? (caminho.indexOf('?') === -1 ? '?' : '&') + 'baixar=0' : ''), {
        headers: { Authorization: 'Bearer ' + sessao.token() },
      });
      if (!resposta.ok) {
        var erro = await resposta.json().catch(function () { return {}; });
        throw new Error(erro.erro || 'Não foi possível baixar o arquivo.');
      }
      var disposicao = resposta.headers.get('Content-Disposition') || '';
      var nome = nomeDoCabecalho(disposicao) || 'arquivo';
      var url = URL.createObjectURL(await resposta.blob());
      // o servidor responde "inline" quando o professor não permitiu download
      if (aba || /^inline/i.test(disposicao)) {
        if (aba) aba.location.href = url; else window.open(url, '_blank');
      } else {
        var a = document.createElement('a');
        a.href = url;
        a.download = nome;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    } catch (e) {
      if (aba) aba.close();
      aviso(e.message, 'erro');
    }
  }

  function nomeDoCabecalho(disposicao) {
    var utf = disposicao.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf) return decodeURIComponent(utf[1]);
    var simples = disposicao.match(/filename="?([^";]+)"?/i);
    return simples ? simples[1] : null;
  }

  // ---------- Formatação ----------
  var DOIS = function (n) { return String(n).padStart(2, '0'); };

  function data(valor) {
    if (!valor) return '';
    var d = new Date(valor);
    return DOIS(d.getDate()) + '/' + DOIS(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function dataHora(valor) {
    if (!valor) return '';
    var d = new Date(valor);
    return data(valor) + ' às ' + DOIS(d.getHours()) + ':' + DOIS(d.getMinutes());
  }
  /** "Hoje", "Ontem" ou dd/mm/aaaa */
  function dataRelativa(valor) {
    if (!valor) return '';
    var d = new Date(valor);
    var hoje = new Date();
    var dia = function (x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); };
    var diff = Math.round((dia(hoje) - dia(d)) / 86400000);
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff === -1) return 'Amanhã';
    return data(valor);
  }
  /** Valor para <input type="datetime-local"> / date / time */
  function paraInputData(valor) {
    var d = new Date(valor);
    return d.getFullYear() + '-' + DOIS(d.getMonth() + 1) + '-' + DOIS(d.getDate());
  }
  function tamanho(bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1).replace('.', ',') + ' KB';
    return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
  }
  function numero(n) {
    return Number(n || 0).toLocaleString('pt-BR');
  }
  /** Escapa texto antes de colocar em innerHTML (evita injeção de HTML). */
  function esc(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  /**
   * Texto das instruções → HTML seguro. Escapa tudo e depois aplica só a
   * formatação da barra do editor: **negrito**, __sublinhado__ e links http(s).
   */
  function paragrafos(texto) {
    return esc(texto).split(/\n{2,}/).map(function (p) {
      var html = p
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<u>$1</u>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');
      return '<p>' + html + '</p>';
    }).join('');
  }

  var NIVEIS = { iniciante: 'Iniciante', medio: 'Médio', avancado: 'Avançado' };
  var STATUS = {
    pendente: { texto: 'Pendente', classe: 'status-dot--pending' },
    rascunho: { texto: 'Rascunho salvo', classe: 'status-dot--draft' },
    entregue: { texto: 'Entregue', classe: 'status-dot--done' },
    avaliada: { texto: 'Avaliada', classe: 'status-dot--graded' },
    encerrada: { texto: 'Prazo encerrado', classe: 'status-dot--late' },
  };
  function statusHtml(status) {
    var s = STATUS[status] || STATUS.pendente;
    return '<em class="status-dot ' + s.classe + '">' + s.texto + '</em>';
  }

  // ---------- Avisos (toast) ----------
  var caixaAvisos;
  function aviso(mensagem, tipo) {
    if (!caixaAvisos) {
      caixaAvisos = document.createElement('div');
      caixaAvisos.className = 'toasts';
      caixaAvisos.setAttribute('role', 'status');
      caixaAvisos.setAttribute('aria-live', 'polite');
      document.body.appendChild(caixaAvisos);
    }
    var el = document.createElement('div');
    el.className = 'toast toast--' + (tipo || 'ok');
    el.textContent = mensagem;
    caixaAvisos.appendChild(el);
    setTimeout(function () { el.classList.add('toast--saindo'); }, 4200);
    setTimeout(function () { el.remove(); }, 4700);
  }

  /** Desabilita o botão enquanto a ação roda (evita clique duplo). */
  async function carregando(botao, acao) {
    if (botao) botao.disabled = true;
    try { return await acao(); } finally { if (botao) botao.disabled = false; }
  }

  // ---------- Componentes das telas ----------

  /** Contador "0/300" dos textareas. */
  function ligarContadores(raiz) {
    (raiz || document).querySelectorAll('.textarea').forEach(function (caixa) {
      var campo = caixa.querySelector('textarea');
      var contador = caixa.querySelector('.counter');
      if (!campo || !contador) return;
      var max = campo.maxLength > 0 ? campo.maxLength : null;
      var atualizar = function () { contador.textContent = campo.value.length + (max ? '/' + max : ''); };
      campo.addEventListener('input', atualizar);
      atualizar();
    });
  }

  /** Área "Arraste e solte": mostra o arquivo escolhido e aceita arrastar. */
  function ligarDropzones(raiz) {
    (raiz || document).querySelectorAll('.dropzone').forEach(function (zona) {
      var input = zona.querySelector('input[type=file]');
      var dica = zona.querySelector('.dropzone__hint');
      if (!input || !dica) return;
      var original = dica.textContent;
      var mostrar = function () {
        var f = input.files && input.files[0];
        dica.textContent = f ? 'Selecionado: ' + f.name + ' (' + tamanho(f.size) + ')' : original;
        zona.classList.toggle('dropzone--cheia', Boolean(f));
      };
      input.addEventListener('change', mostrar);
      ['dragenter', 'dragover'].forEach(function (ev) {
        zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('dropzone--sobre'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        zona.addEventListener(ev, function () { zona.classList.remove('dropzone--sobre'); });
      });
      zona.addEventListener('drop', function (e) {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
          input.files = e.dataTransfer.files;
          input.dispatchEvent(new Event('change'));
        }
      });
      input.form && input.form.addEventListener('reset', function () { setTimeout(mostrar); });
    });
  }

  /** Preenche nome/tipo no cabeçalho e o cartão "Seu progresso". */
  function preencherCabecalho(usuario) {
    var info = document.querySelector('.user__info');
    if (info) {
      info.querySelector('strong').textContent = usuario.nome.split(' ').slice(0, 2).join(' ');
      info.querySelector('small').textContent = usuario.tipo === 'professor' ? 'Professor' : 'Aluno';
    }

    var cartao = document.querySelector('.progress-card');
    if (cartao) {
      if (!usuario.progresso) {
        cartao.hidden = true; // professor não tem XP
      } else {
        var p = usuario.progresso;
        var faixa = Math.max(1, p.xp_proximo_nivel - p.xp_nivel_atual);
        var pct = Math.min(100, Math.round(((p.pontuacao_xp - p.xp_nivel_atual) / faixa) * 1000) / 10);
        var xp = cartao.querySelector('.progress-card__xp span');
        if (xp) xp.textContent = numero(p.pontuacao_xp) + ' / ' + numero(p.xp_proximo_nivel);
        var barra = cartao.querySelector('.bar');
        if (barra) {
          barra.setAttribute('aria-valuenow', p.pontuacao_xp);
          barra.setAttribute('aria-valuemax', p.xp_proximo_nivel);
          barra.firstElementChild.style.width = pct + '%';
        }
        var nivel = cartao.querySelector('.progress-card__level small');
        if (nivel) nivel.textContent = 'Nível ' + p.nivel;
        var moedas = cartao.querySelector('.progress-card__coins span:last-child');
        if (moedas) moedas.innerHTML = '<strong>MOEDAS</strong>' + numero(p.moedas);
      }
    }

    document.querySelectorAll('.user__sair').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        irParaLogin();
      });
    });
  }

  /**
   * Início de toda tela logada: confere o login e o tipo de usuário,
   * preenche o cabeçalho e devolve o usuário atualizado.
   *   const usuario = await Codify.iniciar('aluno');
   */
  async function iniciar(tipoExigido) {
    ligarContadores();
    ligarDropzones();
    if (!sessao.token()) {
      irParaLogin();
      throw new Error('login necessário');
    }
    var usuario = sessao.usuario();
    if (usuario) preencherCabecalho(usuario); // mostra logo, atualiza depois
    try {
      usuario = await api('/auth/me');
      sessao.salvar(sessao.token(), usuario);
      preencherCabecalho(usuario);
    } catch (e) {
      if (!usuario) throw e;
      aviso(e.message, 'erro');
    }
    if (tipoExigido && usuario.tipo !== tipoExigido) {
      location.href = inicioDo(usuario.tipo);
      throw new Error('tipo de usuário diferente');
    }
    return usuario;
  }

  /** Lê um parâmetro da URL (ex.: atividades.html?id=3). */
  function parametro(nome) {
    return new URLSearchParams(location.search).get(nome);
  }

  window.Codify = {
    API: API,
    RAIZ: RAIZ,
    api: api,
    sessao: sessao,
    iniciar: iniciar,
    inicioDo: inicioDo,
    baixar: baixar,
    aviso: aviso,
    carregando: carregando,
    parametro: parametro,
    ligarContadores: ligarContadores,
    ligarDropzones: ligarDropzones,
    fmt: {
      data: data, dataHora: dataHora, dataRelativa: dataRelativa, paraInputData: paraInputData,
      tamanho: tamanho, numero: numero, esc: esc, paragrafos: paragrafos, statusHtml: statusHtml, NIVEIS: NIVEIS,
    },
  };
})();
