# Deployment Runbook

This runbook describes the recommended first live deployment for this repository.

The target is:

- `Frontend`: Vercel
- `Backend`: AWS ECS Fargate
- `Database`: AWS RDS PostgreSQL
- `Image registry`: Amazon ECR
- `Secrets`: AWS Systems Manager Parameter Store or Secrets Manager
- `Logs`: CloudWatch Logs

This is the recommended first deployment because it is:

- realistic
- cost-conscious
- professional enough for a portfolio
- fast to stand up, screenshot, document, and delete

## 1. Deployment Goal

The goal of this runbook is to get the app to a live public state where you can prove:

- the frontend is reachable
- the backend is reachable
- the backend talks to a managed database
- the app is configured with real environment variables
- the deployment is deliberate and repeatable

This runbook is optimized for a one-day portfolio deployment, not permanent production operations.

## 2. Final Hosting Shape

The live deployment shape is:

```text
User Browser
  -> Vercel-hosted Next.js frontend
  -> ECS Fargate backend behind a public load balancer
  -> RDS PostgreSQL in private subnets

Supporting AWS services
  -> ECR for backend container image
  -> CloudWatch Logs for backend logs
  -> Parameter Store / Secrets Manager for secrets
```

## 3. Before You Start

Make sure you have:

- an AWS account
- a Vercel account
- Docker working locally
- AWS CLI configured locally
- this repository running successfully through Docker Compose

You should already be able to run:

```bash
docker compose up --build -d
```

If the local Docker stack is not healthy first, do not deploy yet.

## 4. Production Environment Values

These are the environment variables the app needs in production:

- `SERVER_PORT=5000`
- `NEXT_PUBLIC_API_URL=https://<your-backend-domain>`
- `FRONTEND_URL=https://<your-frontend-domain>`
- `CORS_ORIGIN=https://<your-frontend-domain>`
- `DB_HOST=<your-rds-endpoint>`
- `DB_PORT=5432`
- `POSTGRES_USER=<production-db-user>`
- `POSTGRES_PASSWORD=<production-db-password>`
- `POSTGRES_DB=<production-db-name>`
- `JWT_SECRET=<long-random-secret>`

Important production notes:

- use `5432` for RDS unless you intentionally changed it
- `NEXT_PUBLIC_API_URL` must be the public backend URL the browser can reach
- `CORS_ORIGIN` should be the exact frontend origin, not `localhost`
- `JWT_SECRET` should be long, random, and never committed

## 5. AWS Resources to Create

For the recommended first deployment, create:

- `1 VPC`
- `2 public subnets`
- `2 private subnets`
- `1 internet gateway`
- `1 application load balancer`
- `1 ECS cluster`
- `1 ECS task definition`
- `1 ECS service`
- `1 ECR repository`
- `1 RDS PostgreSQL instance`
- `1 CloudWatch log group`
- `1 security group for the ALB`
- `1 security group for ECS`
- `1 security group for RDS`

For a temporary portfolio deployment, keep sizing small and simple.

## 6. Security Group Model

Use this networking model:

- `ALB security group`
  - allow inbound `80` from the internet
  - allow inbound `443` if you configure TLS
- `ECS security group`
  - allow inbound `5000` from the ALB security group only
- `RDS security group`
  - allow inbound `5432` from the ECS security group only

This is one of the most important professional details to get right:

- the database should not be public
- the backend should not talk to the world directly
- access should flow through the load balancer and security groups

## 7. Step 1: Create the Database

Create an RDS PostgreSQL instance with:

- smallest practical instance size
- private subnets
- automated backups enabled
- a known database name
- a dedicated app username and password

Record:

- RDS endpoint
- DB name
- DB username
- DB password

You will need those for ECS runtime configuration.

## 8. Step 2: Create the Backend Image Repository

Create an ECR repository for the backend image.

Example repository purpose:

- store the Docker image built from `backend/Dockerfile`

After creation, note:

- AWS account ID
- AWS region
- full ECR repository URI

## 9. Step 3: Build and Push the Backend Image

Build the backend image from the repo root:

```bash
docker build -t saas-backend ./backend
```

Tag it for ECR:

```bash
docker tag saas-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/saas-backend:latest
```

