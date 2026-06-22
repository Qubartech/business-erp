# Qubartech ERP System

Internal ERP built per the `ERP_System_Development_Plan.pdf` specification, consolidated and migrated into a unified Next.js App Router application.

- **Stack**: Next.js 16 + React 19 + TypeScript + Prisma + Tailwind CSS v4 + TanStack Query + Supabase.
- **Database**: Supabase PostgreSQL (or any compatible Postgres database).
- **Storage**: Supabase Storage for document uploads.
- **Application Structure**: Next.js workspace is located inside the `web/` folder.
- **Orchestration**: Root-level script forwarding allows running and compiling the project directly from the root directory.
- **Runtime**: Docker Compose with `db`, `web` (Next.js), and `nginx` services.

---

## First-Run Setup

1. **Configure Environment Variables**:
   Copy `.env.example` to `.env` inside the `web/` directory and configure the environment values (database URLs, Supabase tokens, JWT secret):
   ```bash
   cp web/.env.example web/.env
   ```

2. **Start Services via Docker Compose**:
   Bring up the database and services:
   ```bash
   docker compose up -d
   ```

3. **Install Dependencies**:
   Install dependencies from the root directory (automatically delegates to the `web` workspace):
   ```bash
   npm install --prefix web
   ```

4. **Apply Database Migrations & Seed Data**:
   Ensure migrations are applied and the default admin user is seeded:
   ```bash
   # Generates Prisma clients
   npm run prisma:generate
   
   # Applies pending migrations to the database
   npm run prisma:deploy
   
   # Seeds the initial administrator
   npm run seed
   ```

5. **Open the Application**:
   Navigate to <http://localhost:8080>.
   - **Default Admin Account**: `admin@example.com` / `admin1234` (Please change this immediately).

---

## Day-to-Day Development Commands

All npm commands can be run directly from the root workspace:

```bash
# Run Next.js in development mode
npm run dev

# Run Next.js in production build mode
npm run build

# Start the built production server locally
npm run start
```

---

## Architecture & Project Structure

- `web/src/app/`: Next.js Page routes and backend `/api/` route handlers.
- `web/src/views/`: Reusable page layouts and dashboard/tasks/projects/profile screens.
- `web/src/components/`: Shared UI components (Modals, Tooltips, Loading indicators, Buttons).
- `web/src/features/`: Custom React hooks, providers, and state contexts (auth, theme, time tracking).
- `web/prisma/`: Prisma database schema definitions, migrations, and seeding scripts.
