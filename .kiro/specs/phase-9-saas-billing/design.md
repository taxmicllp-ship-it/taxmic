# Phase 9 — SaaS Billing Design

## Overview

SaaS billing lives inside the existing `billing` module at `apps/api/src/modules/billing/subscriptions/`. It shares the Stripe client and follows the same patterns as the invoices/payments sub-modules already in place.

---

## Module Structure

```
apps/api/src/modules/billing/
  subscriptions/
    subscriptions.types.ts          ← types (Plan, Subscription, UsageSummary, DTOs)
    subscriptions.validation.ts     ← Zod schemas
    plans.repository.ts             ← DB reads for plans
    plans.service.ts                ← list/get plans
    subscriptions.repository.ts     ← DB reads/writes for subscriptions + events
    subscriptions.service.ts        ← create/update/cancel + Stripe calls
    usage.service.ts                ← live count queries + limit enforcement
    subscriptions.controller.ts     ← HTTP handlers
    subscriptions.routes.ts         ← Express router
    stripe-subscriptions-webhook.controller.ts  ← webhook handler

apps/web/src/
  features/billing/
    api/billing-api.ts              ← axios calls
    hooks/useSubscription.ts
    hooks/useUsage.ts
    types.ts
  pages/billing/
    plans.tsx
    subscription.tsx
    usage.tsx
    history.tsx
```

---

## Database Tables (existing — no new tables)

### `plans`
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | varchar(100) | e.g. "Starter" |
| slug | varchar(50) | unique |
| stripe_price_id | — | not in schema; stored in `features` JSON or seeded externally |
| price_monthly | decimal | |
| price_annual | decimal | |
| max_users | int? | null = unlimited |
| max_clients | int? | null = unlimited |
| max_storage_gb | int? | null = unlimited |
| features | json? | arbitrary feature flags |
| is_active | bool | filter on this |

> Note: `stripe_price_id` is not a dedicated column in the schema. It is stored in the `features` JSON field: `{ "stripe_price_id": "price_xxx" }`. The seed script must write it there. The service reads it as:
> ```typescript
> const stripePriceId = (plan.features as Record<string, string> | null)?.stripe_price_id;
> if (!stripePriceId) throw new AppError('Plan has no Stripe price configured', 500, 'PLAN_MISCONFIGURED');
> ```

### `subscriptions`
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| firm_id | uuid | unique — one subscription per firm |
| plan_id | uuid | FK → plans |
| status | enum | trialing/active/past_due/canceled/unpaid |
| stripe_subscription_id | varchar? | |
| stripe_customer_id | varchar? | |
| current_period_start | datetime? | |
| current_period_end | datetime? | |
| cancel_at_period_end | bool | |
| canceled_at | datetime? | |
| trial_start / trial_end | datetime? | |

### `subscription_events`
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| subscription_id | uuid | FK → subscriptions |
| event_type | varchar(100) | e.g. "customer.subscription.updated" |
| from_status | varchar? | previous status |
| to_status | varchar? | new status |
| metadata | json? | arbitrary payload |
| created_at | datetime | |

> No `stripe_event_id` column exists. Idempotency is handled by checking for an existing event with matching `event_type` + `metadata->>'stripe_event_id'` within the last 60 seconds, or by using the `webhook_events` table already used by the payments webhook.

---

## Stripe Integration

The existing `stripe.service.ts` uses a factory function and doesn't expose the Stripe client directly. The subscriptions service will instantiate its own Stripe client using the same pattern:

```typescript
function getStripe(): Stripe {
  if (!config.stripeSecretKey) throw new AppError('Stripe not configured', 503, 'STRIPE_NOT_CONFIGURED');
  return new Stripe(config.stripeSecretKey, { apiVersion: '2026-02-25.clover' });
}
```

### Subscription Creation Flow
```
POST /api/v1/subscriptions
  → validate planId + paymentMethodId
  → check firm has no active subscription (409 if exists)
  → stripe.customers.create({ email, name, metadata: { firm_id } })
  → stripe.paymentMethods.attach(paymentMethodId, { customer })
  → stripe.customers.update(customerId, { invoice_settings: { default_payment_method } })
  → stripe.subscriptions.create({ customer, items: [{ price: plan.stripe_price_id }] })
  → subscriptions.create({ firmId, planId, stripeCustomerId, stripeSubscriptionId, status, periods })
  → subscription_events.create({ event_type: 'subscription.created' })
```

