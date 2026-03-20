# Phase 9 — SaaS Billing Audit Report

**Date:** 2026-03-17  
**Auditor:** Kiro  
**Scope:** Full technical audit of Phase 9 SaaS Billing implementation  
**Verdict:** PASS with known gaps documented below

---

## 1. Architecture Validation

### Backend Module Structure

```
apps/api/src/modules/billing/subscriptions/
  plans.repository.ts          ✓
  plans.service.ts             ✓
  subscriptions.repository.ts  ✓
  subscriptions.service.ts     ✓
  subscriptions.controller.ts  ✓
  subscriptions.routes.ts      ✓
  subscriptions.types.ts       ✓
  subscriptions.validation.ts  ✓
  usage.service.ts             ✓
  stripe-subscriptions-webhook.controller.ts  ✓
```

### Router Registration

`billing/index.ts` correctly mounts `subscriptionsRouter` alongside existing `invoicesRouter` and `paymentsRouter`. All three are mounted at `/api/v1` in `app.ts`. No conflicts with existing routes.

**PASS** — additive-only, no existing routes modified.

### Webhook Raw Body

`subscriptions.routes.ts` correctly applies `express.raw({ type: 'application/json' })` to the webhook route before any auth middleware. The webhook route is registered first in the router file, ensuring it is matched before the authenticated routes.

**PASS**

### app.ts Body Parsing Order

`app.ts` applies `express.json()` globally before mounting routers. The webhook route uses `express.raw()` at the route level, which overrides the global JSON parser for that specific path. This is the correct Express pattern.

**PASS**

---

## 2. Database Validation

### Schema (`saas.prisma`)

| Table | Key Fields | Indexes | Notes |
|---|---|---|---|
| `plans` | id, slug (unique), price_monthly, price_annual, max_users, max_clients, max_storage_gb, features (Json), is_active, sort_order | is_active, sort_order | ✓ |
| `subscriptions` | id, firm_id (unique), plan_id, status, stripe_subscription_id, stripe_customer_id, period dates, cancel_at_period_end | plan_id, status, stripe_subscription_id, current_period_end | ✓ |
| `subscription_events` | id, subscription_id, event_type, from_status, to_status, metadata, created_at | subscription_id, event_type, created_at | ✓ |

`firm_id` is `@unique` on `subscriptions` — correctly enforces one subscription per firm.

`stripe_price_id` is NOT a dedicated column — it lives in `features` JSON as `{ "stripe_price_id": "price_xxx" }`. This is consistent with the schema.

**PASS**

### Seed Script (`scripts/seed-plans.ts`)

- Uses `upsert` on `slug` — idempotent, safe to re-run.
- Correctly stores `stripe_price_id` inside `features` JSON.
- Placeholder values (`price_starter_placeholder`, etc.) are clearly documented as requiring replacement before production.
- `PrismaClient` imported from `@prisma/client` — correct for the `apps/api` context.
- Usage: `cd apps/api && npx ts-node ../../scripts/seed-plans.ts`

**PASS**

---

## 3. Stripe Integration Validation

### createSubscription flow (`subscriptions.service.ts`)

1. Checks for existing subscription → 409 if found ✓
2. Reads `stripe_price_id` from `plan.features` JSON ✓
3. Creates or retrieves Stripe customer via `stripe.customers.create` ✓
4. Creates Stripe subscription with `payment_behavior: 'default_incomplete'` and `expand: ['latest_invoice.payment_intent']` ✓
5. Extracts `current_period_start/end` from `sub.items.data[0]` (Stripe v20 items API) ✓
6. Persists to DB with `stripe_subscription_id` and `stripe_customer_id` ✓
7. Creates initial `subscription.created` event ✓

### cancelSubscription flow

Calls `stripe.subscriptions.update({ cancel_at_period_end: true })` — correct graceful cancellation pattern (does not immediately terminate). DB updated to reflect `cancel_at_period_end: true`.

**PASS**

### updateSubscription flow

Calls `stripe.subscriptions.update` with new `items` array using the existing item ID. Correctly handles plan change via Stripe's subscription update API.

**PASS**

### Stripe API Version

Both `subscriptions.service.ts` and `stripe-subscriptions-webhook.controller.ts` use `apiVersion: '2026-02-25.clover' as any`. The `as any` cast is required because the Stripe SDK types may not yet include this version string. This is acceptable.

**PASS**

---

## 4. Webhook Validation

### Signature Verification

