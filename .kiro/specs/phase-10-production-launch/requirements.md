# Phase 10 — Production Launch Requirements

## Overview

Phase 10 is a pure audit and validation phase. No new features are introduced. No schema changes are made. No modules are refactored. The goal is to verify that the system built across Phases 1–9 is secure, observable, correctly configured, and ready to accept paying customers in production.

The output of Phase 10 is a single audit report: `docs/audits/PHASE-10-PRODUCTION-LAUNCH-AUDIT.md` with a final GO or NO-GO recommendation.

---

## Constraints

- Do NOT modify folder structure
- Do NOT modify database schema
- Do NOT introduce new features
- Do NOT rename files
- Do NOT refactor existing modules
- Only audit, validate, and document

---

## Requirements

### REQ-1: System Coverage Verification

**REQ-1.1** Verify that all 9 modules are implemented and registered in `apps/api/src/app.ts`:
- Auth
- CRM
- Documents
- Tasks
- Billing (invoices + payments + subscriptions)
- Notifications
- Portal
- SaaS Billing (subscriptions)

**REQ-1.2** Verify router registration order in `app.ts`:
- Auth routes mounted before global middleware
- Billing webhook routes receive raw body (not parsed JSON)
- Error handler is the last middleware

**REQ-1.3** Verify tenant isolation middleware (`tenantContext`) is applied to all protected routes.

---

### REQ-2: Security Audit

**REQ-2.1** Verify JWT middleware (`authenticate`) protects all staff-facing endpoints.

**REQ-2.2** Verify portal middleware (`authenticatePortal`) protects all portal endpoints.

**REQ-2.3** Verify staff JWT tokens cannot access portal routes and portal tokens cannot access staff routes.

**REQ-2.4** Verify every database query in every repository filters by `firm_id` (or `firm_id + client_id` where applicable). No cross-tenant data access is possible.

**REQ-2.5** Verify Stripe webhook signature validation is present in both webhook controllers:
- `apps/api/src/modules/billing/payments/webhook.controller.ts`
- `apps/api/src/modules/billing/subscriptions/stripe-subscriptions-webhook.controller.ts`

**REQ-2.6** Verify webhook idempotency via `webhook_events` table in both webhook controllers.

**REQ-2.7** Verify document upload enforces:
- MIME type validation
- File size limits
- Storage path isolation: `firmId/clientId/folderId/...`

**REQ-2.8** Verify rate limiting is applied to auth endpoints (register, login, forgot-password, reset-password).

---

### REQ-3: Performance Validation (Static)

**REQ-3.1** Verify that critical database tables have compound indexes including `firm_id`:
- `clients` — `(firm_id, deleted_at)`, `(firm_id, name)`
- `contacts` — `(firm_id, deleted_at)`
- `documents` — `(firm_id, client_id)`
- `tasks` — `(firm_id, status)`, `(firm_id, assigned_to)`
- `invoices` — `(firm_id, status)`, `(firm_id, client_id)`
- `notifications` — `(firm_id, user_id, is_read)`
- `subscriptions` — `(firm_id)` unique, `(stripe_subscription_id)`

**REQ-3.2** Verify Prisma queries in high-traffic services use `include` or `select` rather than repeated round-trips:
- `clients.service.ts`
- `documents.service.ts`
- `tasks.service.ts`
- `subscriptions.service.ts`

**REQ-3.3** Verify no obvious N+1 query patterns exist in list endpoints.

---

### REQ-4: Observability Validation

**REQ-4.1** Verify structured logging is implemented via `apps/api/src/shared/utils/logger.ts`.

**REQ-4.2** Verify logger is used in all service files for key events (create, update, delete, auth events, webhook events).

**REQ-4.3** Verify the health endpoint exists and responds:
- `GET /api/v1/health` → `{ status: 'ok' }`

**REQ-4.4** Verify whether Sentry integration exists. If absent, flag as MEDIUM gap — not a blocker but must be documented.

