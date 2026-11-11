const editor = document.querySelector('#editor');
const saida = document.querySelector('#saida');
const salvos = document.querySelector('#salvos');
const status = document.querySelector('#status');

const exemplos = [
  { nome: 'Ler e exibir número', entrada: '10', codigo: '#include <stdio.h>\n\nint main() {\n    int numero;\n    printf("Digite um numero: ");\n    scanf("%d", &numero);\n\n    printf("\\nVoce digitou: %d", numero);\n    return 0;\n}' },
  { nome: 'Soma de dois números', entrada: '3 4', codigo: '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("Soma: %d", a + b);\n    return 0;\n}' },
  { nome: 'Média de três números', entrada: '6 8 10', codigo: '#include <stdio.h>\n\nint main() {\n    int a, b, c;\n    scanf("%d %d %d", &a, &b, &c);\n    printf("Media: %d", (a + b + c) / 3);\n    return 0;\n}' },
  { nome: 'Verificar par ou ímpar', entrada: '7', codigo: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    if (n % 2 == 0) {\n        printf("par");\n    } else {\n        printf("impar");\n    }\n    return 0;\n}' },
  { nome: 'Tabuada de um número', entrada: '3', codigo: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for (int i = 1; i <= 10; i++) {\n        printf("%d x %d = %d\\n", n, i, n * i);\n    }\n    return 0;\n}' }
];

let statusAtual = 'rascunho';
let missoes = [];

const atualizarNumeros = criarEditor(editor);
ligarFerramentasEditor(editor);

function mostrarDesafio() {
  const categoria = document.querySelector('#dificuldade').value;
  const daCategoria = missoes.filter(function (m) {
    return m.nivel_dificuldade == categoria && m.situacao != 'bloqueada';
  });
  const atual = daCategoria.find((m) => m.situacao == 'em_andamento') ||
    daCategoria.find((m) => m.situacao == 'disponivel') || daCategoria[0];

  if (!atual) {
    document.querySelector('#nomeMissao').textContent = 'Nenhum desafio disponível';
    document.querySelector('#descricao').textContent = 'Conclua as missões anteriores na Trilha de Missões para liberar desafios.';
    document.querySelector('#descEntrada').textContent = '-';
    document.querySelector('#descSaida').textContent = '-';
    document.querySelector('#recompensa').textContent = '';
    return;
  }

  document.querySelector('#nomeMissao').textContent = atual.titulo;
  document.querySelector('#descricao').textContent = atual.descricao;
  document.querySelector('#descEntrada').textContent = atual.descricao_entrada;
  document.querySelector('#descSaida').textContent = atual.descricao_saida;
  document.querySelector('#recompensa').textContent = atual.recompensa_xp + ' XP';
}

async function carregarDesafio() {
  const resposta = await api('/missoes');
  if (!resposta.ok) {
    return;
  }
  missoes = resposta.dados.missoes;

  const emAndamento = missoes.find((m) => m.situacao == 'em_andamento');
  if (emAndamento) {
    document.querySelector('#dificuldade').value = emAndamento.nivel_dificuldade;
  }
  mostrarDesafio();
}

function mostrarExemplos() {
  const caixa = document.querySelector('#exemplos');
  exemplos.forEach(function (exemplo, i) {
    const botao = document.createElement('button');
    botao.className = 'exemplo';
    botao.innerHTML = '<span>0' + (i + 1) + '. ' + exemplo.nome + '</span>' + icone('codigo', 18);
    botao.addEventListener('click', function () {
      for (const outro of caixa.children) {
        outro.classList.remove('ativo');
      }
      botao.classList.add('ativo');
      editor.value = exemplo.codigo;
      document.querySelector('#entrada').value = exemplo.entrada;
      atualizarNumeros();
    });
    caixa.appendChild(botao);
  });
}

async function carregarSalvos() {
  const resposta = await api('/codigos');
  salvos.innerHTML = '';

  if (!resposta.ok) {
    salvos.textContent = resposta.dados.erro;
    return;
  }
  if (resposta.dados.length == 0) {
    salvos.textContent = 'Nenhum código salvo ainda.';
    return;
  }

  for (const codigo of resposta.dados) {
    const botao = document.createElement('button');
    botao.className = 'cinza';
    botao.style.margin = '0 8px 8px 0';
    botao.textContent = formatarData(codigo.data_salvo) + ' (' + codigo.status + ')';
    botao.addEventListener('click', function () {
      editor.value = codigo.conteudo;
      atualizarNumeros();
    });
    salvos.appendChild(botao);
  }
}

document.querySelector('#compilar').addEventListener('click', async function () {
  const resultado = await compilarCodigo(editor.value, document.querySelector('#entrada').value, saida, status);
  if (resultado) {
    statusAtual = resultado.compilou ? 'compilado' : 'erro';
  }
});

document.querySelector('#salvar').addEventListener('click', async function () {
  const resposta = await api('/codigos', 'POST', { conteudo: editor.value, status: statusAtual });
  if (!resposta.ok) {
    alert(resposta.dados.erro);
    return;
  }
  alert(resposta.dados.mensagem);
  carregarSalvos();
});

document.querySelector('#limpar').addEventListener('click', function () {
  saida.textContent = '';
  status.textContent = '';
});

document.querySelector('#dificuldade').addEventListener('change', mostrarDesafio);

editor.value = exemplos[0].codigo;
document.querySelector('#entrada').value = exemplos[0].entrada;
atualizarNumeros();
iniciarPagina('aluno');
mostrarExemplos();
carregarSalvos();
carregarDesafio();
