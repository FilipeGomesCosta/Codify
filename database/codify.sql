DROP DATABASE IF EXISTS codify;
CREATE DATABASE codify CHARACTER SET utf8mb4;
USE codify;

CREATE TABLE usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(100) NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  token_senha VARCHAR(64),
  token_expira DATETIME
);

CREATE TABLE aluno (
  id_usuario INT PRIMARY KEY,
  pontuacao_xp INT DEFAULT 0,
  nivel INT DEFAULT 1,
  moedas INT DEFAULT 0,
  sequencia INT DEFAULT 0,
  ultimo_dia DATE,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE professor (
  id_usuario INT PRIMARY KEY,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE item (
  id_item INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(200),
  preco INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  raridade VARCHAR(10) NOT NULL,
  categoria VARCHAR(20) NOT NULL,
  efeito VARCHAR(20) NOT NULL,
  icone VARCHAR(20)
);

CREATE TABLE inventario (
  id_inventario INT AUTO_INCREMENT PRIMARY KEY,
  id_aluno INT NOT NULL UNIQUE,
  FOREIGN KEY (id_aluno) REFERENCES aluno(id_usuario)
);

CREATE TABLE item_inventario (
  id_inventario INT NOT NULL,
  id_item INT NOT NULL,
  quantidade INT NOT NULL,
  data_adquirido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_inventario, id_item),
  FOREIGN KEY (id_inventario) REFERENCES inventario(id_inventario),
  FOREIGN KEY (id_item) REFERENCES item(id_item)
);

CREATE TABLE compra (
  id_compra INT AUTO_INCREMENT PRIMARY KEY,
  id_aluno INT NOT NULL,
  id_item INT NOT NULL,
  quantidade INT NOT NULL,
  data_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_aluno) REFERENCES aluno(id_usuario),
  FOREIGN KEY (id_item) REFERENCES item(id_item)
);

CREATE TABLE missao (
  id_missao INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT,
  nivel_dificuldade VARCHAR(20) NOT NULL,
  recompensa_xp INT NOT NULL,
  recompensa_moedas INT NOT NULL,
  id_requisito INT,
  entrada_teste VARCHAR(200),
  saida_esperada VARCHAR(200),
  descricao_entrada VARCHAR(200),
  descricao_saida VARCHAR(200),
  dica VARCHAR(300),
  pista VARCHAR(300),
  FOREIGN KEY (id_requisito) REFERENCES missao(id_missao)
);

CREATE TABLE progresso_missao (
  id_progresso INT AUTO_INCREMENT PRIMARY KEY,
  id_aluno INT NOT NULL,
  id_missao INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  data_conclusao DATETIME,
  UNIQUE (id_aluno, id_missao),
  FOREIGN KEY (id_aluno) REFERENCES aluno(id_usuario),
  FOREIGN KEY (id_missao) REFERENCES missao(id_missao)
);

CREATE TABLE codigo (
  id_codigo INT AUTO_INCREMENT PRIMARY KEY,
  id_aluno INT NOT NULL,
  conteudo TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  data_salvo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_aluno) REFERENCES aluno(id_usuario)
);

CREATE TABLE sala_aula (
  id_sala INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(200),
  nivel VARCHAR(20) NOT NULL,
  linguagem VARCHAR(30) NOT NULL,
  acesso VARCHAR(10) NOT NULL,
  codigo_acesso VARCHAR(9) NOT NULL UNIQUE,
  imagem VARCHAR(20) DEFAULT 'codigo',
  imagem_arquivo VARCHAR(100),
  aprovacao TINYINT DEFAULT 0,
  id_professor INT NOT NULL,
  FOREIGN KEY (id_professor) REFERENCES professor(id_usuario)
);

CREATE TABLE participa (
  id_aluno INT NOT NULL,
  id_sala INT NOT NULL,
  status VARCHAR(10) DEFAULT 'ativo',
  PRIMARY KEY (id_aluno, id_sala),
  FOREIGN KEY (id_aluno) REFERENCES aluno(id_usuario),
  FOREIGN KEY (id_sala) REFERENCES sala_aula(id_sala)
);