**REQ-4.5** Verify `SENTRY_DSN` is referenced in config or environment. If absent, document as missing.

---

### REQ-5: Environment Configuration Audit

**REQ-5.1** Audit `apps/api/src/config/index.ts` and classify every environment variable:
- Required (system fails without it)
- Optional (has safe default)
- Missing (referenced in code but not in config)
- Unsafe default (default value is insecure for production)

**REQ-5.2** Verify the following variables are present and classified:
- `DATABASE_URL` — required
- `JWT_SECRET` — required, must not have a weak default
- `STRIPE_SECRET_KEY` — required for billing
- `STRIPE_WEBHOOK_SECRET` — required for webhooks
- `STORAGE_PROVIDER` — required (local vs s3)
- `SENTRY_DSN` — optional but recommended
- `FRONTEND_URL` — required for Stripe Checkout redirect

**REQ-5.3** Verify `apps/api/.env` does not contain production secrets committed to the repository.

**REQ-5.4** Verify `.env.example` at repo root documents all required variables.

---

### REQ-6: Deployment Readiness

**REQ-6.1** Verify the API can be built for production:
- `npm run build` in `apps/api`
- TypeScript compilation must succeed with no errors

**REQ-6.2** Verify the web app can be built for production:
- `npm run build` in `apps/web`
- Vite build must succeed with no errors

**REQ-6.3** Verify production start command is defined in `apps/api/package.json`.

**REQ-6.4** Verify `NODE_ENV=production` disables development-only behaviors (e.g. reset token in response, verbose Prisma logging).

---

### REQ-7: Backup Strategy Verification

**REQ-7.1** Check `docs/05-operations/` for documented backup procedures.

**REQ-7.2** Verify documentation covers:
- Daily database backup procedure
- Retention policy
- Restore procedure

**REQ-7.3** If backup documentation is absent or incomplete, flag as MEDIUM gap.

---

### REQ-8: Regression Validation

**REQ-8.1** Verify all Phase 1–9 modules remain functional by reviewing their audit reports in `docs/audits/`.

**REQ-8.2** Confirm no Phase 10 changes break existing routes, middleware, or database queries.

**REQ-8.3** Verify the following critical flows are intact (code review, not runtime test):
- Auth: register, login, password reset
- CRM: client CRUD, contact CRUD
- Documents: upload, download, delete
- Tasks: create, assign, update
- Billing: invoice creation, PDF, payment
- Notifications: create, mark read
- Portal: client login, document access, invoice payment
- SaaS Billing: plan list, subscription current, usage, webhook

---

### REQ-9: Known Gap Register

**REQ-9.1** The audit report must include a Bug Register with all known gaps from Phases 1–9 that remain open.

**REQ-9.2** Each entry must include: ID, Description, Severity (CRITICAL / MEDIUM / LOW), Module, Status.

**REQ-9.3** Known gaps to carry forward from Phase 9:
- Stripe price IDs are placeholder values — must be replaced before accepting real payments (CRITICAL)
- User limit enforcement not wired to registration or invite (MEDIUM)
- Sentry not integrated (MEDIUM, if confirmed absent)
- Backup procedures not documented (MEDIUM, if confirmed absent)

---

### REQ-10: Production Launch Report

**REQ-10.1** Create `docs/audits/PHASE-10-PRODUCTION-LAUNCH-AUDIT.md` containing:
- System overview (modules verified)
- Security audit results (pass/fail per check)
- Performance findings (index and query validation)
- Observability status
- Environment configuration (variable classification table)
- Deployment checklist (exact commands)
- Bug register (all open issues)
- Final recommendation: GO or NO-GO

**REQ-10.2** If any CRITICAL bug exists, the recommendation must be NO-GO.

**REQ-10.3** If all CRITICAL items are resolved but MEDIUM items remain, the recommendation may be conditional GO with documented pre-launch checklist.
