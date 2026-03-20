# Implementation Plan: plan-sync

## Overview

Implement dual-source plan management: an admin CRUD API (Option A) and Stripe webhook sync (Option B). Both share a database migration that promotes `stripe_price_id` to a dedicated column and adds `stripe_product_id`. The DB is always the runtime source of truth.

## Tasks

- [x] 1. Database migration — add stripe columns to plans table
  - Add `stripe_product_id VARCHAR(255)` and `stripe_price_id VARCHAR(255)` columns to `plans` in `packages/database/prisma/saas.prisma`
  - Add `@@index([stripe_product_id])` and `@@unique([stripe_price_id])` to the `plans` model
  - Create migration file `packages/database/prisma/migrations/YYYYMMDDHHMMSS_plan_sync_stripe_columns/migration.sql` with the four SQL statements from the design
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. requireAdmin middleware
  - Create `apps/api/src/shared/middleware/require-admin.ts`
  - Read `req.user?.role`; call `next(new AppError('Forbidden', 403, 'FORBIDDEN'))` if not `'admin'`; call `next()` otherwise
  - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.1 Write property test for requireAdmin role rejection
    - **Property 1: Non-admin role rejection**
    - Generate random role strings ≠ `'admin'`; assert middleware calls `next` with a 403 `AppError` and never calls the route handler
    - **Validates: Requirements 2.2**

- [x] 3. plans.repository.ts — add write methods
  - Add `findAll_admin()`: returns all plans including inactive, ordered by `sort_order`
  - Add `create(data: CreatePlanData)`: inserts a new row and returns it
  - Add `update(id, data: UpdatePlanData)`: updates matching row and returns it
  - Add `deactivate(id)`: sets `is_active = false` and returns the row
  - Add `findByStripeProductId(stripeProductId)`: returns matching plan or `null`
  - Add `upsertByStripeProductId(stripeProductId, data: UpsertPlanData)`: insert-or-update keyed on `stripe_product_id`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.1 Write property test for upsertByStripeProductId idempotency
    - **Property 9: upsertByStripeProductId idempotency**
    - Call upsert twice with the same `stripe_product_id`; assert exactly one row exists in the DB after both calls
    - **Validates: Requirements 3.5**

- [x] 4. plans.service.ts — add admin methods
  - Add `listAllPlans()`: delegates to `plansRepository.findAll_admin()`
  - Add `createPlan(dto)`: calls `stripe.products.create()`, then `stripe.prices.create()`, then `plansRepository.create()` with both IDs; if Stripe throws, no DB write occurs
  - Add `updatePlan(id, dto)`: if price fields changed, creates new Stripe price and archives old one; otherwise skips Stripe calls; delegates to `plansRepository.update()`
  - Add `deactivatePlan(id)`: calls `stripe.prices.update(stripe_price_id, { active: false })` then `plansRepository.deactivate(id)`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 4.1 Write property test for createPlan atomicity
    - **Property 4: createPlan atomicity — no partial state on Stripe error**
    - Mock Stripe to throw at `products.create` or `prices.create`; assert no row inserted in `plans` table
    - **Validates: Requirements 4.4**

  - [x] 4.2 Write property test for createPlan round-trip Stripe ID persistence
    - **Property 5: createPlan round-trip — Stripe IDs persisted**
    - Generate valid `CreatePlanDto` values; assert returned plan has `stripe_product_id` and `stripe_price_id` matching the mocked Stripe responses
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 4.3 Write property test for deactivatePlan side effects
    - **Property 6: deactivatePlan sets is_active false and archives Stripe price**
    - Generate active plans; assert `is_active = false` on the returned row and `stripe.prices.update` called with `{ active: false }`
    - **Validates: Requirements 3.3, 4.8**

