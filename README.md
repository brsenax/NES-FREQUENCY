# NES — Sistema de Frequência

Sistema completo de controle de frequência escolar com suporte a aulas presenciais e online, código rotativo na tela, e três perfis de acesso.

---

## 1. Visão Geral da Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL   │
│  React+Vite  │ API │   FastAPI    │     │              │
│  port 5173   │     │  port 8000   │     │  port 5432   │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Frontend:** React 18 + Vite + React Router  
**Backend:** FastAPI + SQLAlchemy (async) + JWT + bcrypt  
**Banco:** PostgreSQL 16 com asyncpg  
**Deploy:** Docker Compose (ou serviços separados)

---

## 2. Estrutura de Pastas

```
nes-frequencia/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py              # Entry point FastAPI
│       ├── seed.py              # Seed inicial
│       ├── core/
│       │   ├── config.py        # Settings (pydantic)
│       │   ├── database.py      # Engine + session
│       │   └── security.py      # JWT + bcrypt + guards
│       ├── models/
│       │   ├── user.py          # User (admin/prof/aluno)
│       │   ├── disciplina.py    # Disciplina + pivots
│       │   └── sessao.py        # Sessao + Presenca
│       ├── schemas/
│       │   └── schemas.py       # Pydantic schemas
│       ├── services/
│       │   └── token_service.py # Token rotation
│       └── api/
│           ├── auth.py          # Login + /me
│           ├── users.py         # CRUD usuários
│           ├── disciplinas.py   # CRUD disciplinas
│           ├── sessoes.py       # Sessões + token
│           ├── checkin.py       # Check-in (token + manual)
│           └── relatorios.py    # Relatórios
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles/global.css
        ├── services/api.js
        ├── contexts/AuthContext.jsx
        ├── components/Layout.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── SessaoPage.jsx
            ├── AlunosPage.jsx
            ├── HistoricoPage.jsx
            ├── RelatorioPage.jsx
            ├── AlunoCheckinPage.jsx
            └── AlunoFrequenciaPage.jsx
```

---

## 3. Perfis e Regras de Negócio

| Perfil     | Pode fazer                                                    |
|-----------|---------------------------------------------------------------|
| **Admin**     | Tudo: CRUD alunos, disciplinas, professores. Relatório geral. |
| **Professor** | Iniciar sessão (suas disciplinas), chamada híbrida, relatório por disciplina. |
| **Aluno**     | Fazer check-in por token, ver suas frequências.               |

### Disciplinas e Modos

| Disciplina                    | Modo    | Comportamento                                              |
|------------------------------|---------|-------------------------------------------------------------|
| Geometria Analítica          | Código  | Todos marcam presença pelo código na tela                   |
| Programação Estruturada      | Código  | Todos marcam presença pelo código na tela                   |
| Inteligência Artificial      | Código  | Todos marcam presença pelo código na tela                   |
| Ciência dos Dados            | Código  | Todos marcam presença pelo código na tela                   |
| Funções Elementares          | Híbrido | Código para online + chamada manual para presencial         |
| Probabilidade e Estatística  | Híbrido | Código para online + chamada manual para presencial         |

---

## 4. Código de Presença (Token Rotativo)

O professor inicia uma sessão e um **código numérico de 6 dígitos** aparece em destaque na tela. O aluno digita esse código no sistema para confirmar presença.

- Token de **6 dígitos** numéricos
- Rotação automática a cada **20 segundos**
- Exibido em fonte grande na tela do professor para projeção
- O ID da sessão também é exibido para o aluno informar

**Fluxo:**
1. Professor inicia sessão → código aparece grande na tela (ex: `482917`)
2. Aluno loga no sistema → digita o ID da sessão + código de 6 dígitos
3. Backend valida: token ativo, não expirado, aluno matriculado, sem duplicata
4. Presença registrada com horário e método (token ou manual)

**Validações do backend:**
- Aluno autenticado (JWT)
- Aluno matriculado na disciplina da sessão
- Token corresponde ao token atual da sessão
- Token não expirado (janela de 2× o intervalo de rotação = 40s)
- Aluno não pode marcar presença duas vezes na mesma sessão

---

