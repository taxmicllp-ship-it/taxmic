# Phase 5 Billing — Readiness Audit Report

**Date:** 2026-03-17
**Auditor:** Kiro
**Scope:** Pre-implementation readiness check for Phase 5 Billing module
**Mode:** READ-ONLY — no code written, no schema changed

---

## 1. Database Validation

### 1.1 Required Tables

| Table | Expected | Present in DB | Prisma Schema | Status |
|---|---|---|---|---|
| `invoice_sequences` | YES | YES | YES | ✅ PASS |
| `invoices` | YES | YES | YES | ✅ PASS |
| `invoice_items` | YES | YES | YES | ✅ PASS |
| `payments` | YES | YES | YES | ✅ PASS |

All 4 billing tables are present in the live database and defined in `packages/database/prisma/billing.prisma` (merged into `schema.prisma`).

### 1.2 Table Column Verification

#### invoice_sequences
| Column | Type | Status |
|---|---|---|
| `firm_id` | UUID, PK, FK → firms | ✅ |
| `last_number` | INTEGER, default 0 | ✅ |
| `created_at` | TIMESTAMP | ✅ |
| `updated_at` | TIMESTAMP | ✅ |

RLS policy `invoice_seq_isolation` active. ✅

#### invoices
| Column | Type | Status |
|---|---|---|
| `id` | UUID, PK | ✅ |
| `firm_id` | UUID, FK → firms | ✅ |
| `client_id` | UUID, FK → clients | ✅ |
| `number` | INTEGER | ✅ |
| `status` | `invoice_status_enum` | ✅ |
| `issue_date` | DATE | ✅ |
| `due_date` | DATE, nullable | ✅ |
| `subtotal_amount` | DECIMAL(10,2) | ✅ |
| `tax_amount` | DECIMAL(10,2) | ✅ |
| `total_amount` | DECIMAL(10,2) | ✅ |
| `paid_amount` | DECIMAL(10,2) | ✅ |
| `notes` | TEXT, nullable | ✅ |
| `pdf_url` | VARCHAR(500), nullable | ✅ |
| `sent_at` | TIMESTAMP, nullable | ✅ |
| `paid_at` | TIMESTAMP, nullable | ✅ |
| `deleted_at` | TIMESTAMP, nullable (soft delete) | ✅ |

UNIQUE constraint `(firm_id, number) WHERE deleted_at IS NULL` confirmed. ✅
RLS policy `invoices_isolation` active. ✅
Check constraints: `paid_amount >= 0`, `total_amount >= 0`, `paid_amount <= total_amount`. ✅

#### invoice_items
| Column | Type | Status |
|---|---|---|
| `id` | UUID, PK | ✅ |
| `invoice_id` | UUID, FK → invoices (CASCADE) | ✅ |
| `description` | TEXT | ✅ |
| `quantity` | DECIMAL(10,2) | ✅ |
| `unit_price` | DECIMAL(10,2) | ✅ |
| `amount` | DECIMAL(10,2) | ✅ |
| `sort_order` | INTEGER, default 0 | ✅ |

RLS policy `invoice_items_isolation` active (via invoice_id → firm_id). ✅
Check constraints: `quantity > 0`, `unit_price >= 0`, `amount >= 0`. ✅

#### payments
| Column | Type | Status |
|---|---|---|
| `id` | UUID, PK | ✅ |
| `firm_id` | UUID, FK → firms | ✅ |
| `invoice_id` | UUID, FK → invoices | ✅ |
| `amount` | DECIMAL(10,2) | ✅ |
| `method` | `payment_method_enum` | ✅ |
| `status` | `payment_status_enum`, default `pending` | ✅ |
| `stripe_payment_intent_id` | VARCHAR(255), nullable | ✅ |
| `stripe_charge_id` | VARCHAR(255), nullable | ✅ |
| `reference_number` | VARCHAR(255), nullable | ✅ |
| `notes` | TEXT, nullable | ✅ |
| `paid_at` | TIMESTAMP, nullable | ✅ |

RLS policy `payments_isolation` active. ✅

### 1.3 Table Name Mismatch Check

**FINDING: RESOLVED**

The `FOLDER-STRUCTURE-FINAL.md` references a file named `invoice-line-items.repository.ts`, implying a table named `invoice_line_items`. The actual Prisma model and live database table is `invoice_items`.

| Reference | Value | Status |
|---|---|---|
| `FOLDER-STRUCTURE-FINAL.md` file name | `invoice-line-items.repository.ts` | ⚠️ DOC MISMATCH |
| Actual Prisma model | `invoice_items` | ✅ CORRECT |
| Actual DB table | `invoice_items` | ✅ CORRECT |

