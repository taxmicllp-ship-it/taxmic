# Design Document — Phase 7: Beta Launch Preparation

## Overview

Phase 7 is a readiness phase, not a feature phase. No new API endpoints, schema changes, or UI pages are introduced. The work consists of four concrete deliverables:

1. **Beta seed script** (`scripts/seed-beta-firms.ts`) — already written; this document specifies its design constraints and correctness properties.
2. **Static workflow audit** — a code-level trace of the Client → Document → Task → Invoice → Payment chain, verifying module registration, middleware application, and webhook wiring.
3. **Environment variable audit** — a classification of every variable in `apps/api/.env` and `.env.example` against `apps/api/src/config/index.ts`.
4. **Output documents** — `docs/BETA-DEPLOYMENT-CHECKLIST.md` and `docs/audits/PHASE-7-BETA-LAUNCH-READINESS.md`.

### Constraints

- No new features, no schema changes, no infrastructure deployment.
- Storage remains `local` for beta (`STORAGE_PROVIDER` defaults to `local` in config).
- `DashboardLayout` remains the approved layout wrapper (per layout-governance.md).
- The seed script uses Prisma client directly — no HTTP layer.

---

## Architecture

The system under audit is a monorepo with two apps:

```
apps/api/   — Express + Prisma API (Node.js / TypeScript)
apps/web/   — React + Vite frontend
packages/database/ — Shared Prisma schema
scripts/    — Operational scripts (seed, etc.)
```

### Module Registration in `apps/api/src/app.ts`

All six feature modules are mounted on `/api/v1`:

| Mount path | Router | Module |
|---|---|---|
| `/api/v1/auth` | `auth.routes` | Auth |
| `/api/v1` | `crm/index` | CRM (clients + contacts) |
| `/api/v1` | `documents.routes` | Documents |
| `/api/v1` | `tasks.routes` | Tasks |
| `/api/v1` | `billing/index` | Billing (invoices + payments + webhook) |
| `/api/v1` | `notifications/index` | Notifications |

The global `express.json()` body parser is applied before all routes. The Stripe webhook route overrides this with `express.raw()` at the route level (see §Static Audit).

---

## Components and Interfaces

### Seed Script (`scripts/seed-beta-firms.ts`)

The script is already implemented. Its design is:

- **Runtime**: `ts-node`, invoked from `apps/api/` so that `@prisma/client` resolves correctly.
- **Database access**: `PrismaClient` directly — no HTTP calls.
- **Idempotency**: `firms.findUnique({ where: { slug } })` check before each firm; skips without error if found.
- **Transactions**: Each firm's creation (firm + firm_settings + invoice_sequences + storage_usage + user + user_role) is wrapped in `prisma.$transaction`.
- **Pre-flight check**: Verifies `owner` role exists before processing any firm; exits with non-zero code if missing.
- **Output**: Prints a credential table to stdout on completion.

Firm data:

| Slug | Email | Password |
|---|---|---|
| beta-firm-1 | admin@betafirm1.com | BetaPass1! |
| beta-firm-2 | admin@betafirm2.com | BetaPass2! |
| beta-firm-3 | admin@betafirm3.com | BetaPass3! |
| beta-firm-4 | admin@betafirm4.com | BetaPass4! |
| beta-firm-5 | admin@betafirm5.com | BetaPass5! |

### Static Workflow Audit

The audit traces the Workflow_Chain through code inspection only.

**Chain**: Client (CRM) → Document → Task → Invoice → Payment

#### CRM Module

- `apps/api/src/modules/crm/index.ts` mounts `clientsRouter` and `contactsRouter`.
- Client records carry `firm_id` (tenant isolation) and expose `id` as `client_id` for downstream modules.
- All CRM routes apply `authenticate` + `tenantContext` middleware (verified in `clients.routes.ts`).

#### Documents Module

- `documents.routes.ts` applies `router.use(authenticate, tenantContext)` globally.
- Routes are scoped under `/clients/:id/folders` and `/clients/:id/documents` — `client_id` is the `:id` path param.
- `documents.service.ts` resolves storage via `getStorageProvider()` from `storage.factory.ts`, which reads `STORAGE_PROVIDER` env var and defaults to `LocalStorageProvider`.

