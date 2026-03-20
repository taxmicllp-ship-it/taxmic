# UI Pages Inventory — Phases 1–5

**Version:** 1.0  
**Status:** Evidence-Based  
**Scope:** Phase 1 (Auth) through Phase 5 (Billing)  
**Produced:** 2026-03-17  
**Method:** Cross-referenced documentation + actual codebase inspection

---

## How This Document Was Produced

Every page entry below is backed by at least one of:
- A route registered in `apps/web/src/App.tsx`
- A page file in `apps/web/src/pages/`
- An explicit page listed in `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1
- An explicit page listed in `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` §5 (per-phase frontend pages)

Pages that exist only in documentation but not in code are flagged. Pages that exist only in code but not in documentation are flagged.

---

## Layout Note

All dashboard pages use `DashboardLayout` from `apps/web/src/components/layout/DashboardLayout.tsx`.  
`FRONTEND-DESIGN-SYSTEM-GOVERNANCE.md` specifies `AppLayout → AppHeader → AppSidebar → PageContainer` from `ui_theme_ref/layout/`.  
This mismatch is a documented governance exception — see `.kiro/steering/layout-governance.md`.  
No layout migration is in scope for Phases 1–5.

---

## Phase 1 — Auth

---

### Login

**Route:** `/login`  
**Phase Introduced:** Phase 1 — Auth  
**Purpose:** Authenticate an existing firm user and obtain a JWT session.

**Visible UI Components:**
- Firm slug input field
- Email input field
- Password input field
- "Forgot password?" link → `/forgot-password`
- "Sign in" submit button
- Error alert (on failed login)
- "Don't have an account? Register" link → `/register`
- `AuthPageLayout` wrapper (split-panel layout)

**Backend APIs Used:**
- `POST /api/v1/auth/login`

**Database Entities:**
- `users`
- `firms`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 1 Frontend Pages
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Public Pages #1
- `docs/04-development/IMPLEMENTATION-CHECKLIST.md` — Week 1: Basic Auth

**Code Reference:**
- `apps/web/src/pages/auth/login.tsx`
- `apps/web/src/App.tsx` — `<Route path="/login" element={<LoginPage />} />`

---

### Register

**Route:** `/register`  
**Phase Introduced:** Phase 1 — Auth  
**Purpose:** Create a new firm and owner user account.

**Visible UI Components:**
- Firm Name input
- Firm Slug input
- Firm Email input
- First Name / Last Name inputs (2-column grid)
- User Email input
- Password input
- "Create account" submit button
- Error alert (on failed registration)
- "Already have an account? Sign in" link → `/login`
- `AuthPageLayout` wrapper

**Backend APIs Used:**
- `POST /api/v1/auth/register`

**Database Entities:**
- `firms`
- `users`
- `user_roles`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 1 Frontend Pages
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Public Pages #2
- `docs/04-development/IMPLEMENTATION-CHECKLIST.md` — Week 1: Basic Auth

**Code Reference:**
- `apps/web/src/pages/auth/register.tsx`
- `apps/web/src/App.tsx` — `<Route path="/register" element={<RegisterPage />} />`

---

### Forgot Password

**Route:** `/forgot-password`  
**Phase Introduced:** Phase 1 — Auth  
**Purpose:** Request a password reset link via email.

**Visible UI Components:**
- Email input field
- "Send reset link" submit button
- Success alert (with reset link confirmation message)
- Dev-mode token display (when `data.resetToken` is present)
- Error alert (on failure)
- "Remember your password? Sign in" link → `/login`
- `AuthPageLayout` wrapper

**Backend APIs Used:**
- `POST /api/v1/auth/forgot-password`

**Database Entities:**
- `users`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 1 Frontend Pages
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Public Pages #3
- `docs/01-product/MVP-FEATURE-LOCK.md` — Authentication: Password reset via email

**Code Reference:**
- `apps/web/src/pages/auth/forgot-password.tsx`
- `apps/web/src/App.tsx` — `<Route path="/forgot-password" element={<ForgotPasswordPage />} />`

---

## Phase 2 — CRM

---

### Dashboard

**Route:** `/dashboard`  
**Phase Introduced:** Phase 2 — CRM  
**Purpose:** Firm overview and navigation hub. Entry point after login.

**Visible UI Components:**
- Page heading "Dashboard" + subtitle "Welcome to Taxmic."
- 3 `MetricCard` navigation tiles:
  - Clients → `/clients`
  - Contacts → `/contacts`
  - Tasks → `/tasks`
- Wrapped in `DashboardLayout` (sidebar + header)

**Backend APIs Used:**
- None (static navigation cards only — no live data fetched)

**Database Entities:**
- None directly

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 2 Frontend Pages: Dashboard
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Dashboard Pages #4
- `docs/01-product/mvp-doc.md` — MVP System Architecture: Frontend Pages: Dashboard

**Code Reference:**
- `apps/web/src/pages/dashboard.tsx`
- `apps/web/src/App.tsx` — `<Route path="/dashboard" element={<DashboardPage />} />`

**Note:** Dashboard currently shows only navigation tiles. No live metrics (client count, invoice totals, task counts) are fetched. Documented as a future enhancement.

---

### Clients List

**Route:** `/clients`  
**Phase Introduced:** Phase 2 — CRM  
**Purpose:** View and search all clients for the firm.

**Visible UI Components:**
- Client list table (via `ClientList` component)
- Search input
- Client status badges
- "New Client" button → `/clients/new`
- Edit / View links per row
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/clients`
- `GET /api/v1/clients/search?q=:query`