- [x] 5. subscriptions.validation.ts — add plan Zod schemas
  - Add `createPlanSchema`: requires `name` (string min 1), `slug` (string min 1), `price_monthly` (number positive), `price_annual` (number positive); optional: `description`, `max_users`, `max_clients`, `max_storage_gb`, `sort_order`
  - Add `updatePlanSchema`: `createPlanSchema.partial()`
  - _Requirements: 5.6, 5.7, 5.8_

  - [x] 5.1 Write property test for invalid body → 422
    - **Property 8: Invalid request body returns 422**
    - Generate bodies with missing required fields, wrong types, non-positive numbers; assert each fails Zod parse
    - **Validates: Requirements 5.6, 5.7, 5.8**

- [x] 6. plans.controller.ts — new file
  - Create `apps/api/src/modules/billing/subscriptions/plans.controller.ts`
  - Follow the class-with-arrow-methods pattern from `subscriptions.controller.ts`
  - `listAllPlans`: delegates to `plansService.listAllPlans()`, returns HTTP 200
  - `createPlan`: delegates to `plansService.createPlan(req.body)`, returns HTTP 201
  - `updatePlan`: delegates to `plansService.updatePlan(req.params.id, req.body)`, returns HTTP 200
  - `deactivatePlan`: delegates to `plansService.deactivatePlan(req.params.id)`, returns HTTP 200
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 7. plans.routes.ts — new file
  - Create `apps/api/src/modules/billing/subscriptions/plans.routes.ts`
  - Mount four routes: `GET /admin/plans`, `POST /admin/plans`, `PATCH /admin/plans/:id`, `DELETE /admin/plans/:id`
  - Apply `authenticate` then `requireAdmin` on all routes; apply `validate(createPlanSchema)` on POST and `validate(updatePlanSchema)` on PATCH
  - No `tenantContext` middleware — admin routes are not tenant-scoped
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 2.4_

  - [x] 7.1 Write property test for GET /admin/plans completeness
    - **Property 7: GET /admin/plans returns all plans including inactive**
    - Seed mixed active/inactive plan sets; assert response array length equals total plan count
    - **Validates: Requirements 5.3**

- [x] 8. billing/index.ts — mount plans router
  - Import `plansRouter` from `./subscriptions/plans.routes`
  - Add `billingRouter.use(plansRouter)` alongside the existing router mounts
  - _Requirements: 5.9_

- [x] 9. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. subscriptions.service.ts — update three price lookup call sites
  - In `createSubscription`: replace `(plan.features as Record<string, string> | null)?.stripe_price_id` with `plan.stripe_price_id`
  - In `updateSubscription`: same replacement
  - In `createCheckoutSession`: same replacement
  - Error message remains `'Plan has no Stripe price configured'` with code `PLAN_MISCONFIGURED`
  - _Requirements: 1.1, 1.7_

  - [x] 10.1 Write property test for price lookup uses column
    - **Property 3: subscriptions.service price lookup uses column**
    - Generate plan records with `stripe_price_id` set on the column; assert service reads `plan.stripe_price_id` directly and throws `PLAN_MISCONFIGURED` when it is null
    - **Validates: Requirements 1.7**

- [x] 11. stripe-subscriptions-webhook.controller.ts — add four new event cases
  - Add inline `parseMeta` helper: `(val: string | undefined): number | null => { const n = Number(val); return isNaN(n) || val === undefined ? null : n; }`
  - Add `case 'product.created'` and `case 'product.updated'`: call `plansRepository.upsertByStripeProductId()` mapping product fields and metadata
  - Add `case 'price.created'`: look up plan by `price.product`; if not found log warning and break; otherwise update `stripe_price_id` and `price_monthly`
  - Add `case 'price.updated'`: look up plan by `price.product`; if `price.active === false` set `is_active = false`; if not found log warning and break
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 11.1 Write property test for webhook product.created metadata mapping
    - **Property 10: Webhook product.created maps all metadata fields correctly**
    - Generate `product.created` payloads with varied metadata (including absent/NaN values); assert upserted plan fields match expected mapping with `null` for NaN/absent
    - **Validates: Requirements 6.1, 6.5, 6.6**

  - [x] 11.2 Write property test for webhook price.created updates plan
    - **Property 11: Webhook price.created updates price fields**
    - Generate `price.created` payloads where `price.product` matches an existing plan; assert `stripe_price_id` and `price_monthly` updated correctly
    - **Validates: Requirements 6.3**

  - [x] 11.3 Write property test for webhook price.updated deactivates plan
    - **Property 12: Webhook price.updated with active=false deactivates plan**
    - Generate `price.updated` payloads with `active: false`; assert matching plan has `is_active = false`
    - **Validates: Requirements 6.4**