**Action required:** The repository file must be named `invoice-items.repository.ts` and all code must use `prisma.invoice_items`. The folder structure doc is outdated — implementation must follow the schema, not the doc.

### 1.4 ENUMs Verification

| ENUM | Values | Present in Schema | Status |
|---|---|---|---|
| `invoice_status_enum` | draft, sent, paid, overdue, cancelled | YES | ✅ |
| `payment_method_enum` | stripe, check, cash, wire, other | YES | ✅ |
| `payment_status_enum` | pending, completed, failed, refunded | YES | ✅ |

---

## 2. Migration Validation

### 2.1 Applied Migrations

| Migration | Applied |
|---|---|
| `20260315000000_phase0_enums` | ✅ |
| `20260315164926_phase0_enums` | ✅ |
| `20260315200000_phase0_fixes` | ✅ |
| `20260316000000_crm_search_indexes` | ✅ |

### 2.2 Billing Table Migration Status

All 4 billing tables (`invoice_sequences`, `invoices`, `invoice_items`, `payments`) are present in the live database. They were created as part of the Phase 0 schema migration (all tables were created upfront).

**No new migration is required to create the billing tables.**

### 2.3 PostgreSQL Function: `get_next_invoice_number`

**FINDING: PRESENT AND CORRECT**

```
SELECT proname FROM pg_proc WHERE proname = 'get_next_invoice_number';
→ 1 row returned ✅
```

Function logic verified:
```sql
INSERT INTO invoice_sequences (firm_id, last_number, created_at, updated_at)
  VALUES (p_firm_id, 1, now(), now())
  ON CONFLICT (firm_id) DO UPDATE
    SET last_number = invoice_sequences.last_number + 1,
        updated_at  = now()
  RETURNING last_number INTO v_next;
RETURN v_next;
```

- Handles first invoice for a firm (INSERT path) ✅
- Handles subsequent invoices (ON CONFLICT UPDATE path) ✅
- Atomic — no race conditions ✅
- Returns the next number directly ✅

**No migration required for this function.**

### 2.4 RLS Policies on Billing Tables

All 4 billing tables have RLS policies active:

| Table | Policy Name | Status |
|---|---|---|
| `invoice_sequences` | `invoice_seq_isolation` | ✅ Active |
| `invoices` | `invoices_isolation` | ✅ Active |
| `invoice_items` | `invoice_items_isolation` | ✅ Active |
| `payments` | `payments_isolation` | ✅ Active |

---

## 3. Dependency Validation

### 3.1 Stripe SDK

| Check | Status |
|---|---|
| `stripe` in `apps/api/package.json` | ❌ MISSING |
| `stripe` in `apps/api/node_modules/` | ❌ NOT INSTALLED |

**This is a BLOCKER.** The `stripe` npm package must be added before any billing code can be written.

**Fix required:**
```bash
# From workspace root
npm install stripe --workspace=apps/api
```

### 3.2 PDF Generation Library

| Check | Status |
|---|---|
| `pdfkit` in `apps/api/package.json` | ❌ MISSING |
| `@types/pdfkit` in `apps/api/package.json` | ❌ MISSING |

**This is a BLOCKER** for invoice PDF generation (required by spec).

**Fix required:**
```bash
npm install pdfkit --workspace=apps/api
npm install @types/pdfkit --workspace=apps/api --save-dev
```

### 3.3 Environment Variables

#### `.env.example` (root)
| Variable | Present | Status |
|---|---|---|
| `STRIPE_SECRET_KEY` | YES (empty) | ✅ Declared |
| `STRIPE_WEBHOOK_SECRET` | YES (empty) | ✅ Declared |

#### `apps/api/.env` (development)
| Variable | Present | Status |
|---|---|---|
| `STRIPE_SECRET_KEY` | ❌ MISSING | ⚠️ Must add before testing |
| `STRIPE_WEBHOOK_SECRET` | ❌ MISSING | ⚠️ Must add before testing |

**Not a code blocker** (can add values when Stripe account is configured), but must be present before any Stripe API calls are made.

### 3.4 Existing Dependencies (Already Present)

| Package | Purpose | Status |
|---|---|---|
| `express` | HTTP server | ✅ |
| `zod` | Validation | ✅ |
| `@repo/database` | Prisma client | ✅ |
| `jsonwebtoken` | JWT auth | ✅ |
| `winston` | Logging | ✅ |
| `uuid` | UUID generation | ✅ |
| `multer` | File uploads (for PDF storage) | ✅ |

