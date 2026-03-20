# Phase 9 — SaaS Billing Tasks

## Backend

- [x] 1. Backend — Core module files
  - [x] 1.1 Create `subscriptions.types.ts` with Plan, Subscription, SubscriptionEvent, UsageSummary, CreateSubscriptionDto, UpdateSubscriptionDto
  - [x] 1.2 Create `subscriptions.validation.ts` with Zod schemas for create and update
  - [x] 1.3 Create `plans.repository.ts` — findAll (active, ordered), findById
  - [x] 1.4 Create `plans.service.ts` — listPlans, getPlan
  - [x] 1.5 Create `subscriptions.repository.ts` — findByFirmId, findById, create, update, updateByStripeSubscriptionId, createEvent, listEvents
  - [x] 1.6 Create `usage.service.ts` — getUsageSummary, checkUserLimit, checkClientLimit, checkStorageLimit

- [x] 2. Backend — Subscription service and Stripe integration
  - [x] 2.1 Create `subscriptions.service.ts` — createSubscription (Stripe customer + subscription), getSubscription, updateSubscription (plan change + cancel_at_period_end), cancelSubscription
  - [x] 2.2 Create `stripe-subscriptions-webhook.controller.ts` — verify signature, idempotency via webhook_events table, handle customer.subscription.created/updated/deleted and invoice.payment_failed/succeeded

- [x] 3. Backend — HTTP layer and routing
  - [x] 3.1 Create `subscriptions.controller.ts` — listPlans, createSubscription, getSubscription, updateSubscription, cancelSubscription, getUsage, getHistory
  - [x] 3.2 Create `subscriptions.routes.ts` — wire routes with authenticate middleware; webhook route uses raw body parser
  - [x] 3.3 Update `apps/api/src/modules/billing/index.ts` to register subscriptions router

- [x] 4. Backend — Usage limit enforcement integration
  - [x] 4.1 Call `usageService.checkClientLimit(firmId)` in clients.service.ts before creating a client
  - [x] 4.2 Call `usageService.checkStorageLimit(firmId, fileBytes)` in documents.service.ts before uploading

- [x] 5. Backend — Plans seed script
  - [x] 5.1 Create `scripts/seed-plans.ts` with Starter, Pro, Enterprise plans — each must include price_monthly, price_annual, max_users, max_clients, max_storage_gb, and `features: { stripe_price_id: "price_xxx" }` (use placeholder IDs; replace with real Stripe price IDs before production)

## Frontend

- [x] 6. Frontend — API layer and types
  - [x] 6.1 Create `apps/web/src/features/billing/types.ts` — Plan, Subscription, UsageSummary, SubscriptionEvent
  - [x] 6.2 Create `apps/web/src/features/billing/api/billing-api.ts` — getPlans, createSubscription, getSubscription, updateSubscription, cancelSubscription, getUsage, getHistory
  - [x] 6.3 Create `apps/web/src/features/billing/hooks/useSubscription.ts` — React Query hooks
  - [x] 6.4 Create `apps/web/src/features/billing/hooks/useUsage.ts` — React Query hook

- [x] 7. Frontend — Pages
  - [x] 7.1 Create `apps/web/src/pages/billing/plans.tsx` — plan cards with pricing, limits, subscribe action
  - [x] 7.2 Create `apps/web/src/pages/billing/subscription.tsx` — current subscription status, period dates, cancel button
  - [x] 7.3 Create `apps/web/src/pages/billing/usage.tsx` — usage progress bars with limit comparison
  - [x] 7.4 Create `apps/web/src/pages/billing/history.tsx` — subscription event log table

- [x] 8. Frontend — Routing
  - [x] 8.1 Register billing routes in `apps/web/src/App.tsx` under protected routes

## Verification

- [x] 9. Audit report
  - [x] 9.1 Create `docs/audits/PHASE-9-SAAS-BILLING-IMPLEMENTATION.md` after implementation covering: tables used, endpoints, Stripe integration status, usage tracking, limit enforcement verification
