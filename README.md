# Codify

Site de ensino de programação em C, com trilha de missões, loja, inventário, compilador, salas de aula, atividades e material de apoio.

## Estrutura do projeto

```
codify/
├── backend/                  servidor (Node.js + Express + MySQL)
│   ├── package.json
│   ├── uploads/              arquivos enviados (materiais, atividades, entregas)
│   └── src/
│       ├── server.js         inicia o servidor
│       ├── config/           banco.js (conexão com o MySQL) e email.js (SMTP)
│       ├── middlewares/      auth.js (login e perfis) e upload.js (arquivos)
│       ├── routes/           uma rota por assunto (usuarios, missoes, loja, salas...)
│       ├── services/         compilador.js (gcc) e email.js
│       └── scripts/          criar-banco.js
├── database/
│   └── codify.sql            tabelas e dados de exemplo
└── frontend/
    ├── index.html, login.html, cadastro.html, ...   páginas públicas
    ├── aluno/                páginas do aluno
    ├── professor/            páginas do professor
    └── assets/
        ├── css/              um CSS por tela (estilo.css é o comum)
        ├── js/               um JS por tela (api.js e topo.js são comuns)
        └── img/
```

## Como rodar

1. Instale o Node.js, o MySQL e o compilador `gcc` (o compilador de C do site usa o gcc do próprio computador).
2. O servidor usa o usuário `root` com a senha `root` no MySQL. Se o seu for diferente, altere `backend/src/config/banco.js`.
3. No terminal, dentro da pasta `backend`:

```
npm install
npm run banco
npm start
```

`npm run banco` cria (ou recria) o banco `codify` com os dados de exemplo, usando a mesma conexão do servidor. **Ele apaga o banco `codify` que já existir.** Rode de novo sempre que receber uma versão nova do projeto.

4. Abra o arquivo `frontend/index.html` (duplo clique) ou acesse http://localhost:3000

Se aparecer "O banco de dados está desatualizado", rode `npm run banco`.

## Compilador de C no Windows

Se aparecer "O compilador gcc não foi encontrado...":

1. Instale o gcc: `winget install BrechtSanders.WinLibs.POSIX.UCRT`
2. Feche **todos** os terminais, abra um novo e confira com `gcc --version`
3. Reinicie o servidor (`npm start`)

## Logins de exemplo (senha: senha123)

| Tipo | E-mail |
|---|---|
| Aluno | ana@codify.com |
| Aluno | bruno@codify.com |
| Professor | carlos@codify.com |
| Professor | marcia@codify.com |

Salas de exemplo: `ABCD-1234` (aberta) e `WXYZ-5678` (exige aprovação do professor).

## Recuperar senha por e-mail

Para o site enviar o e-mail de verdade, preencha os dados do seu servidor SMTP em `backend/src/config/email.js`. Sem isso, o link de redefinição (válido por 1 hora) aparece no terminal onde o servidor está rodando.

## Casos de uso e onde estão

| Caso de uso | Tela | Rota do servidor |
|---|---|---|
| UC001 Criar conta / UC002 Efetuar login | cadastro, login, esqueci, redefinir | `routes/usuarios.js` |
| UC003 Realizar missões | aluno/missoes, aluno/missao | `routes/missoes.js` |
| UC004 Comprar na loja / UC005 Acessar inventário | aluno/loja, aluno/inventario | `routes/loja.js` |
| UC006 Programar em Linguagem C | aluno/compilador | `routes/compilador.js` |
| UC007 Criar sala / UC008 Acessar sala | professor/criar-sala, aluno/salas | `routes/salas.js` |
| UC009 Adicionar material / UC010 Acessar material | professor/material-novo, aluno/materiais | `routes/materiais.js` |
| UC011 Adicionar atividade / UC012 Acessar atividade | professor/atividade-nova, aluno/atividade | `routes/atividades.js` |

## Observações

- O login fica guardado na memória do servidor. Se o servidor for reiniciado, é preciso entrar de novo.
- Os arquivos enviados ficam em `backend/uploads` (os arquivos `exemplo-*` são dos materiais de exemplo; não apague).
- O código dos alunos é executado no próprio computador do servidor. Use só para testes e estudo.
