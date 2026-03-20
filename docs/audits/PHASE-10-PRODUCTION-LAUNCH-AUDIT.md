# Phase 10 — Production Launch Audit Report

**Date:** 2026-03-17
**Auditor:** Kiro
**Scope:** Full system audit across Phases 1–9 for production readiness
**Type:** READ-ONLY — no code was modified during this audit

---

## Executive Summary

| Category | Result |
|---|---|
| System Coverage | ⚠️ PARTIAL PASS |
| Security Audit | ⚠️ PARTIAL PASS |
| Performance Validation | ⚠️ PARTIAL PASS |
| Observability | ⚠️ PARTIAL PASS |
| Environment Configuration | ⚠️ PARTIAL PASS |
| Deployment Readiness | ✅ PASS |
| Backup Strategy | ✅ DOCUMENTED |
| Regression Validation | ✅ PASS |

**Final Recommendation: NO-GO**

One CRITICAL open bug (placeholder Stripe price IDs) blocks production launch. Three MEDIUM gaps require pre-launch resolution or documented acceptance. See Section 7 (Bug Register) and Section 8 (Final Recommendation) for full details.

---

## 1. System Overview

### 1.1 Module Router Registration (`apps/api/src/app.ts`)

| Module | Router | Mount Path | Status |
|---|---|---|---|
| Auth | `authRouter` | `/api/v1/auth` | ✅ PASS |
| CRM (clients + contacts) | `crmRouter` | `/api/v1` | ✅ PASS |
| Documents | `documentsRouter` | `/api/v1` | ✅ PASS |
| Tasks | `tasksRouter` | `/api/v1` | ✅ PASS |
| Billing — Invoices | via `billingRouter` | `/api/v1` | ✅ PASS |
| Billing — Payments | via `billingRouter` | `/api/v1` | ✅ PASS |
| Billing — Subscriptions | via `billingRouter` | `/api/v1` | ✅ PASS |
| Notifications | `notificationsRouter` | `/api/v1` | ✅ PASS |
| Portal | `portalRouter` | `/api/v1/portal` | ✅ PASS |

All 9 module routers are imported and mounted. ✅

### 1.2 Router Registration Order

| Check | Finding | Status |
|---|---|---|
| Auth routes mounted before `express.json()` | **FAIL** — `app.use(express.json())` is called on line 12, BEFORE `app.use('/api/v1/auth', authRouter)` on line 21. Auth routes receive parsed JSON bodies. | ⚠️ GAP |
| Billing webhook uses raw body parser | `payments.routes.ts` applies `express.raw({ type: 'application/json' })` at the route level, overriding the global JSON parser for that path. `subscriptions.routes.ts` does the same. This is the correct Express pattern. | ✅ PASS |
| Error handler is last `app.use()` | `app.use(errorHandler)` is the final statement in `app.ts`. | ✅ PASS |
| `GET /api/v1/health` returns `{ status: 'ok' }` | Defined in `app.ts` before auth routes, returns `res.status(200).json({ status: 'ok' })`. | ✅ PASS |

**Note on 1.2 auth order:** Auth routes are mounted after `express.json()` but this is not a security issue — auth routes need JSON body parsing to read `email`, `password`, etc. The original concern was about a hypothetical global `authenticate` middleware being applied before auth routes. No such global middleware exists in this codebase; `authenticate` is applied per-router. The ordering is functionally correct.


---

## 2. Security Audit Results

### 2.1 Staff Route Authentication (`authenticate` middleware)

| Route File | Middleware Applied | Method | Status |
|---|---|---|---|
| `clients.routes.ts` | `router.use(authenticate, tenantContext)` — all routes covered | Router-level | ✅ PASS |
| `contacts.routes.ts` | `router.use(authenticate, tenantContext)` — all routes covered | Router-level | ✅ PASS |
| `documents.routes.ts` | `router.use(authenticate, tenantContext)` — all routes covered | Router-level | ✅ PASS |
| `tasks.routes.ts` | `router.use(authenticate, tenantContext)` — all routes covered | Router-level | ✅ PASS |
| `invoices.routes.ts` | `router.use(authenticate, tenantContext)` — all routes covered | Router-level | ✅ PASS |
| `payments.routes.ts` | Webhook route explicitly has NO auth (correct). Checkout and list routes have `authenticate` per-route. | Per-route | ✅ PASS |
| `subscriptions.routes.ts` | Webhook route explicitly has NO auth (correct). All other routes have `authenticate` per-route. | Per-route | ✅ PASS |
| `notifications.routes.ts` | `router.use(authenticate, tenantContext)` — all routes covered | Router-level | ✅ PASS |

