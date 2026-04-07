# Frontend

## Visão geral

O frontend do NES-FREQUÊNCIA é uma aplicação React que oferece interface para login, administração de sessões, check-in de alunos e geração de relatórios.

## Tecnologias principais

- React
- Vite
- React Router DOM
- Axios

## Estrutura do frontend

```text
frontend/
├── package.json
├── package-lock.json
├── vite.config.js
├── nginx.conf
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/global.css
    ├── contexts/AuthContext.jsx
    ├── services/api.js
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

## Configuração de desenvolvimento

- `vite.config.js` define o servidor em `localhost:5173`.
- O proxy em `vite.config.js` redireciona chamadas de `/api` para `http://localhost:8000`.
- Isso permite que o frontend use caminhos relativos na API e funcione sem CORS nos ambientes de desenvolvimento.

## Comandos úteis

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Fluxo de autenticação

1. O usuário acessa `LoginPage.jsx`.
2. O formulário envia `login` e `senha` para `api.login()`.
3. O token JWT retornado é salvo em `localStorage`.
4. `AuthContext.jsx` mantém o estado do usuário e recarrega os dados no início.
5. Todas as requisições subsequentes usam o token no cabeçalho `Authorization`.
6. Rotas protegidas só ficam acessíveis se o usuário estiver autenticado.

## Principais componentes

### `App.jsx`

- Define as rotas públicas e privadas.
- Redireciona usuários conforme perfil (`aluno`, `professor`, `admin`).
- Monta layout comum para as páginas internas.

### `AuthContext.jsx`

- Gerencia estado de usuário e carregamento.
- Realiza chamada a `api.me()` para validar o token.
- Proporciona funções `login` e `logout`.

### `services/api.js`

- Cria instância Axios com `baseURL`.
- Adiciona token JWT automaticamente ao cabeçalho.
- Trata respostas de erro, especialmente 401.

### `Layout.jsx`

- Renderiza menu de navegação e área principal.
- Disponibiliza estrutura visual comum para o app.

### Páginas principais

- `LoginPage.jsx` — autenticação de usuário.
- `SessaoPage.jsx` — administração de sessões e tokens.
- `AlunosPage.jsx` — gestão de usuários/alunos.
- `HistoricoPage.jsx` — visualização de histórico de sessões.
- `RelatorioPage.jsx` — relatórios de frequência.
- `AlunoCheckinPage.jsx` — check-in de alunos por token.
- `AlunoFrequenciaPage.jsx` — visualização de frequência do aluno.

## Observações

- O frontend depende do backend estar disponível em `http://localhost:8000`.
- Se for necessária outra URL, configure `VITE_API_URL`.
- Os arquivos de build do frontend não devem ser versionados.