---

## 4. Frontend Architecture Validation

### 4.1 Routing Architecture

**Actual implementation:** Vite + React Router v6

Confirmed from `apps/web/src/App.tsx`:
```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
// Pages at: apps/web/src/pages/{module}/
```

**Pattern used by all existing modules:**
- Pages: `apps/web/src/pages/{module}/index.tsx`, `[id].tsx`, `new.tsx`
- Features: `apps/web/src/features/{module}/`

### 4.2 Documentation vs Implementation Mismatch

**FINDING: CRITICAL MISMATCH**

`FOLDER-STRUCTURE-FINAL.md` describes a **Next.js App Router** structure:
```
apps/web/src/app/(dashboard)/invoices/
├── page.tsx
├── [id]/
│   └── page.tsx
└── new/
    └── page.tsx
```

**Actual implementation uses Vite + React Router v6:**
```
apps/web/src/pages/invoices/
├── index.tsx
├── [id].tsx
└── new.tsx
```

This mismatch exists for ALL modules (auth, clients, contacts, documents, tasks) — the folder structure doc was written for Next.js but the project was built with Vite. The implementation is correct. The doc is wrong.

**Billing frontend pages must follow the actual pattern:**

| Page | Correct Path |
|---|---|
| Invoice list | `apps/web/src/pages/invoices/index.tsx` |
| New invoice | `apps/web/src/pages/invoices/new.tsx` |
| Invoice detail | `apps/web/src/pages/invoices/[id].tsx` |
| Payment success | `apps/web/src/pages/invoices/payment-success.tsx` |

**Feature files must follow the actual pattern:**
```
apps/web/src/features/invoices/
├── api/invoices-api.ts
├── components/
│   ├── InvoiceList.tsx
│   ├── InvoiceForm.tsx
│   ├── InvoiceDetails.tsx
│   └── LineItemsTable.tsx
├── hooks/
│   ├── useInvoices.ts
│   ├── useCreateInvoice.ts
│   └── useSendInvoice.ts
└── types.ts
```

### 4.3 Current Frontend State

| Module | Pages Present | Features Present |
|---|---|---|
| auth | ✅ | ✅ |
| clients | ✅ | ✅ |
| contacts | ✅ | ✅ |
| documents | ✅ | ✅ |
| tasks | ✅ | ✅ |
| **invoices** | ❌ Not yet created | ❌ Not yet created |

`App.tsx` has no invoice routes registered yet — expected, as Phase 5 has not started.

---

## 5. API Endpoint Validation

### 5.1 Auth Endpoints Referenced in Audit Steps

| Endpoint | Exists | Status |
|---|---|---|
| `GET /api/v1/auth/me` | ❌ NOT IMPLEMENTED | ⚠️ INVALID REFERENCE |
| `POST /api/v1/auth/refresh` | ❌ NOT IMPLEMENTED | ⚠️ INVALID REFERENCE |

These endpoints do not exist in `apps/api/src/modules/auth/auth.routes.ts` and were not part of the Phase 1 spec. Any audit step or test that references them will fail.

**These are not blockers for Phase 5 billing** — billing does not depend on `/me` or `/refresh`. They are simply invalid references in some documentation.

### 5.2 Existing Auth Endpoints (Confirmed Working)

| Endpoint | Status |
|---|---|
| `POST /api/v1/auth/register` | ✅ Working |
| `POST /api/v1/auth/login` | ✅ Working |
| `POST /api/v1/auth/forgot-password` | ✅ Working |
| `POST /api/v1/auth/reset-password` | ✅ Working |
| `POST /api/v1/auth/logout` | ✅ Working |
| `GET /api/v1/health` | ✅ Working |

### 5.3 Billing Module — Current State

`apps/api/src/modules/billing/` — **does not exist yet**. Expected — Phase 5 has not started.

`apps/api/src/app.ts` — no billing router mounted yet. Expected.

### 5.4 Required Billing Endpoints (Phase 5 Scope)

