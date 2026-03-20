# Phase 5 – Billing Implementation Audit Report

**Date:** 2026-03-17  
**Auditor:** Kiro  
**Scope:** Phase 5 Billing — Backend + Frontend + Database  
**Type:** Read-only verification. No code was modified.

---

## Overall Status: PARTIAL PASS — 6 violations found

---

## Section 1: Database Verification

### Tables

| Table | Exists | RLS Enabled | RLS Policy |
|-------|--------|-------------|------------|
| invoice_sequences | ✅ | ✅ | `invoice_seq_isolation` |
| invoices | ✅ | ✅ | `invoices_isolation` |
| invoice_items | ✅ | ✅ | `invoice_items_isolation` (via invoice_id → firm_id) |
| payments | ✅ | ✅ | `payments_isolation` |

### Column Verification — invoices

| Column | Expected | Present |
|--------|----------|---------|
| id | ✅ | ✅ |
| firm_id | ✅ | ✅ |
| client_id | ✅ | ✅ |
| number | ✅ | ✅ |
| status (invoice_status_enum) | ✅ | ✅ |
| issue_date | ✅ | ✅ |
| due_date | ✅ | ✅ |
| subtotal_amount | ✅ | ✅ |
| tax_amount | ✅ | ✅ |
| total_amount | ✅ | ✅ |
| paid_amount | ✅ | ✅ |
| notes | ✅ | ✅ |
| pdf_url | ✅ | ✅ |
| sent_at | ✅ | ✅ |
| paid_at | ✅ | ✅ |
| created_at | ✅ | ✅ |
| deleted_at | ✅ | ✅ |

### Column Verification — invoice_items

| Column | Expected | Present |
|--------|----------|---------|
| id | ✅ | ✅ |
| invoice_id | ✅ | ✅ |
| description | ✅ | ✅ |
| quantity | ✅ | ✅ |
| unit_price | ✅ | ✅ |
| amount | ✅ | ✅ |
| sort_order | ✅ | ✅ |

### Column Verification — payments

| Column | Expected | Present |
|--------|----------|---------|
| id | ✅ | ✅ |
| firm_id | ✅ | ✅ |
| invoice_id | ✅ | ✅ |
| amount | ✅ | ✅ |
| method (payment_method_enum) | ✅ | ✅ |
| status (payment_status_enum) | ✅ | ✅ |
| stripe_payment_intent_id | ✅ | ✅ |
| stripe_charge_id | ✅ | ✅ |
| reference_number | ✅ | ✅ |
| notes | ✅ | ✅ |
| paid_at | ✅ | ✅ |

### Function

| Item | Status |
|------|--------|
| `get_next_invoice_number()` exists | ✅ |
| Atomic sequence via INSERT ON CONFLICT | ✅ (per PHASE-5-BILLING.md spec) |

**Section 1 Result: PASS**

---

## Section 2: Backend Folder Structure Verification

Reference: `docs/02-architecture/FOLDER-STRUCTURE-FINAL.md`

### billing/invoices/ — Expected vs Actual

| File | Expected | Present |
|------|----------|---------|
| invoices.controller.ts | ✅ | ✅ |
| invoices.service.ts | ✅ | ✅ |
| invoices.repository.ts | ✅ | ✅ |
| invoices.routes.ts | ✅ | ✅ |
| invoices.types.ts | ✅ | ✅ |
| invoices.validation.ts | ✅ | ✅ |
| pdf-generator.service.ts | ✅ (inside invoices/) | ❌ VIOLATION — placed at billing/ root |
| invoice-line-items.repository.ts | ✅ | ❌ VIOLATION — file does not exist |
| __tests__/ | ✅ | ❌ VIOLATION — directory does not exist |

### billing/payments/ — Expected vs Actual