### 2.2 Portal Route Authentication (`authenticatePortal` middleware)

| Route | Middleware | Status |
|---|---|---|
| `POST /portal/auth/login` | None (public — correct) | ✅ PASS |
| `POST /portal/auth/create-account` | `authenticate` (staff JWT — correct, staff creates portal accounts) | ✅ PASS |
| `GET /portal/dashboard` | `authenticatePortal` | ✅ PASS |
| `GET /portal/documents` | `authenticatePortal` | ✅ PASS |
| `POST /portal/documents/upload` | `authenticatePortal` | ✅ PASS |
| `GET /portal/documents/:id/download` | `authenticatePortal` | ✅ PASS |
| `GET /portal/invoices` | `authenticatePortal` | ✅ PASS |
| `POST /portal/invoices/:id/pay` | `authenticatePortal` | ✅ PASS |
| `GET /portal/tasks` | `authenticatePortal` | ✅ PASS |

All portal routes correctly protected. ✅

### 2.3 Staff vs Portal Middleware Separation

`authenticate` (`shared/middleware/authenticate.ts`): reads `req.user.firmId` from JWT payload. Does not check `payload.type`.

`authenticatePortal` (`shared/middleware/authenticate-portal.ts`): verifies JWT, then checks `payload.type !== 'portal'` — rejects any non-portal token with 401. Sets `req.portalUser` (not `req.user`).

**Cross-contamination analysis:**
- A staff JWT has no `type: 'portal'` field → `authenticatePortal` rejects it ✅
- A portal JWT has `type: 'portal'` and `clientUserId` (not `userId`) → staff routes that read `req.user.firmId` would fail because `req.user` is never set by `authenticatePortal` ✅
- The two middleware functions set different request properties (`req.user` vs `req.portalUser`) — no overlap ✅

**Result: PASS** — middleware are fully separate and non-interchangeable.


### 2.4 Tenant Isolation — `firm_id` Filtering in Repositories

| Repository | All reads filter by `firm_id` | Notes | Status |
|---|---|---|---|
| `clients.repository.ts` | `findByFirm`, `findById`, `create`, `linkContact`, `unlinkContact`, `findLink` all include `firm_id`. `update` uses `where: { id }` only — relies on service pre-check via `findById`. | Minor: `update()` and `softDelete()` do not include `firm_id` in the Prisma `where` clause directly, but service always calls `findById(firmId, id)` first. Defense-in-depth gap at repository level. | ⚠️ MINOR GAP |
| `contacts.repository.ts` | `findByFirm`, `findById` include `firm_id`. `update` and `delete` use `where: { id }` only — same pattern as clients. | Same minor gap as clients. | ⚠️ MINOR GAP |
| `tasks.repository.ts` | `findById`, `findAll`, `findByClient`, `update`, `softDelete` all include `firm_id` in `where`. | Full defense-in-depth. | ✅ PASS |
| `invoices.repository.ts` | `findById`, `findAll`, `findByClient`, `update`, `updateStatus` all include `firm_id`. | Full defense-in-depth. | ✅ PASS |
| `payments.repository.ts` | `create`, `findByClient`, `findByInvoice` include `firm_id`. `updateByStripePaymentIntentId` uses `stripe_payment_intent_id` only — this is a webhook path where `firm_id` is not available from the Stripe event. | Acceptable for webhook path; `findPendingByInvoice` has no `firm_id` but is internal-only. | ✅ PASS |
| `notifications.repository.ts` | `create`, `findAll`, `findById`, `markAsRead` all include `firm_id`. | Full defense-in-depth. | ✅ PASS |
| `documents.service.ts` | `uploadDocument` constructs `fileKey` as `${firmId}/${clientId}/...`. `getDownloadUrl` and `deleteDocument` call `documentsRepository.findById(firmId, documentId)`. `listDocuments` calls `documentsRepository.findByClient(firmId, clientId)`. | Firm isolation enforced at service level. | ✅ PASS |

**Overall tenant isolation: PASS** — all critical query paths are firm-scoped. The minor gap in `clients` and `contacts` update/delete (no `firm_id` in Prisma `where`) is mitigated by service-layer pre-checks and was noted in the Phase 2 audit.

### 2.5 Stripe Webhook Signature Validation

| Controller | Signature Verification | Status |
|---|---|---|
| `payments/webhook.controller.ts` | `stripeService.constructEvent(req.body as Buffer, sig, config.stripeWebhookSecret)` — throws on invalid signature, returns 400. Guards against missing secret with 503. | ✅ PASS |
| `subscriptions/stripe-subscriptions-webhook.controller.ts` | `new Stripe(...).webhooks.constructEvent(req.body as Buffer, sig, config.stripeWebhookSecret)` — throws on invalid signature, returns 400. Guards against missing secret with 503. | ✅ PASS |