Per `PHASE-WISE-EXECUTION-PLAN.md` Phase 5:

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/v1/invoices` | List invoices (paginated, filterable) |
| POST | `/api/v1/invoices` | Create invoice with line items |
| GET | `/api/v1/invoices/:id` | Get invoice detail |
| PATCH | `/api/v1/invoices/:id` | Update invoice |
| POST | `/api/v1/invoices/:id/send` | Send invoice email |
| POST | `/api/v1/invoices/:id/pay` | Create Stripe Checkout session |
| POST | `/api/v1/payments/stripe/webhook` | Stripe webhook handler |
| GET | `/api/v1/clients/:id/invoices` | List invoices by client |
| GET | `/api/v1/clients/:id/payments` | List payments by client |

---

## 6. Documentation Mismatches

| # | Document | Mismatch | Impact |
|---|---|---|---|
| 1 | `FOLDER-STRUCTURE-FINAL.md` | Lists `invoice-line-items.repository.ts` — actual table is `invoice_items` | HIGH — file must be named `invoice-items.repository.ts` |
| 2 | `FOLDER-STRUCTURE-FINAL.md` | Describes Next.js App Router paths for frontend | HIGH — must use Vite/React Router paths instead |
| 3 | Various audit prompts | Reference `GET /auth/me` and `POST /auth/refresh` | LOW — these don't exist; ignore in billing context |
| 4 | `PHASE-5-BILLING.md` | References `invoice_line_items` table name | HIGH — actual table is `invoice_items` |
| 5 | `FOLDER-STRUCTURE-FINAL.md` | Lists `billing/` as having `invoices/`, `payments/`, `subscriptions/` subdirectories | MEDIUM — subscriptions is SaaS billing (Phase 9), not Phase 5 |

---

## 7. Required Fixes Before Phase 5

### BLOCKERS (must resolve before writing any code)

| # | Fix | Command / Action |
|---|---|---|
| B1 | Install `stripe` npm package | `npm install stripe --workspace=apps/api` |
| B2 | Install `pdfkit` npm package | `npm install pdfkit --workspace=apps/api && npm install @types/pdfkit --workspace=apps/api --save-dev` |

### REQUIRED BEFORE TESTING (not code blockers)

| # | Fix | Action |
|---|---|---|
| R1 | Add `STRIPE_SECRET_KEY` to `apps/api/.env` | Obtain from Stripe dashboard (test mode) |
| R2 | Add `STRIPE_WEBHOOK_SECRET` to `apps/api/.env` | Obtain from Stripe CLI or dashboard |

### DOCUMENTATION CORRECTIONS (apply during spec writing)

| # | Correction | Rule |
|---|---|---|
| D1 | Use `invoice_items` everywhere — not `invoice_line_items` | Follow schema, not folder structure doc |
| D2 | Frontend pages at `apps/web/src/pages/invoices/` — not App Router paths | Follow existing Vite/React Router pattern |
| D3 | Billing module is `apps/api/src/modules/billing/` with `invoices/` and `payments/` subdirs only | `subscriptions/` is Phase 9 (SaaS Billing) |
| D4 | `GET /auth/me` and `POST /auth/refresh` do not exist — do not reference in tests | Not in Phase 1 spec |

---

## 8. Final Verdict

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   PHASE 5 — BILLING MODULE                                   ║
║                                                              ║
║   VERDICT: READY WITH MINOR FIXES                            ║
║                                                              ║
║   Database:          ✅ ALL 4 TABLES PRESENT                 ║
║   Migrations:        ✅ ALL APPLIED                          ║
║   DB Function:       ✅ get_next_invoice_number EXISTS       ║
║   RLS Policies:      ✅ ALL 4 TABLES PROTECTED               ║
║   ENUMs:             ✅ ALL 3 BILLING ENUMS PRESENT          ║
║   Stripe SDK:        ❌ NOT INSTALLED (BLOCKER)              ║
║   PDFKit:            ❌ NOT INSTALLED (BLOCKER)              ║
║   Stripe Env Vars:   ⚠️  NOT IN apps/api/.env               ║
║   Frontend Arch:     ✅ Vite + React Router (confirmed)      ║
║   Doc Mismatches:    ⚠️  5 identified (non-blocking)         ║
║   Previous Phases:   ✅ 1-4 ALL PASS                         ║
║                                                              ║
║   Blockers: 2 (install stripe + pdfkit)                      ║
║   Warnings: 3 (env vars + doc corrections)                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Summary

The system is in excellent shape for Phase 5. The database is fully ready — all 4 billing tables exist, all RLS policies are active, and the `get_next_invoice_number()` PostgreSQL function is deployed and correct. Phases 1–4 are all locked and passing.

The only two blockers are missing npm packages (`stripe` and `pdfkit`) that take 30 seconds to install. Once those are installed and Stripe test keys are added to `.env`, implementation can begin immediately.

The documentation mismatches (Next.js paths in folder structure doc, `invoice_line_items` naming) are known and must be corrected in the spec — they do not affect the codebase.

**Resolve the 2 blockers, then proceed to spec creation.**
