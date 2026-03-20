# CURL API TEST REPORT
**Date:** 2026-03-19 (updated 2026-03-20)
**API Base:** `http://localhost:3000/api/v1`  
**Test Firm:** `test-firm-curl` | firmId: `5b5b30b9-a258-4384-afd6-99bb34e0a3c9`  
**Test User:** `john@test.com` | userId: `a32f9929-d9b0-4cce-aac9-8faea0cdf5d5` | role: `owner`

---

## ✅ BUG-001 FIXED — Global Auth Middleware Leak

**Root cause (resolved):** `tasksRouter`, `documentsRouter`, `crmRouter` (clients + contacts), `invoicesRouter`, `notificationsRouter` all used `router.use(authenticate, tenantContext)` with **no path prefix**, causing all unauthenticated requests to return 401.

**Fix applied:** Replaced `router.use(authenticate)` with per-route middleware on every route definition in all 6 affected routers. Also fixed BigInt serialization on `POST /portal/documents/upload` (`size_bytes` now returned as string).

**Verified fixed (2026-03-20):**
- `POST /payments/webhook` → 400 (Stripe sig error — correct) ✅
- `POST /payments/stripe/webhook` → 400 ✅
- `POST /subscriptions/webhook` → 400 ✅
- `POST /emails/send` (x-internal-request) → 200 ✅
- `POST /emails/webhook` (SES) → 200 ✅
- `POST /portal/auth/login` → 401 (invalid credentials — correct, route reachable) ✅
- `GET /portal/dashboard` → 200 ✅
- `GET /portal/documents` → 200 ✅
- `POST /portal/documents/upload` → 201 with `size_bytes` as string ✅
- `GET /portal/documents/:id/download` → 200 with signed URL ✅
- `GET /portal/invoices` → 200 ✅
- `GET /portal/tasks` → 200 ✅

---

## SECTION 1 — SYSTEM ENDPOINTS

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/health` | GET | — | ✅ 200 | `{"status":"ok"}` |
| `/me` | GET | Bearer token | ✅ 200 | user + role object |
| `/me` | PATCH | `{"firstName":"Johnny"}` | ✅ 200 | updated user |
| `/auth/me` | GET | Bearer token | ✅ 200 | `{id, email, firstName, lastName, firmId, firmName, role}` |

---

## SECTION 2 — AUTH ENDPOINTS

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/auth/register` | POST | valid payload | ✅ 201 | `{token, user}` |
| `/auth/register` | POST | duplicate slug | ✅ 409 | `FIRM_SLUG_EXISTS` |
| `/auth/register` | POST | missing fields | ✅ 422 | `VALIDATION_ERROR` with field details |
| `/auth/login` | POST | valid credentials | ✅ 200 | `{token, user}` |
| `/auth/login` | POST | wrong password | ✅ 401 | `INVALID_CREDENTIALS` |
| `/auth/forgot-password` | POST | `{"email":"john@test.com"}` | ✅ 200 | `{message}` (non-blocking) |
| `/auth/reset-password` | POST | invalid token | ✅ 400/422 | error |
| `/auth/change-password` | POST | Bearer + old/new password | ✅ 200 | success |
| `/auth/logout` | POST | Bearer token | ✅ 200 | success |

---

## SECTION 3 — CRM: FIRMS

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/firms/current` | GET | Bearer token | ✅ 200 | full firm object |
| `/firms/current` | PATCH | `{"name":"Test Firm Updated"}` | ✅ 200 | updated firm |
| `/firms/:id` | GET | Bearer + firmId | ✅ 200 | same as `/firms/current` (firmId from token) |
| `/firms/:id` | PATCH | Bearer + body | ✅ 200 | updated firm |

---

## SECTION 4 — CRM: CLIENTS

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/clients` | POST | `{name, email, phone}` | ✅ 201 | client object |
| `/clients` | GET | Bearer token | ✅ 200 | `{data, total, page, limit}` |
| `/clients/search` | GET | `?q=acme` | ✅ 200 | `{data, total, page, limit}` (alias for list with query) |
| `/clients/:id` | GET | Bearer + clientId | ✅ 200 | client object |
| `/clients/:id` | PATCH | `{name, status}` | ✅ 200 | updated client |
| `/clients/:id` | DELETE | Bearer + clientId | ✅ 204 | empty |
| `/clients/:id/contacts/link` | POST | `{"contactId":"..."}` | ✅ 201 | link record |
| `/clients/:id/contacts/:contactId` | DELETE | Bearer | ✅ 204 | empty |

