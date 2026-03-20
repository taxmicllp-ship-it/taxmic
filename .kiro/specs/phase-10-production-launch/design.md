# Phase 10 — Production Launch Design

## Overview

Phase 10 is a read-only audit phase. No code is written, no schema is changed, no files are renamed.
The agent reads existing files, validates them against the requirements, and produces a single output:
`docs/audits/PHASE-10-PRODUCTION-LAUNCH-AUDIT.md`

---

## Audit Methodology

Each step reads specific files, applies a checklist, and records PASS / FAIL / GAP per item.
All findings are accumulated into the final report.

---

## Step 1 — System Coverage

Files to read:
- `apps/api/src/app.ts`

Checks:
- All 9 module routers are imported and mounted
- Auth routes are mounted before global middleware
- Billing webhook route receives raw body (not parsed JSON)
- Error handler is the last `app.use()` call
- Health endpoint exists at `GET /api/v1/health`

---

## Step 2 — Security Audit

### 2a — Middleware Coverage

Files to read:
- `apps/api/src/shared/middleware/authenticate.ts`
- `apps/api/src/modules/auth/auth.routes.ts`
- `apps/api/src/modules/crm/clients/clients.routes.ts`
- `apps/api/src/modules/crm/contacts/contacts.routes.ts`
- `apps/api/src/modules/documents/documents.routes.ts`
- `apps/api/src/modules/tasks/tasks.routes.ts`
- `apps/api/src/modules/billing/invoices/invoices.routes.ts`
- `apps/api/src/modules/billing/payments/payments.routes.ts`
- `apps/api/src/modules/billing/subscriptions/subscriptions.routes.ts`
- `apps/api/src/modules/notifications/notifications.routes.ts`
- `apps/api/src/modules/portal/portal.routes.ts`

Checks:
- `authenticate` middleware on all staff routes
- `authenticatePortal` middleware on all portal routes
- No staff route uses `authenticatePortal` and vice versa

### 2b — Tenant Isolation

Files to read:
- `apps/api/src/modules/crm/clients/clients.repository.ts`
- `apps/api/src/modules/crm/contacts/contacts.repository.ts`
- `apps/api/src/modules/documents/documents.repository.ts` (if exists) or `documents.service.ts`
- `apps/api/src/modules/tasks/tasks.repository.ts`
- `apps/api/src/modules/billing/invoices/invoices.repository.ts`
- `apps/api/src/modules/billing/payments/payments.repository.ts`
- `apps/api/src/modules/notifications/notifications.repository.ts`
- `apps/api/src/modules/billing/subscriptions/subscriptions.repository.ts` (if exists)

Checks:
- Every `findMany`, `findFirst`, `findUnique` includes `firm_id` filter
- No query returns data without a tenant scope

### 2c — Stripe Webhook Security

Files to read:
- `apps/api/src/modules/billing/payments/webhook.controller.ts`
- `apps/api/src/modules/billing/subscriptions/stripe-subscriptions-webhook.controller.ts`

Checks:
- Stripe signature verification via `stripe.webhooks.constructEvent`
- Idempotency check against `webhook_events` table before processing

### 2d — File Upload Security

Files to read:
- `apps/api/src/modules/documents/documents.validation.ts`
- `apps/api/src/modules/documents/documents.service.ts`
- `apps/api/src/shared/storage/storage.factory.ts`
- `apps/api/src/shared/storage/local-storage.provider.ts`

Checks:
- MIME type validation present
- File size limit enforced
- Storage path uses `firmId/clientId/...` pattern

### 2e — Rate Limiting

Files to read:
- `apps/api/src/modules/auth/auth.routes.ts`

Checks:
- Rate limiter middleware applied to: register, login, forgot-password, reset-password

---

## Step 3 — Performance Validation

### 3a — Index Coverage