CREATE TABLE atividade_sala (
  id_atividade INT AUTO_INCREMENT PRIMARY KEY,
  id_sala INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT,
  arquivo VARCHAR(100),
  arquivo_nome VARCHAR(200),
  prazo DATETIME NOT NULL,
  permite_atraso TINYINT DEFAULT 0,
  pontuacao FLOAT DEFAULT 10,
  disponivel_em DATETIME,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_sala) REFERENCES sala_aula(id_sala)
);

CREATE TABLE entrega_atividade (
  id_entrega INT AUTO_INCREMENT PRIMARY KEY,
  id_atividade INT NOT NULL,
  id_aluno INT NOT NULL,
  arquivo VARCHAR(100),
  arquivo_nome VARCHAR(200),
  observacao VARCHAR(300),
  data_entrega DATETIME NOT NULL,
  nota FLOAT,
  feedback VARCHAR(300),
  status VARCHAR(20) NOT NULL,
  UNIQUE (id_atividade, id_aluno),
  FOREIGN KEY (id_atividade) REFERENCES atividade_sala(id_atividade),
  FOREIGN KEY (id_aluno) REFERENCES aluno(id_usuario)
);

CREATE TABLE material_apoio (
  id_material INT AUTO_INCREMENT PRIMARY KEY,
  id_sala INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  descricao VARCHAR(300),
  categoria VARCHAR(30),
  tipo VARCHAR(20) NOT NULL,
  arquivo VARCHAR(100),
  arquivo_nome VARCHAR(200),
  link VARCHAR(300),
  tamanho INT DEFAULT 0,
  permitir_download TINYINT DEFAULT 1,
  destaque TINYINT DEFAULT 0,
  disponivel_em DATETIME,
  data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_sala) REFERENCES sala_aula(id_sala)
);


-- dados de exemplo (a senha de todos os usuarios e senha123)

