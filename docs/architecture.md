# Arquitetura do NES-FREQUÊNCIA

## Objetivo

Este documento descreve a arquitetura do sistema e como os componentes se comunicam entre si.

## Visão geral do sistema

O NES-FREQUÊNCIA é composto por três camadas principais:

- **Frontend**: aplicação web construída com React e Vite.
- **Backend**: API REST construída com Express e Prisma.
- **Banco de dados**: PostgreSQL.

## Fluxo de requisição

1. O usuário abre o frontend no navegador.
2. O frontend faz chamadas HTTP para as rotas da API em `/api/...`.
3. No ambiente de desenvolvimento, o Vite proxy redireciona essas chamadas para `http://localhost:8000`.
4. O backend processa a requisição e acessa o PostgreSQL via Prisma.
5. O backend retorna uma resposta JSON ao frontend.

## Componentes principais

### Frontend

- `frontend/src/main.jsx` — inicializa o React e o roteamento.
- `frontend/src/App.jsx` — define rotas públicas e rotas protegidas por autenticação.
- `frontend/src/contexts/AuthContext.jsx` — gerencia estado de usuário, armazenamento em `localStorage` e carregamento inicial.
- `frontend/src/services/api.js` — cliente Axios que organiza chamadas à API e tratamento de erros.
- `frontend/src/pages/` — contém as telas da aplicação, como login, sessões, check-in e relatórios.

### Backend

- `backend/src/index.js` — ponto de partida do servidor Express.
- `backend/src/config.js` — carrega configurações de ambiente e valores padrão.
- `backend/src/prisma.js` — inicia o cliente Prisma para comunicação com o banco.
- `backend/prisma/schema.prisma` — define o modelo de dados e relações do PostgreSQL.
- `backend/src/routes/` — implementa as rotas REST da API.
- `backend/src/services/tokenService.js` — contém regras de negócio para token de presença e hashing de senhas.
- `backend/src/middleware/auth.js` — valida JWT e controla permissões por perfil.
- `backend/src/seed.js` — popula o banco com dados iniciais.

### Banco de dados

- O banco é PostgreSQL.
- Em Docker Compose, a porta exposta é `5433`.
- Localmente, o PostgreSQL típico usa a porta `5432`.
- A conexão é configurada via `backend/.env`.

## Requisitos de integração

- O frontend e o backend devem apontar para o mesmo host / porta para o proxy funcionar.
- O backend precisa ter o Prisma client gerado e o banco sincronizado antes de rodar.
- O `frontend/src/services/api.js` envia o token JWT no cabeçalho `Authorization` automaticamente.

## Observações adicionais

- Não há dependência do antigo backend FastAPI no projeto atual.
- O backend Express é o único serviço que consome o banco de dados.
- O frontend consome apenas API REST JSON.
