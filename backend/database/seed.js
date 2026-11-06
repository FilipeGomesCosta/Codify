// Popula o banco com dados de exemplo (os mesmos dos protótipos).
// Uso: npm run db:seed  (ou npm run db:reset para recriar tudo)
//
// Logins criados (senha de todos: senha123):
//   aluno:     ana@codify.com    (1.250 XP, 2.340 moedas)
//   aluno:     bruno@codify.com  (90 moedas – para testar "Moedas insuficientes")
//   professor: carlos@codify.com, marcia@codify.com, filipe@codify.com
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const { pool, transacao } = require('../src/config/db');
const { nivelPorXp } = require('../src/utils/nivel');

async function main() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM usuario');
  if (total > 0) {
    console.log('O banco já tem dados. Para recriar do zero use: npm run db:reset');
    return;
  }

  const senha = await bcrypt.hash('senha123', 10);

  await transacao(async (conn) => {
    const inserir = async (sql, params) => (await conn.query(sql, params))[0].insertId;

    // ---------- Usuários ----------
    const criarUsuario = async (nome, email, tipo) => inserir(
      'INSERT INTO usuario (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
      [nome, email, senha, tipo],
    );
    const criarAluno = async (nome, email, xp, moedas) => {
      const id = await criarUsuario(nome, email, 'aluno');
      await conn.query(
        'INSERT INTO aluno (id_usuario, pontuacao_xp, nivel, moedas) VALUES (?, ?, ?, ?)',
        [id, xp, nivelPorXp(xp), moedas],
      );
      return id;
    };
    const criarProfessor = async (nome, email) => {
      const id = await criarUsuario(nome, email, 'professor');
      await conn.query('INSERT INTO professor (id_usuario) VALUES (?)', [id]);
      return id;
    };

    const ana = await criarAluno('Ana Souza', 'ana@codify.com', 1250, 2340);
    const bruno = await criarAluno('Bruno Lima', 'bruno@codify.com', 300, 90);
    const carlos = await criarProfessor('Carlos Henrique', 'carlos@codify.com');
    const marcia = await criarProfessor('Márcia Pimenta', 'marcia@codify.com');
    const filipe = await criarProfessor('Filipe Gomes', 'filipe@codify.com');

    // ---------- Salas ----------
    const criarSala = (nome, codigo, prof, descricao, nivel, imagem) => inserir(
      'INSERT INTO sala_aula (nome, codigo_acesso, id_professor, descricao, nivel, imagem) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, codigo, prof, descricao, nivel, imagem],
    );
    const logica = await criarSala('Lógica de Programação', 'C4D7-9B2A', carlos, 'Primeiros passos em lógica e algoritmos.', 'medio', 'codigo');
    const linguagemC = await criarSala('Linguagem C Aplicada', 'A1B2-C3D4', marcia, 'Programação em C com projetos práticos.', 'medio', 'programacao');
    const estruturas = await criarSala('Estruturas de Dados em C', 'E5F6-0718', filipe, 'Vetores, matrizes, listas e pilhas.', 'avancado', 'computador');

    for (const [aluno, sala] of [[ana, logica], [ana, linguagemC], [ana, estruturas], [bruno, logica]]) {
      await conn.query('INSERT INTO participa (id_aluno, id_sala) VALUES (?, ?)', [aluno, sala]);
    }

    // ---------- Atividades (prazo daqui a alguns dias) ----------
    await conn.query(
      `INSERT INTO atividade (titulo, descricao, prazo, id_sala) VALUES
       (?, ?, DATE_ADD(CURDATE(), INTERVAL 30 DAY) + INTERVAL '23:59' HOUR_MINUTE, ?),
       (?, ?, DATE_ADD(CURDATE(), INTERVAL 7 DAY) + INTERVAL '23:59' HOUR_MINUTE, ?)`,
      [
        'Atividade 03 - Vetores e Matrizes',
        'Resolva os exercícios abaixo sobre vetores e matrizes. Justifique todos os passos e apresente os códigos de forma clara e objetiva.\n'
          + '1. Crie um programa que leia um vetor de 10 inteiros, calcule e exiba a soma dos elementos e a média aritmética.\n'
          + '2. Crie um programa que leia uma matriz 3x3 de inteiros e exiba a soma das diagonais principal e secundária.\n'
          + '3. Crie um programa que leia uma matriz 4x5 de inteiros e exiba a matriz, a soma de cada linha e a soma de cada coluna.',
        estruturas,
        'Lista de exercícios - Estruturas de Repetição',
        'Resolva os exercícios usando for, while e do-while.',
        logica,
      ],
    );

    // ---------- Materiais de apoio ----------
    // Os de arquivo ficam sem arquivo (o professor envia pela tela); os de link já funcionam.
    const materiais = [
      ['Introdução à Lógica de Programação', 'Conceitos básicos de lógica de programação para iniciantes.', logica, 'documento', 'Lógica de Programação', null],
      ['Estruturas de Repetição em C', 'Exemplos e exercícios sobre loops e suas aplicações.', logica, 'documento', 'Linguagem C', null],
      ['Videoaula: Arrays em C', 'Aprenda como manipular arrays na prática com exemplos.', linguagemC, 'video', 'Linguagem C', 'https://www.youtube.com/results?search_query=arrays+em+C'],
      ['Slides: Estruturas de Dados', 'Resumo dos principais conceitos de estruturas de dados.', estruturas, 'documento', 'Estruturas de Dados', null],
      ['Exercícios Resolvidos de Lógica', 'Lista de exercícios com resolução comentada.', logica, 'documento', 'Exercícios', null],
      ['Referência da linguagem C', 'Documentação de referência da biblioteca padrão do C.', linguagemC, 'link', 'Linguagem C', 'https://en.cppreference.com/w/c'],
    ];
    for (const [titulo, descricao, sala, tipo, categoria, link] of materiais) {
      await conn.query(
        'INSERT INTO material_apoio (titulo, descricao, id_sala, tipo, categoria, arquivo) VALUES (?, ?, ?, ?, ?, ?)',
        [titulo, descricao, sala, tipo, categoria, link],
      );
    }

    // ---------- Missões ----------
    const missoes = [
      ['Boas-vindas ao C', 'Escreva um programa que leia um número inteiro e, em seguida, o exiba.', 'iniciante', 100, 50],
      ['Soma de dois números', 'Leia dois números inteiros e exiba a soma.', 'iniciante', 100, 50],
      ['Média de três números', 'Leia três notas e exiba a média.', 'iniciante', 150, 60],
      ['Verificar par ou ímpar', 'Leia um número e informe se ele é par ou ímpar.', 'intermediario', 200, 80],
      ['Tabuada de um número', 'Leia um número e exiba a tabuada de 1 a 10.', 'intermediario', 250, 100],
    ];
    const idsMissoes = [];
    for (const m of missoes) {
      idsMissoes.push(await inserir(
        'INSERT INTO missao (titulo, descricao, nivel_dificuldade, recompensa_xp, recompensa_moedas) VALUES (?, ?, ?, ?, ?)',
        m,
      ));
    }
    await conn.query(
      "INSERT INTO realiza (id_aluno, id_missao, status) VALUES (?, ?, 'concluida'), (?, ?, 'em_andamento')",
      [ana, idsMissoes[0], ana, idsMissoes[1]],
    );

    // ---------- Itens da loja ----------
    const itens = [
      ['Dica de Sintaxe', 'Revela uma dica de sintaxe de uma questão.', 150, 'auxilio'],
      ['Proteção', 'Protege seu progresso caso erre uma missão.', 200, 'auxilio'],
      ['Impulso de energia', 'Restaura 20% da sua energia para missões.', 100, 'recurso'],
      ['Pista de Missão', 'Fornece uma pista sobre o objetivo da missão atual.', 120, 'missao'],
      ['Cristal Tech', 'Moeda rara usada em recursos especiais.', 500, 'missao'],
      ['Desbloqueador', 'Desbloqueia conteúdos especiais.', 300, 'missao'],
    ];
    const idsItens = [];
    for (const i of itens) {
      idsItens.push(await inserir('INSERT INTO item (nome, descricao, preco, tipo) VALUES (?, ?, ?, ?)', i));
    }
    // Ana já comprou 2 Dicas de Sintaxe e 1 Proteção
    for (const [item, qtd] of [[idsItens[0], 2], [idsItens[1], 1]]) {
      await conn.query('INSERT INTO compra (id_aluno, id_item, quantidade) VALUES (?, ?, ?)', [ana, item, qtd]);
      await conn.query('INSERT INTO possui (id_aluno, id_item, quantidade) VALUES (?, ?, ?)', [ana, item, qtd]);
    }

    // ---------- Código salvo no Compilador ----------
    await conn.query(
      "INSERT INTO codigo (id_aluno, conteudo, status) VALUES (?, ?, 'compilado')",
      [ana, '#include <stdio.h>\n\nint main() {\n    int numero;\n    printf("Digite um numero: ");\n    scanf("%d", &numero);\n\n    printf("\\nVoce digitou: %d", numero);\n\n    return 0;\n}\n'],
    );
  });

  console.log('Dados de exemplo inseridos. Senha de todos os usuários: senha123');
}

main()
  .catch((erro) => {
    console.error('Erro ao popular o banco:', erro.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
