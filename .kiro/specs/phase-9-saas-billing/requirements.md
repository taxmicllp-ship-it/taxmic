# Phase 9 — SaaS Billing Requirements

## Overview

Implement subscription billing for SaaS plans. This allows firms using Taxmic to subscribe to a plan, manage their subscription, enforce usage limits, and receive subscription lifecycle events from Stripe.

---

## Requirements

### REQ-1: Plan Management

**REQ-1.1** The system must expose a public (authenticated) endpoint to list all active plans.

**REQ-1.2** Each plan must expose the following fields:
- `id`, `name`, `slug`, `description`
- `price_monthly`, `price_annual`
- `max_users`, `max_clients`, `max_storage_gb`
- `features` (JSON), `is_active`, `sort_order`

**REQ-1.3** Plans must be seeded with at least three tiers: Starter, Pro, Enterprise.

**REQ-1.4** Plans are read-only from the API. No create/update/delete endpoints for plans.

---

### REQ-2: Subscription Creation

**REQ-2.1** A firm must be able to create a subscription by providing a `planId` and a Stripe `paymentMethodId`.

**REQ-2.2** Each firm may have only one active subscription at a time. Attempting to create a second subscription while one is active must return HTTP 409.

**REQ-2.3** Subscription creation must:
1. Create a Stripe customer for the firm
2. Attach the payment method to the customer
3. Create a Stripe subscription using the plan's `stripe_price_id`
4. Store the subscription in the database with `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_start`, `current_period_end`

**REQ-2.4** The subscription `status` must mirror Stripe values: `trialing`, `active`, `past_due`, `canceled`, `unpaid`.

---

### REQ-3: Subscription Management

**REQ-3.1** A firm must be able to retrieve their subscription by ID.

**REQ-3.2** A firm must be able to update their subscription:
- Change plan (`planId`) — updates the Stripe subscription item with proration
- Set `cancelAtPeriodEnd` — schedules cancellation at period end

**REQ-3.3** A firm must be able to cancel their subscription immediately. This cancels the Stripe subscription and sets status to `canceled`.

**REQ-3.4** All subscription operations must be scoped to `firm_id`. No cross-tenant access.

---

### REQ-4: Stripe Webhook Integration

**REQ-4.1** The system must expose a webhook endpoint at `POST /api/v1/subscriptions/webhook` that accepts raw Stripe events.

**REQ-4.2** The webhook must verify the Stripe signature using `STRIPE_WEBHOOK_SECRET`.

**REQ-4.3** The following Stripe events must be handled:
- `customer.subscription.created` — sync status and period dates
- `customer.subscription.updated` — sync status, period dates, cancel_at_period_end
- `customer.subscription.deleted` — set status to `canceled`
- `invoice.payment_failed` — set status to `past_due`
- `invoice.payment_succeeded` — set status to `active`

**REQ-4.4** Webhook processing must be idempotent. Each Stripe event must be recorded in `subscription_events` and duplicate events must be skipped.

---

### REQ-5: Usage Tracking

**REQ-5.1** The system must expose `GET /api/v1/usage` returning current usage for the authenticated firm.

**REQ-5.2** Usage must be calculated via live database counts (no separate usage table):
- `users` — count of active users for the firm
- `clients` — count of active clients for the firm
- `documents` — count of active documents for the firm
- `storage_gb` — from `storage_usage` table

**REQ-5.3** The usage response must include plan limits alongside current usage:
```json
{
  "users": 3,
  "clients": 12,
  "documents": 45,
  "storage_gb": 1.2,
  "limits": {
    "max_users": 5,
    "max_clients": 50,
    "max_storage_gb": 10
  }
}
```

---

### REQ-6: Usage Limit Enforcement

**REQ-6.1** Before creating a new user, the system must verify `current_users < plan.max_users`. If exceeded, return HTTP 403 with code `PLAN_LIMIT_EXCEEDED`.

**REQ-6.2** Before creating a new client, the system must verify `current_clients < plan.max_clients`. If exceeded, return HTTP 403 with code `PLAN_LIMIT_EXCEEDED`.

**REQ-6.3** Before uploading a document, the system must verify that adding the file's bytes would not exceed `plan.max_storage_gb`. If exceeded, return HTTP 403 with code `PLAN_LIMIT_EXCEEDED`.

**REQ-6.4** If a firm has no subscription, limits must not be enforced (graceful degradation).

**REQ-6.5** `null` plan limits mean unlimited — no enforcement applied.

---

### REQ-7: Subscription Event History

**REQ-7.1** All subscription lifecycle changes must be recorded in `subscription_events`.

**REQ-7.2** Events must include: `event_type`, `from_status`, `to_status`, `metadata`, `created_at`.

**REQ-7.3** The billing history page must display subscription events for the firm's subscription.

---

### REQ-8: Frontend Pages

**REQ-8.1** Plans Page (`/billing/plans`) — display available plans with pricing and features. Allow subscribing.

**REQ-8.2** Subscription Page (`/billing/subscription`) — show current subscription status, plan details, period dates, cancel option.

**REQ-8.3** Usage Page (`/billing/usage`) — show current usage vs plan limits with visual progress indicators.

**REQ-8.4** History Page (`/billing/history`) — show subscription event log.

**REQ-8.5** All pages must use `DashboardLayout` (per layout governance).

---

### REQ-9: Security

**REQ-9.1** All subscription and usage endpoints must require authentication via JWT.

**REQ-9.2** Every database query must filter by `firm_id`. No cross-tenant data access.

**REQ-9.3** The webhook endpoint must not require JWT auth but must verify Stripe signature.

---

### REQ-10: Regression Protection

**REQ-10.1** Phase 9 must not modify any existing module files except:
- `apps/api/src/modules/billing/index.ts` — to register subscription routes
- `apps/api/src/app.ts` — only if needed for webhook raw body parsing
- `apps/web/src/App.tsx` — to add billing page routes

**REQ-10.2** Usage limit checks in CRM and Documents modules must be additive (call `usageService` before creating resources) without altering existing logic.
