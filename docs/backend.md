# Backend

## Visão geral

O backend do NES-FREQUÊNCIA é construído com Node.js, Express e Prisma. Ele é responsável por fornecer a API REST, autenticação, autorização, persistência de dados e regras de negócio relacionadas à frequência escolar.

## Tecnologias principais

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT (`jsonwebtoken`)
- `bcryptjs`
- `dotenv`
- `cors`

## Estrutura do backend

```text
backend/
├── package.json
├── package-lock.json
├── .env.example
├── Dockerfile
├── prisma/
│   └── schema.prisma
└── src/
    ├── config.js
    ├── index.js
    ├── prisma.js
    ├── seed.js
    ├── middleware/
    │   └── auth.js
    ├── routes/
    │   ├── auth.js
    │   ├── users.js
    │   ├── disciplinas.js
    │   ├── sessoes.js
    │   ├── checkin.js
    │   └── relatorios.js
    └── services/
        └── tokenService.js
```

## Configuração do ambiente

### Arquivos de ambiente

- `backend/.env.example` contém os exemplos de variáveis necessárias.
- `backend/.env` deve ser criado a partir desse exemplo e não deve ser versionado.

### Variáveis de ambiente importantes

- `DATABASE_URL` — URL de conexão com PostgreSQL.
- `SECRET_KEY` — chave secreta usada para JWT.
- `ALGORITHM` — algoritmo JWT (ex: `HS256`).
- `ACCESS_TOKEN_EXPIRE_MINUTES` — validade do token de acesso.
- `TOKEN_ROTATION_SECONDS` — tempo para rotação de token de presença.
- `TOKEN_LENGTH` — tamanho do token numérico de presença.

### Exemplo de URL do banco

- Docker Compose: `postgresql://postgres:postgres@localhost:5433/nes_frequencia`
- Instalação local: `postgresql://usuario:senha@localhost:5432/nes_frequencia`

## Comandos de inicialização

```bash
cd backend
npm install            # instala dependências
npx prisma generate     # gera cliente Prisma
npx prisma db push      # sincroniza schema com o banco
npm run seed            # popula dados iniciais
npm run dev             # inicia o servidor em modo de desenvolvimento
```

## Principais módulos e responsabilidades

### `src/index.js`

- inicializa o servidor Express
- configura `cors` e `express.json()`
- registra rotas da API
- define rota de health check
- trata rotas não encontradas

### `src/config.js`

- carrega variáveis de ambiente com `dotenv`
- expõe configurações de conexão e segurança

### `src/prisma.js`

- cria e exporta o cliente Prisma
- permite acesso ao banco em toda a aplicação

### `src/middleware/auth.js`

- valida JWT no cabeçalho `Authorization`
- extrai usuário autenticado
- verifica perfil do usuário para autorização

### `src/services/tokenService.js`

- gera e valida tokens numéricos de presença
- faz hash de senhas com `bcryptjs`
- trata a lógica de expiração de tokens

### `src/routes/*.js`

- implementam a lógica de cada área da aplicação
- separam recursos de autenticação, usuários, disciplinas, sessões, check-in e relatórios

### `src/seed.js`

- cria usuários iniciais de admin, professores e alunos
- cria disciplinas padrão
- matricula alunos e professores nas disciplinas

## Recursos suportados

O backend oferece as seguintes funcionalidades:

- login e autenticação JWT
- endpoint `/api/auth/me`
- CRUD de usuários
- cadastro em massa de alunos
- gerenciamento de disciplinas e matriculas
- criação, rotacionamento, encerramento e consulta de sessões
- check-in por token para alunos
- check-in manual para professores/admin
- relatórios de frequência por disciplina e geral
- consulta de presenças por sessão

## Observações importantes

- O backend depende do banco estar disponível e do Prisma ter as tabelas criadas.
- O seed deve ser executado apenas uma vez em ambientes novos.
- A URL do banco definida em `backend/.env` deve apontar para o PostgreSQL correto.
