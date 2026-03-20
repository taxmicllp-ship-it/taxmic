# Plan Sync Design — Dual-Source Architecture

**Date:** 2026-03-17  
**Status:** Design document — no code changes made yet

---

## What Is Currently Implemented

### Database (`packages/database/prisma/saas.prisma`)

The `plans` table exists with these columns:

```
id, name, slug, description, price_monthly, price_annual,
max_users, max_clients, max_storage_gb, features (Json), is_active, sort_order
```

The `stripe_price_id` is stored inside the `features` JSON column as:
```json
{ "stripe_price_id": "price_xxx" }
```

There is no `stripe_product_id` column. There is no `stripe_price_id` dedicated column.

### Backend (`apps/api/src/modules/billing/subscriptions/`)

| File | What it does |
|---|---|
| `plans.repository.ts` | `findAll()` (active only, ordered) and `findById()` — read only |
| `plans.service.ts` | `listPlans()` and `getPlan()` — read only |
| `subscriptions.controller.ts` | `listPlans` handler — read only |
| `subscriptions.routes.ts` | `GET /plans` — public to authenticated users, no admin guard |
| `subscriptions.service.ts` | Reads `plan.features.stripe_price_id` when creating/updating subscriptions |
| `stripe-subscriptions-webhook.controller.ts` | Handles: `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded`, `invoice.payment_failed` — does NOT handle `product.created`, `price.created`, or any plan-related webhook events |

### Frontend (`apps/web/src/features/billing/`)

| File | What it does |
|---|---|
| `billing-api.ts` | `getPlans()` — calls `GET /plans` |
| `types.ts` | `Plan` type includes `features: Record<string, unknown>` — `stripe_price_id` is accessible but not typed explicitly |
| `pages/billing/plans.tsx` | Displays plans from DB, Subscribe button triggers Stripe Checkout |

### Seed Script (`scripts/seed-plans.js`)

One-time script. Reads `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE` from env, validates they are set, then upserts 3 plans into the DB with hardcoded pricing and limits. This is the only current mechanism to populate plans.

### What Does NOT Exist

- No admin API endpoint to create/update/delete plans
- No admin UI page for plan management
- No webhook handler for `product.created`, `price.created`, `price.updated`, `product.updated`
- No `stripe_product_id` stored anywhere
- No role-based guard for admin-only routes (JWT has `role` field but no middleware enforces it)
- No sync in either direction between Stripe and the DB beyond what the seed script does manually

---

## Proposed: Dual-Source Architecture

Both flows should work. The DB is always the source of truth at runtime — the subscription service always reads `stripe_price_id` from the `plans` table. The two approaches differ only in how plans get into the DB.

---

## Option A — App Dashboard is Source of Truth

Admin creates/edits a plan in your dashboard. Your API calls Stripe to create the product + price, gets back the IDs, and saves them to the DB.

### What needs to change

#### Database

Add two dedicated columns to `plans` table (currently buried in `features` JSON):

```
stripe_product_id  String?  @db.VarChar(255)
stripe_price_id    String?  @db.VarChar(255)
```

The `features` JSON column can remain for other feature flags. Moving `stripe_price_id` out of JSON makes it queryable and indexable.

New migration required.

#### Backend — New files needed

`plans.repository.ts` — add:
- `create(data)` — insert new plan row
- `update(id, data)` — update plan row
- `deactivate(id)` — set `is_active = false` (soft delete)
- `findByStripeProductId(stripeProductId)` — needed for Option B webhook handler

`plans.service.ts` — add:
- `createPlan(dto)` — calls `stripe.products.create()` + `stripe.prices.create()`, saves both IDs to DB
- `updatePlan(id, dto)` — if price changes, calls `stripe.prices.create()` (Stripe prices are immutable, you create a new one and archive the old), updates DB
- `deactivatePlan(id)` — sets `is_active = false`, archives Stripe price

`plans.controller.ts` — new file:
- `POST /admin/plans` — create plan
- `PATCH /admin/plans/:id` — update plan
- `DELETE /admin/plans/:id` — deactivate plan
- `GET /admin/plans` — list all plans including inactive (admin view)

`plans.routes.ts` — new file:
- All routes behind `authenticate` + a new `requireAdmin` middleware that checks `req.user.role === 'admin'` (the `role` field already exists in the JWT payload)

#### Backend — Existing files to modify

`subscriptions.service.ts` — update `stripe_price_id` lookup:
- Currently reads from `(plan.features as Record<string, string>).stripe_price_id`
- After migration: read from `plan.stripe_price_id` directly

`subscriptions.routes.ts` — register the new plans admin router

`billing/index.ts` — import and mount the new plans router

#### Frontend — New files needed

`apps/web/src/features/billing/api/billing-api.ts` — add admin plan methods:
- `createPlan(data)`
- `updatePlan(id, data)`
- `deactivatePlan(id)`
- `listAllPlans()` (includes inactive)

`apps/web/src/pages/billing/admin-plans.tsx` — new admin page:
- List all plans (active + inactive)
- Create plan form: name, slug, description, price_monthly, price_annual, max_users, max_clients, max_storage_gb
- Edit plan
- Deactivate plan

`apps/web/src/features/billing/types.ts` — update `Plan` type:
- Add `stripe_product_id: string | null`
- Add `stripe_price_id: string | null` as a top-level field (not inside `features`)

#### Frontend — Existing files to modify

