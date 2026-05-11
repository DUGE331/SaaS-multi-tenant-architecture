# Multi-Tenant SaaS Architecture

A full-stack multi-tenant SaaS example built with Node.js, Express, PostgreSQL, and Next.js. The project focuses on tenant isolation, role-based access control, invitation onboarding, and the backend patterns commonly used in real SaaS products.

## AWS Deployment Highlight

This project has been deployed in a hybrid cloud setup using:

- `Frontend`: Vercel
- `Backend`: AWS ECS Fargate
- `Database`: AWS RDS PostgreSQL
- `Container registry`: Amazon ECR
- `Load balancing`: Application Load Balancer
- `Logs`: CloudWatch Logs

Deployment outcome:

- the backend was deployed successfully to AWS and exposed through an ALB
- production database migrations were executed successfully against RDS
- the backend `/health` endpoint responded publicly from the live AWS environment
- the frontend was deployed to Vercel
- the remaining production gap is HTTPS on the backend ALB so the browser can call the API from the deployed frontend

## What This Project Demonstrates

- Multi-tenant application design with shared infrastructure
- Tenant-scoped authorization and data access
- Invitation-driven onboarding flow
- Membership-based RBAC across multiple tenants
- Separation between frontend concerns and backend trust boundaries
- Containerized backend deployment to AWS ECS Fargate
- Managed PostgreSQL migration to AWS RDS
- Load balancer health checks and cloud runtime verification

## Screenshots

### ECS Backend Service Running
![alt text](<Screenshot 2026-05-05 171524.png>)

### AWS Target Group Healthy
![alt text](<Screenshot 2026-05-05 171543.png>)

### Live Backend Health Check
![alt text](<Screenshot 2026-05-05 171249.png>)

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
- Secure internal AI assistant backed by AWS Bedrock

## Secure Internal AI Assistant

`SekuroChat-lite` is a tenant-aware internal assistant embedded into the SaaS platform rather than a generic chatbot bolted onto the side.

It currently demonstrates:

- tenant-scoped knowledge entries managed by `owner` and `admin` roles
- private assistant conversations scoped by both `tenant_id` and `created_by_user_id`
- AWS Bedrock integration behind a provider abstraction
- backend-first security controls including validation, rate limiting, quota checks, prompt-abuse rejection, and metadata-only usage events

The assistant currently uses curated tenant knowledge plus lightweight project context. It does not use vector search, unrestricted database access, or cross-tenant context.

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
- Backend deployed successfully to AWS ECS Fargate
- Database migrated successfully to AWS RDS PostgreSQL
- Frontend deployed successfully to Vercel
- Public backend health endpoint verified through ALB
- Full browser-based production flow still needs HTTPS on the backend
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

Assistant-related values:

- `AI_ASSISTANT_ENABLED`
- `AI_PROVIDER`
- `AI_BEDROCK_REGION`
- `AI_BEDROCK_MODEL_ID`
- `AI_BEDROCK_INFERENCE_PROFILE_ID`
- `AI_SYSTEM_PROMPT`
- `AI_MAX_INPUT_MESSAGES`
- `AI_MAX_KNOWLEDGE_ITEMS`
- `AI_MAX_RESPONSE_TOKENS`
- `AI_TEMPERATURE`
- `AI_MAX_USER_REQUESTS_PER_WINDOW`
- `AI_MAX_TENANT_REQUESTS_PER_WINDOW`
- `AI_MAX_TENANT_REQUESTS_PER_DAY`

## Assistant Security

The internal assistant is designed as a tenant-aware workspace feature rather than a general chatbot.

Current security controls include:

- assistant routes require authentication
- knowledge management is limited to `owner` and `admin`
- assistant conversations are scoped by both `tenant_id` and `created_by_user_id`
- assistant prompt inputs are validated and size-limited
- assistant usage is rate-limited at both user and tenant levels
- daily tenant assistant usage is capped through metadata-only usage events
- prompt injection attempts targeting hidden instructions, secrets, or cross-tenant access are rejected
- backend logs redact sensitive assistant request fields and authorization headers
- assistant usage persistence stores metadata only, not token secrets or raw audit copies of prompts outside chat history

Current limitation:

- assistant conversations still persist full chat content as product data, so users should not paste passwords, API keys, or sensitive personal information into the assistant
- some Bedrock models in `ap-southeast-2` require an inference profile rather than direct on-demand model invocation, so local or cloud runtime config may need `AI_BEDROCK_INFERENCE_PROFILE_ID`

## Security Notes

- `.env` is intentionally ignored and should never be committed.
- Placeholder values in `.env.example` are safe to publish.
- Basic hardening currently includes `helmet`, auth rate limiting, structured backend logging, and container health checks.
- This repository is meant for learning and portfolio use, not direct production deployment without further hardening.

## Next Steps

- Add HTTPS to the backend ALB with ACM and a custom domain
- Move runtime secrets to AWS Secrets Manager or SSM Parameter Store
- Separate ALB, ECS, and RDS security groups more cleanly
- Optionally add Infrastructure as Code for repeatable cloud setup

## Production Planning

- Target production architecture: [docs/production-target-architecture.md](docs/production-target-architecture.md)
- Deployment runbook: [docs/deployment-runbook.md](docs/deployment-runbook.md)

## Notes

Architecture notes and development details live in `/docs` when present.
