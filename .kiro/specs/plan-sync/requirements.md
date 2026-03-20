# Requirements Document

## Introduction

The plan-sync feature introduces a dual-source architecture for managing SaaS billing plans in Taxmic. Currently, plans can only be populated via a one-time seed script, `stripe_price_id` is buried inside a JSON column, and there is no `stripe_product_id` stored anywhere. This feature enables two complementary flows that work simultaneously:

- **Option A (App Dashboard as source of truth):** An admin creates or edits a plan in the Taxmic dashboard. The backend calls Stripe to create the product and price, receives both IDs, and persists them to the `plans` table.
- **Option B (Stripe Dashboard as source of truth):** An admin creates products and prices directly in the Stripe Dashboard with required metadata. Stripe fires webhooks. The backend receives them and upserts the plan in the database.

Both options require a database migration to promote `stripe_price_id` out of the `features` JSON column and add a new `stripe_product_id` column. The seed script is demoted to a last-resort bootstrap tool for fresh environments only.

---

## Glossary

- **Plans_Repository**: The data access layer at `apps/api/src/modules/billing/subscriptions/plans.repository.ts`
- **Plans_Service**: The business logic layer at `apps/api/src/modules/billing/subscriptions/plans.service.ts`
- **Plans_Controller**: The new HTTP handler file at `apps/api/src/modules/billing/subscriptions/plans.controller.ts`
- **Plans_Router**: The new route definition file at `apps/api/src/modules/billing/subscriptions/plans.routes.ts`
- **Subscriptions_Service**: The existing service at `apps/api/src/modules/billing/subscriptions/subscriptions.service.ts`
- **Webhook_Controller**: The existing handler at `apps/api/src/modules/billing/subscriptions/stripe-subscriptions-webhook.controller.ts`
- **Billing_Router**: The module entry point at `apps/api/src/modules/billing/index.ts`
- **Require_Admin**: The new middleware at `apps/api/src/shared/middleware/require-admin.ts`
- **Admin_Plans_Page**: The new frontend page at `apps/web/src/pages/billing/admin-plans.tsx`
- **Billing_API**: The frontend API client at `apps/web/src/features/billing/api/billing-api.ts`
- **Plan_Type**: The TypeScript interface in `apps/web/src/features/billing/types.ts`
- **Stripe**: The external Stripe API service
- **Seed_Script**: The bootstrap script at `scripts/seed-plans.js`

---

## Requirements

### Requirement 1: Database Schema Migration

**User Story:** As a platform engineer, I want `stripe_product_id` and `stripe_price_id` stored as dedicated indexed columns on the `plans` table, so that they are queryable, indexable, and not buried inside a JSON blob.

#### Acceptance Criteria

1. THE Plans_Repository SHALL read `stripe_price_id` from the `plans.stripe_price_id` column, not from `plans.features`.
2. WHEN the migration runs, THE database SHALL add a `stripe_product_id VARCHAR(255)` column to the `plans` table.
3. WHEN the migration runs, THE database SHALL add a `stripe_price_id VARCHAR(255)` column to the `plans` table.
4. WHEN the migration runs, THE database SHALL create a unique index on `plans.stripe_price_id`.
5. WHEN the migration runs, THE database SHALL create an index on `plans.stripe_product_id`.
6. THE Prisma schema in `packages/database/prisma/saas.prisma` SHALL declare `stripe_product_id` and `stripe_price_id` as optional `String?` fields with `@db.VarChar(255)`.
7. THE Subscriptions_Service SHALL read `plan.stripe_price_id` directly in all three call sites (`createSubscription`, `updateSubscription`, `createCheckoutSession`) instead of casting `plan.features`.

---

### Requirement 2: Require Admin Middleware

**User Story:** As a security engineer, I want admin-only routes protected by a role check, so that non-admin users cannot create or modify plans.

#### Acceptance Criteria

1. THE Require_Admin middleware SHALL read `req.user.role` from the JWT payload attached by the `authenticate` middleware.
2. WHEN `req.user.role` is not `'admin'`, THE Require_Admin middleware SHALL return HTTP 403 with error code `FORBIDDEN`.
3. WHEN `req.user.role` is `'admin'`, THE Require_Admin middleware SHALL call `next()` to pass control to the route handler.
4. THE Require_Admin middleware SHALL be applied after the `authenticate` middleware on all admin plan routes.

---

### Requirement 3: Plans Repository Write Methods

**User Story:** As a backend developer, I want the Plans_Repository to support write operations, so that plans can be created, updated, and deactivated from both the admin API and the webhook handler.

#### Acceptance Criteria

