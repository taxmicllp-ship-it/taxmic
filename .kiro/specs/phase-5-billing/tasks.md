# Phase 5 — Billing Module Tasks

## Status Legend
- [ ] Not started
- [x] Complete

---

## Pre-Implementation (Blockers)

- [x] Task 1: Install `stripe` npm package (`npm install stripe --workspace=apps/api`)
- [x] Task 2: Install `pdfkit` + `@types/pdfkit` (`npm install pdfkit @types/pdfkit --workspace=apps/api`)
- [x] Task 3: Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `apps/api/.env` (empty values — keys added when Stripe account configured)
- [x] Task 4: Update `apps/api/src/config/index.ts` — add `stripeSecretKey` and `stripeWebhookSecret` as optional (no `process.exit` if missing); add `storageProvider`

---

## Backend — Invoices

- [x] Task 5: Create `apps/api/src/modules/billing/invoices/invoices.types.ts`
  - `CreateInvoiceDto`, `UpdateInvoiceDto`, `ListInvoicesQuery`, `CreateLineItemDto`

- [x] Task 6: Create `apps/api/src/modules/billing/invoices/invoices.validation.ts`
  - `CreateInvoiceSchema`, `UpdateInvoiceSchema`, `ListInvoicesQuerySchema`
  - Items array: min 1 item on create
  - `tax_amount`: optional decimal string, default `"0"`

- [x] Task 7: Create `apps/api/src/modules/billing/invoices/invoices.repository.ts`
  - `create(firmId, data, number, totals)` — transaction: insert invoice + items
  - `findById(firmId, invoiceId)` — include `invoice_items`, `payments`
  - `findAll(firmId, query)` — paginated, filtered, soft-delete excluded
  - `update(firmId, invoiceId, data, totals?)` — transaction: replace items if provided
  - `updateStatus(firmId, invoiceId, patch)` — update status/sent_at/paid_at/pdf_url/paid_amount
  - `findByClient(firmId, clientId)` — all invoices for a client
  - `getNextNumber(firmId)` — `prisma.$queryRaw` calling `get_next_invoice_number(firmId::uuid)`

- [x] Task 8: Create `apps/api/src/modules/billing/pdf-generator.service.ts`
  - `generateAndStore(invoice, firmSettings, firmName)` → returns storage key
  - Uses `pdfkit` to build PDF buffer
  - Includes: firm name, `invoice_prefix + number`, client name, dates, line items, totals, `invoice_terms`, `invoice_footer`
  - Stores via `getStorageProvider().save(buffer, key)`
  - Key format: `invoices/{invoiceId}/invoice-{number}.pdf`

- [x] Task 9: Create `apps/api/src/modules/billing/invoices/invoices.service.ts`
  - `createInvoice(firmId, data)` — compute totals, get next number, call repository
  - `getInvoice(firmId, invoiceId)` — 404 if not found
  - `listInvoices(firmId, query)` — delegate to repository
  - `updateInvoice(firmId, invoiceId, data)` — enforce draft-only rule, recompute totals
  - `sendInvoice(firmId, invoiceId)` — enforce draft-only, generate PDF, update status=sent, sent_at=now, log stub
  - `createCheckoutSession(firmId, invoiceId, successUrl, cancelUrl)` — delegate to payments service

- [x] Task 10: Create `apps/api/src/modules/billing/invoices/invoices.controller.ts`
  - `listInvoices`, `createInvoice`, `getInvoice`, `updateInvoice`, `sendInvoice`, `payInvoice`
  - Extract `req.user!.firmId` for all methods

- [x] Task 11: Create `apps/api/src/modules/billing/invoices/invoices.routes.ts`
  - Apply `authenticate` + `tenantContext` on all routes
  - `GET /invoices`, `POST /invoices`, `GET /invoices/:id`, `PATCH /invoices/:id`
  - `POST /invoices/:id/send`, `POST /invoices/:id/pay`
  - `GET /clients/:id/invoices`

---

## Backend — Payments & Stripe

- [x] Task 12: Create `apps/api/src/modules/billing/payments/payments.types.ts`
  - `CreatePaymentDto`, `PaymentResponse`, `ListPaymentsQuery`

- [x] Task 13: Create `apps/api/src/modules/billing/payments/payments.repository.ts`
  - `create(firmId, invoiceId, data)` — insert payment record
  - `updateByStripePaymentIntentId(intentId, patch)` — update status/paid_at/stripe_charge_id
  - `findByClient(firmId, clientId)` — all payments for a client
  - `findByInvoice(firmId, invoiceId)` — all payments for an invoice

- [x] Task 14: Create `apps/api/src/modules/billing/payments/stripe.service.ts`
  - `createCheckoutSession(invoice, successUrl, cancelUrl)` → `{ url, paymentIntentId }`
  - Throws `AppError('Stripe not configured', 503, 'STRIPE_NOT_CONFIGURED')` if key missing
  - Uses `stripe` npm package with `config.stripeSecretKey`
  - `constructEvent(rawBody, sig, secret)` → Stripe event

- [x] Task 15: Create `apps/api/src/modules/billing/payments/payments.service.ts`
  - `createCheckoutSession(firmId, invoiceId, successUrl, cancelUrl)`
    - Verify invoice exists and is `sent`
    - Create pending payment record
    - Call `stripeService.createCheckoutSession`
    - Update payment with `stripe_payment_intent_id`
    - Return `{ url }`
  - `listClientPayments(firmId, clientId)` — delegate to repository