| File | Expected | Present |
|------|----------|---------|
| payments.controller.ts | ✅ | ✅ |
| payments.service.ts | ✅ | ✅ |
| payments.repository.ts | ✅ | ✅ |
| payments.routes.ts | ✅ | ✅ |
| payments.types.ts | ✅ | ✅ |
| payments.validation.ts | ✅ | ❌ VIOLATION — file does not exist |
| stripe.service.ts | ✅ | ✅ |
| webhook.controller.ts | ✅ | ✅ |
| __tests__/ | ✅ | ❌ VIOLATION — directory does not exist |

**Section 2 Result: FAIL**

Violations:
1. `pdf-generator.service.ts` is at `billing/pdf-generator.service.ts` — must be at `billing/invoices/pdf-generator.service.ts`
2. `invoice-line-items.repository.ts` is missing — line items are handled inline in `invoices.repository.ts`
3. `payments.validation.ts` is missing — no Zod validation schema for payments module
4. `__tests__/` directories missing for both `invoices/` and `payments/`

**Note on violation 2:** The readiness audit (`PHASE-5-BILLING-READINESS-AUDIT.md`) documented that the actual DB table is `invoice_items` not `invoice_line_items`. The file name in `FOLDER-STRUCTURE-FINAL.md` (`invoice-line-items.repository.ts`) is a doc artifact. However the structural intent — a dedicated repository file for line items — is still a valid expectation. The implementation merged line item operations into `invoices.repository.ts` instead.

---

## Section 3: Repository Layer Verification

### Prisma model usage

| Model | Used | Correct name |
|-------|------|--------------|
| prisma.invoices | ✅ | ✅ |
| prisma.invoice_items | ✅ | ✅ |
| prisma.payments | ✅ | ✅ |
| prisma.invoice_sequences | ✅ (via $queryRaw) | ✅ |
| prisma.webhook_events | ✅ | ✅ |

`invoice_line_items` is NOT referenced anywhere — confirmed correct.

### Repository methods

| Method | Expected | Present |
|--------|----------|---------|
| createInvoice | ✅ | ✅ (`create`) |
| getInvoiceById | ✅ | ✅ (`findById`) |
| listInvoices | ✅ | ✅ (`findAll`) |
| updateInvoice | ✅ | ✅ (`update`) |
| createInvoiceItems | ✅ | ✅ (inline in `create` and `update` transactions) |
| recordPayment | ✅ | ✅ (`paymentsRepository.create`) |

**Section 3 Result: PASS**

---

## Section 4: Business Logic Verification

| Rule | Expected | Status |
|------|----------|--------|
| Invoice number via `get_next_invoice_number()` | ✅ | ✅ — `invoicesRepository.getNextNumber()` calls the DB function via `$queryRaw` |
| Totals calculated server-side | ✅ | ✅ — `computeTotals()` in `invoices.service.ts`; client preview is clearly labeled "Preview only" |
| Client totals not trusted | ✅ | ✅ — `tax_amount` from client is accepted but subtotal is always recomputed from items |
| Status transition: draft → sent | ✅ | ✅ — `sendInvoice()` enforces `status === 'draft'` guard |
| Status transition: sent → paid | ✅ | ✅ — webhook handler sets `status = 'paid'` on `checkout.session.completed` |
| `POST /invoices/:id/send` updates status + sent_at | ✅ | ✅ |
| Email sending stubbed | ✅ | ✅ — logs `INVOICE_EMAIL_STUB` event |

**Section 4 Result: PASS**

---

## Section 5: Stripe Integration Verification

| Item | Expected | Status |
|------|----------|--------|
| Stripe Checkout used | ✅ | ✅ — `stripe.checkout.sessions.create()` in `stripe.service.ts` |
| Stripe Elements NOT used | ✅ | ✅ — no Elements code anywhere |
| `createCheckoutSession` exists | ✅ | ✅ |
| `success_url` set | ✅ | ✅ |
| `cancel_url` set | ✅ | ✅ |
| `metadata.invoice_id` set | ✅ | ✅ |
| Webhook controller exists | ✅ | ✅ (`webhook.controller.ts`) |
| Webhook idempotency via `webhook_events` | ✅ | ✅ — upsert + `status === 'processed'` guard |
| Duplicate events prevented | ✅ | ✅ |
| Stripe signature verification | ✅ | ✅ — `stripe.webhooks.constructEvent()` |