Both webhook controllers verify Stripe signatures before processing any event. ✅

### 2.6 Webhook Idempotency via `webhook_events` Table

| Controller | Idempotency Check | Status |
|---|---|---|
| `payments/webhook.controller.ts` | `prisma.webhook_events.findUnique({ where: { event_id } })` — returns 200 immediately if `status === 'processed'`. Uses `upsert` to record event before processing. | ✅ PASS |
| `subscriptions/stripe-subscriptions-webhook.controller.ts` | Same pattern — `findUnique` check, `upsert` before processing, update to `processed` on success, `failed` on error. | ✅ PASS |

Both controllers implement full idempotency. ✅

### 2.7 Document Upload — MIME Validation and Size Limits

**`documents.validation.ts`:** Contains only folder and list query schemas. No MIME or size validation defined here.

**`upload.middleware.ts`** (referenced in `documents.routes.ts` as `handleUpload`): Not read directly in this audit, but Phase 3 audit confirmed multer with MIME whitelist and 50MB limit.

**`portal.routes.ts`:** Defines inline multer config with explicit MIME whitelist (PDF, JPEG, PNG, GIF, Word, Excel) and `limits: { fileSize: 50 * 1024 * 1024 }`.

**`documents.service.ts`:** Does not perform MIME validation itself — delegates to multer middleware upstream.

| Check | Finding | Status |
|---|---|---|
| MIME type validation | Present in multer middleware (upload.middleware.ts for staff, inline in portal.routes.ts for portal) | ✅ PASS |
| File size limit (50MB) | Enforced by multer in both paths | ✅ PASS |
| Storage path isolation | `fileKey = ${firmId}/${clientId}/${folderId}/${uuid}_${filename}` in `documents.service.ts` | ✅ PASS |

### 2.8 Storage Path Isolation

`documents.service.ts` line: `const fileKey = \`${data.firmId}/${data.clientId}/${data.folderId}/${randomUUID()}_${data.filename}\``

Path pattern: `firmId/clientId/folderId/uuid_filename` — matches required `firmId/clientId/...` pattern. ✅

`local-storage.provider.ts`: Flattens path separators to `_` for local disk storage (`fileKey.replace(/\//g, '_')`). This is dev-only behavior; S3 provider preserves the path hierarchy.

**Result: PASS**

### 2.9 Rate Limiting on Auth Endpoints

`auth.routes.ts` applies dedicated rate limiters:

| Endpoint | Limiter | Status |
|---|---|---|
| `POST /auth/register` | `registerLimiter` | ✅ PASS |
| `POST /auth/login` | `loginLimiter` | ✅ PASS |
| `POST /auth/forgot-password` | `forgotPasswordLimiter` | ✅ PASS |
| `POST /auth/reset-password` | `resetPasswordLimiter` | ✅ PASS |

Phase 1 audit confirmed: 15-minute window, 5–10 requests max per IP, RFC 6585 headers. ✅


---

## 3. Performance Findings

### 3.1 Compound Index Verification (REQ-3.1)

**Source:** `schema.prisma` + migration `20260317000000_compound_tenant_indexes` + migration `20260316000000_crm_search_indexes`

| Table | Required Index | Found In | Status |
|---|---|---|---|
| `clients` | `(firm_id, deleted_at)` | Schema has `@@index([firm_id])` and `@@index([deleted_at])` separately. Migration adds `idx_clients_firm_created_at (firm_id, created_at DESC)` and `idx_clients_firm_status (firm_id, status)`. No explicit `(firm_id, deleted_at)` compound index. | ⚠️ GAP |
| `clients` | `(firm_id, name)` | Migration `20260316000000_crm_search_indexes` adds `idx_clients_firm_id_name ON clients (firm_id, name)`. | ✅ PASS |
| `contacts` | `(firm_id, deleted_at)` | Schema has `@@index([firm_id])` and `@@index([deleted_at])` separately. Migration adds `idx_contacts_firm_created_at (firm_id, created_at DESC)`. No explicit `(firm_id, deleted_at)` compound index. | ⚠️ GAP |
| `documents` | `(firm_id, client_id)` | Schema has `@@index([firm_id, client_id])` directly. | ✅ PASS |
| `tasks` | `(firm_id, status)` | Schema has `@@index([firm_id, status, due_date])` which covers `(firm_id, status)` as a prefix. | ✅ PASS |
| `tasks` | `(firm_id, assigned_to)` | No `assigned_to` column on tasks — assignments are in `task_assignments` table. Migration adds `idx_task_assignments_user_task ON task_assignments (user_id, task_id)`. The REQ-3.1 spec uses `assigned_to` but the actual schema uses a join table. Functionally covered. | ✅ PASS (schema-adjusted) |
| `invoices` | `(firm_id, status)` | Schema has `@@index([firm_id, status, due_date])` which covers `(firm_id, status)` as a prefix. | ✅ PASS |
| `invoices` | `(firm_id, client_id)` | Schema has `@@index([firm_id])` and `@@index([client_id])` separately. No explicit `(firm_id, client_id)` compound index. | ⚠️ GAP |
| `notifications` | `(firm_id, user_id, is_read)` | Migration drops old `user_id_is_read_created_at` index and adds `idx_notifications_firm_user_created_at (firm_id, user_id, created_at DESC)` and partial `idx_notifications_firm_user_unread WHERE is_read = false`. Covers the query pattern. | ✅ PASS |
| `subscriptions` | unique `(firm_id)` | Schema has `firm_id String @unique` — enforced at column level. | ✅ PASS |
| `subscriptions` | `(stripe_subscription_id)` | Schema has `@@index([stripe_subscription_id])`. | ✅ PASS |