**Database Entities:**
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 2 Frontend Pages: Clients List
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Client Pages #5
- `docs/01-product/MVP-FEATURE-LOCK.md` — Client Management: List clients (with search)

**Code Reference:**
- `apps/web/src/pages/clients/index.tsx`
- `apps/web/src/features/clients/components/ClientList.tsx`

---

### Client Detail

**Route:** `/clients/:id`  
**Phase Introduced:** Phase 2 — CRM  
**Purpose:** View full details of a single client.

**Visible UI Components:**
- Back link → `/clients`
- Client name heading
- "Edit" button → `/clients/:id/edit`
- Detail grid: Email, Phone, Type, Status, Tax ID, Website
- Notes section (if present)
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/clients/:id`

**Database Entities:**
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 2 Frontend Pages: Client Detail
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Client Pages #6
- `docs/01-product/mvp-doc.md` — Client Profile Page

**Code Reference:**
- `apps/web/src/pages/clients/[id].tsx`
- `apps/web/src/features/clients/components/ClientDetails.tsx`

---

### New Client

**Route:** `/clients/new`  
**Phase Introduced:** Phase 2 — CRM  
**Purpose:** Create a new client record.

**Visible UI Components:**
- Page heading "New Client"
- `ClientForm` (name, email, phone, type, status, tax_id, website, notes)
- Submit / Cancel buttons
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `POST /api/v1/clients`

**Database Entities:**
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Client Pages #7
- `docs/01-product/MVP-FEATURE-LOCK.md` — Client Management: Create client

**Code Reference:**
- `apps/web/src/pages/clients/new.tsx`
- `apps/web/src/features/clients/components/ClientForm.tsx`

---

### Edit Client

**Route:** `/clients/:id/edit`  
**Phase Introduced:** Phase 2 — CRM  
**Purpose:** Edit an existing client's details.

**Visible UI Components:**
- Page heading "Edit Client"
- `ClientForm` pre-populated with existing data
- Submit / Cancel buttons
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/clients/:id`
- `PATCH /api/v1/clients/:id`

**Database Entities:**
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Client Pages #7 (edit variant)
- `docs/01-product/MVP-FEATURE-LOCK.md` — Client Management: Update client

**Code Reference:**
- `apps/web/src/pages/clients/edit.tsx`
- `apps/web/src/features/clients/components/ClientForm.tsx`

---

### Contacts List