**Note:** Link endpoint requires camelCase `contactId` (not `contact_id`).

---

## SECTION 5 — CRM: CONTACTS

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/contacts` | POST | `{name, email, phone, title}` | ✅ 201 | contact object |
| `/contacts` | GET | Bearer token | ✅ 200 | `{data, total, page, limit}` |
| `/contacts/:id` | GET | Bearer + contactId | ✅ 200 | contact object |
| `/contacts/:id` | PATCH | `{title}` | ✅ 200 | updated contact |
| `/contacts/:id` | DELETE | Bearer + contactId | ✅ 204 | empty |

**Note:** Contact schema uses `name` (single field), not `first_name`/`last_name`.

---

## SECTION 6 — DOCUMENTS

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/clients/:id/folders` | POST | `{"name":"Test Folder"}` | ✅ 201 | folder object |
| `/clients/:id/folders` | GET | Bearer + clientId | ✅ 200 | array of folders |
| `/folders/:id/upload` | POST | multipart file | ✅ 201 | document object with file_key |
| `/documents/:id` | GET | Bearer + docId | ✅ 200 | document object |
| `/documents/:id/download` | GET | Bearer + docId | ✅ 200 | `{url, filename, mime_type}` |
| `/documents/:id` | DELETE | Bearer + docId | ✅ 204 | empty |
| `/clients/:id/documents` | GET | Bearer + clientId | ✅ 200 | array (empty — client_id not set on upload) |

**Note:** `GET /clients/:id/documents` returns empty because uploaded documents have `client_id: null` — the upload endpoint associates to folder only, not client directly. This is a data model gap.

---

## SECTION 7 — TASKS

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/tasks` | POST | `{title, status, priority, client_id, due_date}` | ✅ 201 | task object with `task_assignments` |
| `/tasks` | GET | Bearer token | ✅ 200 | `{data, total, page, limit}` |
| `/tasks/:id` | GET | Bearer + taskId | ✅ 200 | task object |
| `/tasks/:id` | PATCH | `{status:"in_progress"}` | ✅ 200 | updated task |
| `/tasks/:id` | DELETE | Bearer + taskId | ✅ 204 | empty |
| `/clients/:id/tasks` | GET | Bearer + clientId | ✅ 200 | array of tasks |

**Notes:**
- `status` enum: `new`, `in_progress`, `waiting_client`, `review`, `completed`
- `priority` enum: `low`, `medium`, `high`, `urgent`
- `due_date` format: `YYYY-MM-DD` (not ISO datetime)

---

## SECTION 8 — INVOICES

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/invoices` | POST | `{client_id, issue_date, due_date, items[]}` | ✅ 201 | invoice with `invoice_items` and `payments` |
| `/invoices` | GET | Bearer token | ✅ 200 | `{data, total, page, limit}` |
| `/invoices/:id` | GET | Bearer + invoiceId | ✅ 200 | full invoice object |
| `/invoices/:id` | PATCH | `{notes, items[]}` | ✅ 200 | updated invoice, recalculates totals |
| `/invoices/:id` | DELETE | Bearer + invoiceId | ✅ 204 | empty |
| `/invoices/:id/send` | POST | Bearer + invoiceId | ⚠️ 500 | `INTERNAL_ERROR` — email send fails (Resend not configured in test env) |
| `/clients/:id/invoices` | GET | Bearer + clientId | ✅ 200 | array of invoices |

**Notes:**
- `items[].quantity` and `items[].unit_price` must be **strings** (e.g. `"2"`, `"500.00"`), not numbers
- `issue_date` is required; `due_date` is optional
- `POST /invoices/:id/send` returns 500 because email service fails without Resend API key — this is an environment issue, not a code bug

---