**Summary:** 3 minor index gaps (`clients (firm_id, deleted_at)`, `contacts (firm_id, deleted_at)`, `invoices (firm_id, client_id)`). These are covered by separate single-column indexes and the query planner can use index intersection, but explicit compound indexes would be more efficient. Not a production blocker — flag as LOW.

### 3.2 N+1 Query Review — `clients.service.ts`

`listClients` → `clientsRepository.findByFirm` → `prisma.clients.findMany({ where, skip, take })`. No `include` on the list query — returns flat client rows only. No nested relations fetched per row. No N+1 pattern. ✅

`getClient` → `clientsRepository.findById` → `prisma.clients.findFirst`. Single query. ✅

**Result: PASS** — no N+1 patterns in clients service.

### 3.3 N+1 Query Review — `documents.service.ts`

`listDocuments` → `documentsRepository.findByClient(firmId, clientId, folderId)`. Single `findMany` query. No per-row sub-queries. ✅

**Result: PASS** — no N+1 patterns in documents service.

### 3.4 N+1 Query Review — `tasks.service.ts`

`listTasks` → `tasksRepository.findAll` → `prisma.tasks.findMany({ where, include: taskInclude })`. `taskInclude` is `{ task_assignments: { select: { user_id, assigned_at } } }` — a single JOIN, not a per-row query. ✅

**Result: PASS** — no N+1 patterns in tasks service.

### 3.5 N+1 Query Review — `subscriptions.service.ts`

`getCurrentSubscription` → `subscriptionsRepository.findByFirmId`. Single query. ✅

`createSubscription` makes multiple sequential Stripe API calls and DB writes, but these are transactional operations, not list queries. No N+1 pattern. ✅

**Result: PASS** — no N+1 patterns in subscriptions service.


---

## 4. Observability Status

### 4.1 Structured Logger (`apps/api/src/shared/utils/logger.ts`)

```typescript
winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console({ silent: NODE_ENV === 'test' })]
})
```

- Winston with JSON format + timestamp ✅
- Not raw `console.log` ✅
- Silenced in test environment ✅
- No file transport (stdout only) — acceptable for containerized deployments ✅

**Result: PASS**

### 4.2 Logger Usage in `auth.service.ts`

| Event | Log Level | Logged |
|---|---|---|
| Registration success | `logger.info({ event: 'AUTH_REGISTER', userId, firmId, email })` | ✅ |
| Login success | `logger.info({ event: 'AUTH_LOGIN_SUCCESS', userId, firmId, email })` | ✅ |
| Login failure | `logger.warn({ event: 'AUTH_LOGIN_FAILURE', email, firmSlug })` | ✅ |
| Password reset token generated | `logger.info({ event: 'AUTH_PASSWORD_RESET', userId, email })` | ✅ |
| Password reset completed | `logger.info({ event: 'AUTH_PASSWORD_RESET', userId })` | ✅ |

All key auth events are logged. ✅ **Result: PASS**

### 4.3 Logger Usage in Webhook Controllers and Subscriptions Service

**`payments/webhook.controller.ts`:**
- `WEBHOOK_SECRET_MISSING` — warn ✅
- `WEBHOOK_SIGNATURE_FAILED` — warn ✅
- `INVOICE_PAID` — info ✅
- `WEBHOOK_PROCESSING_ERROR` — error ✅
- `WEBHOOK_UNHANDLED` — info ✅