Authenticate Docker to ECR:

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
```

Push the image:

```bash
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/saas-backend:latest
```

## 10. Step 4: Store Secrets and Config

Store the backend secrets outside the repo.

Recommended:

- `JWT_SECRET`
- `POSTGRES_PASSWORD`

You can also store:

- `POSTGRES_USER`
- `POSTGRES_DB`
- `DB_HOST`
- `FRONTEND_URL`
- `CORS_ORIGIN`

For a small deployment, it is acceptable to keep non-secret config directly in ECS task definition env vars and keep only sensitive values in Parameter Store or Secrets Manager.

## 11. Step 5: Create the ECS Task Definition

Create an ECS Fargate task definition for the backend container.

Use:

- image: the ECR image URI
- container port: `5000`
- runtime platform matching your image
- CloudWatch logs enabled
- env vars and secrets injected at runtime

Set these runtime values for the backend container:

- `SERVER_PORT=5000`
- `FRONTEND_URL=https://<frontend-domain>`
- `CORS_ORIGIN=https://<frontend-domain>`
- `DB_HOST=<rds-endpoint>`
- `DB_PORT=5432`
- `POSTGRES_USER=<db-user>`
- `POSTGRES_PASSWORD=<db-password>`
- `POSTGRES_DB=<db-name>`
- `JWT_SECRET=<jwt-secret>`

## 12. Step 6: Create the ECS Service

Create an ECS service with:

- launch type `Fargate`
- desired count `1`
- public load balancer attached
- target group pointing to container port `5000`
- ECS tasks placed in private subnets if possible

For a temporary portfolio deployment, one task is enough.

## 13. Step 7: Configure the Load Balancer Health Check

Configure the target group health check path as:

```text
/health
```

Expected success response:

- HTTP `200`

This matches the health endpoint already implemented in the backend.

## 14. Step 8: Run Database Migrations

Before treating the deployment as ready, run the Knex migrations against RDS.

You have a few options:

- run a one-off ECS task using the same image with the migrate command
- temporarily run the migration command from a trusted machine that can reach RDS
- use a deployment job in a pipeline later

Recommended first portfolio option:

- run a one-off ECS task with:

```text
npm run migrate
```

That keeps the migration process close to the deployed runtime.

## 15. Step 9: Deploy the Frontend to Vercel

Deploy the `frontend` directory to Vercel.

Set this environment variable in Vercel:

- `NEXT_PUBLIC_API_URL=https://<backend-domain>`

The browser must be able to reach the backend URL directly.

After deployment, record:

- the frontend domain

Then update backend runtime config if needed:

- `FRONTEND_URL`
- `CORS_ORIGIN`

If you deploy the frontend first with a temporary Vercel domain, use that exact domain in the backend config.

## 16. Step 10: Verify the Live System

After both sides are deployed, verify:

1. frontend loads in the browser
2. backend `/health` returns `200`
3. register works
4. login works
5. `/auth/me` works after login
6. project creation works
7. tenant-scoped data still behaves correctly

This is your minimum release checklist.

## 17. Portfolio Evidence to Capture

Take screenshots of:

- Vercel deployment dashboard
- ECS cluster/service
- ECS task running
- ALB target health
- RDS instance details
- CloudWatch log group or backend logs
- live login page
- live dashboard after authentication

These screenshots make the deployment story much easier to explain in a portfolio or interview.

## 18. What to Say in an Interview

This runbook supports a clean explanation:

- the frontend and backend were deployed separately because they have different runtime needs
- the backend was containerized and deployed to ECS Fargate for managed container hosting
- PostgreSQL was moved to RDS so the database was persistent and not tied to a local machine
- secrets were injected at runtime rather than committed to the repo
- health checks and structured logs improved operability
- hardening was prioritized, but not everything was overengineered

That is exactly the kind of engineering judgment interviewers want to hear.

## 19. Known Gaps You Can State Honestly

This runbook does not claim the app is fully enterprise-hardened.

Remaining notable gaps include:

- auth still uses `localStorage`
- no Infrastructure as Code yet
- no full CI/CD pipeline yet
- no advanced monitoring or alerting yet
- no WAF yet

Saying this explicitly is a strength, not a weakness.

## 20. Teardown Plan

After you capture screenshots and notes, delete:

- ECS service
- ECS task definition revisions if desired
- load balancer and target group
- ECR repository if no longer needed
- RDS instance
- parameter/secrets entries created only for the demo

Also remove or disable:

- any temporary public DNS entries
- any custom domains you attached

This keeps the portfolio deployment cheap and prevents idle cloud spend.

## 21. Recommended Next Repo Tasks

To support this runbook even better, the next repo tasks should be:

1. add example production env documentation
2. add a short ECS deployment checklist to the README
3. decide whether to keep current auth for the first live demo or upgrade to cookie-based auth
4. optionally add Terraform or CDK after the first successful deployment