## 5. Rodar Localmente (sem Docker)

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL rodando na porta 5432

### Backend

```bash
cd backend
cp .env.example .env        # edite se necessário
pip install -r requirements.txt
# Criar banco
createdb nes_frequencia      # ou via psql

# Rodar seed
python -m app.seed

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**

---

## 6. Rodar com Docker (recomendado)

```bash
docker compose up --build
```

Depois rode o seed:

```bash
docker compose exec backend python -m app.seed
```

Acesse **http://localhost** (porta 80)

---

## 7. Seed Inicial — Credenciais

| Perfil     | Login              | Senha   |
|-----------|-------------------|---------|
| Admin      | admin@nes.edu.br   | nes2026 |
| Professor  | vitor@nes.edu.br   | nes2026 |
| Professor  | maria@nes.edu.br   | nes2026 |
| Professor  | joao@nes.edu.br    | nes2026 |
| Alunos     | NES0001 a NES0020  | nes2026 |

---

## 8. Deploy em Produção

### Opção A: Render.com

**Backend (Web Service):**
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env vars: DATABASE_URL, SECRET_KEY, CORS_ORIGINS

**Frontend (Static Site):**
- Root directory: `frontend`
- Build: `npm install && npm run build`
- Publish dir: `dist`
- Env var: `VITE_API_URL=https://seu-backend.onrender.com`

**Banco:** Render PostgreSQL ou Supabase/Neon.

### Opção B: VPS com Docker

```bash
git clone <repo>
cd nes-frequencia
cp backend/.env.example backend/.env
# Edite backend/.env com SECRET_KEY real e DATABASE_URL
docker compose -f docker-compose.yml up -d --build
docker compose exec backend python -m app.seed
```

### Variáveis de Ambiente (produção)

```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/nes_frequencia
SECRET_KEY=<openssl rand -hex 32>
CORS_ORIGINS=["https://seu-frontend.com"]
VITE_API_URL=https://seu-backend.com
```

---

## 9. Plano de Migração do Protótipo

| # | Etapa                              | Status |
|---|-------------------------------------|--------|
| 1 | Substituir persistência local por API | ✅ Feito |
| 2 | Login real com JWT                    | ✅ Feito |
| 3 | Código rotativo na tela (sem QR)        | ✅ Feito |
| 4 | Token rotativo a cada 20s             | ✅ Feito |
| 5 | Perfis admin/professor/aluno          | ✅ Feito |
| 6 | Professor só vê suas disciplinas      | ✅ Feito |
| 7 | Relatório consolidado (admin)         | ✅ Feito |
| 8 | Frequência geral = presencas/sessões  | ✅ Feito |
| 9 | Modo híbrido (código + manual)        | ✅ Feito |
| 10| Docker para deploy                    | ✅ Feito |

---

## 10. Checklist de Validação

- [ ] **Login admin:** admin@nes.edu.br / nes2026 → vê todas as abas
- [ ] **Login professor:** vitor@nes.edu.br / nes2026 → vê só suas disciplinas
- [ ] **Login aluno:** NES0001 / nes2026 → vê check-in + frequências
- [ ] **Professor vendo só sua disciplina:** maria@nes.edu.br só vê 3 disciplinas
- [ ] **Token girando:** na tela de sessão ativa, o código de 6 dígitos muda a cada 20s
- [ ] **Aluno marcando presença:** loga como NES0001, digita sessão ID + token → sucesso
- [ ] **Bloqueio de presença duplicada:** tenta marcar de novo → erro
- [ ] **Token expirado:** espera >40s sem rotação → erro ao tentar
- [ ] **Modo híbrido:** em Funções, aluno online faz check-in + professor marca presencial
- [ ] **Na lista manual, aluno online aparece como "Online ✓"** (sem botão de falta)
- [ ] **Relatório do professor:** seleciona disciplina → vê frequência por aluno
- [ ] **Relatório geral (admin):** tabela com todas disciplinas + frequência geral
- [ ] **Destaque vermelho para <50%**
- [ ] **Histórico:** lista sessões, expande para ver presenças detalhadas
- [ ] **Cadastro em lote:** admin adiciona 5 nomes de uma vez
