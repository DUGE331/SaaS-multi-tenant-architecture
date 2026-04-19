# Multi-Tenant SaaS Architecture

A full-stack multi-tenant SaaS example built with Node.js, Express, PostgreSQL, and Next.js. The project focuses on tenant isolation, role-based access control, invitation onboarding, and the backend patterns commonly used in real SaaS products.

## What This Project Demonstrates

- Multi-tenant application design with shared infrastructure
- Tenant-scoped authorization and data access
- Invitation-driven onboarding flow
- Membership-based RBAC across multiple tenants
- Separation between frontend concerns and backend trust boundaries

## Screenshots

### Dashboard
<img width="2879" height="1632" alt="Screenshot 2026-04-03 202505" src="https://github.com/user-attachments/assets/c2852273-bb1a-496b-9115-8aa890d4e0ee" />

### Register
<img width="2863" height="1712" alt="Screenshot 2026-04-03 202304" src="https://github.com/user-attachments/assets/696ce650-d354-4470-b946-0cb2fa07d317" />


### Database / Tenant Isolation
<img width="2879" height="1799" alt="Database isolation screenshot" src="https://github.com/user-attachments/assets/eace2fc7-60bb-4b76-a6dc-7746da8e5837" />

## Tech Stack

- Frontend: Next.js
- Backend: Node.js, Express
- Database: PostgreSQL
- Local infrastructure: Docker Compose
- Auth: JWT
- Validation: Zod
- Query builder: Knex

## Core Features

- Tenant-scoped queries to prevent cross-tenant access
- Role-based permissions for `owner`, `admin`, and `member`
- Invitation acceptance flow for new users
- `/auth/me` endpoint for server-verified session state
- Member management for adding, updating, and removing users
- Support for users belonging to multiple tenants with different roles

## Architecture Note

Tenant isolation is enforced in backend queries, not delegated to the client. A representative pattern in the API looks like:

```js
.where({ tenant_id: req.user.tenantId })
```

That means the backend remains the source of truth for data access even if the frontend is bypassed or modified.

## Project Status

- Working locally
- Backend architecture is stable
- Frontend is functional with a refactored UI
- Full stack runs locally through Docker Compose
- Basic production hardening is in place
- Not yet deployed to a live environment
- Not yet fully production hardened

## Run Locally

1. Copy `.env.example` to `.env` and replace placeholder values.
2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
cd backend
npm install
cd ../frontend
npm install
```

4. Run database migrations:

```bash
cd backend
npm run migrate
```

5. Start the development servers:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## Run With Docker

1. Copy `.env.example` to `.env` and replace placeholder values.
2. Build and start the full stack:

```bash
docker compose up --build -d
```

3. Open the app at `http://localhost:3000`.
4. The backend API is available at `http://localhost:5000`.
5. PostgreSQL is available at `localhost:5433`.

Useful commands:

```bash
docker compose ps
```

```bash
docker compose logs -f backend
```

```bash
docker compose down
```

Notes:

- The backend container runs migrations before starting the API.
- The frontend build uses `NEXT_PUBLIC_API_URL`, which is baked into the Docker image during build time.

## Environment Variables

The repo includes a tracked example file at `.env.example`. Real secrets must stay in an untracked `.env` file.

Required values:

- `SERVER_PORT`
- `NEXT_PUBLIC_API_URL`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `DB_HOST`
- `DB_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `JWT_SECRET`

## Security Notes

- `.env` is intentionally ignored and should never be committed.
- Placeholder values in `.env.example` are safe to publish.
- Basic hardening currently includes `helmet`, auth rate limiting, structured backend logging, and container health checks.
- This repository is meant for learning and portfolio use, not direct production deployment without further hardening.

## Next Steps

- Deploy to the cloud 

## Production Planning

- Target production architecture: [docs/production-target-architecture.md](docs/production-target-architecture.md)
- Deployment runbook: [docs/deployment-runbook.md](docs/deployment-runbook.md)

## Notes

Architecture notes and development details live in `/docs` when present.