1. WHEN `create(data)` is called, THE Plans_Repository SHALL insert a new row into the `plans` table and return the created record.
2. WHEN `update(id, data)` is called, THE Plans_Repository SHALL update the matching `plans` row and return the updated record.
3. WHEN `deactivate(id)` is called, THE Plans_Repository SHALL set `is_active = false` on the matching `plans` row (soft delete).
4. WHEN `findByStripeProductId(stripeProductId)` is called, THE Plans_Repository SHALL return the plan row where `stripe_product_id` matches, or `null` if not found.
5. WHEN `upsertByStripeProductId(stripeProductId, data)` is called, THE Plans_Repository SHALL insert a new plan row if no row with that `stripe_product_id` exists, or update the existing row if one does.

---

### Requirement 4: Option A — Admin Creates Plan via Dashboard

**User Story:** As a platform admin, I want to create a new billing plan from the Taxmic dashboard, so that the plan is created in Stripe and saved to the database in a single operation.

#### Acceptance Criteria

1. WHEN a valid `createPlan` request is received, THE Plans_Service SHALL call `stripe.products.create()` with the plan name and description.
2. WHEN a valid `createPlan` request is received, THE Plans_Service SHALL call `stripe.prices.create()` with the `unit_amount` (in cents), currency, and the Stripe product ID returned from step 1.
3. WHEN Stripe returns a product ID and price ID, THE Plans_Service SHALL persist a new `plans` row with `stripe_product_id`, `stripe_price_id`, and all plan fields from the request DTO.
4. IF Stripe returns an error during plan creation, THEN THE Plans_Service SHALL not persist any row to the database and SHALL propagate the error as HTTP 502.
5. WHEN a valid `updatePlan` request is received with a changed price, THE Plans_Service SHALL call `stripe.prices.create()` to create a new Stripe price (Stripe prices are immutable).
6. WHEN a new Stripe price is created during plan update, THE Plans_Service SHALL call `stripe.prices.update()` on the old price ID with `active: false` to archive it.
7. WHEN a valid `updatePlan` request is received with no price change, THE Plans_Service SHALL update only the non-price fields without calling Stripe.
8. WHEN `deactivatePlan(id)` is called, THE Plans_Service SHALL set `is_active = false` on the plan row and SHALL call `stripe.prices.update()` with `active: false` on the plan's `stripe_price_id`.

---

### Requirement 5: Admin Plans API Endpoints

**User Story:** As a platform admin, I want CRUD HTTP endpoints for plan management, so that the admin dashboard can create, list, update, and deactivate plans.

#### Acceptance Criteria

1. THE Plans_Router SHALL mount all admin plan routes behind both the `authenticate` middleware and the Require_Admin middleware.
2. WHEN `POST /admin/plans` is called with a valid body, THE Plans_Controller SHALL delegate to `Plans_Service.createPlan()` and return HTTP 201 with the created plan.
3. WHEN `GET /admin/plans` is called, THE Plans_Controller SHALL return HTTP 200 with all plans including inactive ones (admin view).
4. WHEN `PATCH /admin/plans/:id` is called with a valid body, THE Plans_Controller SHALL delegate to `Plans_Service.updatePlan()` and return HTTP 200 with the updated plan.
5. WHEN `DELETE /admin/plans/:id` is called, THE Plans_Controller SHALL delegate to `Plans_Service.deactivatePlan()` and return HTTP 200.
6. IF `POST /admin/plans` or `PATCH /admin/plans/:id` is called with an invalid body, THEN THE Plans_Controller SHALL return HTTP 422 with a Zod validation error.
7. THE `createPlan` Zod schema in `subscriptions.validation.ts` SHALL require: `name` (string, min 1), `slug` (string, min 1), `price_monthly` (number, positive), `price_annual` (number, positive), and SHALL accept optional: `description`, `max_users`, `max_clients`, `max_storage_gb`, `sort_order`.
8. THE `updatePlan` Zod schema in `subscriptions.validation.ts` SHALL make all fields from the `createPlan` schema optional.
9. THE Billing_Router SHALL import and mount the Plans_Router so that admin plan routes are reachable under the billing module.

---

### Requirement 6: Option B — Stripe Webhook Sync

**User Story:** As a platform admin, I want plans to be automatically created or updated in the database when I create or modify products and prices in the Stripe Dashboard, so that Stripe remains the source of truth without requiring manual DB operations.

#### Acceptance Criteria