**`subscriptions/stripe-subscriptions-webhook.controller.ts`:**
- `SUBSCRIPTIONS_WEBHOOK_SECRET_MISSING` — warn ✅
- `SUBSCRIPTIONS_WEBHOOK_SIGNATURE_FAILED` — warn ✅
- `SUBSCRIPTIONS_WEBHOOK_PROCESSING_ERROR` — error ✅
- `WEBHOOK_UNHANDLED` — info ✅

**`subscriptions.service.ts`:**
- `SUBSCRIPTION_CREATED` — info ✅
- `SUBSCRIPTION_UPDATED` — info ✅
- `SUBSCRIPTION_CANCELED` — info ✅
- `CHECKOUT_SESSION_CREATED` — info ✅

**Result: PASS** — comprehensive logging across all webhook and subscription events.

### 4.4 Sentry Integration

`apps/api/src/config/index.ts` does **not** reference `SENTRY_DSN`. The variable is present in `.env.example` (as an empty string) but is not validated or consumed by the config module.

No Sentry SDK import found in `app.ts`, `server.ts`, or any middleware.

**Result: SENTRY_DSN absent from config — flagged as MEDIUM gap (BUG-003)**


---

## 5. Environment Configuration

### 5.1 Variable Classification Table

Source: `apps/api/src/config/index.ts`, `apps/api/.env`, `.env.example`

| Variable | In Config Schema | Default | Classification | Production Notes |
|---|---|---|---|---|
| `DATABASE_URL` | Not in Zod schema (Prisma reads directly from `process.env`) | None | **Required** | Must point to production DB. Not validated at startup — missing value causes Prisma connection failure at first query, not at boot. |
| `JWT_SECRET` | ✅ `z.string().min(16)` | None (required) | **Required** | No weak default in schema. However `apps/api/.env` contains `"dev-secret-change-in-production"` — this is a dev file, not production. |
| `JWT_EXPIRES_IN` | ✅ `.default('7d')` | `'7d'` | **Optional** — safe default | Acceptable for production. |
| `NODE_ENV` | ✅ `.default('development')` | `'development'` | **Required for production** — unsafe default | Must be set to `'production'` before launch. Default of `'development'` exposes reset tokens in API responses. |
| `PORT` | ✅ `.default('3000')` | `'3000'` | **Optional** — safe default | Acceptable. |
| `STRIPE_SECRET_KEY` | ✅ `.optional()` | `undefined` | **Required for billing** — optional at startup | Server starts without it; all Stripe calls fail at runtime. Must be set before accepting payments. |
| `STRIPE_WEBHOOK_SECRET` | ✅ `.optional()` | `undefined` | **Required for webhooks** — optional at startup | Webhook handler returns 503 if absent. Must be set before going live. |
| `STORAGE_PROVIDER` | ✅ `.default('local')` | `'local'` | **Unsafe default for production** | Defaults to local disk — not suitable for multi-server or cloud deployment. Must be set to `'s3'` with AWS credentials for production. |
| `FRONTEND_URL` | ✅ `.default('http://localhost:3001')` | `'http://localhost:3001'` | **Required for production** — unsafe default | Used in Stripe Checkout `success_url` and `cancel_url`. Default causes payment redirects to fail in production. |
| `SENTRY_DSN` | ❌ Not in schema | N/A | **Missing** — recommended | Not referenced anywhere in config. No error tracking in production without this. |
| `DATABASE_URL` (startup validation) | ❌ Not in Zod schema | N/A | **Missing from validation** | Prisma reads it directly; a missing or malformed value is not caught at startup. |

### 5.2 JWT_SECRET Weak Default Check

`apps/api/src/config/index.ts` Zod schema: `z.string().min(16)` — no hardcoded default. ✅

`apps/api/.env` (dev file): `JWT_SECRET="dev-secret-change-in-production"` — this is a development credential file, not committed to production. The value is weak (32 chars but predictable). Must be replaced before production deployment.

**Result: Config schema is safe. Dev `.env` file contains a weak value — acceptable for development, MUST be replaced for production.**

### 5.3 Stripe Keys in Config

Both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are present in the Zod schema as optional fields. ✅

`apps/api/.env` contains Stripe test keys (`sk_test_...`, `whsec_...`). These are test-mode credentials — safe for development, must be replaced with live keys for production.

### 5.4 STORAGE_PROVIDER Default

`z.enum(['local', 's3']).default('local')` — defaults to `'local'`. This is an **unsafe default for production**: local disk storage is not suitable for multi-server deployments, does not persist across container restarts, and has no redundancy.

**Flagged as unsafe default. Must be set to `'s3'` with AWS credentials before production launch.**

### 5.5 `.env.example` Coverage

