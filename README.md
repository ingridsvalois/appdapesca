# App da Pesca — E-commerce

E-commerce para a loja **App da Pesca**, especializada em artigos de pesca.

## Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion, Zustand, Stripe Elements
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Banco de dados**: PostgreSQL
- **Autenticação**: JWT (access + refresh) em cookies HttpOnly
- **Pagamentos**: Stripe (cartão, Pix)
- **Containerização**: Docker e Docker Compose

## Estrutura

- `backend/` — API REST (porta 5000)
- `frontend/` — Aplicação web (porta 3000)

## Variáveis de ambiente

### Raiz (para Docker Compose)

Copie `.env.example` para `.env` e ajuste:

| Variável | Descrição |
|----------|-----------|
| `FRONTEND_URL` | URL do frontend (ex: `http://localhost:3000`) |
| `BACKEND_URL` | URL do backend (ex: `http://localhost:5000`) |
| `POSTGRES_USER` | Usuário PostgreSQL |
| `POSTGRES_PASSWORD` | Senha PostgreSQL |
| `POSTGRES_DB` | Nome do banco |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook Stripe |

### Backend (`backend/.env`)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL (ex: `postgresql://user:pass@localhost:5432/dbname`) |
| `FRONTEND_URL` | Origem permitida no CORS |
| `JWT_ACCESS_SECRET` | Segredo do token de acesso |
| `JWT_REFRESH_SECRET` | Segredo do refresh token |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook Stripe |

### Frontend (`frontend/.env`)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL da API (ex: `http://localhost:5000`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chave pública Stripe |

## Como rodar

### Com Docker Compose

1. Na raiz: copie `.env.example` para `.env` e preencha.
2. Suba os serviços:
   ```bash
   docker-compose up --build
   ```
3. Em outro terminal, rode as migrations (uma vez):
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```
4. Frontend: http://localhost:3000  
   Backend: http://localhost:5000  
   Documentação da API: http://localhost:5000/api/docs

### Sem Docker (local)

1. **PostgreSQL** rodando localmente (ex: porta 5432).
2. **Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edite .env (DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, etc.)
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```
3. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   # Edite .env (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   npm install
   npm run dev
   ```
4. Acesse http://localhost:3000

## Scripts úteis

- **Raiz**: `npm run dev:backend`, `npm run dev:frontend`, `npm run dev:all` (com concurrently)
- **Backend**: `npm run dev`, `npm run build`, `npm run start`, `npm run prisma:migrate`, `npm run test`
- **Frontend**: `npm run dev`, `npm run build`, `npm run start`

## Documentação da API

Com o backend rodando, acesse **http://localhost:5000/api/docs** para a documentação Swagger (OpenAPI).

Principais grupos de endpoints:

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`
- **Usuário**: `GET/PUT /api/users/me`, `GET/POST/PUT/DELETE /api/users/me/addresses`
- **Categorias**: `GET /api/categories`
- **Produtos**: `GET /api/products`, `GET /api/products/:slug`, `POST /api/products/:id/reviews`
- **Carrinho**: `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/:id`, `DELETE /api/cart/items/:id`
- **Pedidos**: `GET /api/orders`, `GET /api/orders/:id`
- **Checkout**: `POST /api/checkout/create-payment-intent`
- **Webhook**: `POST /api/webhooks/stripe`
- **Admin** (requer role ADMIN): `GET/POST/PUT/DELETE /api/admin/categories`, `GET/POST/PUT/DELETE /api/admin/products`, `GET /api/admin/orders`, `GET /api/admin/orders/:id`, `PATCH /api/admin/orders/:id/status`

## Testes

- **Backend** (em `backend/`): `npm test` — Jest + Supertest (rota de health e auth). Para testes de auth, é necessário `DATABASE_URL` configurada.
- **Frontend**: testes E2E com Cypress podem ser configurados em `frontend/cypress/` (opcional).

## Deploy

- **Frontend**: Vercel — conecte o repositório, configure `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, e use o build command padrão do Next.js.
- **Backend**: Render, Railway ou AWS — configure as variáveis de ambiente, use `npm run build` e `npm run start`. Rode `npx prisma migrate deploy` no startup ou em um job.
- **Banco**: use um PostgreSQL gerenciado (ex: Render, Railway, Supabase, Neon) e defina `DATABASE_URL` no backend.
- **Stripe**: em produção, use chaves live e configure o webhook para a URL do backend (ex: `https://seu-backend.com/api/webhooks/stripe`).

## Primeiro usuário admin

Por padrão, novos usuários são criados com role `USER`. Para criar um admin, altere manualmente no banco após o primeiro cadastro:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'seu@email.com';
```

Ou use um seed do Prisma (crie em `prisma/seed.ts` e configure no `package.json`: `"prisma": { "seed": "ts-node prisma/seed.ts" }`).