1. WHEN the Webhook_Controller receives a `product.created` event, THE Webhook_Controller SHALL upsert a plan row using `stripe_product_id` as the key, mapping `product.name` → `name`, `product.description` → `description`, and Stripe product metadata fields to their corresponding plan columns.
2. WHEN the Webhook_Controller receives a `product.updated` event, THE Webhook_Controller SHALL update the matching plan row's `name` and `description` fields.
3. WHEN the Webhook_Controller receives a `price.created` event, THE Webhook_Controller SHALL update the matching plan row (found via `price.product`) with `stripe_price_id = price.id` and `price_monthly = price.unit_amount / 100`.
4. WHEN the Webhook_Controller receives a `price.updated` event and `price.active` is `false`, THE Webhook_Controller SHALL set `is_active = false` on the matching plan row.
5. WHEN mapping Stripe product metadata to plan columns, THE Webhook_Controller SHALL parse `metadata.slug` → `slug`, `Number(metadata.max_users)` → `max_users`, `Number(metadata.max_clients)` → `max_clients`, `Number(metadata.max_storage_gb)` → `max_storage_gb`, `Number(metadata.sort_order)` → `sort_order`.
6. WHEN a metadata value is absent or `Number()` returns `NaN`, THE Webhook_Controller SHALL store `null` for that column rather than writing `NaN` to the database.
7. THE Webhook_Controller SHALL handle `product.created`, `product.updated`, `price.created`, and `price.updated` events inside the existing `handleSubscriptionEvent` switch statement, reusing the existing idempotency and signature verification logic.
8. IF a `price.created` or `price.updated` event references a `product` ID that does not exist in the `plans` table, THEN THE Webhook_Controller SHALL log a warning and skip processing without throwing an error.

---

### Requirement 7: Frontend Plan Type Update

**User Story:** As a frontend developer, I want the `Plan` TypeScript type to include `stripe_product_id` and `stripe_price_id` as top-level typed fields, so that components can reference them without casting `features`.

#### Acceptance Criteria

1. THE Plan_Type SHALL include `stripe_product_id: string | null` as a top-level field.
2. THE Plan_Type SHALL include `stripe_price_id: string | null` as a top-level field.
3. THE Plan_Type SHALL retain the existing `features: Record<string, unknown> | null` field for other feature flags.

---

### Requirement 8: Frontend Admin Plans API Methods

**User Story:** As a frontend developer, I want the Billing_API client to expose admin plan methods, so that the Admin_Plans_Page can call the backend without writing raw fetch calls.

#### Acceptance Criteria

1. THE Billing_API SHALL expose a `listAllPlans()` method that calls `GET /admin/plans` and returns `Plan[]`.
2. THE Billing_API SHALL expose a `createPlan(data)` method that calls `POST /admin/plans` and returns the created `Plan`.
3. THE Billing_API SHALL expose an `updatePlan(id, data)` method that calls `PATCH /admin/plans/:id` and returns the updated `Plan`.
4. THE Billing_API SHALL expose a `deactivatePlan(id)` method that calls `DELETE /admin/plans/:id` and returns the updated `Plan`.

---

### Requirement 9: Admin Plans UI Page

**User Story:** As a platform admin, I want an admin plans management page in the dashboard, so that I can view, create, edit, and deactivate billing plans without accessing the database directly.

#### Acceptance Criteria

1. THE Admin_Plans_Page SHALL use `DashboardLayout` as its layout wrapper, not `AppLayout`.
2. THE Admin_Plans_Page SHALL display all plans returned by `listAllPlans()`, including inactive ones, in a table or list.
3. WHEN the admin clicks "Create Plan", THE Admin_Plans_Page SHALL display a form with fields: name, slug, description, price_monthly, price_annual, max_users, max_clients, max_storage_gb.
4. WHEN the admin submits a valid create form, THE Admin_Plans_Page SHALL call `Billing_API.createPlan()` and refresh the plan list on success.
5. WHEN the admin clicks "Edit" on a plan, THE Admin_Plans_Page SHALL display a pre-filled form with the plan's current values.
6. WHEN the admin submits a valid edit form, THE Admin_Plans_Page SHALL call `Billing_API.updatePlan()` and refresh the plan list on success.
7. WHEN the admin clicks "Deactivate" on an active plan, THE Admin_Plans_Page SHALL call `Billing_API.deactivatePlan()` and refresh the plan list on success.
8. WHEN an API call fails, THE Admin_Plans_Page SHALL display an error message to the admin.
9. THE `App.tsx` router SHALL include a route for `/billing/admin/plans` that renders the Admin_Plans_Page inside `DashboardLayout`.

---

### Requirement 10: Seed Script Demotion

**User Story:** As a platform engineer, I want the seed script documented as a last-resort bootstrap tool, so that new team members understand it is not the primary mechanism for plan management.

#### Acceptance Criteria

1. THE Seed_Script SHALL remain functional for bootstrapping fresh environments where no plans exist and neither Option A nor Option B has been run.
2. THE Seed_Script SHALL include a comment at the top stating it is a last-resort bootstrap tool and that Option A (admin UI) or Option B (Stripe webhooks) are the primary mechanisms.
3. WHERE the `.env.example` file contains `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, or `STRIPE_PRICE_ENTERPRISE` variables, THE Seed_Script documentation SHALL note these are only required for the seed script and can be removed once Option A or B is in use.