### Webhook Flow
```
POST /api/v1/subscriptions/webhook (raw body, no JWT)
  → verify stripe signature
  → idempotency: check webhook_events table (reuse existing pattern)
  → upsert webhook_events record
  → handle event type
  → update subscription status/periods
  → record subscription_event
  → mark webhook_events as processed
```

The webhook reuses the existing `webhook_events` table (already used by payments webhook) for idempotency — same pattern as `webhook.controller.ts`.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/v1/plans | JWT | List active plans |
| POST | /api/v1/subscriptions | JWT | Create subscription |
| GET | /api/v1/subscriptions/:id | JWT | Get subscription |
| PATCH | /api/v1/subscriptions/:id | JWT | Update subscription |
| DELETE | /api/v1/subscriptions/:id | JWT | Cancel subscription |
| POST | /api/v1/subscriptions/webhook | None (sig verify) | Stripe webhook |
| GET | /api/v1/usage | JWT | Get usage summary |

---

## Usage Tracking Design

No `subscription_usage` table. All usage is computed via live Prisma counts:

```typescript
users     → prisma.users.count({ where: { firm_id, deleted_at: null } })
clients   → prisma.clients.count({ where: { firm_id, deleted_at: null } })
documents → prisma.documents.count({ where: { firm_id, deleted_at: null } })
storage   → prisma.storage_usage.findFirst({ where: { firm_id } }) → total_bytes
```

### Limit Enforcement

`usageService` exposes three guard methods called by CRM and Documents services:

```typescript
usageService.checkUserLimit(firmId)     // called before user creation
usageService.checkClientLimit(firmId)   // called before client creation
usageService.checkStorageLimit(firmId, additionalBytes)  // called before upload
```

Each method:
1. Fetches the firm's subscription + plan
2. If no subscription → returns (no enforcement)
3. If plan limit is `null` → returns (unlimited)
4. Counts current usage
5. If `count >= limit` → throws `AppError(403, 'PLAN_LIMIT_EXCEEDED')`

---

## Frontend Design

### State Management
- React Query for all server state
- No global store needed

### Pages

**`/billing/plans`** — PlansPage
- Fetches `GET /api/v1/plans`
- Card grid: plan name, price, limits, features
- "Subscribe" button → opens payment method form (Stripe Elements or paymentMethodId input)
- Highlights current plan if subscription exists

**`/billing/subscription`** — SubscriptionPage
- Fetches current subscription (GET by firm's subscription ID)
- Shows: plan name, status badge, period dates, cancel_at_period_end warning
- "Cancel Subscription" button → DELETE with confirmation
- "Change Plan" → links to plans page

**`/billing/usage`** — UsagePage
- Fetches `GET /api/v1/usage`
- Progress bars for users, clients, storage
- Shows raw numbers: "3 / 5 users"
- Color coding: green < 80%, yellow 80–95%, red > 95%

**`/billing/history`** — HistoryPage
- Fetches subscription events via usage/subscription endpoint
- Table: date, event type, from/to status, metadata summary

### Layout
All pages use `DashboardLayout` per layout governance.

---

## Routing Registration

`apps/api/src/modules/billing/index.ts` — add subscriptions router:
```typescript
import subscriptionsRouter from './subscriptions/subscriptions.routes';
billingRouter.use(subscriptionsRouter);
```

`apps/web/src/App.tsx` — add billing routes under protected routes:
```tsx
<Route path="/billing/plans" element={<PlansPage />} />
<Route path="/billing/subscription" element={<SubscriptionPage />} />
<Route path="/billing/usage" element={<UsagePage />} />
<Route path="/billing/history" element={<HistoryPage />} />
```

---

## Correctness Properties

**P1 — Single subscription per firm:** At no point should `subscriptions` contain two non-canceled rows with the same `firm_id`.

**P2 — Status consistency:** The subscription `status` in the database must always reflect the latest Stripe status after webhook processing.

**P3 — Limit enforcement:** If `plan.max_clients = N` and `clients.count = N`, then `POST /clients` must return 403.

**P4 — Idempotent webhooks:** Processing the same Stripe event ID twice must produce the same database state as processing it once.

**P5 — Tenant isolation:** `GET /api/v1/subscriptions/:id` for a subscription belonging to firm A must return 404 when called by firm B.
