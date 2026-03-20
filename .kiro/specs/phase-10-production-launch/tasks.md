# Phase 10 — Production Launch Tasks

## Task 1 — System Coverage Verification

- [x] 1.1 Read `apps/api/src/app.ts` and verify all 9 module routers are imported and mounted
- [x] 1.2 Verify auth routes are mounted before global middleware
- [x] 1.3 Verify billing webhook route uses raw body parser (not `express.json()`)
- [x] 1.4 Verify error handler is the last `app.use()` call
- [x] 1.5 Verify `GET /api/v1/health` endpoint exists and returns `{ status: 'ok' }`

---

## Task 2 — Security Audit

- [x] 2.1 Read all route files and verify `authenticate` middleware on every staff route
- [x] 2.2 Read `portal.routes.ts` and verify `authenticatePortal` middleware on every portal route
- [x] 2.3 Confirm staff and portal middleware are separate and non-interchangeable
- [x] 2.4 Read all repository files and verify every query filters by `firm_id`
- [x] 2.5 Read both webhook controllers and verify Stripe signature validation
- [x] 2.6 Read both webhook controllers and verify idempotency via `webhook_events` table
- [x] 2.7 Read `documents.validation.ts` and `documents.service.ts` — verify MIME validation and size limits
- [x] 2.8 Read storage provider and verify path isolation: `firmId/clientId/...`
- [x] 2.9 Read `auth.routes.ts` and verify rate limiting on register, login, forgot-password, reset-password

---

## Task 3 — Performance Validation

- [x] 3.1 Read `schema.prisma` and migration files — verify compound indexes per REQ-3.1
- [x] 3.2 Read `clients.service.ts` — verify list queries use `include`/`select`, no N+1
- [x] 3.3 Read `documents.service.ts` — verify list queries use `include`/`select`, no N+1
- [x] 3.4 Read `tasks.service.ts` — verify list queries use `include`/`select`, no N+1
- [x] 3.5 Read `subscriptions.service.ts` — verify list queries use `include`/`select`, no N+1

---

## Task 4 — Observability Validation

- [x] 4.1 Read `logger.ts` — verify it is a structured logger (not raw `console.log`)
- [x] 4.2 Read `auth.service.ts` — verify logger is used for login, register, password reset events
- [x] 4.3 Read `subscriptions.service.ts` and webhook controller — verify logger used for webhook events
- [x] 4.4 Read `config/index.ts` — check if `SENTRY_DSN` is referenced; if absent, flag MEDIUM gap

---

## Task 5 — Monitoring Readiness

- [x] 5.1 Read `schema.prisma` — check for `security_audit_logs` model; if absent, flag MEDIUM gap
- [x] 5.2 Confirm `SENTRY_DSN` classification in config (optional vs missing)

---

## Task 6 — Backup Strategy

- [x] 6.1 Read `docs/05-operations/BETA-DEPLOYMENT-CHECKLIST.md` — check for backup procedures
- [x] 6.2 Read `docs/05-operations/SYSTEM-OPERATIONS.md` if it exists
- [x] 6.3 Read `docs/05-operations/production-readiness.md` if it exists
- [x] 6.4 Verify daily backup, retention policy, and restore procedure are documented
- [x] 6.5 If absent or incomplete, flag as MEDIUM gap

---

## Task 7 — Environment Configuration

- [x] 7.1 Read `apps/api/src/config/index.ts` — classify every variable per REQ-5.1
- [x] 7.2 Verify `JWT_SECRET` has no weak default (e.g. `"dev-secret-change-in-production"`)
- [x] 7.3 Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are present in config
- [x] 7.4 Verify `STORAGE_PROVIDER` default is flagged as unsafe for production
- [x] 7.5 Read `.env.example` — verify all required variables are documented
- [x] 7.6 Check `apps/api/.env` — confirm no production secrets are committed (check file exists, do not log values)

---

## Task 8 — Deployment Readiness

- [x] 8.1 Read `apps/api/package.json` — verify `build` and `start` scripts exist
- [x] 8.2 Read `apps/web/package.json` — verify `build` script exists
- [x] 8.3 Verify `NODE_ENV=production` suppresses dev-only behaviors (reset token in response, verbose Prisma logging)

---

## Task 9 — Regression Validation

- [x] 9.1 Read all Phase 1–9 audit reports in `docs/audits/`
- [x] 9.2 Confirm each phase audit shows PASS or equivalent final status
- [x] 9.3 Carry forward any open CRITICAL or MEDIUM bugs into the Phase 10 bug register

---

## Task 10 — Production Launch Report

- [x] 10.1 Create `docs/audits/PHASE-10-PRODUCTION-LAUNCH-AUDIT.md`
- [x] 10.2 Write System Overview section — list all verified modules
- [x] 10.3 Write Security Audit Results — pass/fail per check from Task 2
- [x] 10.4 Write Performance Findings — index and query validation from Task 3
- [x] 10.5 Write Observability Status — logging and Sentry from Tasks 4–5
- [x] 10.6 Write Environment Configuration — variable classification table from Task 7
- [x] 10.7 Write Deployment Checklist — exact commands from Task 8
- [x] 10.8 Write Bug Register — all open issues with ID, Description, Severity, Module, Status
- [x] 10.9 Write Final Recommendation — GO or NO-GO per REQ-10.2 and REQ-10.3