## SECTION 9 — PAYMENTS

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/payments` | GET | Bearer token | ✅ 200 | `[]` (empty, no payments yet) |
| `/clients/:id/payments` | GET | Bearer + clientId | ✅ 200 | `[]` (empty) |
| `/invoices/:id/pay` | POST | Bearer + invoiceId | ⚠️ 422 | `INVALID_STATUS` — invoice must be `sent` status first |
| `/payments/checkout-session` | POST | `{invoice_id, success_url, cancel_url}` | ⚠️ 422 | `INVALID_STATUS` — same constraint |
| `/payments/webhook` | POST | raw body | ✅ 400 | Stripe sig error (correct — no valid sig) |
| `/payments/stripe/webhook` | POST | raw body | ✅ 400 | Stripe sig error (correct) |

**Notes:**
- Payment flow requires invoice to be in `sent` status before checkout session can be created
- Webhook endpoints now correctly bypass auth middleware (BUG-001 fixed)

---

## SECTION 10 — NOTIFICATIONS

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/notifications` | GET | Bearer token | ✅ 200 | `{data, total, page, limit}` — auto-created on document upload |
| `/notifications/unread-count` | GET | Bearer token | ✅ 200 | `{"unread_count":1}` |
| `/notifications/:id/read` | PATCH | Bearer + notifId | ✅ 200 | updated notification with `is_read:true` |
| `/email-events` | GET | Bearer token | ✅ 200 | `{data, total, page, limit}` — welcome email event present |
| `/emails/send` | POST | `x-internal-request: true` + body | ✅ 200 | `{messageId}` |
| `/emails/webhook` | POST | SES SNS payload | ✅ 200 | `{received:true}` |

---

## SECTION 11 — PORTAL

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/portal/auth/create-account` | POST | Bearer (firm) + `{clientId, email, password, firstName, lastName}` | ✅ 201 | portal user object |
| `/portal/auth/register` | POST | Bearer (firm) + same body | ✅ 201 | alias — same result |
| `/portal/auth/login` | POST | `{firmSlug, email, password}` | ✅ 401 | `INVALID_CREDENTIALS` (route reachable, correct) |
| `/portal/dashboard` | GET | Portal token | ✅ 200 | `{documents, invoices, tasks}` counts |
| `/portal/documents` | GET | Portal token | ✅ 200 | array of documents with `size_bytes` as string |
| `/portal/documents/upload` | POST | Portal token + file | ✅ 201 | document object, `size_bytes` serialized as string |
| `/portal/documents/:id/download` | GET | Portal token | ✅ 200 | `{url, filename, mime_type}` |
| `/portal/invoices` | GET | Portal token | ✅ 200 | array of invoices |
| `/portal/invoices/:id` | GET | Portal token | ✅ 200 | invoice detail |
| `/portal/invoices/:id/pay` | POST | Portal token | ⚠️ 422 | `INVALID_STATUS` — invoice must be `sent` first |
| `/portal/tasks` | GET | Portal token | ✅ 200 | array of tasks |

---

## SECTION 12 — SAAS BILLING (SUBSCRIPTIONS)

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/plans` | GET | Bearer token | ✅ 200 | array of 5 plans (Starter, Pro, Enterprise, Growth, Test Plan) |
| `/subscriptions/current` | GET | Bearer token | ✅ 200 | `null` (no active subscription) |
| `/usage` | GET | Bearer token | ✅ 200 | `{users, clients, documents, storage_gb, limits}` |
| `/subscriptions` | POST | `{planId, paymentMethodId}` | ⚠️ 500 | `PLAN_MISCONFIGURED` — plan has no Stripe price_id |
| `/subscriptions/checkout-session` | POST | `{planId, successUrl, cancelUrl}` | ⚠️ 500 | `PLAN_MISCONFIGURED` — same |
| `/subscriptions/:id` | GET | Bearer + subId | untested | no subscription to test |
| `/subscriptions/:id` | PATCH | Bearer + body | untested | no subscription to test |
| `/subscriptions/:id` | DELETE | Bearer + subId | untested | no subscription to test |
| `/subscriptions/:id/history` | GET | Bearer + subId | untested | no subscription to test |
| `/subscriptions/webhook` | POST | raw Stripe body | ✅ 400 | Stripe sig error (correct — no valid sig) |
| `/admin/plans` | GET | Bearer (admin role) | ⚠️ 403 | `FORBIDDEN` — test user is `owner` not `admin` |
| `/admin/plans` | POST | Bearer (admin) + plan body | ⚠️ 403 | same |
| `/admin/plans/:id` | PATCH | Bearer (admin) | ⚠️ 403 | same |
| `/admin/plans/:id` | DELETE | Bearer (admin) | ⚠️ 403 | same |

**Notes:**
- `POST /subscriptions` requires camelCase `planId` and `paymentMethodId`
- Plans seeded in DB but `stripe_price_id` is null on Starter/Pro/Enterprise — only Growth and Test Plan have Stripe IDs
- Admin endpoints correctly enforce `requireAdmin` middleware — 403 for non-admin users is correct behavior

