const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function rodar(comando, argumentos, pasta, entrada) {
  return new Promise((resolve) => {
    const processo = execFile(comando, argumentos, { cwd: pasta, timeout: 5000 }, (erro, saida, erros) => {
      resolve({ erro: erro, saida: saida, erros: erros });
    });
    processo.stdin.on('error', () => {});
    processo.stdin.end(entrada);
  });
}

async function compilarEExecutar(codigo, entrada) {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'codify-'));
  fs.writeFileSync(path.join(pasta, 'main.c'), codigo);

  try {
    const programa = process.platform == 'win32' ? 'main.exe' : 'main';
    const compilacao = await rodar('gcc', ['main.c', '-o', programa], pasta, '');
    if (compilacao.erro && compilacao.erro.code == 'ENOENT') {
      return { falhaServico: true, semGcc: true };
    }
    if (compilacao.erro) {
      const erros = compilacao.erros.replace(/main\.c:(\d+):\d+: /g, 'Linha $1: ');
      return { compilou: false, saida: '', erros: erros };
    }

    const execucao = await rodar(path.join(pasta, programa), [], pasta, entrada || '');
    let erros = execucao.erros;
    if (execucao.erro && execucao.erro.killed) {
      erros = 'O programa demorou demais e foi interrompido.';
    }
    return { compilou: true, saida: execucao.saida, erros: erros };
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
}

function mensagemDeFalha(resultado) {
  if (resultado.semGcc) {
    return 'O compilador gcc não foi encontrado no computador do servidor. Instale o gcc, reinicie o servidor e tente novamente. Seu código foi mantido.';
  }
  return 'Não foi possível realizar a compilação. Seu código foi mantido, tente novamente.';
}

module.exports = compilarEExecutar;
module.exports.mensagemDeFalha = mensagemDeFalha;