**Route:** `/contacts`  
**Phase Introduced:** Phase 2 — CRM  
**Purpose:** View all contacts across the firm.

**Visible UI Components:**
- Contact list table (via `ContactList` component)
- "New Contact" button → `/contacts/new`
- Edit links per row
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/contacts`

**Database Entities:**
- `contacts`
- `client_contacts`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 2 Frontend Pages: Contacts List
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Contact Pages #8
- `docs/01-product/MVP-FEATURE-LOCK.md` — Contact Management

**Code Reference:**
- `apps/web/src/pages/contacts/index.tsx`
- `apps/web/src/features/contacts/components/ContactList.tsx`

---

### New Contact

**Route:** `/contacts/new`  
**Phase Introduced:** Phase 2 — CRM  
**Purpose:** Create a new contact record.

**Visible UI Components:**
- Page heading "New Contact"
- `ContactForm` (name, email, phone, title, notes)
- Submit / Cancel buttons
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `POST /api/v1/contacts`

**Database Entities:**
- `contacts`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Contact Pages #9
- `docs/01-product/MVP-FEATURE-LOCK.md` — Contact Management: Create contact

**Code Reference:**
- `apps/web/src/pages/contacts/new.tsx`
- `apps/web/src/features/contacts/components/ContactForm.tsx`

---

### Edit Contact

**Route:** `/contacts/:id/edit`  
**Phase Introduced:** Phase 2 — CRM  
**Purpose:** Edit an existing contact's details.

**Visible UI Components:**
- Page heading "Edit Contact"
- `ContactForm` pre-populated with existing data
- Submit / Cancel buttons
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/contacts/:id`
- `PATCH /api/v1/contacts/:id`

**Database Entities:**
- `contacts`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Contact Pages #9 (edit variant)
- `docs/01-product/MVP-FEATURE-LOCK.md` — Contact Management: Update contact

**Code Reference:**
- `apps/web/src/pages/contacts/edit.tsx`
- `apps/web/src/features/contacts/components/ContactForm.tsx`

---

## Phase 3 — Documents

---

### Documents

**Route:** `/documents?clientId=:clientId`  
**Phase Introduced:** Phase 3 — Documents  
**Purpose:** View, upload, and manage documents for a specific client. Requires `?clientId=` query parameter.

**Visible UI Components:**
- Page heading "Documents"
- "New Folder" button (inline folder name input on click)
- `DocumentUpload` component (folder selector + file input)
- `FolderTree` sidebar (left panel — folder list with selection)
- `DocumentList` (right panel — files in selected folder)
- Empty state: "Select a client to view documents." (when no `clientId`)
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/clients/:id/folders`
- `POST /api/v1/clients/:id/folders`
- `GET /api/v1/clients/:id/documents`
- `POST /api/v1/folders/:id/upload`
- `DELETE /api/v1/documents/:id`
- `GET /api/v1/documents/:id/download`

**Database Entities:**
- `folders`
- `documents`
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 3 Frontend Pages: Documents List
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Document Pages #10
- `docs/01-product/MVP-FEATURE-LOCK.md` — Document Management

**Code Reference:**
- `apps/web/src/pages/documents/index.tsx`
- `apps/web/src/features/documents/components/FolderTree.tsx`
- `apps/web/src/features/documents/components/DocumentList.tsx`
- `apps/web/src/features/documents/components/DocumentUpload.tsx`

**Note:** The documentation specifies `/documents` as a standalone page and `/clients/:id/documents` as a client-scoped route. The implementation uses a single page with `?clientId=` query param instead of a nested route. This is a structural deviation — flagged in the Validation section.

---

## Phase 4 — Tasks

---

### Tasks List

**Route:** `/tasks`  
**Phase Introduced:** Phase 4 — Tasks  
**Purpose:** View, filter, and manage all tasks for the firm.

**Visible UI Components:**
- Page heading "Tasks"
- "New Task" button → `/tasks/new`
- Status filter dropdown (NEW, IN_PROGRESS, WAITING_CLIENT, REVIEW, COMPLETED)
- `TaskList` component (table of tasks with status badges)
- Edit / Delete actions per row
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/tasks`
- `GET /api/v1/tasks?status=:status`
- `DELETE /api/v1/tasks/:id`

