-- =========================================================
-- Codify – Banco de dados (MySQL 8+ / MariaDB 10.5+)
-- Gerado a partir do MER do projeto.
--
-- ATENÇÃO: este script APAGA as tabelas existentes e as recria.
-- Use apenas para criar o banco do zero (npm run db:reset).
-- =========================================================

CREATE DATABASE IF NOT EXISTS codify
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE codify;

-- Remove na ordem inversa das dependências
DROP TABLE IF EXISTS entrega;
DROP TABLE IF EXISTS material_apoio;
DROP TABLE IF EXISTS atividade;
DROP TABLE IF EXISTS participa;
DROP TABLE IF EXISTS sala_aula;
DROP TABLE IF EXISTS possui;
DROP TABLE IF EXISTS compra;
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS realiza;
DROP TABLE IF EXISTS missao;
DROP TABLE IF EXISTS codigo;
DROP TABLE IF EXISTS professor;
DROP TABLE IF EXISTS aluno;
DROP TABLE IF EXISTS usuario;

-- ---------------------------------------------------------
-- USUÁRIO  (especialização total e disjunta – (t,d))
--   Todo usuário é ALUNO ou PROFESSOR, nunca os dois.
--   A coluna "tipo" (fora do MER) é o discriminador que
--   garante a regra disjunta; a regra total é garantida no
--   cadastro, que cria usuário + aluno/professor na mesma transação.
-- ---------------------------------------------------------
CREATE TABLE usuario (
  id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  senha      VARCHAR(255) NOT NULL,              -- hash bcrypt, nunca a senha pura
  tipo       ENUM('aluno', 'professor') NOT NULL,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uk_usuario_email (email)
) ENGINE = InnoDB;