#### Tasks Module

- `tasks.routes.ts` applies `router.use(authenticate, tenantContext)` globally.
- `TaskResponse` and `CreateTaskDto` both carry `client_id` (optional FK to CRM clients).
- `/clients/:id/tasks` route provides the client-scoped task list.

#### Billing — Invoices

- `invoices.routes.ts` applies `router.use(authenticate, tenantContext)` globally.
- `CreateInvoiceDto` requires `client_id` (non-optional FK to CRM clients).
- `/clients/:id/invoices` route provides the client-scoped invoice list.

#### Billing — Payments & Webhook

- `payments.routes.ts` registers the Stripe webhook **before** authenticated routes:
  ```
  POST /payments/webhook  →  express.raw({ type: 'application/json' })  →  stripeWebhookHandler
  ```
  No `authenticate` or `tenantContext` middleware on this route. ✓
- `webhook.controller.ts` handles `checkout.session.completed`:
  1. Verifies Stripe signature.
  2. Idempotency check via `webhook_events` table.
  3. Updates payment status to `completed` via `paymentsRepository.updateByStripePaymentIntentId`.
  4. Updates invoice status to `paid` via `invoicesRepository.updateStatus`.
  5. Calls `notificationsService.createNotification` for the firm's first active user.
- Note: The requirements mention `payment_intent.succeeded` but the implementation handles `checkout.session.completed`. This is the correct event for Stripe Checkout flows and is consistent with the Phase 5 billing design. The requirements document contains a minor terminology mismatch — not a bug.

#### Notifications Module

- `notifications/index.ts` exports the router as default and `notificationsService` as a named export.
- `app.ts` imports the default export (the router) and mounts it at `/api/v1`.
- `notificationsService.createNotification` is called from `webhook.controller.ts` inside a try/catch — notification failures do not fail the webhook response.
- `email-events.service.ts` records email attempts regardless of `SES_FROM_EMAIL` configuration.

### Environment Variable Audit

Comparison of `apps/api/.env` vs `.env.example` vs `apps/api/src/config/index.ts`:

| Variable | In .env | In config schema | Classification | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | ✓ | Not validated (Prisma reads directly) | Present, required | Must be set |
| `JWT_SECRET` | ✓ (`dev-secret-change-in-production`) | Required, min 16 chars | Present, **WEAK** | Pre-production blocker |
| `NODE_ENV` | ✓ (`development`) | Optional, default `development` | Present, acceptable | Set to `production` before prod deploy |
| `PORT` | ✓ (`3000`) | Optional, default `3000` | Present, acceptable | — |
| `STRIPE_SECRET_KEY` | ✓ (test key) | Optional | Present, acceptable for beta | Switch to live key for production |
| `STRIPE_WEBHOOK_SECRET` | ✓ (test secret) | Optional | Present, acceptable for beta | Switch for production |
| `STORAGE_PROVIDER` | ✗ | Optional, default `local` | Missing, acceptable | Defaults to local disk |
| `SES_FROM_EMAIL` | ✗ | Not in schema | Missing, known limitation | Email sending non-functional |
| `AWS_REGION` | ✗ | Not in schema | Missing, acceptable | Not needed while storage is local |
| `AWS_ACCESS_KEY_ID` | ✗ | Not in schema | Missing, acceptable | Not needed while storage is local |
| `AWS_SECRET_ACCESS_KEY` | ✗ | Not in schema | Missing, acceptable | Not needed while storage is local |
| `AWS_S3_BUCKET` | ✗ | Not in schema | Missing, acceptable | Not needed while storage is local |
| `SENTRY_DSN` | ✗ | Not in schema | Missing, acceptable | Error tracking not required for beta |
| `FRONTEND_URL` | ✗ | Not in schema | Missing, notable | May affect CORS; not currently validated |
| `API_URL` | ✗ | Not in schema | Missing, notable | May affect redirect logic; not validated |
| `REDIS_URL` | ✗ | Not in schema | In .env.example only | Not referenced by config schema; unused |
| `JWT_REFRESH_SECRET` | ✗ | Not in schema | In .env.example only | Refresh tokens not implemented |
| `JWT_REFRESH_EXPIRES_IN` | ✗ | Not in schema | In .env.example only | Refresh tokens not implemented |