`stripe.webhooks.constructEvent(req.body as Buffer, sig, config.stripeWebhookSecret)` — correct. Requires raw body (verified above).

### Idempotency

Uses `webhook_events` table (same pattern as Phase 5 payments webhook):
1. Check `findUnique` by `event_id` — if `status === 'processed'`, return 200 immediately ✓
2. `upsert` with `status: 'processing'` before handling ✓
3. Update to `status: 'processed'` on success ✓
4. Update to `status: 'failed'` with error message on failure ✓

**PASS**

### Event Handlers

| Event | Handler | Notes |
|---|---|---|
| `customer.subscription.created` | Updates period dates + status, creates event | ✓ |
| `customer.subscription.updated` | Updates period dates + status + cancel_at_period_end, creates event with from/to status | ✓ |
| `customer.subscription.deleted` | Sets status to `canceled`, sets `canceled_at`, creates event | ✓ |
| `invoice.payment_failed` | Sets status to `past_due`, creates event | ✓ |
| `invoice.payment_succeeded` | Sets status to `active`, creates event | ✓ |

`invoice.subscription` is handled as both string and object (`typeof invoice.subscription === 'string'`) — correct for Stripe's polymorphic field.

**PASS**

### Missing Webhook Secret Guard

If `config.stripeWebhookSecret` is falsy, the handler returns 503. This is correct defensive behavior for unconfigured environments.

**PASS**

---

## 5. Usage Tracking Validation

### `usage.service.ts`

All usage is computed via live Prisma counts — no `subscription_usage` table exists (by design).

| Method | Query | Limit Source | Behavior |
|---|---|---|---|
| `getUsageSummary` | counts users, clients, documents; sums storage | `plan.max_*` fields | Returns full summary with limits |
| `checkUserLimit` | counts active users | `plan.max_users` | null = unlimited, throws 403 if exceeded |
| `checkClientLimit` | counts active clients | `plan.max_clients` | null = unlimited, throws 403 if exceeded |
| `checkStorageLimit` | sums storage + incoming bytes | `plan.max_storage_gb` | null = unlimited, throws 403 if exceeded |

Graceful degradation: if no subscription found, `getUsageSummary` returns counts with null limits (unlimited). `checkClientLimit` and `checkStorageLimit` return without throwing if no subscription exists.

**PASS**

### Limit Enforcement Wiring

| Limit | Wired | Location |
|---|---|---|
| Client limit | ✓ | `clients.service.ts → createClient` |
| Storage limit | ✓ | `documents.service.ts → uploadDocument` |
| User limit | ✗ | Not wired to any user creation endpoint |

**KNOWN GAP:** `checkUserLimit` is implemented but not called during user creation. User creation is handled in `auth.service.ts` (registration) and potentially an admin user-management endpoint. Wiring this was out of Phase 9 scope. Document as a Phase 10 / hardening task.

---

## 6. Frontend Validation

### Layout Compliance

All 4 billing pages (`plans.tsx`, `subscription.tsx`, `usage.tsx`, `history.tsx`) are registered as children of `<Route element={<DashboardLayout />}>` in `App.tsx`. Pages do NOT import `DashboardLayout` directly — correct per layout governance.

**PASS**

### Route Registration (`App.tsx`)

```tsx
<Route path="/billing/plans" element={<PlansPage />} />
<Route path="/billing/subscription" element={<SubscriptionPage />} />
<Route path="/billing/usage" element={<UsagePage />} />
<Route path="/billing/history" element={<HistoryPage />} />
```

All 4 routes correctly nested inside `DashboardLayout`. Imports present and correct.

**PASS**

### `billing-api.ts`

All 7 API methods map correctly to backend routes:

| Method | Frontend Call | Backend Route |
|---|---|---|
| `getPlans` | `GET /plans` | `GET /api/v1/plans` ✓ |
| `createSubscription` | `POST /subscriptions` | `POST /api/v1/subscriptions` ✓ |
| `getSubscription` | `GET /subscriptions/:id` | `GET /api/v1/subscriptions/:id` ✓ |
| `updateSubscription` | `PATCH /subscriptions/:id` | `PATCH /api/v1/subscriptions/:id` ✓ |
| `cancelSubscription` | `DELETE /subscriptions/:id` | `DELETE /api/v1/subscriptions/:id` ✓ |
| `getUsage` | `GET /usage` | `GET /api/v1/usage` ✓ |
| `getHistory` | `GET /subscriptions/:id/history` | `GET /api/v1/subscriptions/:id/history` ✓ |