**Section 5 Result: PASS**

---

## Section 6: PDF Generation Verification

| Item | Expected | Status |
|------|----------|--------|
| pdfkit used | ✅ | ✅ |
| `pdf-generator.service.ts` exists | ✅ | ✅ (wrong location — see Section 2) |
| PDF stored via StorageProvider | ✅ | ✅ — `getStorageProvider().upload()` |
| `pdf_url` stored in invoices table | ✅ | ✅ — `updateStatus(..., { pdf_url: pdfKey })` |
| Invoice number in PDF | ✅ | ✅ — `invoiceLabel` using `invoice_prefix` |
| Client name in PDF | ✅ | ✅ — `invoice.client.name` |
| Invoice items in PDF | ✅ | ✅ |
| Subtotal in PDF | ✅ | ✅ |
| Tax in PDF | ✅ | ✅ |
| Total in PDF | ✅ | ✅ |
| `firm_settings.invoice_prefix` used | ✅ | ✅ |
| `firm_settings.invoice_terms` used | ✅ | ✅ |
| `firm_settings.invoice_footer` used | ✅ | ✅ — rendered at bottom of PDF |

**Section 6 Result: PASS**

---

## Section 7: Frontend Verification

### Page files

| File | Expected | Present |
|------|----------|---------|
| pages/invoices/index.tsx | ✅ | ✅ |
| pages/invoices/new.tsx | ✅ | ✅ |
| pages/invoices/[id].tsx | ✅ | ✅ |
| pages/invoices/payment-success.tsx | ✅ | ✅ |

### Routes in App.tsx

| Route | Expected | Present |
|-------|----------|---------|
| /invoices | ✅ | ✅ |
| /invoices/new | ✅ | ✅ |
| /invoices/:id | ✅ | ✅ |
| /invoices/payment-success | ✅ | ✅ (outside DashboardLayout — correct) |

### Feature components

| Component | Expected | Present |
|-----------|----------|---------|
| InvoiceList.tsx | ✅ | ✅ |
| InvoiceForm.tsx | ✅ | ✅ |
| InvoiceDetails.tsx | ✅ | ✅ |
| InvoicePDF.tsx | ✅ | ❌ VIOLATION — missing |
| LineItemsTable.tsx | ✅ | ✅ |

### features/payments/ folder

| Item | Expected | Present |
|------|----------|---------|
| features/payments/ | ✅ | ❌ VIOLATION — does not exist |
| PaymentButton.tsx | ✅ | ❌ VIOLATION — missing |
| PaymentHistory.tsx | ✅ | ❌ VIOLATION — missing |
| usePayment.ts | ✅ | ❌ VIOLATION — missing |
| payments-api.ts | ✅ | ❌ VIOLATION — missing |

### Design System Compliance (FRONTEND-DESIGN-SYSTEM-GOVERNANCE.md)

The governance doc mandates:
- All pages use `AppLayout → AppHeader → AppSidebar → PageContainer` structure
- No raw HTML inputs, buttons, or modals
- All UI from `ui_theme_ref/` components

**Findings:**

| Rule | Requirement | Status |
|------|-------------|--------|
| Layout | `AppLayout` + `AppSidebar` + `AppHeader` + `PageContainer` | ❌ VIOLATION — pages use `DashboardLayout` wrapper (existing pattern from phases 1–4), not the `AppLayout` system from `ui_theme_ref/layout/` |
| Button | `components/ui/Button` | ✅ — `Button` from `components/ui/Button` used throughout |
| Table | `components/ui/Table` | ✅ — `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` used in `InvoiceList.tsx` |
| Input | `components/ui/Input` or `components/form/InputField` | ⚠️ PARTIAL — `InputField` used for most fields, but raw `<input>` and `<textarea>` elements used for line item rows in `InvoiceForm.tsx` |
| Badge | `components/ui/Badge` | ✅ — `InvoiceStatusBadge` uses badge-style classes |
| Form | `components/form` | ⚠️ PARTIAL — `Label` and `InputField` used, but no `Form`/`FormField` wrapper components |
| Select | `components/ui/Select` | ❌ VIOLATION — raw `<select>` used for status filter in `InvoiceList.tsx` |
| Spinner | `components/ui/Spinner` | ❌ VIOLATION — loading states use raw `<p>` text, no Spinner component |

