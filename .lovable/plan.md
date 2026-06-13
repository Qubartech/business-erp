## Approach

You'll run the project yourself, so I'll generate the codebase exactly per your PDF spec (Express + Prisma + JWT + Docker + separate React/Vite frontend). The existing TanStack Start scaffold in this Lovable project will be left untouched at the root — the new code lives in `backend/`, `frontend/`, `nginx/`, and root `docker-compose.yml`. The Lovable preview will not render this app; you run it locally with `docker compose up -d`.

All 5 phases will be built in one delivery.

## Repository layout

```text
/
├── docker-compose.yml
├── nginx/
│   └── default.conf
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── tests/                     # vitest: unit, service, api
│   └── src/
│       ├── app.ts                 # express app, middleware wiring
│       ├── server.ts              # http listen
│       ├── lib/                   # prisma client, jwt, errors, response, di container
│       ├── middleware/            # auth, role, error handler, request validator
│       ├── services/              # cross-cutting (token, hash, storage)
│       ├── validators/            # shared Zod schemas
│       ├── routes/                # route index, mounts feature routers
│       ├── auth/                  # controller, service, routes, schemas
│       ├── users/
│       ├── projects/
│       ├── tasks/
│       ├── notes/
│       ├── time-entries/
│       ├── documents/
│       └── settings/
└── frontend/
    ├── Dockerfile
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    ├── package.json
    └── src/
        ├── app/                   # providers, router root
        ├── routes/                # route definitions
        ├── layouts/               # AppLayout (sidebar+topbar), AuthLayout
        ├── pages/                 # thin pages, one per route
        ├── features/
        │   ├── auth/  users/  projects/  tasks/  notes/
        │   ├── time-tracking/  documents/  settings/  dashboard/
        ├── components/            # ReusableTable, ReusableForm, FormFields, Modal, etc.
        ├── services/              # axios client, api modules per feature
        ├── hooks/                 # useAuth, usePermissions, useDebounce
        ├── lib/                   # queryClient, axios, formatters
        ├── utils/
        └── types/
```

## Backend details

- **Stack**: Node 22, Express 4, TypeScript, Prisma (PostgreSQL), Zod, bcrypt, jsonwebtoken, multer (for Supabase Storage uploads), @supabase/supabase-js (storage only), vitest + supertest.
- **Architecture**: thin controllers → services (business logic) → Prisma. DI via a small typed container so services receive `{ prisma, logger, ... }` and tests can inject mocks. Transactions via `prisma.$transaction` for multi-step writes (create user+role, create project+members, etc.).
- **Auth**: `POST /api/auth/login` issues short access JWT (15m) + refresh token (7d) persisted in `refresh_tokens`. `POST /api/auth/refresh`, `POST /api/auth/logout` (revokes refresh), `GET /api/auth/me`. `requireAuth` middleware decodes access token; `requireRole('admin' | 'manager' | 'member')` enforces RBAC per the PDF role matrix.
- **Response envelope** (every route, success and error):
  - `{ success: true, message, data }`
  - `{ success: false, message, errors }` — Zod field errors mapped here.
- **Validation**: every request body/query parsed by a Zod schema via a `validate(schema)` middleware. Schemas colocated in each feature.
- **Modules and tables** (Prisma schema covers all phases up front; routes/services delivered per phase order):
  - Phase 1: `users`, `refresh_tokens`; dashboard summary endpoint; user CRUD + activate/deactivate + role assign.
  - Phase 2: `projects` (Draft/Active/OnHold/Completed/Archived), `project_members`; `tasks` (Todo/InProgress/Review/Done × Low/Medium/High/Critical) with filters (status, priority, assignee, project, due-date range).
  - Phase 3: `notes` (rich text stored as HTML/Markdown string; full-text search via `to_tsvector` index); `time_entries` (start/stop timer endpoints + manual entry, duration auto-computed on stop).
  - Phase 4: `documents` — file uploaded via multer → streamed to Supabase Storage bucket `documents`, metadata row in PostgreSQL; download endpoint returns signed URL; optional `project_id` link.
  - Phase 5: `settings` key/value store; endpoints scoped to admin.
- **Tests**: vitest with three layers — unit (pure helpers, validators), service (services with a Prisma test client against a disposable schema), api (supertest against the Express app with mocked services). One representative spec per module so the harness is real, not just placeholders.

## Frontend details

