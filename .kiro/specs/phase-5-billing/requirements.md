# Phase 5 — Billing Module Requirements

## Overview

Phase 5 adds invoice management and Stripe Checkout payment collection to the platform. Firms can create invoices for clients, generate PDFs, send invoices (stub), and collect payment via Stripe Checkout. Webhook events are processed idempotently.

Scope: `invoices` + `payments` only. Subscriptions are Phase 9.

---

## Functional Requirements

### FR-1: Invoice Creation

- A firm user can create an invoice for a client.
- An invoice must have at least one line item.
- Invoice totals (`subtotal_amount`, `tax_amount`, `total_amount`) are always calculated server-side from line items. Client-submitted totals are ignored.
- `subtotal_amount` = sum of all `invoice_items.amount` (quantity × unit_price).
- `tax_amount` is provided by the client as a decimal value (e.g. `0.00`).
- `total_amount` = `subtotal_amount` + `tax_amount`.
- Invoice number is assigned by calling the PostgreSQL function `get_next_invoice_number(firm_id)` — never manually set by the client.
- New invoices are created with status `draft`.
- `issue_date` is required. `due_date` is optional.

### FR-2: Invoice Listing

- A firm user can list all invoices for their firm.
- Supports fil
tering by: `status`, `client_id`, `due_date`.
- Supports pagination: `page` and `limit` query params.
- Soft-deleted invoices (`deleted_at IS NOT NULL`) are excluded.

### FR-3: Invoice Detail

- A firm user can retrieve a single invoice by ID.
- Response includes all line items and payment records.

### FR-4: Invoice Update

- A firm user can update an invoice that is in `draft` status.
- Fields updatable: `client_id`, `issue_date`, `due_date`, `tax_amount`, `notes`, `items`.
- If `items` is provided, existing items are deleted and replaced (full replace).
- Totals are recalculated server-side on every update.
- Invoices in `sent`, `paid`, or `cancelled` status cannot be updated.

### FR-5: Invoice Send (Stub)

- `POST /invoices/:id/send` transitions a `draft` invoice to `sent`.
- Sets `sent_at = now()`.
- Logs email intent to server log (stub — actual delivery is Phase 6).
- Returns the updated invoice.
- Cannot send an invoice that is already `sent`, `paid`, or `cancelled`.

### FR-6: Invoice PDF Generation

- When an invoice is sent (`POST /invoices/:id/send`), a PDF is generated using `pdfkit`.
- PDF content includes:
  - Firm name, firm address (from `firms` table)
  - Invoice prefix from `firm_settings.invoice_prefix` (e.g. `INV-`)
  - Invoice number formatted as `{prefix}{number}` (e.g. `INV-0042`)
  - Client name
  - Issue date, due date
  - Line items table: description, quantity, unit price, amount
  - Subtotal, tax, total
  - Payment terms from `firm_settings.invoice_terms`
  - Footer from `firm_settings.invoice_footer`
- PDF is stored via the existing `StorageProvider` abstraction.
- The storage key is saved to `invoices.pdf_url`.

### FR-7: Stripe Checkout Payment

- `POST /invoices/:id/pay` creates a Stripe Checkout Session for the invoice total.
- Only invoices in `sent` status can be paid via Stripe.
- Returns `{ url: string }` — the Stripe Checkout redirect URL.
- A `payments` record is created with `status = pending` and `method = stripe` before redirecting.
- `stripe_payment_intent_id` is stored on the payment record once available from Stripe.
- If `STRIPE_SECRET_KEY` is not configured, the endpoint returns `503 Service Unavailable`.

### FR-8: Stripe Webhook

- `POST /payments/stripe/webhook` receives Stripe webhook events.
- Idempotency: before processing, check `webhook_events` table by `event_id`. If already processed, return `200` immediately.
- Handles `checkout.session.completed`:
  - Find the pending payment by `stripe_payment_intent_id`.
  - Update payment `status = completed`, set `paid_at = now()`.
  - Update invoice `status = paid`, set `paid_at = now()`, update `paid_amount`.
- Handles `checkout.session.expired`:
  - Update payment `status = failed`.
- All other event types are acknowledged with `200` and logged.
- Webhook signature is verified using `STRIPE_WEBHOOK_SECRET`.
- The raw request body must be used for signature verification (not parsed JSON).

### FR-9: Client Invoice List

- `GET /clients/:id/invoices` returns all invoices for a specific client within the firm.

### FR-10: Client Payment List

- `GET /clients/:id/payments` returns all payments for a specific client within the firm.

---

## Non-Functional Requirements

### NFR-1: Tenant Isolation

- Every query includes `firm_id` from `req.user.firmId`.
- No cross-firm data leakage is possible.

### NFR-2: Server-Side Totals

- `subtotal_amount`, `tax_amount`, and `total_amount` are always computed server-side.
- Client-submitted total values are ignored.

### NFR-3: Stripe Optional at Startup

- If `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` are missing from env, the server logs a warning but does NOT exit.
- Stripe-dependent endpoints return `503` if keys are absent at request time.

### NFR-4: Webhook Idempotency

- Every Stripe webhook event is recorded in `webhook_events` before processing.
- Duplicate delivery of the same `event.id` is a no-op.

### NFR-5: No Regressions

- Phases 1–4 (auth, CRM, documents, tasks) must continue to work without modification.

---

## Out of Scope (Phase 5)

- Email delivery (Phase 6)
- Client portal payment page (Phase 7)
- Subscriptions / SaaS billing (Phase 9)
- Invoice deletion
- Manual payment recording (non-Stripe)
- Recurring invoices
