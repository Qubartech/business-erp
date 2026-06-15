# ERP System

Internal ERP built per the included `ERP_System_Development_Plan.pdf` spec.

- **Backend**: Node 22 + Express + TypeScript + Prisma + JWT (modular monolith).
- **Frontend**: React 19 + Vite + TypeScript + React Router + TanStack Query + RHF + Zod + Tailwind.
- **Database**: hosted Supabase PostgreSQL (no local Postgres container).
- **Storage**: Supabase Storage for document uploads.
- **Runtime**: Docker Compose with `backend`, `frontend`, `nginx` services.

> The scaffold at the repo root is unused by this app. Run the app via Docker Compose only.

## First-run setup

1. Copy env and fill in values:
   ```bash
   cp .env.example .env
   ```
2. Bring up services:
   ```bash
   docker compose up -d
   ```
3. Install deps inside the containers:
   ```bash
   docker compose exec backend npm install
   docker compose exec frontend npm install
   ```
4. Apply database schema and seed the initial admin user:
   
   > [!NOTE]
   > If your `DATABASE_URL` uses a connection pooler (e.g. port `6543` with `?pgbouncer=true`), Prisma migrations will hang. You must override `DATABASE_URL` to connect directly via port `5432` without `pgbouncer=true`:
   
   ```bash
   # Replace with your direct connection URL (port 5432)
   docker compose exec -e DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>" backend npx prisma migrate deploy
   docker compose exec -e DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>" backend npm run seed
   ```
5. Open <http://localhost:8080>. Default admin: `admin@example.com` / `admin1234` (change it immediately).

## Day-to-day commands

```bash
docker compose up -d
docker compose exec backend npm run dev
docker compose exec backend npm test
docker compose exec frontend npm run dev
docker compose exec frontend npm run build
docker compose exec frontend npm test
```

## Modules (per phase)

- **Phase 1**: Auth (JWT + refresh tokens, RBAC) · Dashboard summary cards · User management.
- **Phase 2**: Projects · Tasks (statuses, priorities, filters).
- **Phase 3**: Notes (rich text + search) · Time tracking (timer + manual entries).
- **Phase 4**: Documents (Supabase Storage).
- **Phase 5**: Settings (key/value, admin-only).

## API

Base URL: `/api`. All responses follow:

```json
{ "success": true,  "message": "...", "data": { } }
{ "success": false, "message": "...", "errors": { } }
```
