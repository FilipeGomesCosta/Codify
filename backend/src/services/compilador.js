// Compila e executa código C com o gcc do servidor.
//
// ATENÇÃO – SEGURANÇA: executar código de alunos no próprio servidor é
// perigoso (o programa pode ler arquivos, travar a máquina etc.). Por isso
// este recurso vem DESLIGADO (EXECUTAR_CODIGO=false no .env). Ligue só
// para testes locais. Em produção, use um ambiente isolado (container
// Docker sem rede ou um serviço como o Judge0).
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const HttpError = require('../utils/HttpError');

const TEMPO_COMPILACAO = 10000; // ms
const TEMPO_EXECUCAO = 3000; // ms
const SAIDA_MAXIMA = 64 * 1024; // 64 KB

function rodar(comando, args, { cwd, timeout, entrada = '' }) {
  return new Promise((resolve) => {
    const processo = execFile(
      comando,
      args,
      { cwd, timeout, maxBuffer: SAIDA_MAXIMA, killSignal: 'SIGKILL' },
      (erro, stdout, stderr) => {
        resolve({
          ok: !erro,
          erroSistema: erro?.code === 'ENOENT',
          tempoEsgotado: Boolean(erro?.killed),
          codigoSaida: erro ? (typeof erro.code === 'number' ? erro.code : 1) : 0,
          stdout,
          stderr,
        });
      },
    );
    processo.stdin.on('error', () => {}); // programa pode fechar a entrada antes
    processo.stdin.end(entrada);
  });
}

async function compilarEExecutar(codigoFonte, entrada) {
  if (process.env.EXECUTAR_CODIGO !== 'true') {
    throw new HttpError(503, 'A execução de código está desativada no servidor.');
  }

  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'codify-'));
  try {
    await fs.writeFile(path.join(pasta, 'main.c'), codigoFonte);

    const compilacao = await rodar('gcc', ['main.c', '-o', 'main', '-std=c11', '-Wall', '-lm'], {
      cwd: pasta,
      timeout: TEMPO_COMPILACAO,
    });
    if (compilacao.erroSistema) throw new HttpError(500, 'O compilador gcc não está instalado no servidor.');
    if (!compilacao.ok) {
      return { status: 'erro', etapa: 'compilacao', saida: '', erros: compilacao.stderr };
    }

    const execucao = await rodar('./main', [], { cwd: pasta, timeout: TEMPO_EXECUCAO, entrada });
    return {
      status: 'compilado',
      etapa: 'execucao',
      saida: execucao.stdout,
      erros: execucao.tempoEsgotado
        ? `Tempo limite de execução excedido (${TEMPO_EXECUCAO / 1000}s).`
        : execucao.stderr,
      avisos: compilacao.stderr, // warnings do gcc (-Wall)
      codigo_saida: execucao.codigoSaida,
    };
  } finally {
    await fs.rm(pasta, { recursive: true, force: true });
  }
}

module.exports = { compilarEExecutar };