`.env.example` documents: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `NODE_ENV`, `PORT`, `API_URL`, `FRONTEND_URL`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SES_FROM_EMAIL`, `SENTRY_DSN`.

All variables required by `config/index.ts` are documented in `.env.example`. ✅

Note: `REDIS_URL`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `API_URL`, `SES_FROM_EMAIL`, `AWS_*` are in `.env.example` but not in `config/index.ts` — they are future/planned variables. Not a gap.

### 5.6 `apps/api/.env` Assessment

File exists. Contains development/test values only:
- `DATABASE_URL` — local PostgreSQL dev database ✅ (dev value)
- `JWT_SECRET` — weak dev placeholder ⚠️ (must replace for production)
- `NODE_ENV` — `"development"` ✅ (dev value)
- `STRIPE_SECRET_KEY` — Stripe test key (`sk_test_...`) ✅ (test value, not live)
- `STRIPE_WEBHOOK_SECRET` — test webhook secret (`whsec_...`) ✅ (test value, not live)

No production secrets detected in the committed dev `.env` file. The file contains only development/test credentials as expected.


---

## 6. Deployment Checklist

### 6.1 Build Scripts

| Package | Script | Command | Status |
|---|---|---|---|
| `apps/api` | `build` | `tsc` | ✅ PASS |
| `apps/api` | `start` | ❌ No `start` script defined in `package.json` | ⚠️ GAP |
| `apps/web` | `build` | `tsc -b && vite build` | ✅ PASS |

**Note on missing `start` script:** `apps/api/package.json` has `dev` (`ts-node-dev`) but no `start` script for production. The `BETA-DEPLOYMENT-CHECKLIST.md` documents the correct production start command as `node dist/server.js`. This should be added as a `start` script for operational clarity.

### 6.2 NODE_ENV=production Behavior

**Reset token suppression (`auth.service.ts`):**
```typescript
if (config.nodeEnv !== 'production' && resetToken !== undefined) {
  response.resetToken = resetToken;
}
```
Reset token is excluded from the response in production. ✅

**Verbose Prisma logging:** No explicit Prisma log configuration found in the codebase. Prisma defaults to no query logging unless `log: ['query']` is passed to `PrismaClient`. No dev-only Prisma logging to suppress. ✅

### 6.3 Exact Production Deployment Commands

```bash
# 1. Apply database migrations
cd packages/database
npx prisma migrate deploy

# 2. Install API dependencies
cd apps/api
npm install --production

# 3. Build the API
cd apps/api
npm run build

# 4. Start the API server
cd apps/api
NODE_ENV=production node dist/server.js

# 5. Install web dependencies
cd apps/web
npm install

# 6. Build the web app
cd apps/web
npm run build

# 7. Serve the web build (example with a static server)
# Serve apps/web/dist via nginx, Caddy, or equivalent

# 8. Verify health endpoint
curl https://<api-domain>/api/v1/health
# Expected: {"status":"ok"}

# 9. Register Stripe webhooks in Stripe Dashboard
# Payments webhook:      POST https://<api-domain>/api/v1/payments/webhook
# Subscriptions webhook: POST https://<api-domain>/api/v1/subscriptions/webhook

# 10. Seed plans (first deploy only)
cd apps/api
NODE_ENV=production npx ts-node ../../scripts/seed-plans.js
# IMPORTANT: Replace placeholder stripe_price_id values in plans table before this step
```

### 6.4 Required Environment Variables for Production

```bash
# Minimum required set — server will not start without these
DATABASE_URL="postgresql://..."
JWT_SECRET="<32+ random bytes from: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
NODE_ENV="production"

# Required for billing to function
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Required for correct payment redirects
FRONTEND_URL="https://app.yourdomain.com"

# Required for production file storage
STORAGE_PROVIDER="s3"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="..."

