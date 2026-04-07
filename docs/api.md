# API

## Autenticação

- `POST /api/auth/login`
  - corpo: `{ login, senha }`
  - resposta: token JWT e dados do usuário

- `GET /api/auth/me`
  - requer token
  - retorna dados do usuário autenticado

## Usuários

- `GET /api/users`
  - requer role `admin` ou `professor`
  - query: `perfil`, `disciplina_id`

- `POST /api/users`
  - requer role `admin`
  - corpo: `{ nome, email?, matricula?, senha, perfil? }`

- `POST /api/users/bulk`
  - requer role `admin`
  - corpo: `{ nomes, perfil?, disciplina_ids?, senha_padrao? }`

- `PUT /api/users/:userId`
  - requer role `admin`
  - atualiza usuário

- `DELETE /api/users/:userId`
  - requer role `admin`
  - desabilita usuário

## Disciplinas

- `GET /api/disciplinas`
  - retorna disciplinas visíveis ao usuário

- `POST /api/disciplinas`
  - requer role `admin`
  - corpo: `{ nome, modo?, cor? }`

- `POST /api/disciplinas/:discId/professores/:profId`
  - requer role `admin`
  - atribui professor

- `POST /api/disciplinas/:discId/alunos/:alunoId`
  - requer role `admin` ou `professor`
  - matricula aluno na disciplina

- `DELETE /api/disciplinas/:discId/alunos/:alunoId`
  - requer role `admin` ou `professor`
  - remove aluno da disciplina

- `GET /api/disciplinas/:discId/alunos`
  - requer role `admin` ou `professor`
  - lista alunos matriculados

## Sessões

- `POST /api/sessoes`
  - requer role `admin` ou `professor`
  - corpo: `{ disciplina_id, descricao?, data? }`
  - cria sessão e gera token

- `POST /api/sessoes/:sessaoId/rotate-token`
  - requer role `admin` ou `professor`
  - rotaciona token da sessão atual

- `GET /api/sessoes/:sessaoId/token-info`
  - requer role `admin` ou `professor`
  - retorna token e validade

- `POST /api/sessoes/:sessaoId/encerrar`
  - requer role `admin` ou `professor`
  - encerra sessão

- `GET /api/sessoes/ativa`
  - requer role `admin` ou `professor`
  - retorna sessão ativa do usuário

- `GET /api/sessoes/historico`
  - requer role `admin` ou `professor`
  - query: `disciplina_id`

- `GET /api/sessoes/:sessaoId/presencas`
  - retorna presenças da sessão

- `DELETE /api/sessoes/:sessaoId`
  - requer role `admin`
  - exclui sessão e presenças

## Check-in

- `POST /api/checkin/token`
  - requer token do aluno
  - corpo: `{ sessao_id, token, metodo? }`

- `POST /api/checkin/manual`
  - requer role `admin` ou `professor`
  - corpo: `{ sessao_id, presencas }`

## Relatórios

- `GET /api/relatorios/disciplina/:discId`
  - requer role `admin` ou `professor`
  - relatório de frequência por disciplina

- `GET /api/relatorios/geral`
  - requer role `admin`
  - relatório geral de todos os alunos

- `GET /api/relatorios/minhas-frequencias`
  - requer token de aluno
  - retorna frequências do aluno logado