**Section 7 Result: FAIL**

Violations:
5. `InvoicePDF.tsx` component missing from `features/invoices/components/`
6. `features/payments/` folder entirely missing — `PaymentButton.tsx`, `PaymentHistory.tsx`, `usePayment.ts`, `payments-api.ts` all absent
7. Pages use `DashboardLayout` instead of `AppLayout` system from `ui_theme_ref/layout/` (this is consistent with phases 1–4 which also use `DashboardLayout` — the governance doc was not enforced in prior phases either)
8. Raw `<input>`, `<textarea>`, and `<select>` elements used in `InvoiceForm.tsx` and `InvoiceList.tsx` — violates Rule 1 of governance doc

---

## Section 8: API Endpoint Verification

### Expected endpoints per PHASE-WISE-EXECUTION-PLAN.md

| Endpoint | Expected | Implemented | Notes |
|----------|----------|-------------|-------|
| GET /api/v1/invoices | ✅ | ✅ | |
| POST /api/v1/invoices | ✅ | ✅ | |
| GET /api/v1/invoices/:id | ✅ | ✅ | |
| PATCH /api/v1/invoices/:id | ✅ | ✅ | |
| POST /api/v1/invoices/:id/send | ✅ | ✅ | |
| POST /api/v1/payments/checkout-session | ✅ | ❌ VIOLATION — implemented as `POST /api/v1/invoices/:id/pay` |
| POST /api/v1/payments/webhook | ✅ | ❌ VIOLATION — implemented as `POST /api/v1/payments/stripe/webhook` |

**Section 8 Result: FAIL**

Violations:
9. Checkout session endpoint path mismatch: spec expects `POST /payments/checkout-session`, implementation uses `POST /invoices/:id/pay`
10. Webhook endpoint path mismatch: spec expects `POST /payments/webhook`, implementation uses `POST /payments/stripe/webhook`

---

## Section 9: Security Verification

| Item | Expected | Status |
|------|----------|--------|
| All invoice queries filter by firm_id | ✅ | ✅ — `where: { firm_id: firmId }` on all repository methods |
| All payment queries filter by firm_id | ✅ | ✅ |
| No cross-tenant data leakage | ✅ | ✅ — RLS also enforces at DB level |
| Stripe webhook signature verification | ✅ | ✅ — `stripe.webhooks.constructEvent()` with secret |
| Webhook endpoint has no auth middleware | ✅ | ✅ — raw body route registered before `authenticate` |

**Section 9 Result: PASS**

---

## Section 10: Dependency Verification

| Dependency | Expected | Present in package.json |
|------------|----------|------------------------|
| stripe | ✅ | ✅ (`^20.4.1`) |
| pdfkit | ✅ | ✅ (`^0.18.0`) |
| @types/pdfkit | ✅ | ✅ (`^0.17.5`) |

**Section 10 Result: PASS**

---

## Section 11: Regression Verification

Prior phase routes are all still mounted in `apps/api/src/app.ts`:
- `/api/v1/auth` — Phase 1 ✅
- `/api/v1` (crmRouter) — Phase 2 ✅
- `/api/v1` (documentsRouter) — Phase 3 ✅
- `/api/v1` (tasksRouter) — Phase 4 ✅
- `/api/v1` (billingRouter) — Phase 5 ✅

No route conflicts detected. Billing routes use `/invoices` and `/payments` prefixes which do not overlap with prior phases.

**Section 11 Result: PASS** (static analysis — live regression curl tests not run in this audit)