- **Stack**: React 19 + TypeScript, Vite, React Router v6 (the PDF specifies React Router, not TanStack Router), TanStack Query, Axios, React Hook Form + Zod (`@hookform/resolvers/zod`), Tailwind CSS, lucide-react for icons, sonner for toasts.
- **Design**: clean neutral admin — slate/zinc surfaces, single blue accent, dense data tables, persistent collapsible left sidebar with role-filtered nav, top bar with user menu. No charts in v1 per spec; dashboard is summary cards.
- **Reusable primitives** (the core of "fast future extension"):
  - `<DataTable />` — columns config, sorting, pagination, row actions, empty/loading states, server-side query integration.
  - `<FormShell />` + typed field components (`<TextField>`, `<SelectField>`, `<DateField>`, `<TextareaField>`, `<RichTextField>`) — all wired to RHF context with Zod-resolver error display.
  - `<ConfirmDialog>`, `<PageHeader>`, `<StatusBadge>`, `<PriorityBadge>`, `<EmptyState>`.
- **Feature layout** (each feature folder): `api.ts` (axios calls), `hooks.ts` (TanStack Query wrappers: `useUsersQuery`, `useCreateUserMutation`, etc.), `schemas.ts` (Zod), `components/` (feature-specific UI), `pages/` (thin route components that just compose hooks + components).
- **Auth**: `AuthProvider` stores access token in memory + refresh in httpOnly cookie (set by backend). Axios interceptor auto-refreshes on 401, retries once, redirects to `/login` on hard failure. `<ProtectedRoute roles={[...]} />` wrapper gates routes per PDF role matrix.
- **Routes implemented**:
  - `/login`
  - `/` dashboard (summary cards)
  - `/users`, `/users/new`, `/users/:id` (admin only)
  - `/projects`, `/projects/new`, `/projects/:id` (members tab, tasks tab)
  - `/tasks` with filter bar, `/tasks/new`, `/tasks/:id`
  - `/notes` personal list + rich text editor (TipTap, lightweight setup)
  - `/time` timer widget + entries list + manual entry modal
  - `/documents` list + upload + per-project filter
  - `/settings` admin-only key/value editor
- **Tests**: vitest + @testing-library/react. Component tests for `<DataTable>` and one feature list. Form validation tests for create-user and create-task forms.

## Docker & infra

- `docker-compose.yml` services:
  - `backend` — Node 22 image, mounts `./backend`, runs `npm run dev`, expects `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` from `.env`.
  - `frontend` — Node 22 image, runs Vite dev on `:5173`.
  - `nginx` — reverse proxy: `/api` → backend, `/` → frontend, exposed on `:8080`.
- No local Postgres container (you use hosted Supabase Postgres per spec).
- `.env.example` documents every required variable.
- Root `README.md` with the exact commands from your spec (`docker compose up -d`, `docker compose exec backend npm run prisma:migrate`, `... npm test`, etc.) plus first-run steps (run migrations, seed an initial admin).

## What's intentionally out of scope (per spec)

- Charts/analytics on dashboard (summary cards only).
- Microservices, CQRS, event sourcing, GraphQL.
- Local Postgres container.
- Heavy animations / decorative UI.

## Delivery order within this single build

1. Root `docker-compose.yml`, `nginx/default.conf`, `.env.example`, README.
2. Backend skeleton: app, server, response envelope, error handler, Zod validate middleware, Prisma schema (all phases), DI container, auth middleware, RBAC middleware, one vitest config + sample specs.
3. Backend modules in phase order (auth → users → dashboard → projects → tasks → notes → time-entries → documents → settings), each with controller, service, routes, validators, and one test file.
4. Frontend skeleton: Vite + Tailwind + router + query client + axios + AuthProvider + ProtectedRoute + AppLayout/sidebar + DataTable + FormShell + field components + vitest setup.
5. Frontend feature pages in the same phase order, each wiring hooks + reusable primitives.

After delivery you'll run:

```bash
cp .env.example .env   # fill in DATABASE_URL + SUPABASE keys + JWT secrets
docker compose up -d
docker compose exec backend npm install
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed   # creates initial admin
docker compose exec frontend npm install
# app on http://localhost:8080
```

## Risks to confirm before I start

- **Repo size**: this generates ~150–200 files in one turn. Expect a long build step.
- **Lovable preview will be blank/broken** for this project after delivery (the root is still TanStack Start, which I'm not touching, but the meaningful app lives in `backend/`+`frontend/`). You'll only run it via Docker locally.
- **I won't be able to test it end-to-end** here (no Node runtime for Express, no Docker). Test specs will exist and be structured correctly, but real `npm test` / `docker compose up` validation happens on your machine.

Confirm and I'll start building.