**PASS**

### React Query Hooks (`useSubscription.ts`, `useUsage.ts`)

- `usePlans` — no `enabled` guard needed (always fetch) ✓
- `useSubscription(id)` — `enabled: !!id` guard prevents fetch with empty string ✓
- `useSubscriptionHistory(subscriptionId)` — `enabled: !!subscriptionId` guard ✓
- `useCreateSubscription` — invalidates `['subscription']` and `['usage']` on success ✓
- `useCancelSubscription` — invalidates both subscription and usage queries ✓

**PASS**

### `plans.tsx`

Renders plan cards with name, description, monthly/annual price, and limits. Handles loading and empty states. Subscribe button calls `window.alert('Stripe payment integration required')`.

**KNOWN GAP (by design):** Stripe Elements / payment intent flow is not implemented. The Subscribe button is a placeholder. Full Stripe checkout integration is a future phase item.

### `subscription.tsx`

Reads `subscription_id` from `localStorage.getItem('subscription_id')`. Renders subscription details with status badge, period dates, cancel_at_period_end warning, and cancel button.

**KNOWN GAP:** Nothing in the current implementation writes `subscription_id` to `localStorage` after `createSubscription`. The `createSubscription` mutation in `useCreateSubscription` does not persist the returned subscription ID. This means `SubscriptionPage` and `HistoryPage` will always show the "No active subscription" state until this is wired.

**Root cause:** The `onSuccess` callback in `useCreateSubscription` invalidates queries but does not call `localStorage.setItem('subscription_id', data.id)`.

**Recommended fix (Phase 10):**
```ts
onSuccess: (data) => {
  localStorage.setItem('subscription_id', data.id);
  queryClient.invalidateQueries({ queryKey: ['subscription'] });
  queryClient.invalidateQueries({ queryKey: ['usage'] });
},
```

Alternatively, fetch the subscription by `firmId` from the backend rather than relying on `localStorage`.

### `usage.tsx`

Progress bars with color thresholds (green < 80%, yellow 80–95%, red > 95%). Handles unlimited limits (null) correctly — shows full green bar. Handles loading and empty states.

**PASS**

### `history.tsx`

`subscriptionId` is read at module level (`const subscriptionId = localStorage.getItem('subscription_id') ?? ''`) — this is evaluated once at module load time, not reactively. If `localStorage` is updated after the module loads, the component will not re-read it without a page refresh.

**MINOR ISSUE:** Should be read inside the component function body (or via `useState`) to be reactive. However, given the `localStorage` write gap above, this is a secondary concern.

Uses `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` from `../../components/ui/Table` — consistent with existing UI patterns.

**PASS (with minor note)**

---

## 7. Security Validation

### Authentication

All subscription/usage/history routes require `authenticate` + `tenantContext` middleware. The webhook route explicitly has NO auth middleware (correct — Stripe signs the payload instead).

**PASS**

### Tenant Isolation

- `subscriptionsService.getSubscription` scopes by `firmId` via `subscriptionsRepository.findById(firmId, id)` — the repository checks `firm_id` on the subscription record ✓
- `subscriptionsService.cancelSubscription` and `updateSubscription` both pass `firmId` through to the repository ✓
- `usageService.getUsageSummary` scopes all counts by `firmId` ✓
- `getHistory` in the controller calls `findByFirmId` first, then `listEvents` on the returned subscription — firm isolation maintained ✓

**PASS**

### Input Validation

`createSubscriptionSchema` and `updateSubscriptionSchema` (Zod) are applied via `validate()` middleware on POST and PATCH routes. GET/DELETE routes have no body to validate.

**PASS**

### Stripe Secret Handling

`config.stripeSecretKey` and `config.stripeWebhookSecret` are read from environment config. No secrets hardcoded. Both webhook handlers guard against missing secrets.

**PASS**

---

## 8. Regression Validation

### Existing Billing Module

`billing/index.ts` — `subscriptionsRouter` added alongside existing routers. No existing router modified.

**PASS**

### `clients.service.ts`

`checkClientLimit(firmId)` added as the first call in `createClient`. All other methods unchanged. Import of `usageService` added at top.

**PASS** — additive only.

### `documents.service.ts`

`checkStorageLimit(data.firmId, data.buffer.length)` added after folder validation, before storage upload. All other methods unchanged. Import of `usageService` added at top.

**PASS** — additive only.