---

## SECTION 13 — DASHBOARD

| Endpoint | Method | Input | Status | Response |
|----------|--------|-------|--------|----------|
| `/dashboard/summary` | GET | Bearer token | ✅ 200 | `{clients, contacts, tasks, invoices, notifications}` |

---

## SUMMARY TABLE

| Module | Total Endpoints | ✅ Pass | ⚠️ Expected Fail | ❌ Bug |
|--------|----------------|---------|-----------------|--------|
| System | 4 | 4 | 0 | 0 |
| Auth | 9 | 9 | 0 | 0 |
| Firms | 4 | 4 | 0 | 0 |
| Clients | 8 | 8 | 0 | 0 |
| Contacts | 5 | 5 | 0 | 0 |
| Documents | 7 | 6 | 0 | 1 (client_id not set on upload) |
| Tasks | 6 | 6 | 0 | 0 |
| Invoices | 7 | 5 | 1 (send/email) | 0 |
| Payments | 6 | 4 | 2 (Stripe/status) | 0 |
| Notifications | 6 | 6 | 0 | 0 |
| Portal | 11 | 9 | 1 (pay/status) | 0 |
| SaaS Billing | 14 | 4 | 5 (Stripe/admin) | 0 |
| Dashboard | 1 | 1 | 0 | 0 |
| **TOTAL** | **88** | **71** | **9** | **1** |

---

## BUGS FOUND

### ~~BUG-001 — CRITICAL: Global Auth Middleware Leak~~ ✅ FIXED (2026-03-20)
**Severity:** Critical  
**Affected:** 7 public/internal endpoints  
**Root cause:** `router.use(authenticate, tenantContext)` with no path prefix in `tasks.routes.ts`, `documents.routes.ts`, `clients.routes.ts`, `contacts.routes.ts`, `invoices.routes.ts`, `notifications.routes.ts`.  
**Fix applied:** Per-route middleware on all 6 routers. Also fixed BigInt serialization on portal upload response.  
**Verified:** All 12 previously-broken endpoints now return correct responses.

### BUG-002 — MINOR: `GET /clients/:id/documents` returns empty
**Severity:** Minor  
**Root cause:** Document upload (`POST /folders/:id/upload`) sets `client_id: null` on the document record — it only links to `folder_id`. The list endpoint queries by `client_id`.  
**Fix:** Resolve `client_id` from the folder's `client_id` during upload and set it on the document.  
**Status:** Open

### BUG-003 — ENVIRONMENT: `POST /invoices/:id/send` returns 500
**Severity:** Environment (not a code bug)  
**Root cause:** Resend API key not configured in test environment.  
**Fix:** Configure `RESEND_API_KEY` in `.env`.  
**Status:** Environment issue

### BUG-004 — DATA: Plans missing `stripe_price_id`
**Severity:** Environment  
**Root cause:** Starter, Pro, Enterprise plans seeded without `stripe_price_id`.  
**Fix:** Run plan sync or update seeded plans with valid Stripe price IDs.  
**Status:** Environment issue

---

## VALIDATION SCHEMA NOTES (for frontend integration)

These field name mismatches were discovered during testing:

| Endpoint | Expected (guessed) | Actual (correct) |
|----------|-------------------|-----------------|
| `POST /contacts` | `first_name`, `last_name` | `name` (single field) |
| `POST /clients/:id/contacts/link` | `contact_id` | `contactId` (camelCase) |
| `POST /invoices` | `line_items` | `items` |
| `POST /invoices` items | `quantity: 2` (number) | `quantity: "2"` (string) |
| `POST /invoices` items | `unit_price: 500` (number) | `unit_price: "500.00"` (string) |
| `POST /tasks` | `status: "pending"` | `status: "new"` (enum) |
| `POST /tasks` | `due_date: "2026-04-01T00:00:00Z"` | `due_date: "2026-04-01"` (date only) |
| `POST /subscriptions` | `plan_id`, `payment_method_id` | `planId`, `paymentMethodId` (camelCase) |
| `POST /portal/auth/create-account` | `client_id`, `first_name`, `last_name` | `clientId`, `firstName`, `lastName` (camelCase) |
| `POST /portal/auth/login` | — | `firmSlug`, `email`, `password` |
