# Multi-Tenant SaaS Architecture

A multi-tenant SaaS app built with Node.js, Express, PostgreSQL, and Next.js, focused on tenant isolation, RBAC, and invitation-based onboarding.

Built to understand real-world SaaS architecture — one of the most in-demand backend/cloud patterns across platforms like Upwork.

---

## 🖥️ Demo / Screenshots

### Dashboard (Tenant View)
<img width="1059" height="1439" alt="Screenshot 2026-03-17 183117" src="https://github.com/user-attachments/assets/7af59c91-a73b-41a2-bc6b-79d39c7b7566" />

### Invitation Flow
<img width="1879" height="1311" alt="Screenshot 2026-03-17 202305" src="https://github.com/user-attachments/assets/8b0835e1-38ac-4ab1-89c1-47dc3c2d8110" />

### Database / Tenant Isolation
<img width="2879" height="1799" alt="Screenshot 2026-03-10 150140" src="https://github.com/user-attachments/assets/eace2fc7-60bb-4b76-a6dc-7746da8e5837" />

---

## ⚙️ Tech Stack

- **Frontend:** Next.js  
- **Backend:** Node.js, Express  
- **Database:** PostgreSQL (Docker)  
- **Auth:** JWT + middleware  
- **Validation:** Zod  

---

## 🚀 Key Features

- Multi-tenant architecture (shared DB, shared schema)  
- Role-based access (owner / admin / member)  
- Tenant-scoped queries (strict isolation)  
- `/auth/me` for session truth (not trusting JWT alone)  
- Invitation-based onboarding  
- Member management (add, update role, remove)  
- Membership-based RBAC (user can belong to multiple tenants with different roles)
  
---

## 🔄 Example Flow

Owner invites → user accepts → account created → membership assigned → user lands in tenant dashboard

---

## 🧠 Key Insight

Tenant isolation is enforced at the query level:

`.where({ tenant_id: req.user.tenantId })`
This prevents cross-tenant data access regardless of frontend behavior.

## Why this is better

- keeps **code clearly separated**
- makes explanation **scannable**
- looks like real engineering docs (not a paragraph dump)
- highlights **impact, not just description**

---

## Current State
- Fully working locally
- Backend architecture is stable
- Frontend is functional but minimal
- Not yet deployed

---

# Next Steps
- Project update/delete with permissions
- Improved frontend validation (field-level errors)
- Invite resend / regenerate
- Integration tests (auth, RBAC, tenant isolation)
- Production-ready config and deployment (AWS)

---

# Run Locally
1. Copy `.env.example` to `.env` and replace the placeholder values.
2. Start PostgreSQL with `docker compose up -d`.
3. Install dependencies in both apps:
   `cd backend && npm install`
   `cd frontend && npm install`
4. Run migrations:
   `cd backend && npm run migrate`
5. Start the backend and frontend dev servers:
   `cd backend && npm run dev`
   `cd frontend && npm run dev`

## Security Notes
- The public repo is safe to share only if `.env` stays untracked.
- `JWT_SECRET`, `POSTGRES_PASSWORD`, and other runtime secrets must come from `.env`.
- This project is still development-oriented and not production-hardened yet.

# Notes
Full development log and architecture decisions are available in /docs.
