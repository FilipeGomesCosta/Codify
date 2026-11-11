const trilha = document.querySelector('#trilha');
const resumo = document.querySelector('#resumo');
const POR_PAGINA = 4;

let missoes = [];
let aluno = null;
let pagina = 1;
let xpSemana = 0;

const nomesSituacao = { concluida: 'CONCLUÍDA', em_andamento: 'EM ANDAMENTO', disponivel: 'DISPONÍVEL', bloqueada: 'BLOQUEADA' };
const iconesSituacao = { concluida: 'check', em_andamento: 'foguete', disponivel: 'play', bloqueada: 'cadeado' };
const textosBotao = { concluida: 'Revisar', em_andamento: 'Continuar missão', disponivel: 'Iniciar', bloqueada: 'Abrir' };

function mostrarMissoes() {
  const busca = document.querySelector('#busca').value.toLowerCase();
  const categoria = document.querySelector('#categoria').value;
  const ordem = document.querySelector('#ordem').value;

  const visiveis = missoes.filter(function (m) {
    return (categoria == '' || m.nivel_dificuldade == categoria) && m.titulo.toLowerCase().includes(busca);
  });
  if (ordem == 'maior') visiveis.sort((a, b) => b.recompensa_xp - a.recompensa_xp);
  if (ordem == 'menor') visiveis.sort((a, b) => a.recompensa_xp - b.recompensa_xp);

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  if (pagina > totalPaginas) {
    pagina = 1;
  }

  trilha.innerHTML = '';
  for (const missao of visiveis.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)) {
    const item = document.createElement('div');
    item.className = 'missao ' + missao.situacao;
    item.innerHTML =
      '<div class="bolinha">' + icone(iconesSituacao[missao.situacao], 40) + '</div>' +
      '<span class="status">' + nomesSituacao[missao.situacao] + '</span>' +
      '<div class="caixa"><small>' + String(missao.id_missao).padStart(2, '0') + '</small>' +
      '<b>' + limpar(missao.titulo) + '</b>' +
      '<span class="xp">XP ' + missao.recompensa_xp + '</span></div>';

    const caixa = item.querySelector('.caixa');
    if (missao.situacao == 'concluida') {
      caixa.innerHTML += '<div class="selo-check"><span></span>' + icone('check', 14) + '<span></span></div>';
    }
    if (missao.situacao == 'bloqueada') {
      caixa.innerHTML += '<span class="requisito">' + icone('cadeado', 14) + ' Conclua a missão ' + String(missao.id_missao - 1).padStart(2, '0') + ' para desbloquear</span>';
      item.addEventListener('click', function () {
        abrirMissao(missao.id_missao);
      });
    } else if (missao.situacao == 'concluida') {
      item.addEventListener('click', function () {
        abrirMissao(missao.id_missao);
      });
    } else {
      const botao = document.createElement('button');
      botao.textContent = textosBotao[missao.situacao];
      botao.addEventListener('click', function () {
        abrirMissao(missao.id_missao);
      });
      caixa.appendChild(botao);
    }
    trilha.appendChild(item);
  }

  if (visiveis.length == 0) {
    trilha.textContent = 'Nenhuma missão encontrada.';
  }
  criarPaginas(document.querySelector('#paginas'), totalPaginas, pagina, function (nova) {
    pagina = nova;
    mostrarMissoes();
  });
}

async function abrirMissao(id) {
  const resposta = await api('/missoes/' + id + '/iniciar', 'POST');
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    return;
  }
  window.location.href = 'missao.html?id=' + id;
}

function mostrarResumo(concluidas) {
  const dias = aluno.sequencia;
  const inicio = limiteNivel(aluno.nivel);
  const fim = limiteNivel(aluno.nivel + 1);
  const porcentoNivel = (aluno.pontuacao_xp - inicio) / (fim - inicio) * 100;
  const porcento = Math.round(concluidas / missoes.length * 100);

  resumo.innerHTML =
    '<div class="cartao">' + icone('check', 34) + '<div>Missões concluídas<br><b>' + concluidas + '</b> / ' + missoes.length +
    '<div class="barra"><div style="width: ' + porcento + '%"></div></div><small>' + porcento + '%</small></div></div>' +
    '<div class="cartao">' + icone('estrela', 34) + '<div>XP acumulado<br><b>' + aluno.pontuacao_xp.toLocaleString('pt-BR') + '</b> XP' +
    '<small class="destaque-claro">+' + xpSemana + ' XP essa semana</small></div></div>' +
    '<div class="cartao">' + icone('escudo', 34) + '<div>Nível atual<br><b class="destaque">' + nomeNivel(aluno.nivel) + '</b>' +
    '<div class="barra"><div style="width: ' + porcentoNivel + '%"></div></div><small>' + aluno.pontuacao_xp.toLocaleString('pt-BR') + ' / ' + fim.toLocaleString('pt-BR') + ' XP</small></div></div>' +
    '<div class="cartao">' + icone('chama', 34) + '<div>Sequência atual<br><b>' + dias + (dias == 1 ? ' dia' : ' dias') + '</b>' +
    '<small class="destaque-claro">Continue assim!</small></div></div>';
}

async function carregar() {
  const resposta = await api('/missoes');
  if (!resposta.ok) {
    trilha.textContent = resposta.dados.erro;
    return;
  }

  missoes = resposta.dados.missoes;
  aluno = resposta.dados.aluno;
  xpSemana = resposta.dados.xp_semana;
  mostrarResumo(resposta.dados.concluidas);

  const atual = missoes.findIndex((m) => m.situacao == 'em_andamento');
  if (atual >= 0) {
    pagina = Math.floor(atual / POR_PAGINA) + 1;
  }
  mostrarMissoes();
}

function trocarVisao(lista) {
  trilha.classList.toggle('lista', lista);
  document.querySelector('#vGrade').classList.toggle('ativa', !lista);
  document.querySelector('#vLista').classList.toggle('ativa', lista);
}

document.querySelector('#vGrade').addEventListener('click', function () {
  trocarVisao(false);
});
document.querySelector('#vLista').addEventListener('click', function () {
  trocarVisao(true);
});
document.querySelector('#busca').addEventListener('input', mostrarMissoes);
document.querySelector('#categoria').addEventListener('change', mostrarMissoes);
document.querySelector('#ordem').addEventListener('change', mostrarMissoes);

iniciarPagina('aluno');
carregar();