- [x] 12. Frontend: billing/types.ts — add stripe fields to Plan interface
  - Add `stripe_product_id: string | null` to the `Plan` interface
  - Add `stripe_price_id: string | null` to the `Plan` interface
  - Retain existing `features: Record<string, unknown> | null` field
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 13. Frontend: billing-api.ts — add admin plan methods
  - Add `listAllPlans()`: `api.get<Plan[]>('/admin/plans').then(r => r.data)`
  - Add `createPlan(data: CreatePlanPayload)`: `api.post<Plan>('/admin/plans', data).then(r => r.data)`
  - Add `updatePlan(id, data: UpdatePlanPayload)`: `api.patch<Plan>(\`/admin/plans/${id}\`, data).then(r => r.data)`
  - Add `deactivatePlan(id)`: `api.delete<Plan>(\`/admin/plans/${id}\`).then(r => r.data)`
  - Add `CreatePlanPayload` and `UpdatePlanPayload` types matching the backend Zod schemas
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 14. Frontend: admin-plans.tsx — new admin page
  - Create `apps/web/src/pages/billing/admin-plans.tsx` using `DashboardLayout` as the layout wrapper
  - Fetch all plans on mount via `billingApi.listAllPlans()`; display in a table with columns: name, slug, price_monthly, is_active
  - "Create Plan" button opens an inline form with fields: name, slug, description, price_monthly, price_annual, max_users, max_clients, max_storage_gb
  - "Edit" button on each row opens the same form pre-filled with the plan's current values
  - "Deactivate" button on active plan rows calls `billingApi.deactivatePlan(id)` and refreshes the list
  - On any API error, display a visible error message in the UI
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 14.1 Write property test for admin plans page renders all plans
    - **Property 13: Admin plans page displays all plans from API response**
    - Generate plan arrays of varying length including inactive plans; assert rendered row count equals array length
    - **Validates: Requirements 9.2**

  - [x] 14.2 Write property test for edit form pre-fills with current values
    - **Property 14: Edit form pre-fills with current plan values**
    - Generate plan objects; assert each form input value matches the corresponding plan field after clicking Edit
    - **Validates: Requirements 9.5**

  - [x] 14.3 Write property test for API error surfaces to user
    - **Property 15: API error surfaces to user**
    - Mock API calls to return errors; assert a visible error message appears in the rendered output
    - **Validates: Requirements 9.8**

- [x] 15. App.tsx — add admin plans route
  - Import `AdminPlansPage` from `./pages/billing/admin-plans`
  - Add `<Route path="/billing/admin/plans" element={<AdminPlansPage />} />` inside the existing `DashboardLayout` route group
  - _Requirements: 9.9_

- [x] 16. Seed script — add bootstrap comment
  - Add a comment block at the top of `scripts/seed-plans.js` stating it is a last-resort bootstrap tool for fresh environments only, and that Option A (admin UI at `/billing/admin/plans`) or Option B (Stripe webhooks) are the primary mechanisms
  - Note that `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE` env vars are only required for this script and can be removed once Option A or B is in use
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 17. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check`; each test is tagged `// Feature: plan-sync, Property N: <text>`
- Admin routes have no `tenantContext` middleware — they are platform-level, not tenant-scoped
- The webhook handler must never throw for unknown product IDs — always log + return 200
- `stripe_price_id` uniqueness is enforced at the DB level via unique index (migration task 1)