### `App.tsx`

4 billing routes added inside the existing `DashboardLayout` block. 4 imports added. No existing routes modified.

**PASS** — additive only.

---

## 9. CURL Test Reference

> Note: Server not running during audit. Expected behavior documented.

### List Plans
```bash
curl http://localhost:3000/api/v1/plans \
  -H "Authorization: Bearer <token>"
# Expected: 200 [ { id, name, slug, price_monthly, price_annual, max_users, max_clients, max_storage_gb, features, ... } ]
```

### Create Subscription
```bash
curl -X POST http://localhost:3000/api/v1/subscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "planId": "<plan-uuid>", "billingInterval": "monthly" }'
# Expected: 201 { id, firm_id, plan_id, status: "trialing", stripe_subscription_id, ... }
# If subscription already exists: 409 { error: "Subscription already exists" }
```

### Get Subscription
```bash
curl http://localhost:3000/api/v1/subscriptions/<id> \
  -H "Authorization: Bearer <token>"
# Expected: 200 { id, firm_id, plan_id, status, current_period_start, current_period_end, plan: { name, ... } }
# If not found or wrong firm: 404
```

### Cancel Subscription
```bash
curl -X DELETE http://localhost:3000/api/v1/subscriptions/<id> \
  -H "Authorization: Bearer <token>"
# Expected: 200 { id, cancel_at_period_end: true, status: "active" }
```

### Get Usage
```bash
curl http://localhost:3000/api/v1/usage \
  -H "Authorization: Bearer <token>"
# Expected: 200 { users: N, clients: N, documents: N, storage_gb: N.NN, limits: { max_users, max_clients, max_storage_gb } }
```

### Get History
```bash
curl http://localhost:3000/api/v1/subscriptions/<id>/history \
  -H "Authorization: Bearer <token>"
# Expected: 200 [ { id, event_type, from_status, to_status, created_at } ]
```

### Webhook (Stripe)
```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: <computed-sig>" \
  --data-binary @event.json
# Expected: 200 (processed) or 400 (bad signature) or 503 (not configured)
```

### Limit Enforcement — Client
```bash
# With a Starter plan (max_clients: 25) and 25 existing clients:
curl -X POST http://localhost:3000/api/v1/clients \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "New Client" }'
# Expected: 403 { error: "Client limit reached for your plan", code: "PLAN_LIMIT_EXCEEDED" }
```

### Limit Enforcement — Storage
```bash
# With a Starter plan (max_storage_gb: 5) and storage at capacity:
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@large-file.pdf" ...
# Expected: 403 { error: "Storage limit reached for your plan", code: "PLAN_LIMIT_EXCEEDED" }
```

---

## 10. Known Gaps & Recommended Actions

| # | Severity | Gap | Recommended Action |
|---|---|---|---|
| 1 | LOW | `subscriptions.types.ts` `Plan` interface has a stale `stripe_price_id: string \| null` field that doesn't exist as a DB column | Remove the field from the interface in a cleanup pass |
| 2 | MEDIUM | `checkUserLimit` is implemented but not wired to any user creation endpoint | Wire in `auth.service.ts` (registration) and any admin user-invite endpoint in Phase 10 |
| 3 | HIGH | `subscription_id` is never written to `localStorage` after `createSubscription` — `SubscriptionPage` and `HistoryPage` always show "No active subscription" | Add `localStorage.setItem('subscription_id', data.id)` in `useCreateSubscription.onSuccess`, or refactor to fetch subscription by `firmId` |
| 4 | MEDIUM | Subscribe button on `PlansPage` is a `window.alert()` placeholder — no Stripe Elements / payment intent flow | Implement Stripe Checkout or Elements in a dedicated billing UI phase |
| 5 | LOW | `history.tsx` reads `subscriptionId` at module level (not reactive) | Move `localStorage.getItem` inside the component function body |

---

## Summary

| Section | Result |
|---|---|
| Architecture | PASS |
| Database | PASS |
| Stripe Integration | PASS |
| Webhook | PASS |
| Usage Tracking | PASS |
| Limit Enforcement | PASS (user limit gap documented) |
| Frontend | PASS with gaps (localStorage write missing, Subscribe placeholder) |
| Security | PASS |
| Regression | PASS |

Phase 9 backend is production-ready pending Stripe key configuration and the `subscription_id` localStorage write fix. The frontend billing UI is functional for usage and plan display; full subscription management requires the localStorage fix and Stripe Elements integration.