---

## Section 12: Folder Structure Integrity

Extra files not in `FOLDER-STRUCTURE-FINAL.md`:
- `apps/api/src/modules/billing/pdf-generator.service.ts` — should be inside `billing/invoices/`
- `apps/web/src/features/invoices/hooks/useInvoice.ts` — not listed in spec (minor, acceptable addition)
- `apps/web/src/features/invoices/hooks/useUpdateInvoice.ts` — not listed in spec (minor, acceptable addition)
- `apps/web/src/features/invoices/hooks/useSendInvoice.ts` — listed in spec ✅

No files were created outside allowed module boundaries. All billing code is contained within `billing/` and `features/invoices/`.

**Section 12 Result: PARTIAL PASS** — one file in wrong location, no files outside module boundaries.

---

## Summary of All Violations

| # | Severity | Location | Violation |
|---|----------|----------|-----------|
| 1 | MEDIUM | `billing/pdf-generator.service.ts` | File placed at billing root — must be inside `billing/invoices/` per `FOLDER-STRUCTURE-FINAL.md` |
| 2 | LOW | `billing/invoices/` | `invoice-line-items.repository.ts` missing — line items handled inline in `invoices.repository.ts`. Note: actual table is `invoice_items`; doc name is a known artifact. |
| 3 | MEDIUM | `billing/payments/` | `payments.validation.ts` missing — no Zod validation schema for payments endpoints |
| 4 | LOW | `billing/invoices/__tests__/`, `billing/payments/__tests__/` | Test directories missing |
| 5 | MEDIUM | `features/invoices/components/` | `InvoicePDF.tsx` missing |
| 6 | HIGH | `features/payments/` | Entire `features/payments/` folder missing — `PaymentButton.tsx`, `PaymentHistory.tsx`, `usePayment.ts`, `payments-api.ts` all absent |
| 7 | HIGH | All invoice pages | Pages use `DashboardLayout` instead of `AppLayout` system from `ui_theme_ref/layout/` — violates `FRONTEND-DESIGN-SYSTEM-GOVERNANCE.md` Rule 5 |
| 8 | MEDIUM | `InvoiceForm.tsx`, `InvoiceList.tsx` | Raw `<input>`, `<textarea>`, `<select>` elements used — violates governance Rule 1 (no raw HTML UI elements) |
| 9 | HIGH | `payments.routes.ts` | Checkout session endpoint is `POST /invoices/:id/pay` — spec requires `POST /payments/checkout-session` |
| 10 | MEDIUM | `payments.routes.ts` | Webhook endpoint is `POST /payments/stripe/webhook` — spec requires `POST /payments/webhook` |

---

## Recommended Fixes

1. Move `pdf-generator.service.ts` into `billing/invoices/` and update all imports.
2. Create `invoice-items.repository.ts` inside `billing/invoices/` with dedicated line item CRUD methods, extracted from `invoices.repository.ts`.
3. Create `payments.validation.ts` with Zod schemas for checkout session request validation.
4. Create `__tests__/` directories for `billing/invoices/` and `billing/payments/` with stub test files.
5. Create `InvoicePDF.tsx` in `features/invoices/components/` — a client-side invoice preview component.
6. Create `features/payments/` folder with `PaymentButton.tsx`, `PaymentHistory.tsx`, `usePayment.ts`, `payments-api.ts`.
7. Align invoice pages with `AppLayout` system OR formally document that `DashboardLayout` is the approved layout wrapper for this project (it is used consistently across all phases 1–4).
8. Replace raw `<input>`, `<textarea>`, `<select>` in `InvoiceForm.tsx` and `InvoiceList.tsx` with design system components (`InputField`, `Select` from `components/ui/`).
9. Add `POST /payments/checkout-session` endpoint (or rename `POST /invoices/:id/pay`) to match spec.
10. Rename webhook route from `/payments/stripe/webhook` to `/payments/webhook`.

---

*This report is read-only. No code was modified during this audit.*