- [x] Task 16: Create `apps/api/src/modules/billing/payments/webhook.controller.ts`
  - Reads raw body via `express.raw({ type: 'application/json' })`
  - Verifies Stripe signature via `stripeService.constructEvent`
  - Idempotency check + insert into `webhook_events`
  - Handles `checkout.session.completed` → mark payment completed, invoice paid
  - Handles `checkout.session.expired` → mark payment failed
  - All other events → log + 200

- [x] Task 17: Create `apps/api/src/modules/billing/payments/payments.controller.ts`
  - `listClientPayments`

- [x] Task 18: Create `apps/api/src/modules/billing/payments/payments.routes.ts`
  - `GET /clients/:id/payments` — with `authenticate` + `tenantContext`
  - `POST /payments/stripe/webhook` — NO auth middleware, raw body

---

## Backend — Wiring

- [x] Task 19: Create `apps/api/src/modules/billing/index.ts`
  - Import and re-export `invoicesRouter` and `paymentsRouter` as a combined `billingRouter`

- [x] Task 20: Update `apps/api/src/app.ts`
  - Import `billingRouter` from `./modules/billing/index`
  - Mount: `app.use('/api/v1', billingRouter)`
  - Webhook route needs `express.raw` — handled inside `payments.routes.ts`

---

## Frontend — Feature Layer

- [x] Task 21: Create `apps/web/src/features/invoices/types.ts`
  - `Invoice`, `InvoiceItem`, `Payment`, `CreateInvoicePayload`, `UpdateInvoicePayload`

- [x] Task 22: Create `apps/web/src/features/invoices/api/invoices-api.ts`
  - `list(params?)`, `get(id)`, `create(data)`, `update(id, data)`, `send(id)`, `pay(id)`

- [x] Task 23: Create `apps/web/src/features/invoices/hooks/useInvoices.ts`
  - `useQuery(['invoices', params], () => invoicesApi.list(params))`

- [x] Task 24: Create `apps/web/src/features/invoices/hooks/useInvoice.ts`
  - `useQuery(['invoices', id], () => invoicesApi.get(id))`

- [x] Task 25: Create `apps/web/src/features/invoices/hooks/useCreateInvoice.ts`
  - `useMutation`, invalidates `['invoices']`

- [x] Task 26: Create `apps/web/src/features/invoices/hooks/useUpdateInvoice.ts`
  - `useMutation`, invalidates `['invoices']` and `['invoices', id]`

- [x] Task 27: Create `apps/web/src/features/invoices/hooks/useSendInvoice.ts`
  - `useMutation`, invalidates `['invoices', id]`

- [x] Task 28: Create `apps/web/src/features/invoices/components/InvoiceStatusBadge.tsx`
  - Colors: draft=gray, sent=blue, paid=green, overdue=red, cancelled=yellow

- [x] Task 29: Create `apps/web/src/features/invoices/components/LineItemsTable.tsx`
  - Renders line items with description, qty, unit price, amount columns

- [x] Task 30: Create `apps/web/src/features/invoices/components/InvoiceList.tsx`
  - Table of invoices with status badge, client name, total, due date, actions

- [x] Task 31: Create `apps/web/src/features/invoices/components/InvoiceForm.tsx`
  - Fields: client_id (select), issue_date, due_date, tax_amount, notes
  - Dynamic line items: add/remove rows, description, quantity, unit_price
  - Displays computed subtotal + total (client-side preview only — server recalculates)

- [x] Task 32: Create `apps/web/src/features/invoices/components/InvoiceDetails.tsx`
  - Full invoice view: header, line items table, totals, status, actions (Send, Pay)

---

## Frontend — Pages

- [x] Task 33: Create `apps/web/src/pages/invoices/index.tsx`
  - Uses `useInvoices`, renders `InvoiceList`
  - "New Invoice" button → `/invoices/new`

- [x] Task 34: Create `apps/web/src/pages/invoices/new.tsx`
  - Uses `useCreateInvoice`, renders `InvoiceForm`
  - On success → navigate to `/invoices/:id`

- [x] Task 35: Create `apps/web/src/pages/invoices/[id].tsx`
  - Uses `useInvoice`, `useSendInvoice`
  - Renders `InvoiceDetails`
  - "Send" button calls `POST /invoices/:id/send`
  - "Pay" button calls `POST /invoices/:id/pay` → redirects to Stripe Checkout URL

- [x] Task 36: Create `apps/web/src/pages/invoices/payment-success.tsx`
  - Simple confirmation page shown after Stripe Checkout completes
  - Reads `?invoice_id=` from query string
  - Shows success message + link back to invoice

---

## Frontend — Routing

- [x] Task 37: Update `apps/web/src/App.tsx`
  - Import all 4 invoice pages
  - Add `/invoices`, `/invoices/new`, `/invoices/:id` inside `DashboardLayout` route group
  - Add `/invoices/payment-success` outside `DashboardLayout`

---

## Regression Verification

- [x] Task 38: Verify Phase 1 auth endpoints still respond (register, login, logout, forgot-password, reset-password)
- [x] Task 39: Verify Phase 2 CRM endpoints still respond (clients list, contacts list)
- [x] Task 40: Verify Phase 3 documents endpoints still respond (documents list)
- [x] Task 41: Verify Phase 4 tasks endpoints still respond (tasks list)
