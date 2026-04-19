# Production Target Architecture

This document defines the target production architecture for the multi-tenant SaaS application in this repository.

The goal is not "most enterprise" or "most complex." The goal is:

- professional and defensible
- aligned with common software engineering practices
- AWS-first
- cheap enough to stand up briefly for portfolio evidence, then tear down

## 1. Architecture Goal

The production target for this project is:

- a public frontend URL for the Next.js app
- a public API URL for the Express backend
- a managed PostgreSQL database
- secure environment variable and secret handling
- repeatable deployment steps
- enough hardening to be credible for a real junior-to-mid software engineering portfolio project

This is a "small production" target, not a high-scale design.

## 2. Recommended AWS Deployment Shape

The recommended low-cost AWS-first architecture is:

- `Frontend`: Vercel for cheapest and fastest deployment of Next.js
- `Backend API`: AWS ECS Fargate running one small container
- `Database`: AWS RDS PostgreSQL, smallest practical instance
- `Container Registry`: Amazon ECR
- `Secrets`: AWS Systems Manager Parameter Store or AWS Secrets Manager
- `DNS / TLS`: Route 53 + ACM only if using a custom domain
- `Logs`: CloudWatch Logs

This is the recommended portfolio path because:

- it shows AWS experience where it matters
- it avoids forcing the frontend onto more expensive or more awkward AWS hosting
- it keeps the backend and database in the AWS ecosystem
- it is easier to explain in interviews than a fully self-hosted stack

## 3. Why This Is the Target Architecture

### Why not deploy everything to AWS?

You can, but it is not the cheapest or simplest path for a Next.js portfolio app.

For this project, a professional engineer would optimize for:

- clear separation of concerns
- low operational overhead
- managed services where possible
- minimal moving parts

Putting the frontend on Vercel and the backend/database on AWS is a normal and credible architecture.

### Why ECS Fargate for the backend?

Because it demonstrates useful AWS skills without adding server management:

- containerized deployment
- task definitions
- service configuration
- environment variable and secret injection
- CloudWatch logging
- ALB target health checks

It is more professional than manually SSHing into an EC2 instance, while still understandable.

### Why RDS PostgreSQL?

Because the app already depends on PostgreSQL and production data should be persistent.

RDS gives:

- managed Postgres
- automated backups
- standard networking and security group controls
- a setup that employers will recognize immediately

## 4. Runtime Topology

The intended runtime topology is:

1. A user visits the frontend URL.
2. The Next.js frontend sends API requests to the backend URL.
3. The backend validates auth, authorization, and tenant scoping.
4. The backend reads and writes data in PostgreSQL.
5. Application logs go to CloudWatch.

### Logical component diagram

```text
Browser
  -> Frontend (Vercel)
  -> Backend API (ECS Fargate behind ALB)
  -> PostgreSQL (RDS)

Backend supporting services:
  -> ECR for container image
  -> CloudWatch Logs for runtime logs
  -> SSM Parameter Store / Secrets Manager for secrets
```

## 5. Networking Design

The low-cost target networking design is:

- `VPC`
- `2 public subnets`
- `2 private subnets`
- `ALB` in public subnets
- `ECS tasks` in private subnets
- `RDS` in private subnets

This is the professional target because:

- the database should not be publicly exposed
- the backend should be reachable through a load balancer, not directly
- the architecture mirrors common real-world AWS patterns

If cost becomes a major issue for a one-day demo, a simplified variant is acceptable:

- ALB in public subnets
- ECS task in public subnet
- RDS still private

That is less ideal than full private backend networking, but still reasonable for a temporary portfolio deployment if clearly documented as a cost optimization.

## 6. Production Configuration Model

The production environment should provide:

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

Production principles:

- never commit real secrets
- store secrets outside the repo
- inject secrets at runtime
- keep frontend public config separate from backend secrets

## 7. Production Hardening Baseline

Before calling this architecture production-ready, the following baseline improvements should exist.

### Already completed in this repository

- Dockerfiles exist for `backend` and `frontend`
- the local stack can run through Docker Compose
- health checks exist for database, backend, and frontend containers
- `helmet` is enabled in the Express app
- rate limiting exists for `/auth/login` and `/auth/register`
- structured request and error logging exists through `pino` / `pino-http`

### Must-have before deployment