`apps/web/src/App.tsx` — add route for `/billing/admin/plans`

---

## Option B — Stripe Dashboard is Source of Truth

You create/edit prices in Stripe Dashboard. Stripe fires webhooks. Your API receives them and upserts the plan in the DB.

### What needs to change

#### Database

Same as Option A — add `stripe_product_id` and `stripe_price_id` columns to `plans` table.

#### Backend — Existing files to modify

`stripe-subscriptions-webhook.controller.ts` — add handlers for:

```
product.created     → create plan row in DB (name, description from Stripe product)
product.updated     → update plan name/description in DB
price.created       → update plan stripe_price_id, price_monthly in DB
price.updated       → if price archived, set plan is_active = false
```

The `handleSubscriptionEvent` function in this file currently has a `switch` with 5 cases. Four new cases are added.

Mapping from Stripe objects to your `plans` table:
- `product.name` → `plans.name`
- `product.description` → `plans.description`
- `product.metadata.slug` → `plans.slug` (you set this metadata in Stripe when creating the product)
- `Number(product.metadata.max_users)` → `plans.max_users` (Stripe metadata is always string — must parse to int)
- `Number(product.metadata.max_clients)` → `plans.max_clients` (same — parse to int)
- `Number(product.metadata.max_storage_gb)` → `plans.max_storage_gb` (same — parse to int, null if absent)
- `price.unit_amount / 100` → `plans.price_monthly` (Stripe stores in cents)
- `price.id` → `plans.stripe_price_id`
- `product.id` → `plans.stripe_product_id`

Note: all `product.metadata` values are strings. The webhook handler must call `Number()` before writing to integer columns. If the value is missing or `NaN`, treat as `null`.

`plans.repository.ts` — add:
- `upsertByStripeProductId(stripeProductId, data)` — used by webhook handler
- `findByStripeProductId(stripeProductId)`

#### Stripe Dashboard configuration required

When creating a product in Stripe Dashboard for Option B to work, you must set these metadata fields on the product:
- `slug` — matches your plan slug (starter, pro, enterprise)
- `max_users`
- `max_clients`
- `max_storage_gb`
- `sort_order`

Without these, the webhook handler cannot populate the limits columns.

#### Webhook events to register in Stripe Dashboard

Currently registered (from `stripe-subscriptions-webhook.controller.ts`):
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Add for Option B:
- `product.created`
- `product.updated`
- `price.created`
- `price.updated`

---

## Shared Changes (required for both options)

### Database migration

New migration file needed under `packages/database/prisma/migrations/`:

```sql
ALTER TABLE plans ADD COLUMN stripe_product_id VARCHAR(255);
ALTER TABLE plans ADD COLUMN stripe_price_id VARCHAR(255);
CREATE INDEX idx_plans_stripe_product_id ON plans(stripe_product_id);
CREATE INDEX idx_plans_stripe_price_id ON plans(stripe_price_id);
```

And update `saas.prisma` to add these fields to the `plans` model.

### Seed script (`scripts/seed-plans.js`)

This script becomes the optional bootstrap tool, not fully obsolete. A fresh deployment needs plans in the DB before any admin UI or Stripe webhook has run. The seed script covers that initial state.

After Option A or B is implemented, the seed script is no longer the primary mechanism — it is a last-resort bootstrap for new environments only. The env vars `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE` in `.env.example` can be removed once the admin UI or webhook sync is in place, since those vars are only needed by the seed script.

### `subscriptions.service.ts`

The line:
```ts
const stripePriceId = (plan.features as Record<string, string> | null)?.stripe_price_id;
```
appears in 3 places (`createSubscription`, `updateSubscription`, `createCheckoutSession`).

After the migration, all three change to:
```ts
const stripePriceId = plan.stripe_price_id;
```

---

## What Does NOT Need to Change

- `webhook_events` table — idempotency handling already works for any event type
- `subscriptions` table — no changes needed
- `subscription_events` table — no changes needed
- `stripe-subscriptions-webhook.controller.ts` signature verification and idempotency logic — reused as-is
- `plans.tsx` (public plans page) — no changes, still reads from `GET /plans`
- `billing-api.ts` `getPlans()` — no changes
- `authenticate` middleware — no changes, `role` already in JWT payload

---

## Summary of Files Affected

| File | Option A | Option B | Both |
|---|---|---|---|
| `saas.prisma` | ✓ | ✓ | ✓ |
| New DB migration | ✓ | ✓ | ✓ |
| `plans.repository.ts` | add write methods | add upsertByStripeProductId | add findByStripeProductId |
| `plans.service.ts` | add createPlan/updatePlan | no change | — |
| `plans.controller.ts` | new file | not needed | — |
| `plans.routes.ts` | new file | not needed | — |
| `billing/index.ts` | mount new router | — | — |
| `stripe-subscriptions-webhook.controller.ts` | — | add 4 event cases | — |
| `subscriptions.service.ts` | update 3 price lookups | update 3 price lookups | ✓ |
| `billing-api.ts` (frontend) | add admin methods | not needed | — |
| `admin-plans.tsx` (frontend) | new page | not needed | — |
| `App.tsx` (frontend) | add route | — | — |
| `billing/types.ts` (frontend) | update Plan type | update Plan type | ✓ |
| `scripts/seed-plans.js` | obsolete | obsolete | ✓ |
| `.env.example` | remove 3 STRIPE_PRICE_* vars | remove 3 STRIPE_PRICE_* vars | ✓ |