**Database Entities:**
- `tasks`
- `clients`
- `users`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 4 Frontend Pages: Tasks List
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Task Pages #12
- `docs/01-product/MVP-FEATURE-LOCK.md` — Task Management: List tasks

**Code Reference:**
- `apps/web/src/pages/tasks/index.tsx`
- `apps/web/src/features/tasks/components/TaskList.tsx`

---

### Task Detail / Edit

**Route:** `/tasks/:id`  
**Phase Introduced:** Phase 4 — Tasks  
**Purpose:** View full task details and edit inline.

**Visible UI Components:**
- Back link → `/tasks`
- Task title heading + `TaskStatusBadge`
- "Edit" / "Cancel" toggle button
- "Delete" button (with confirmation)
- View mode: description, priority, due date, completed_at
- Edit mode: `TaskForm` (title, description, status, priority, due_date, client_id)
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`

**Database Entities:**
- `tasks`
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 4 Frontend Pages: Task Detail
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Task Pages #13
- `docs/01-product/MVP-FEATURE-LOCK.md` — Task Management: Update task details

**Code Reference:**
- `apps/web/src/pages/tasks/[id].tsx`
- `apps/web/src/features/tasks/components/TaskForm.tsx`
- `apps/web/src/features/tasks/components/TaskStatusBadge.tsx`

---

### New Task

**Route:** `/tasks/new`  
**Phase Introduced:** Phase 4 — Tasks  
**Purpose:** Create a new task.

**Visible UI Components:**
- Page heading "New Task"
- `TaskForm` (title, description, status, priority, due_date, client_id)
- Submit button
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `POST /api/v1/tasks`

**Database Entities:**
- `tasks`
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Task Pages #14
- `docs/01-product/MVP-FEATURE-LOCK.md` — Task Management: Create task

**Code Reference:**
- `apps/web/src/pages/tasks/new.tsx`
- `apps/web/src/features/tasks/components/TaskForm.tsx`

---

## Phase 5 — Billing

---

### Invoices List

**Route:** `/invoices`  
**Phase Introduced:** Phase 5 — Billing  
**Purpose:** View and filter all invoices for the firm.

**Visible UI Components:**
- Page heading "Invoices"
- "New Invoice" button → `/invoices/new`
- Status filter (draft, sent, paid, overdue, cancelled)
- `InvoiceList` component (table with invoice number, client, amount, status, due date)
- `InvoiceStatusBadge` per row
- Row click → `/invoices/:id`
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/invoices`
- `GET /api/v1/invoices?status=:status`

**Database Entities:**
- `invoices`
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 5 Frontend Pages: Invoices List
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Invoice Pages #15
- `docs/01-product/MVP-FEATURE-LOCK.md` — Invoicing: View invoice list
- `docs/03-database/phases/PHASE-5-BILLING.md` — invoices table

**Code Reference:**
- `apps/web/src/pages/invoices/index.tsx`
- `apps/web/src/features/invoices/components/InvoiceList.tsx`

---

### Invoice Detail

**Route:** `/invoices/:id`  
**Phase Introduced:** Phase 5 — Billing  
**Purpose:** View full invoice details, send invoice, initiate payment, download PDF.

**Visible UI Components:**
- Back link → `/invoices`
- `InvoiceDetails` component:
  - Invoice number heading + `InvoiceStatusBadge`
  - "Send Invoice" button (visible when status = `draft`)
  - `PaymentButton` (visible when status = `sent`) — initiates Stripe Checkout
  - "Download PDF" link (when `pdf_url` is present)
  - Issue date / Due date / Sent at / Paid at grid
  - `LineItemsTable` (description, quantity, unit price, amount per line item)
  - Subtotal / Tax / Total summary
  - Paid amount (when > 0)
  - Notes section (when present)
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `GET /api/v1/invoices/:id`
- `POST /api/v1/invoices/:id/send`
- `POST /api/v1/payments/checkout-session`