Files to read:
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260317000000_compound_tenant_indexes/migration.sql`
- `packages/database/prisma/migrations/20260316000000_crm_search_indexes/migration.sql`

Checks (per REQ-3.1):
- `clients`: `(firm_id, deleted_at)`, `(firm_id, name)`
- `contacts`: `(firm_id, deleted_at)`
- `documents`: `(firm_id, client_id)`
- `tasks`: `(firm_id, status)`, `(firm_id, assigned_to)`
- `invoices`: `(firm_id, status)`, `(firm_id, client_id)`
- `notifications`: `(firm_id, user_id, is_read)`
- `subscriptions`: unique `(firm_id)`, `(stripe_subscription_id)`

### 3b — N+1 Query Review

Files to read:
- `apps/api/src/modules/crm/clients/clients.service.ts`
- `apps/api/src/modules/documents/documents.service.ts`
- `apps/api/src/modules/tasks/tasks.service.ts`
- `apps/api/src/modules/billing/subscriptions/subscriptions.service.ts`

Checks:
- List endpoints use `include` or `select` — not repeated queries per row
- No obvious N+1 patterns in loops

---

## Step 4 — Observability Validation

Files to read:
- `apps/api/src/shared/utils/logger.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/billing/subscriptions/subscriptions.service.ts`
- `apps/api/src/modules/billing/payments/webhook.controller.ts`

Checks:
- Logger is a structured logger (not raw `console.log`)
- Logger used in auth events (login, register, password reset)
- Logger used in webhook processing
- `SENTRY_DSN` referenced in config — if absent, flag MEDIUM gap

---

## Step 5 — Monitoring Readiness

Files to read:
- `apps/api/src/config/index.ts`
- `packages/database/prisma/schema.prisma` (check for `security_audit_logs` model)

Checks:
- `security_audit_logs` table exists in schema — if absent, flag MEDIUM gap
- Config references `SENTRY_DSN`

---

## Step 6 — Backup Strategy

Files to read:
- `docs/05-operations/BETA-DEPLOYMENT-CHECKLIST.md`
- `docs/05-operations/SYSTEM-OPERATIONS.md` (if exists)
- `docs/05-operations/production-readiness.md` (if exists)

Checks:
- Daily backup procedure documented
- Retention policy documented
- Restore procedure documented
- If absent or incomplete: flag MEDIUM gap

---

## Step 7 — Environment Configuration

Files to read:
- `apps/api/src/config/index.ts`
- `apps/api/.env` (check for committed secrets — do NOT log values)
- `.env.example`

Variable classification table:

| Variable | Classification | Notes |
|---|---|---|
| DATABASE_URL | Required | Must point to production DB |
| JWT_SECRET | Required | Must be ≥32 chars, no weak default |
| STRIPE_SECRET_KEY | Required (billing) | Optional at startup but billing fails without it |
| STRIPE_WEBHOOK_SECRET | Required (webhooks) | Optional at startup but webhooks fail without it |
| STORAGE_PROVIDER | Required | Defaults to `local` — unsafe for production |
| SENTRY_DSN | Optional | Recommended; absent = no error tracking |
| FRONTEND_URL | Required | Needed for Stripe Checkout redirect |
| NODE_ENV | Required | Must be `production` in production |

---

## Step 8 — Deployment Readiness

Files to read:
- `apps/api/package.json`
- `apps/web/package.json`

Checks:
- `build` script defined in both
- `start` script defined in `apps/api/package.json`
- `NODE_ENV=production` behavior: no reset token in response, no verbose Prisma logging

---

## Step 9 — Regression Validation

Files to read:
- `docs/audits/PHASE-1-FINAL-AUDIT.md`
- `docs/audits/PHASE-2-CRM-AUDIT-REPORT.md`
- `docs/audits/PHASE-3-DOCUMENTS-IMPLEMENTATION.md`
- `docs/audits/PHASE-4-TASKS-AUDIT.md`
- `docs/audits/PHASE-5-BILLING-AUDIT.md`
- `docs/audits/PHASE-6-NOTIFICATIONS-AUDIT.md`
- `docs/audits/PHASE-7-BETA-LAUNCH-READINESS.md`
- `docs/audits/PHASE-8-PORTAL-AUDIT.md`
- `docs/audits/PHASE-9-SAAS-BILLING-AUDIT.md`

Checks:
- Each audit report shows PASS or equivalent final status
- No open CRITICAL bugs from prior phases

---

## Step 10 — Report Generation

Output file: `docs/audits/PHASE-10-PRODUCTION-LAUNCH-AUDIT.md`

Report structure:
1. System Overview — modules verified
2. Security Audit Results — pass/fail per check
3. Performance Findings — index and query validation
4. Observability Status — logging and Sentry
5. Environment Configuration — variable classification table
6. Deployment Checklist — exact commands
7. Bug Register — all open issues (ID, Description, Severity, Module, Status)
8. Final Recommendation — GO or NO-GO

Decision rule:
- Any CRITICAL open bug → NO-GO
- All CRITICAL resolved, MEDIUM items remain → Conditional GO with pre-launch checklist
- All clear → GO