- document the production env vars
- define a repeatable migration step
- lock `CORS_ORIGIN` to real frontend URLs
- use a strong `JWT_SECRET`

### Strongly recommended for credibility

- plan to move auth from `localStorage` to `HttpOnly` cookies

### Can wait if cost and time are tight

- Infrastructure as Code with Terraform or CDK
- WAF
- autoscaling
- distributed tracing
- advanced monitoring dashboards

## 8. Authentication Position

Current state:

- JWT is returned by the backend
- frontend stores the token in `localStorage`
- frontend sends the token in the `Authorization` header

Portfolio position:

- acceptable for a learning project
- not ideal for a production-grade security posture

Target direction:

- move toward `HttpOnly`, `Secure` cookies for session handling

For a one-day portfolio deployment, it is acceptable to keep the current auth model if the README or architecture notes explicitly state:

- current auth is suitable for demonstration
- cookie-based auth is the next hardening step

That shows good engineering judgment without forcing unnecessary change right now.

## 9. Container and Deploy Model

The target delivery model is:

### Frontend

- build the Next.js app in production mode
- deploy to Vercel
- configure `NEXT_PUBLIC_API_URL` to point at the backend ALB or API domain

### Backend

- build a Docker image
- push the image to ECR
- deploy the image to ECS Fargate
- inject config and secrets through ECS task definition and Parameter Store / Secrets Manager

### Database

- provision RDS PostgreSQL
- run Knex migrations against the production database before or during deployment

## 10. Deployment Workflow

The target deployment workflow should be:

1. Build frontend
2. Build backend container image
3. Push backend image to ECR
4. Provision or verify database
5. Run migrations
6. Deploy backend service
7. Deploy frontend
8. Verify `/health`
9. Verify login, tenant session restore, project creation, and invitation flow

This is the kind of repeatable workflow a professional engineer aims for.

## 11. Cheapest Credible Portfolio Setup

If the goal is "deploy for one day, capture screenshots, document it, then delete it," the cheapest credible setup is:

- `Frontend`: Vercel hobby plan
- `Backend`: 1 small ECS Fargate task
- `Database`: smallest RDS PostgreSQL instance
- `Secrets`: Parameter Store
- `Logs`: CloudWatch

Then:

- deploy
- take screenshots of:
  - AWS ECS service
  - RDS instance
  - CloudWatch log group
  - running app frontend
  - working login/dashboard flow
- document the architecture in the repo
- destroy the ECS service, RDS instance, and related resources after evidence is captured

## 12. What to Show in a Portfolio or Interview

This architecture is good portfolio evidence because you can explain:

- why the frontend and backend are deployed separately
- why the database is managed and private
- why ECS Fargate was chosen over EC2
- how secrets are handled
- how health checks and logs support operations
- what hardening is already done versus intentionally deferred

That last point matters. Strong engineers do not pretend a small app is fully enterprise-grade. They show that they can prioritize.

## 13. Explicit Scope Decisions

This project intentionally does not require, for the first production deployment:

- multi-region failover
- service mesh
- Kubernetes
- event-driven microservices
- complex CI/CD pipelines

Those would add cost and complexity without improving the credibility of this repo for its current size.

## 14. Target Architecture Summary

The production target architecture for this repository is:

- `Frontend`: Vercel-hosted Next.js app
- `Backend`: Dockerized Express API on AWS ECS Fargate
- `Database`: AWS RDS PostgreSQL
- `Secrets`: AWS Parameter Store or Secrets Manager
- `Logs`: CloudWatch Logs
- `Networking`: ALB in front of ECS, database in private subnets
- `Security baseline`: strong env/secret handling, CORS restriction, health checks, then `helmet`, rate limiting, and improved logging

This is the recommended target because it is:

- professional
- explainable
- AWS-relevant
- cost-conscious
- realistic for a portfolio deployment

## 15. Immediate Next Implementation Steps

The next practical steps for this repository are:

1. Write a production environment variable section with example production values.
2. Decide whether the first deployment will be:
   - `Hybrid`: Vercel frontend + AWS backend/database
   - `AWS-only`: frontend also hosted on AWS
3. Create a short deployment runbook.
4. Decide whether to keep `localStorage` auth for the portfolio deployment or move to `HttpOnly` cookies first.
5. Add infrastructure definition or deployment scripts for the chosen hosting path.

For this project, `Hybrid` is the recommended first deployment.
