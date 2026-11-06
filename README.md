# Codify

Plataforma de ensino de programação: salas de aula, atividades com entrega, material de apoio, missões e loja.

- **backend/** – API em Node.js + Express + MySQL
- **frontend/** – telas em HTML/CSS; `frontend/assets/js/` liga as telas à API

## Como rodar

```bash
cd backend
npm install
cp .env.example .env      # preencha DB_PASSWORD e JWT_SECRET
npm run db:reset          # cria o banco do zero e coloca dados de exemplo
npm start                 # http://localhost:3000/login.html
```

Já tem um banco com dados e não quer apagar? Use `npm run db:migrate`: ele só cria as colunas novas.

Logins de exemplo (senha `senha123`):

| Tipo      | E-mail              |
|-----------|---------------------|
| Aluno     | ana@codify.com      |
| Aluno     | bruno@codify.com    |
| Professor | carlos@codify.com   |
| Professor | marcia@codify.com   |
| Professor | filipe@codify.com   |

O front-end funciona aberto pelo próprio backend (`http://localhost:3000/...`) ou pelo Live Server
(nesse caso as chamadas vão para `http://localhost:3000/api`).

## Fluxo

**Professor**
1. *Sala de Aula → Criar sala* (`professor/salas.html`): nome, descrição, nível e imagem. O código de acesso aparece na tela.
2. *Minhas salas* (`professor/turmas.html`): vê as salas, atividades, materiais e alunos.
3. *Adicionar atividade* (`professor/atividades.html`): título, instruções, anexo opcional, data de entrega e visibilidade (agora ou agendada).
4. *Adicionar material* (`professor/materiais.html`): arquivo ou link, tipo, categoria, visibilidade, permitir download e destaque.
5. Em *Minhas salas → atividade*: baixa a resposta de cada aluno e dá nota (0 a 10) e feedback.

**Aluno**
1. *Salas de Aula* (`aluno/salas.html`): entra numa sala com o código (com ou sem traço).
2. *Entrar* na sala: lista de atividades com status (pendente, rascunho, entregue, avaliada) e materiais da sala.
3. Na atividade (`aluno/atividades.html?id=...`): baixa o anexo, envia arquivo e/ou observação, salva rascunho, envia, reenvia até o prazo e vê a nota e o feedback.
4. *Material de Apoio* (`aluno/materiais.html`): busca, filtro por tipo, ordem, paginação e download.

## Regras

- Professor só acessa as salas que criou; aluno só as salas em que participa.
- Atividade/material **agendado** só aparece para o aluno a partir da data escolhida.
- O aluno pode salvar rascunho, enviar e reenviar **até o prazo**. Depois do prazo, ou depois de avaliada, a entrega fica bloqueada.
- O professor não vê rascunhos, só entregas enviadas. A lista de entregas mostra todos os alunos da sala, e quem não entregou aparece como "pendente".
- Material com "Permitir download" desligado abre no navegador (inline) em vez de baixar.
- Arquivos: até 50 MB; PDF, DOC(X), PPT(X), MP4, PNG, JPG, C, H, ZIP, TXT. Ficam em `backend/uploads/` e são apagados quando a atividade, o material, a entrega ou a sala é excluída.

## API (principais rotas de atividades e materiais)

Todas exigem `Authorization: Bearer <token>` (vem do `/api/auth/login`). Erros voltam como `{ "erro": "mensagem" }`.

| Método | Rota | Quem | O que faz |
|---|---|---|---|
| GET | `/api/salas/codigo` | professor | sugere um código livre para a tela "Criar sala" |
| POST | `/api/salas` | professor | cria sala `{ nome, descricao?, nivel?, imagem?, codigo_acesso? }` |
| POST | `/api/salas/entrar` | aluno | entra com `{ codigo_acesso }` |
| GET | `/api/atividades?sala=` | ambos | lista atividades (aluno: com status da entrega; professor: com totais) |
| GET | `/api/salas/:idSala/atividades` | ambos | atividades de uma sala |
| POST | `/api/salas/:idSala/atividades` | professor | cria (multipart): `titulo`, `instrucoes`/`descricao`, `entrega`/`prazo`, `arquivo?`, `visibilidade` + `data` + `hora` |
| GET | `/api/atividades/:id` | ambos | detalhes (aluno recebe `minha_entrega`) |
| PUT | `/api/atividades/:id` | professor | edita (mesmos campos, todos opcionais; `remover_arquivo=true`) |
| DELETE | `/api/atividades/:id` | professor | exclui com as entregas |
| GET | `/api/atividades/:id/arquivo` | ambos | anexo do professor (`?baixar=0` abre no navegador) |
| POST | `/api/atividades/:id/entregas` | aluno | entrega (multipart): `arquivo?`, `observacao?`, `acao=rascunho\|enviar` |
| DELETE | `/api/atividades/:id/entregas` | aluno | desfaz a própria entrega (antes do prazo e da avaliação) |
| GET | `/api/atividades/:id/entregas` | ambos | professor: todos os alunos; aluno: a própria entrega |
| PUT | `/api/atividades/:id/entregas/:idAluno/avaliacao` | professor | `{ nota (0–10, aceita vírgula), feedback? }` |
| GET | `/api/atividades/:id/entregas/:idAluno/arquivo` | professor / o próprio aluno | arquivo da entrega |
| GET | `/api/materiais?busca=&tipo=&ordem=&sala=&pagina=&limite=` | ambos | lista paginada (`ordem`: recentes, antigos, az) |
| GET | `/api/salas/:idSala/materiais` | ambos | materiais de uma sala (destaques primeiro) |
| POST | `/api/salas/:idSala/materiais` | professor | cria (multipart): `titulo`, `descricao?`, `categoria?`, `tipo`, `arquivo` **ou** `link`, `visibilidade`/`data`/`hora`, `download`, `destaque` |
| GET / PUT / DELETE | `/api/materiais/:id` | GET ambos; PUT/DELETE professor | ver, editar ou excluir |
| GET | `/api/materiais/:id/arquivo` | ambos | baixa o arquivo (link → redireciona) |