INSERT INTO usuario (nome, email, senha, tipo) VALUES
('Ana Souza', 'ana@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Bruno Lima', 'bruno@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Carlos Henrique', 'carlos@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'professor'),
('Márcia Pimenta', 'marcia@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'professor'),
('Beatriz Alves', 'aluno01@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Caio Ribeiro', 'aluno02@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Daniela Costa', 'aluno03@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Eduardo Nunes', 'aluno04@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Fernanda Lopes', 'aluno05@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Gabriel Rocha', 'aluno06@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Helena Martins', 'aluno07@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Igor Barbosa', 'aluno08@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Julia Ferreira', 'aluno09@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Kaique Santos', 'aluno10@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Larissa Gomes', 'aluno11@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Matheus Araújo', 'aluno12@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Natália Cardoso', 'aluno13@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Otávio Pinto', 'aluno14@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Paula Teixeira', 'aluno15@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Rafael Moreira', 'aluno16@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Sofia Carvalho', 'aluno17@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Thiago Dias', 'aluno18@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Vitória Melo', 'aluno19@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Wesley Freitas', 'aluno20@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Yasmin Castro', 'aluno21@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Bruna Ramos', 'aluno22@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Diego Monteiro', 'aluno23@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Elisa Duarte', 'aluno24@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Felipe Azevedo', 'aluno25@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Giovana Reis', 'aluno26@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Henrique Cunha', 'aluno27@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno'),
('Isabela Vieira', 'aluno28@codify.com', '$2b$10$Ooa4n4CDxQQGUsscUa6zNuQe8Drs3LA2bSbQSy6G9uEdbi0oAW2pm', 'aluno');

INSERT INTO aluno (id_usuario, pontuacao_xp, nivel, moedas, sequencia, ultimo_dia) VALUES
(1, 1250, 4, 2340, 6, DATE_SUB(CURDATE(), INTERVAL 1 DAY)), (2, 0, 1, 100, 0, NULL),
(5, 0, 1, 0, 0, NULL),
(6, 0, 1, 0, 0, NULL),
(7, 0, 1, 0, 0, NULL),
(8, 0, 1, 0, 0, NULL),
(9, 0, 1, 0, 0, NULL),
(10, 0, 1, 0, 0, NULL),
(11, 0, 1, 0, 0, NULL),
(12, 0, 1, 0, 0, NULL),
(13, 0, 1, 0, 0, NULL),
(14, 0, 1, 0, 0, NULL),
(15, 0, 1, 0, 0, NULL),
(16, 0, 1, 0, 0, NULL),
(17, 0, 1, 0, 0, NULL),
(18, 0, 1, 0, 0, NULL),
(19, 0, 1, 0, 0, NULL),
(20, 0, 1, 0, 0, NULL),
(21, 0, 1, 0, 0, NULL),
(22, 0, 1, 0, 0, NULL),
(23, 0, 1, 0, 0, NULL),
(24, 0, 1, 0, 0, NULL),
(25, 0, 1, 0, 0, NULL),
(26, 0, 1, 0, 0, NULL),
(27, 0, 1, 0, 0, NULL),
(28, 0, 1, 0, 0, NULL),
(29, 0, 1, 0, 0, NULL),
(30, 0, 1, 0, 0, NULL),
(31, 0, 1, 0, 0, NULL),
(32, 0, 1, 0, 0, NULL);
INSERT INTO professor (id_usuario) VALUES (3), (4);
INSERT INTO inventario (id_aluno) VALUES (1), (2),
(5),
(6),
(7),
(8),
(9),
(10),
(11),
(12),
(13),
(14),
(15),
(16),
(17),
(18),
(19),
(20),
(21),
(22),
(23),
(24),
(25),
(26),
(27),
(28),
(29),
(30),
(31),
(32);

INSERT INTO item (nome, descricao, preco, tipo, raridade, categoria, efeito, icone) VALUES
('Dica de Sintaxe', 'Revela uma dica de sintaxe de uma questão.', 150, 'Auxílio', 'Comum', 'Consumível', 'dica', 'cerebro'),
('Proteção', 'Protege seu progresso caso erre uma missão.', 200, 'Auxílio', 'Raro', 'Consumível', 'nenhum', 'escudo'),
('Impulso de energia', 'Restaura 20% da sua energia para missões.', 100, 'Recurso', 'Comum', 'Consumível', 'nenhum', 'raioazul'),
('Pista de Missão', 'Fornece uma pista sobre o objetivo da missão atual.', 120, 'Missão', 'Comum', 'Consumível', 'pista', 'bandeira'),
('Cristal Tech', 'Moeda rara usada em recursos especiais.', 500, 'Missão', 'Raro', 'Colecionável', 'nenhum', 'cristalroxo'),
('Desbloqueador', 'Desbloqueia conteúdos especiais.', 300, 'Missão', 'Raro', 'Consumível', 'nenhum', 'escudocadeado'),
('Papiro', 'Pergaminho antigo com anotações de código.', 80, 'Recurso', 'Comum', 'Material', 'nenhum', 'papiro'),
('Lâmpada', 'Uma ideia brilhante para suas missões.', 60, 'Recurso', 'Comum', 'Material', 'nenhum', 'lampada'),
('Cristal de Código', 'Cristal raro que guarda linhas de código.', 250, 'Recurso', 'Raro', 'Colecionável', 'nenhum', 'cristal'),
('Bateria de Foco', 'Energia extra para estudar por mais tempo.', 180, 'Recurso', 'Raro', 'Consumível', 'nenhum', 'bateria'),
('Moeda XP', 'Uma moeda comemorativa de XP.', 40, 'Recurso', 'Comum', 'Colecionável', 'nenhum', 'moeda'),
('Manual C', 'Guia de consulta rápida da linguagem C.', 150, 'Recurso', 'Raro', 'Material', 'nenhum', 'livro'),
('Booster XP', 'Impulsiona o XP ganho nas missões.', 400, 'Recurso', 'Épico', 'Consumível', 'nenhum', 'foguete'),
('Escudo de Código', 'Escudo lendário contra bugs.', 350, 'Auxílio', 'Épico', 'Colecionável', 'nenhum', 'escudo'),
('Chave de Sala', 'Chave que abre salas secretas.', 220, 'Missão', 'Raro', 'Colecionável', 'nenhum', 'chave'),
('Fragmento Épico', 'Fragmento raro de código antigo.', 450, 'Recurso', 'Épico', 'Colecionável', 'nenhum', 'cristalroxo'),
('Caneca do Dev', 'Para as longas madrugadas de código.', 60, 'Recurso', 'Comum', 'Colecionável', 'nenhum', 'caneca'),
('Coroa Lendária', 'Para os maiores mestres da lógica.', 1000, 'Recurso', 'Lendário', 'Colecionável', 'nenhum', 'coroa');

INSERT INTO item_inventario (id_inventario, id_item, quantidade, data_adquirido) VALUES
(1, 7, 12, DATE_SUB(NOW(), INTERVAL 1 MINUTE)),
(1, 8, 12, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(1, 9, 5, DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
(1, 10, 3, DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
(1, 11, 12, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(1, 12, 2, DATE_SUB(NOW(), INTERVAL 6 MINUTE)),
(1, 13, 2, DATE_SUB(NOW(), INTERVAL 7 MINUTE)),
(1, 14, 1, DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
(1, 15, 4, DATE_SUB(NOW(), INTERVAL 9 MINUTE)),
(1, 16, 6, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(1, 17, 1, DATE_SUB(NOW(), INTERVAL 11 MINUTE)),
(1, 18, 1, DATE_SUB(NOW(), INTERVAL 12 MINUTE));

INSERT INTO missao (titulo, descricao, nivel_dificuldade, recompensa_xp, recompensa_moedas, id_requisito, entrada_teste, saida_esperada, descricao_entrada, descricao_saida, dica, pista) VALUES
('Introdução à Lógica', 'Escreva um programa que leia um número inteiro e, em seguida, o exiba.', 'iniciante', 100, 50, NULL, '10', '10', 'Um número inteiro.', 'O número informado pelo usuário.', 'Use scanf("%d", &numero) para ler e printf("%d", numero) para exibir.', 'Declare uma variável int antes de chamar o scanf.'),
('Estruturas Condicionais', 'Leia um número e exiba "par" ou "impar" (sem acento).', 'iniciante', 150, 60, 1, '7', 'impar', 'Um número inteiro.', 'A palavra par ou impar.', 'O operador % devolve o resto da divisão.', 'Se numero % 2 for 0, o número é par.'),
('Laços de Repetição', 'Leia um número e exiba a tabuada dele de 1 a 10, todos na mesma linha separados por espaço (ex.: 2 4 6 8 ...).', 'intermediario', 200, 80, 2, '3', '3 6 9 12 15 18 21 24 27 30', 'Um número inteiro.', 'Os dez primeiros múltiplos do número.', 'Use um for de 1 até 10.', 'Dentro do for, exiba numero * i seguido de um espaço.'),
('Vetores e Matrizes', 'Leia cinco números inteiros, guarde-os em um vetor e exiba a soma deles.', 'intermediario', 250, 100, 3, '1 2 3 4 5', '15', 'Cinco números inteiros.', 'A soma dos cinco números.', 'Declare o vetor assim: int v[5];', 'Percorra o vetor com um for somando cada posição.'),
('Funções', 'Crie uma função que calcule o fatorial de um número e exiba o resultado.', 'avancado', 300, 150, 4, '5', '120', 'Um número inteiro.', 'O fatorial do número.', 'Fatorial de 5 = 5 * 4 * 3 * 2 * 1.', 'Comece com resultado = 1 e multiplique dentro de um laço.'),
('Ponteiros', 'Leia dois números e exiba-os trocados, usando ponteiros em uma função.', 'avancado', 350, 180, 5, '3 7', '7 3', 'Dois números inteiros.', 'Os dois números na ordem trocada.', 'void troca(int *a, int *b) recebe os endereços das variáveis.', 'Use uma variável auxiliar para não perder um dos valores.');

INSERT INTO progresso_missao (id_aluno, id_missao, status, data_conclusao) VALUES
(1, 1, 'concluida', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 2, 'concluida', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 3, 'em_andamento', NULL);

INSERT INTO sala_aula (nome, descricao, nivel, linguagem, acesso, codigo_acesso, imagem, aprovacao, id_professor) VALUES
('Lógica de Programação', 'Turma de lógica com linguagem C.', 'intermediario', 'C', 'aberta', 'ABCD-1234', 'codigo', 0, 3),
('Linguagem C Aplicada', 'Projetos práticos em linguagem C.', 'intermediario', 'C', 'aberta', 'WXYZ-5678', 'programacao', 1, 4);

INSERT INTO participa (id_aluno, id_sala, status) VALUES (1, 1, 'ativo'), (1, 2, 'ativo'),
(5, 1, 'ativo'),
(6, 1, 'ativo'),
(7, 1, 'ativo'),
(8, 1, 'ativo'),
(9, 1, 'ativo'),
(10, 1, 'ativo'),
(11, 1, 'ativo'),
(12, 1, 'ativo'),
(13, 1, 'ativo'),
(14, 1, 'ativo'),
(15, 1, 'ativo'),
(16, 1, 'ativo'),
(17, 1, 'ativo'),
(18, 1, 'ativo'),
(19, 1, 'ativo'),
(20, 1, 'ativo'),
(21, 1, 'ativo'),
(22, 1, 'ativo'),
(23, 1, 'ativo'),
(24, 1, 'ativo'),
(25, 1, 'ativo'),
(26, 1, 'ativo'),
(27, 1, 'ativo'),
(28, 1, 'ativo'),
(29, 1, 'ativo'),
(30, 1, 'ativo'),
(31, 1, 'ativo'),
(5, 2, 'ativo'),
(6, 2, 'ativo'),
(7, 2, 'ativo'),
(8, 2, 'ativo'),
(9, 2, 'ativo'),
(10, 2, 'ativo'),
(11, 2, 'ativo'),
(12, 2, 'ativo'),
(13, 2, 'ativo'),
(14, 2, 'ativo'),
(15, 2, 'ativo'),
(16, 2, 'ativo'),
(17, 2, 'ativo'),
(18, 2, 'ativo'),
(19, 2, 'ativo'),
(20, 2, 'ativo'),
(21, 2, 'ativo'),
(22, 2, 'ativo'),
(23, 2, 'ativo'),
(24, 2, 'ativo'),
(25, 2, 'ativo'),
(26, 2, 'ativo'),
(27, 2, 'ativo'),
(28, 2, 'ativo'),
(29, 2, 'ativo'),
(30, 2, 'ativo'),
(31, 2, 'ativo'),
(32, 2, 'ativo');

INSERT INTO atividade_sala (id_sala, titulo, descricao, prazo, permite_atraso) VALUES
(1, 'Lista de exercícios 1', 'Resolva os exercícios de condicionais e envie o arquivo .c.', '2030-12-31 23:59:00', 0);

INSERT INTO atividade_sala (id_sala, titulo, descricao, prazo, permite_atraso, data_criacao) VALUES
(2, 'Projeto de calculadora', 'Desenvolva uma calculadora simples em C.', '2030-12-31 23:59:00', 1, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO material_apoio (id_sala, titulo, descricao, categoria, tipo, arquivo, arquivo_nome, link, tamanho, data_envio) VALUES
(1, 'Introdução à Lógica de Programação', 'Conceitos básicos de lógica de programação para iniciantes.', 'Apostila', 'documento', 'exemplo-logica.pdf', 'Introducao-a-Logica.pdf', NULL, 412, NOW()),
(1, 'Estruturas de Repetição em C', 'Exemplos e exercícios sobre loops e suas aplicações.', 'Exercícios', 'documento', 'exemplo-repeticao.c', 'repeticao.c', NULL, 127, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'Videoaula: Arrays em C', 'Aprenda como manipular arrays na prática com exemplos.', 'Vídeo-aula', 'video', NULL, NULL, 'https://www.youtube.com/results?search_query=arrays+em+c', 0, '2026-05-21 10:00:00'),
(1, 'Referência da linguagem C', 'Documentação online com todas as funções da biblioteca padrão.', 'Referência', 'link', NULL, NULL, 'https://en.cppreference.com/w/c', 0, '2026-05-19 10:00:00');