**Pre-production blockers**: `JWT_SECRET` must be replaced with a cryptographically strong secret (≥ 32 random bytes) before any production deployment.

---

## Data Models

No new data models are introduced in Phase 7. The seed script writes to existing tables:

- `firms` — `id`, `name`, `slug`, `email`
- `firm_settings` — `firm_id` (FK)
- `invoice_sequences` — `firm_id` (FK)
- `storage_usage` — `firm_id`, `total_bytes`, `document_count`
- `users` — `firm_id`, `email`, `password_hash`, `first_name`, `last_name`, `is_active`, `email_verified`
- `user_roles` — `user_id`, `role_id`, `firm_id`
- `roles` — read-only; `owner` role must pre-exist

All writes are wrapped in `prisma.$transaction` per firm, ensuring atomicity.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Seed creates complete firm structure

*For any* clean database (no pre-existing beta slugs), running the seed script should result in exactly 5 firms, each with exactly one `firm_settings` record, one `invoice_sequences` record, one `storage_usage` record, one `users` record with `is_active = true` and `email_verified = true`, and one `user_roles` record linking that user to the `owner` role. The bcrypt hash stored in `password_hash` must have the `$2b$12$` prefix indicating cost factor 12.

**Validates: Requirements 1.1, 1.2**

---

### Property 2: Seed is idempotent

*For any* database state where one or more beta firm slugs already exist, re-running the seed script should not create duplicate firm records, should not throw an error, and should report those firms with status `skipped`. The total firm count after re-run must equal the count before re-run for already-existing slugs.

**Validates: Requirements 1.3**

---

### Property 3: Seed output contains all credential columns

*For any* execution of the seed script, the stdout output must contain a row for each of the 5 beta firms, and each row must include the firm slug, email address, plaintext password, and a status value of either `created` or `skipped`.

**Validates: Requirements 1.4**

---

### Property 4: Transaction isolation on failure

*For any* firm creation where the database transaction fails mid-way, the other firms' transactions must complete successfully and their records must be fully present in the database. No partial firm records (firm without settings, or user without role) should exist after a partial failure.

**Validates: Requirements 1.6**

---

### Property 5: Webhook updates both payment and invoice on checkout.session.completed

Given a valid `checkout.session.completed` Stripe event with a known `payment_intent` ID and `metadata.invoice_id`, calling `stripeWebhookHandler` should result in the payment record having `status = 'completed'` and the invoice record having `status = 'paid'`.

**Validates: Requirements 2.5**

---

### Property 6: Email events are recorded regardless of SES configuration

*For any* email send attempt via `emailService`, an `email_events` record must be created in the database regardless of whether `SES_FROM_EMAIL` is set. The absence of `SES_FROM_EMAIL` must not cause the record creation to be skipped or throw an unhandled exception.

**Validates: Requirements 2.6**

---

## Error Handling

### Seed Script

- Missing `owner` role → `throw new Error(...)` + `process.exit(1)` via `.catch` handler.
- Transaction failure for a single firm → Prisma rolls back automatically; error is caught, logged, and the loop continues to the next firm.
- `PrismaClient` is always disconnected in the `.finally` block.

### Webhook Controller

- Missing `STRIPE_WEBHOOK_SECRET` → 503 response, no processing.
- Invalid Stripe signature → 400 response, no processing.
- Already-processed event (idempotency) → 200 response, no re-processing.
- Notification failure → caught in inner try/catch; webhook still returns 200. Notification errors are non-fatal.
- Any other processing error → 500 response; `webhook_events` record updated to `failed`.

### Config Validation

- `apps/api/src/config/index.ts` uses Zod `safeParse`. If required variables are missing or invalid, the process exits with code 1 and logs field errors. This runs at startup, not at request time.

---

## Testing Strategy

Phase 7 introduces no new runtime features, so the testing scope is focused on the seed script and the webhook handler.

### Unit Tests

Unit tests should cover specific examples and error conditions:

- **Seed script — owner role missing**: Mock `prisma.roles.findFirst` to return `null`; assert process exits with non-zero code and prints an error message.
- **Seed script — firm already exists**: Mock `prisma.firms.findUnique` to return an existing firm for one slug; assert that firm is skipped and the result table shows `skipped`.
- **Webhook handler — checkout.session.completed**: Provide a mock Stripe event; assert `paymentsRepository.updateByStripePaymentIntentId` and `invoicesRepository.updateStatus` are called with correct arguments.
- **Webhook handler — invalid signature**: Mock `stripeService.constructEvent` to throw; assert 400 response.
- **Webhook handler — already processed**: Mock `prisma.webhook_events.findUnique` to return `{ status: 'processed' }`; assert 200 response with no further processing.

### Property-Based Tests

Use [fast-check](https://github.com/dubzzz/fast-check) (TypeScript-native PBT library). Each property test must run a minimum of 100 iterations.

**Property 1 — Seed creates complete firm structure**
```
// Feature: phase-7-beta-launch, Property 1: Seed creates complete firm structure
fc.assert(fc.asyncProperty(fc.constant(cleanDb), async (db) => {
  await runSeed(db);
  const firms = await db.firms.findMany({ where: { slug: { startsWith: 'beta-firm-' } } });
  expect(firms).toHaveLength(5);
  for (const firm of firms) {
    const settings = await db.firm_settings.findUnique({ where: { firm_id: firm.id } });
    expect(settings).not.toBeNull();
    // ... assert invoice_sequences, storage_usage, user, user_roles
  }
}), { numRuns: 100 });
```

**Property 2 — Seed is idempotent**
```
// Feature: phase-7-beta-launch, Property 2: Seed is idempotent
fc.assert(fc.asyncProperty(fc.subarray(['beta-firm-1','beta-firm-2','beta-firm-3','beta-firm-4','beta-firm-5']), async (existingSlugs) => {
  await seedExisting(db, existingSlugs);
  const countBefore = await db.firms.count();
  await runSeed(db);
  const countAfter = await db.firms.count();
  expect(countAfter).toBe(countBefore + (5 - existingSlugs.length));
}), { numRuns: 100 });
```

**Property 3 — Seed output contains all credential columns**
```
// Feature: phase-7-beta-launch, Property 3: Seed output contains all credential columns
// Capture stdout, assert each of 5 slugs appears with email, password, and status columns
```

**Property 4 — Transaction isolation on failure**
```
// Feature: phase-7-beta-launch, Property 4: Transaction isolation on failure
// Inject a failure at a random step for one firm; assert other 4 firms are fully created
```

**Property 6 — Email events recorded regardless of SES config**
```
// Feature: phase-7-beta-launch, Property 6: Email events recorded regardless of SES config
fc.assert(fc.asyncProperty(fc.record({ to: fc.emailAddress(), subject: fc.string(), body: fc.string() }), async (emailData) => {
  process.env.SES_FROM_EMAIL = undefined;
  await emailService.send(emailData);
  const events = await db.email_events.findMany({ where: { to: emailData.to } });
  expect(events.length).toBeGreaterThan(0);
}), { numRuns: 100 });
```

Property 5 (webhook) is covered by the unit test example above — it is a specific event type, not a universally quantified property over arbitrary inputs.

### Static Audit Verification

The static audit findings (Requirement 2) are verified by code inspection and documented in the Readiness Report. They do not require automated tests. The audit checklist:

- [ ] All 6 modules registered in `app.ts` — **PASS** (verified above)
- [ ] `authenticate` + `tenantContext` on all protected routes — **PASS** (all route files use `router.use(authenticate, tenantContext)`)
- [ ] Stripe webhook has `express.raw()` and no auth middleware — **PASS** (verified in `payments.routes.ts`)
- [ ] `webhook.controller.ts` updates payment + invoice on `checkout.session.completed` — **PASS**
- [ ] `notificationsService.createNotification` called from webhook — **PASS**
- [ ] `storage.factory.ts` used by documents service — **PASS**
- [ ] `client_id` FK present in Tasks and Invoices — **PASS**