CREATE TABLE aluno (
  id_usuario   INT UNSIGNED NOT NULL,
  pontuacao_xp INT UNSIGNED NOT NULL DEFAULT 0,
  nivel        INT UNSIGNED NOT NULL DEFAULT 1,
  moedas       INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_aluno_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE professor (
  id_usuario INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_professor_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- CÓDIGO  —  ALUNO (1,1) ESCREVE (0,n) CÓDIGO
-- ---------------------------------------------------------
CREATE TABLE codigo (
  id_codigo     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_aluno      INT UNSIGNED NOT NULL,
  conteudo      MEDIUMTEXT NOT NULL,
  status        ENUM('rascunho', 'compilado', 'erro') NOT NULL DEFAULT 'rascunho',
  criado_em     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,                              -- fora do MER
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- fora do MER
  PRIMARY KEY (id_codigo),
  KEY idx_codigo_aluno (id_aluno),
  CONSTRAINT fk_codigo_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- MISSÃO  —  ALUNO (0,n) REALIZA (0,n) MISSÃO  [status]
-- ---------------------------------------------------------
CREATE TABLE missao (
  id_missao         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo            VARCHAR(150) NOT NULL,
  descricao         TEXT NULL,
  nivel_dificuldade ENUM('iniciante', 'intermediario', 'avancado') NOT NULL DEFAULT 'iniciante',
  recompensa_xp     INT UNSIGNED NOT NULL DEFAULT 0,
  recompensa_moedas INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id_missao)
) ENGINE = InnoDB;

CREATE TABLE realiza (
  id_aluno  INT UNSIGNED NOT NULL,
  id_missao INT UNSIGNED NOT NULL,
  status    ENUM('em_andamento', 'concluida') NOT NULL DEFAULT 'em_andamento',
  PRIMARY KEY (id_aluno, id_missao),
  KEY idx_realiza_missao (id_missao),
  CONSTRAINT fk_realiza_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_realiza_missao FOREIGN KEY (id_missao)
    REFERENCES missao (id_missao) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- ITEM  —  ALUNO (0,n) COMPRA (0,n) ITEM  [quantidade]
--          ALUNO (0,n) POSSUI (0,n) ITEM  [quantidade]
--   COMPRA guarda o total comprado; POSSUI é o inventário atual
--   (diminui quando o item é usado).
-- ---------------------------------------------------------
CREATE TABLE item (
  id_item   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome      VARCHAR(100) NOT NULL,
  descricao TEXT NULL,
  preco     INT UNSIGNED NOT NULL,
  tipo      VARCHAR(30) NOT NULL,          -- ex.: auxilio, recurso, missao
  PRIMARY KEY (id_item),
  KEY idx_item_tipo (tipo)
) ENGINE = InnoDB;

CREATE TABLE compra (
  id_aluno   INT UNSIGNED NOT NULL,
  id_item    INT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id_aluno, id_item),
  KEY idx_compra_item (id_item),
  CONSTRAINT fk_compra_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_compra_item FOREIGN KEY (id_item)
    REFERENCES item (id_item) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE possui (
  id_aluno   INT UNSIGNED NOT NULL,
  id_item    INT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id_aluno, id_item),
  KEY idx_possui_item (id_item),
  CONSTRAINT fk_possui_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_possui_item FOREIGN KEY (id_item)
    REFERENCES item (id_item) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- SALA_AULA  —  PROFESSOR (1,1) CRIA (0,n) SALA_AULA
--               ALUNO (0,n) PARTICIPA (0,n) SALA_AULA
-- ---------------------------------------------------------
CREATE TABLE sala_aula (
  id_sala       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(100) NOT NULL,
  codigo_acesso CHAR(9) NOT NULL,          -- formato XXXX-XXXX
  id_professor  INT UNSIGNED NOT NULL,
  descricao     VARCHAR(150) NULL,                                              -- fora do MER (tela "Criar Sala")
  nivel         ENUM('iniciante', 'medio', 'avancado') NOT NULL DEFAULT 'iniciante', -- fora do MER
  imagem        VARCHAR(20) NOT NULL DEFAULT 'codigo',                          -- fora do MER (arte do cartão)
  criado_em     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,                   -- fora do MER
  PRIMARY KEY (id_sala),
  UNIQUE KEY uk_sala_codigo (codigo_acesso),
  KEY idx_sala_professor (id_professor),
  CONSTRAINT fk_sala_professor FOREIGN KEY (id_professor)
    REFERENCES professor (id_usuario) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE participa (
  id_aluno INT UNSIGNED NOT NULL,
  id_sala  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_aluno, id_sala),
  KEY idx_participa_sala (id_sala),
  CONSTRAINT fk_participa_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_participa_sala FOREIGN KEY (id_sala)
    REFERENCES sala_aula (id_sala) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- ATIVIDADE  —  SALA_AULA (1,1) CONTÉM (0,n) ATIVIDADE
--   arquivo/arquivo_nome: anexo opcional do professor (pasta uploads/atividades)
--   disponivel_em: "Agendar disponibilização" (NULL = já disponível)
-- ---------------------------------------------------------
CREATE TABLE atividade (
  id_atividade  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo        VARCHAR(150) NOT NULL,
  descricao     TEXT NULL,
  prazo         DATETIME NOT NULL,
  id_sala       INT UNSIGNED NOT NULL,
  arquivo       VARCHAR(255) NULL,                                 -- fora do MER
  arquivo_nome  VARCHAR(255) NULL,                                 -- fora do MER (nome original)
  disponivel_em DATETIME NULL,                                     -- fora do MER
  criado_em     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,      -- fora do MER
  PRIMARY KEY (id_atividade),
  KEY idx_atividade_sala (id_sala),
  CONSTRAINT fk_atividade_sala FOREIGN KEY (id_sala)
    REFERENCES sala_aula (id_sala) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- MATERIAL_APOIO  —  SALA_AULA (1,1) DISPONIBILIZA (0,n) MATERIAL_APOIO
--   "arquivo" guarda o nome do arquivo enviado (pasta uploads/)
--   ou um link (http/https).
--   Os demais campos (fora do MER) vêm da tela "Adicionar Material".
-- ---------------------------------------------------------
CREATE TABLE material_apoio (
  id_material       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo            VARCHAR(150) NOT NULL,
  descricao         TEXT NULL,
  arquivo           VARCHAR(500) NULL,
  id_sala           INT UNSIGNED NOT NULL,
  arquivo_nome      VARCHAR(255) NULL,                                           -- nome original do arquivo
  tamanho           INT UNSIGNED NULL,                                           -- bytes
  tipo              ENUM('documento', 'video', 'link', 'imagem', 'outro') NOT NULL DEFAULT 'documento',
  categoria         VARCHAR(60) NULL,
  permitir_download TINYINT(1) NOT NULL DEFAULT 1,
  destaque          TINYINT(1) NOT NULL DEFAULT 0,
  disponivel_em     DATETIME NULL,                                               -- NULL = já disponível
  criado_em         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_material),
  KEY idx_material_sala (id_sala),
  CONSTRAINT fk_material_sala FOREIGN KEY (id_sala)
    REFERENCES sala_aula (id_sala) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- ENTREGA  —  ALUNO (0,n) ENTREGA (0,n) ATIVIDADE  [nota, feedback, status]
--   arquivo, observacao e data_entrega estão fora do MER, mas a
--   tela "Entrega da atividade" precisa deles.
-- ---------------------------------------------------------
CREATE TABLE entrega (
  id_aluno     INT UNSIGNED NOT NULL,
  id_atividade INT UNSIGNED NOT NULL,
  nota         DECIMAL(4, 2) NULL,
  feedback     TEXT NULL,
  status       ENUM('rascunho', 'entregue', 'avaliada') NOT NULL DEFAULT 'rascunho',
  arquivo      VARCHAR(255) NULL,          -- fora do MER
  arquivo_nome VARCHAR(255) NULL,          -- fora do MER (nome original do arquivo)
  observacao   VARCHAR(300) NULL,          -- fora do MER
  data_entrega DATETIME NULL,              -- fora do MER
  PRIMARY KEY (id_aluno, id_atividade),
  KEY idx_entrega_atividade (id_atividade),
  CONSTRAINT chk_entrega_nota CHECK (nota IS NULL OR (nota >= 0 AND nota <= 10)),
  CONSTRAINT fk_entrega_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_entrega_atividade FOREIGN KEY (id_atividade)
    REFERENCES atividade (id_atividade) ON DELETE CASCADE
) ENGINE = InnoDB;
