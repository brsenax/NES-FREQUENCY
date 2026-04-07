# Deploy e Execução

Este documento descreve como executar o NES-FREQUÊNCIA localmente, tanto com Docker quanto sem Docker. Ele também detalha as portas usadas, o seed de dados e as boas práticas de configuração.

## Pré-requisitos

- Node.js 20+
- npm
- Docker e Docker Compose (para execução com container)
- PostgreSQL local ou via Docker

## Executando com Docker Compose

No diretório raiz do projeto:

```bash
cd /home/victor/NES-FREQUENCY
docker compose up --build
```

### Serviços disponíveis

- `db` — PostgreSQL 16
- `backend` — backend Express + Prisma
- `frontend` — build do React servido por Nginx

### Portas padrão

- Frontend: `http://localhost`
- Backend: `http://localhost:8000`
- Banco PostgreSQL: `localhost:5433`

### Seed de dados

Após subir os serviços, execute o seed para criar usuários e dados de exemplo:

```bash
docker compose exec backend npm run seed
```

### Comandos úteis em Docker

- Iniciar todos os serviços: `docker compose up --build`
- Parar todos os serviços: `docker compose down`
- Ver status dos serviços: `docker compose ps`

## Executando sem Docker

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### URLs de desenvolvimento

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Configuração do banco de dados

### Com Docker

Use a URL definida no `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/nes_frequencia
```

### Sem Docker

Se o PostgreSQL estiver instalado localmente, use:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nes_frequencia
```

## Boas práticas

- Não versionar arquivos de ambiente (`backend/.env`, `frontend/.env.local`).
- Não versionar dependências instaladas (`node_modules/`).
- Não versionar arquivos de build (`frontend/dist/`).
- Sempre executar `npx prisma db push` após alterar `backend/prisma/schema.prisma`.

## Observações

- O frontend usa proxy em `frontend/vite.config.js` para redirecionar `/api` ao backend.
- O backend deve estar rodando antes do frontend consumir a API.
- A seed de dados deve ser executada apenas uma vez em ambientes de teste ou desenvolvimento.