**Database Entities:**
- `invoices`
- `invoice_items`
- `payments`
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 5 Frontend Pages: Invoice Detail
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Invoice Pages #16
- `docs/01-product/MVP-FEATURE-LOCK.md` — Invoicing: View invoice details; Payment Processing
- `docs/03-database/phases/PHASE-5-BILLING.md` — invoices, invoice_items, payments tables

**Code Reference:**
- `apps/web/src/pages/invoices/[id].tsx`
- `apps/web/src/features/invoices/components/InvoiceDetails.tsx`
- `apps/web/src/features/payments/PaymentButton.tsx`
- `apps/web/src/features/invoices/components/LineItemsTable.tsx`

---

### New Invoice

**Route:** `/invoices/new`  
**Phase Introduced:** Phase 5 — Billing  
**Purpose:** Create a new invoice with line items.

**Visible UI Components:**
- Page heading "New Invoice"
- `InvoiceForm`:
  - Client selector
  - Issue date input
  - Due date input
  - Line items table (description, quantity, unit price — add/remove rows)
  - Tax amount input
  - Notes textarea
  - Submit button
- Wrapped in `DashboardLayout`

**Backend APIs Used:**
- `POST /api/v1/invoices`
- `GET /api/v1/clients` (to populate client selector)

**Database Entities:**
- `invoices`
- `invoice_items`
- `invoice_sequences`
- `clients`

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 5 Frontend Pages: Invoice Form
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Invoice Pages #17
- `docs/01-product/MVP-FEATURE-LOCK.md` — Invoicing: Create invoice with line items
- `docs/03-database/phases/PHASE-5-BILLING.md` — invoice_sequences function

**Code Reference:**
- `apps/web/src/pages/invoices/new.tsx`
- `apps/web/src/features/invoices/components/InvoiceForm.tsx`

---

### Payment Success

**Route:** `/invoices/payment-success`  
**Phase Introduced:** Phase 5 — Billing  
**Purpose:** Confirmation page shown after a successful Stripe Checkout payment. Mounted outside `DashboardLayout` (accessible without sidebar).

**Visible UI Components:**
- Green checkmark icon in circular badge
- "Payment Successful" heading
- Confirmation message
- "View Invoice" button → `/invoices/:invoice_id` (when `?invoice_id=` param is present)
- "Back to Invoices" button → `/invoices`
- Full-screen centered layout (no sidebar)

**Backend APIs Used:**
- None (Stripe redirects here with `?invoice_id=` query param; webhook handles the actual payment recording)

**Database Entities:**
- None directly (display only)

**Documentation Reference:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 5 Frontend Pages: Payment Success
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 — Payment Pages #18
- `docs/01-product/MVP-FEATURE-LOCK.md` — Payment Processing: Webhook marks invoice as paid

**Code Reference:**
- `apps/web/src/pages/invoices/payment-success.tsx`
- `apps/web/src/App.tsx` — mounted outside `DashboardLayout`

---

## Validation Section

---

### 1. Pages Implemented in Code but Not Documented

| Route | File | Issue |
|-------|------|-------|
| `/contacts/:id/edit` | `apps/web/src/pages/contacts/edit.tsx` | Documented as `/contacts/new, /contacts/:id/edit` combined in §9.1 item #9. Route exists and is registered. No gap — just noting the combined entry. |
| `/clients/:id/edit` | `apps/web/src/pages/clients/edit.tsx` | Same pattern — documented as combined with new. No gap. |

No pages exist in code that are entirely absent from documentation.

---

### 2. Pages Documented but Missing in Implementation

