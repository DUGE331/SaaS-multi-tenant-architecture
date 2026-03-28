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
<img width="1059" height="1439" alt="Dashboard screenshot" src="https://github.com/user-attachments/assets/7af59c91-a73b-41a2-bc6b-79d39c7b7566" />

### Invitation Flow
<img width="1879" height="1311" alt="Invitation flow screenshot" src="https://github.com/user-attachments/assets/8b0835e1-38ac-4ab1-89c1-47dc3c2d8110" />

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
- Frontend is functional but still minimal
- Not yet deployed
- Not yet production hardened

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
- This repository is meant for learning and portfolio use, not direct production deployment without further hardening.

## Next Steps

- Add integration tests for auth, RBAC, and tenant isolation
- Improve frontend validation and error states
- Add invite resend and token regeneration flows
- Add project update and delete permissions
- Prepare a production deployment path

## Notes

Architecture notes and development details live in `/docs` when present.