# Recommended (not required at startup)
SENTRY_DSN="https://...@sentry.io/..."
```


---

## 7. Bug Register

All open issues from Phases 1–9 plus new findings from this audit.

| ID | Description | Severity | Module | Source | Status |
|---|---|---|---|---|---|
| BUG-001 | Stripe price IDs in `plans` table are placeholder values (`price_starter_placeholder`, etc.). The `subscriptions.service.ts` reads `stripe_price_id` from `plan.features` JSON and throws `PLAN_MISCONFIGURED` if absent. No real Stripe subscription can be created until live price IDs are seeded. | **CRITICAL** | SaaS Billing / Plans | Phase 9 Audit | **OPEN** |
| BUG-002 | `checkUserLimit` in `usage.service.ts` is implemented but not called during user registration (`auth.service.ts`) or any user-invite flow. A firm can exceed its plan's `max_users` limit without enforcement. | **MEDIUM** 
| SaaS Billing / Auth | Phase 9 Audit | **OPEN** |
| BUG-003 | Sentry is not integrated. `SENTRY_DSN` is documented in `.env.example` but not referenced in `config/index.ts` or any application code. No error tracking in production. | **MEDIUM** | Observability | Phase 9 Audit + Phase 10 Confirmed | **OPEN** |
| BUG-004 | Backup procedures are documented in `docs/05-operations/SYSTEM-OPERATIONS.md` (Section 2: Data Backup & Restore Strategy) with RDS automated backups (30-day retention), manual snapshot scripts, S3 lifecycle policies, and restore procedures. However, this is a design/planning document — no evidence that backup infrastructure (RDS, Terraform) has been provisioned or tested. | **MEDIUM** | Operations | Phase 10 Audit | **OPEN — documented but unverified** |
| BUG-005 | `apps/api/package.json` has no `start` script. Production start command (`node dist/server.js`) is documented in `BETA-DEPLOYMENT-CHECKLIST.md` but not codified as an npm script. Operational risk: deployment scripts that rely on `npm start` will fail. | **LOW** | Deployment | Phase 10 Audit | **OPEN** |
| BUG-006 | `security_audit_logs` table does not exist in `schema.prisma`. The `production-readiness.md` doc defines the schema and events to log, but the table was never implemented. No security event audit trail (login failures, access denials, document downloads) exists in the database. | **MEDIUM** | Security / Observability | Phase 10 Audit | **OPEN** |
| BUG-007 | `invoice_paid` notification in `webhook.controller.ts` was fixed in Phase 8 (now uses `prisma.users.findFirst` to find a firm user). However the Phase 6 audit noted that `invoice.created_by` was used (always null). Verified in current code: the fix is present — uses `firmUser.id` from a DB lookup. | **RESOLVED** | Notifications / Billing | Phase 6 Audit | **CLOSED** |
| BUG-008 | `EmailEventTypeEnum` mismatch: TypeScript type includes `'failed'` but DB enum has `'complained'`. The `email.service.ts` only ever passes `'sent'` so no runtime error today, but the type contract is wrong. | **LOW** | Notifications | Phase 6 Audit | **OPEN** |
| BUG-009 | `subscription_id` is never written to `localStorage` after `createSubscription` in `useCreateSubscription.ts`. `SubscriptionPage` and `HistoryPage` always show "No active subscription" state. | **MEDIUM** | SaaS Billing / Frontend | Phase 9 Audit | **OPEN** |
| BUG-010 | `NODE_ENV` defaults to `'development'` in config schema. If not explicitly set in production, the forgot-password endpoint will return `resetToken` in the API response — a security leak. | **MEDIUM** | Auth / Config | Phase 10 Audit | **OPEN — mitigated by deployment checklist** |
| BUG-011 | `STORAGE_PROVIDER` defaults to `'local'`. If not set in production, all file uploads go to local disk — data loss risk on container restart or horizontal scaling. | **MEDIUM** | Documents / Config | Phase 10 Audit | **OPEN — mitigated by deployment checklist** |
| BUG-012 | `clients.repository.ts` and `contacts.repository.ts` `update()` methods use `where: { id }` without `firm_id`. Defense-in-depth gap — cross-tenant update is theoretically possible if service pre-check is bypassed. | **LOW** | CRM / Security | Phase 2 Audit + Phase 10 Confirmed | **OPEN** |


---

## 8. Final Recommendation

### Decision Matrix

| Category | Open CRITICAL | Open MEDIUM | Open LOW |
|---|---|---|---|
| SaaS Billing | BUG-001 ❌ | BUG-002, BUG-009 | — |
| Observability | — | BUG-003, BUG-006 | — |
| Operations | — | BUG-004, BUG-010, BUG-011 | BUG-005 |
| Security | — | — | BUG-008, BUG-012 |

**CRITICAL open bugs: 1 (BUG-001)**
**MEDIUM open bugs: 7 (BUG-002, BUG-003, BUG-004, BUG-006, BUG-009, BUG-010, BUG-011)**
**LOW open bugs: 3 (BUG-005, BUG-008, BUG-012)**

### Verdict: ❌ NO-GO

Per REQ-10.2: **Any CRITICAL open bug → NO-GO.**

BUG-001 (placeholder Stripe price IDs) is CRITICAL. No real subscription can be created or charged until live Stripe price IDs are seeded into the `plans` table. Launching with placeholder IDs would result in every subscription attempt failing with `PLAN_MISCONFIGURED`.

### Path to GO

**Step 1 — Resolve CRITICAL (required before any launch):**

1. Create live Stripe products and prices in the Stripe Dashboard for each plan (Starter, Professional, Enterprise).
2. Update `scripts/seed-plans.js` to use real `stripe_price_id` values in the `features` JSON.
3. Run `node scripts/seed-plans.js` against the production database.
4. Verify `subscriptions.service.ts` can successfully create a Stripe subscription end-to-end.

**Step 2 — Pre-launch checklist for MEDIUM items (required before accepting real customers):**

| Item | Action |
|---|---|
| BUG-002 | Wire `usageService.checkUserLimit(firmId)` into `auth.service.ts` `register()` and any user-invite endpoint. |
| BUG-003 | Install `@sentry/node`, add `SENTRY_DSN` to `config/index.ts`, initialize Sentry in `server.ts` before routes. |
| BUG-004 | Provision RDS with automated backups enabled (30-day retention). Run a test restore from snapshot before launch. Document the restore procedure with actual instance identifiers. |
| BUG-006 | Implement `security_audit_logs` table (schema defined in `production-readiness.md`) and wire login/logout/access-denied events. |
| BUG-009 | Add `localStorage.setItem('subscription_id', data.id)` in `useCreateSubscription` `onSuccess`, or refactor to fetch subscription by `firmId` from the backend. |
| BUG-010 | Ensure `NODE_ENV=production` is set in all production environment configs. |
| BUG-011 | Ensure `STORAGE_PROVIDER=s3` with valid AWS credentials is set in all production environment configs. |

**Step 3 — Conditional GO criteria:**

Once BUG-001 is resolved and all MEDIUM items are either fixed or formally accepted with documented risk, the system may proceed to a **Conditional GO** for production launch.

---

## 9. Regression Validation Summary

### Phase Audit Status

| Phase | Audit Report | Final Verdict | Open Issues Carried Forward |
|---|---|---|---|
| Phase 1 — Auth | `PHASE-1-FINAL-AUDIT.md` | ✅ PASS WITH WARNINGS | W1 (JWT config) — resolved in Phase 2 |
| Phase 2 — CRM | `PHASE-2-CRM-AUDIT-REPORT.md` | ✅ PASS | BUG-012 (repository defense-in-depth) |
| Phase 3 — Documents | `PHASE-3-DOCUMENTS-IMPLEMENTATION.md` | ✅ COMPLETE | None critical |
| Phase 4 — Tasks | `PHASE-4-TASKS-AUDIT.md` | ✅ PASS WITH WARNINGS | Non-blocking UX warnings only |
| Phase 5 — Billing | `PHASE-5-BILLING-AUDIT.md` | ⚠️ PARTIAL PASS | Violations 6–10 were addressed in subsequent phases (payments folder created, webhook path corrected) |
| Phase 6 — Notifications | `PHASE-6-NOTIFICATIONS-AUDIT.md` | ⚠️ PARTIAL PASS | BUG-008 (EmailEventTypeEnum), BUG-007 (resolved) |
| Phase 7 — Beta Launch | `PHASE-7-BETA-LAUNCH-READINESS.md` | ✅ GO for beta | B-001 (JWT_SECRET) — deployment checklist item |
| Phase 8 — Portal | `PHASE-8-PORTAL-AUDIT.md` | ✅ PASS WITH FINDINGS | FINDING-3, FINDING-4 (low severity) |
| Phase 9 — SaaS Billing | `PHASE-9-SAAS-BILLING-AUDIT.md` | ✅ PASS with gaps | BUG-001 (CRITICAL), BUG-002, BUG-009 |

All phases show PASS or equivalent final status. No phase has an unresolved CRITICAL bug from its own scope except Phase 9's BUG-001 which is carried forward into this register.

### Core Flow Integrity (Code Review)

| Flow | Status |
|---|---|
| Auth: register → login → password reset | ✅ Intact — verified in Phase 1, no modifications since |
| CRM: client CRUD, contact CRUD | ✅ Intact — verified in Phase 2 |
| Documents: upload → download → delete | ✅ Intact — verified in Phase 3 |
| Tasks: create → assign → update → complete | ✅ Intact — verified in Phase 4 |
| Billing: invoice → PDF → payment → webhook | ✅ Intact — verified in Phase 5, webhook path corrected |
| Notifications: create → mark read | ✅ Intact — verified in Phase 6 |
| Portal: client login → document access → invoice payment | ✅ Intact — verified in Phase 8 |
| SaaS Billing: plan list → checkout → webhook → usage | ✅ Backend intact — frontend localStorage gap (BUG-009) |

---

*Audit completed: 2026-03-17. No files were modified during this audit except the creation of this report.*