| Documented Page | Expected Route | Status | Reference |
|-----------------|---------------|--------|-----------|
| Payment Failure | `/payments/failure` | **MISSING** — not implemented | `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 #19; `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` Phase 5 |
| Contact Detail | `/contacts/:id` | **MISSING** — only edit exists, no read-only detail view | `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` Phase 2 mentions "Contact Form" but no explicit detail page; `docs/01-product/mvp-doc.md` Client Profile tabs imply contact detail |
| Client-scoped Documents | `/clients/:id/documents` | **NOT IMPLEMENTED as route** — implemented as `/documents?clientId=:id` instead | `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 #10 lists "Documents List" without specifying the query-param pattern |
| Settings | `/settings` | **MISSING** — not implemented | `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1 #25 |

---

### 3. Features Visible in UI but Not Yet Fully Implemented

| Feature | Page | Status |
|---------|------|--------|
| Dashboard live metrics | `/dashboard` | Dashboard shows static navigation tiles only. No live client count, invoice totals, or task counts are fetched. Documented as future enhancement. |
| Contact-client linking UI | `/contacts`, `/clients/:id` | Backend supports `POST /clients/:id/contacts/link` and `DELETE /clients/:id/contacts/:contactId`. No UI to link/unlink contacts from client detail page. |
| Invoice PDF download | `/invoices/:id` | "Download PDF" link is rendered when `pdf_url` is present. PDF generation is implemented in the API (`pdf-generator.service.ts`). Requires `pdf_url` to be populated on the invoice record. |
| Payment history display | `/invoices/:id` | `PaymentHistory` component exists in `apps/web/src/features/payments/PaymentHistory.tsx` but is not rendered on any page yet. |
| `InvoicePDF` component | — | `apps/web/src/features/invoices/components/InvoicePDF.tsx` exists but is not rendered on any page. Intended for PDF preview. |

---

### 4. Pages That Should Be Hidden Until Later Phases

The following pages are documented in `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.2 as Post-MVP. They do not exist in code and must not be built until their phase is scoped:

| Page | Route | Phase |
|------|-------|-------|
| Activity Feed | `/activity` | Phase 6 (Post-MVP Phase 2) |
| Onboarding Wizard | `/onboarding` | Phase 6 (Post-MVP Phase 2) |
| Tags Management | `/tags` | Phase 6 (Post-MVP Phase 2) |
| Advanced Search | `/search` | Phase 6 (Post-MVP Phase 2) |
| Email Templates | `/settings/emails` | Phase 6 (Post-MVP Phase 2) |
| Feature Flags | `/settings/features` | Phase 6 (Post-MVP Phase 2) |
| Storage Dashboard | `/settings/storage` | Phase 6 (Post-MVP Phase 2) |
| Usage Dashboard | `/settings/usage` | Phase 6 (Post-MVP Phase 2) |
| Reports | `/reports` | Phase 7 (Post-MVP Phase 3) |
| Analytics Dashboard | `/analytics` | Phase 7 (Post-MVP Phase 3) |
| Time Tracking | `/time` | Phase 7 (Post-MVP Phase 3) |
| Integrations | `/integrations` | Phase 7 (Post-MVP Phase 3) |
| Portal Login | `/portal/login` | Phase 8 (Portal) |
| Portal Dashboard | `/portal/dashboard` | Phase 8 (Portal) |
| Portal Documents | `/portal/documents` | Phase 8 (Portal) |
| Portal Invoices | `/portal/invoices` | Phase 8 (Portal) |
| Portal Tasks | `/portal/tasks` | Phase 8 (Portal) |
| Plans / Subscription | `/plans`, `/subscriptions` | Phase 9 (SaaS Billing) |

---

## Summary

| Phase | Pages Documented | Pages Implemented | Gaps |
|-------|-----------------|-------------------|------|
| Phase 1 — Auth | 3 | 3 | None |
| Phase 2 — CRM | 7 | 7 | Contact detail page missing |
| Phase 3 — Documents | 1 | 1 | Route pattern differs (query param vs nested route) |
| Phase 4 — Tasks | 3 | 3 | None |
| Phase 5 — Billing | 4 | 4 | Payment failure page missing; Settings page missing |
| **Total** | **18** | **18 routes registered** | **3 documented pages not implemented** |
