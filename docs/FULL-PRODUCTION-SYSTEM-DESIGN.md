# FULL PRODUCTION SYSTEM DESIGN

**Version:** 1.0  
**Date:** 2026-03-20  
**Status:** PHASE 2 COMPLETE  
**Source:** `docs/PRODUCTION-DISCOVERY-REPORT.md` and all documents referenced therein  
**Traceability:** Every section is traceable to discovery report sections and source documents

---

## TRACEABILITY INDEX

| Section | Discovery Source | Original Source |
|---------|-----------------|-----------------|
| 1. System Overview | Discovery §1, §7.1 | `main-doc.md`, `MASTER-SYSTEM-BLUEPRINT.md` §1 |
| 2. Module Architecture | Discovery §1.2, §5.1 | `main-doc.md`, `MASTER-SYSTEM-BLUEPRINT.md` §2.4 |
| 3. User Flows | Discovery §1.2, §2.2 | `main-doc.md`, `PHASE-WISE-EXECUTION-PLAN.md` |
| 4. Frontend System | Discovery §2.2, §3.1–3.4 | `PHASE-WISE-EXECUTION-PLAN-PART2.md` §9 |
| 5. API Surface | Discovery §7.1, §3.1–3.4 | `PHASE-WISE-EXECUTION-PLAN-PART2.md` §8, `API-SURFACE-FINAL-AUDIT.md` |
| 6. Data Model | Discovery §5.5 | `DATABASE-ARCHITECTURE-MASTER.md` §5 |
| 7. Infrastructure | Discovery §4.1, §5.4 | `MASTER-SYSTEM-BLUEPRINT.md` §2–4, §7–8 |
| 8. Security Model | Discovery §6.1 | `MASTER-SYSTEM-BLUEPRINT.md` §6 |
| 9. Scaling Strategy | Discovery §6.3 | `MASTER-SYSTEM-BLUEPRINT.md` §9 |
| 10. Observability | Discovery §6.4 | `MASTER-SYSTEM-BLUEPRINT.md` §10, `IMPLEMENTATION-CHECKLIST.md` |
| 11. Gap → Implementation Map | Discovery §5.1–5.5 | All gap sections |
| 12. Production Readiness | Discovery §7.3, §7.4 | `PHASE-WISE-EXECUTION-PLAN-PART2.md` §10 |

---

## 1. FULL SYSTEM OVERVIEW

**Source:** Discovery §1.1, §7.1 — `docs/01-product/main-doc.md`, `docs/02-architecture/MASTER-SYSTEM-BLUEPRINT.md` §1

### 1.1 Product Definition

The full system is a **cloud-based, multi-tenant, all-in-one practice management SaaS** for accounting and tax firms — a direct competitor to TaxDome. It consolidates every tool a solo bookkeeper or small accounting firm uses into one platform, eliminating scattered emails, spreadsheets, file storage, e-signature tools, and invoicing apps.

**Core Value Proposition (from `main-doc.md`):**
> "Consolidate client management, document exchange, task tracking, and billing into one system, eliminating scattered emails, missed deadlines, and slow invoicing."

### 1.2 Target Market

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §1.1

- Solo practitioners (1–2 users)
- Small accounting firms (3–10 users)
- Their clients (document upload, invoice payment via portal)

### 1.3 SaaS Pricing Model

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §1.2

| Plan | Price | Clients | Storage | Users |
|------|-------|---------|---------|-------|
| Starter | $29/month | 50 | 10GB | 5 |
| Professional | $99/month | 200 | 50GB | 15 |
| Enterprise | $299/month | Unlimited | 500GB | Unlimited |

**Revenue Streams (from `MASTER-SYSTEM-BLUEPRINT.md` §1.2):**
- Monthly subscriptions
- Annual subscriptions (2 months free)
- Future add-ons: e-signature, time tracking

### 1.4 Full System Modules

**Source:** Discovery §1.1 — `MASTER-SYSTEM-BLUEPRINT.md` §2.4

| # | Module | Full Intent |
|---|--------|-------------|
| 1 | Auth | JWT, RBAC, 2FA, OAuth, SSO, magic links |
| 2 | CRM | Clients, contacts, custom fields, tags, bulk ops, import/export, merge |
| 3 | Documents | S3 storage, versioning, preview, annotations, virus scanning, OCR, sharing links |
| 4 | Tasks | Task management, subtasks, dependencies, templates, recurring, kanban, time tracking |
| 5 | Billing | Invoices, PDF, Stripe, recurring invoices, tax calc, discounts, partial payments, refunds, estimates |
| 6 | Notifications | Email, SMS, push, in-app, campaigns, scheduling, custom templates |
| 7 | Portal | Client login, documents, invoices, tasks, messaging, mobile app |
| 8 | SaaS Billing | Plans, subscriptions, usage limits, proration, trials, coupons, usage-based billing |
| 9 | Onboarding | Wizard, sample data, video tutorials, interactive demos |
| 10 | Activity Feed | Event timeline per client and firm-wide |
| 11 | Workflow Automation | Pipelines, stages, triggers, conditions, actions |
| 12 | Communication (Chat) | Secure client chat, internal @mentions, Gmail/Outlook IMAP sync |
| 13 | Reporting / Analytics | Financial reports, pipeline metrics, AI forecaster |
| 14 | Integrations | QuickBooks, Xero, Zapier, Calendly, IRS Transcripts, Twilio SMS |

### 1.5 Architecture Style

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §2.1

**Modular Monolith** — NOT microservices. Rationale: faster development, simpler deployment, easier debugging, lower operational overhead. Can extract to microservices later.

**Tenant Model:** Firm-based multi-tenancy. Each accounting firm = 1 tenant. All data isolated by `firm_id`. PostgreSQL RLS enforces isolation. Shared database, logical separation.

---

## 2. COMPLETE MODULE ARCHITECTURE

**Source:** Discovery §1.2 — `docs/01-product/main-doc.md` (full feature sections), `MASTER-SYSTEM-BLUEPRINT.md` §2.4

---

### 2.1 Auth Module

**Source:** Discovery §1.2 (Authentication), §2.2 (Auth feature table)

**Full Features:**
- User registration (firm + first user)
- User login (JWT, 7-day expiry)
- Password reset (token, 1-hour expiry)
- Session management
- Logout (stateless JWT; Redis-based blacklist for production)
- Change password (requires current password)
- 2FA (TOTP app + SMS backup) — deferred
- OAuth (Google, Microsoft) — deferred
- SSO (SAML/OIDC) — deferred, enterprise
- Magic links — deferred
- Fine-grained RBAC: Owner / Admin / Staff / Contractor / Viewer roles
- Per-client roles (Bookkeeper, Manager) — deferred

**Responsibilities:**
- Issue and validate JWT tokens
- Enforce RBAC on all protected routes
- Manage firm registration and first-user creation
- Provide `/me` endpoint for session hydration
- Set tenant context (`app.current_firm_id`) for RLS

**Interactions:**
- All modules depend on Auth for JWT validation
- Tenant context middleware (Auth → all modules)
- Notifications module sends password reset and welcome emails

---

### 2.2 CRM Module

**Source:** Discovery §1.2 (CRM), §2.2 (CRM feature table)

**Full Features:**
- Client CRUD (name, email, phone, type, status, tax ID, website, notes)
- Client search (full-text via tsvector GIN index)
- Client soft delete
- Client status management (active, inactive, archived, lead)
- Client type (individual, business, nonprofit)
- Contact CRUD (name, email, phone, title, notes)
- Contact-client linking (many-to-many)
- Client addresses (billing, shipping, office, home) — table exists, no API
- Client tags for segmentation and automation triggers — deferred
- Custom fields (text, date, dropdown, table) — deferred
- Client groups — deferred
- CSV import/export — deferred
- Client merge (deduplication) — deferred
- Advanced filters — deferred
- Client notes (separate from main record) — deferred
- Account linking (husband-wife, multiple businesses) — deferred
- Bulk actions (archive, send requests, add tags, merge) — deferred
- Activity feed per client — deferred (table exists)
- Client portal invites (staff creates portal account for client)

**Responsibilities:**
- Manage all client and contact data for a firm
- Enforce tenant isolation on all CRM data
- Provide search and filter capabilities
- Link contacts to multiple clients within same firm

**Interactions:**
- Documents module: clients own folders and documents
- Tasks module: tasks linked to clients
- Billing module: invoices linked to clients
- Portal module: client_users linked to clients
- Notifications module: activity events per client
- Activity Feed module: all CRM events logged

---

### 2.3 Documents Module

**Source:** Discovery §1.2 (Documents), §2.2 (Documents feature table)

**Full Features:**
- Folder creation (nested, client-scoped or firm-level)
- File upload (S3, 50MB max, MIME validation)
- File download (signed URLs, 1-hour expiry)
- File delete (soft delete)
- Storage limits per plan (enforced via storage_usage table)
- Document visibility (internal vs client)
- Document versioning (table exists, service not implemented) — deferred
- Document preview (in-browser PDF, Word, Excel, images) — deferred
- Document annotations and markup — deferred
- Document sealing (lock after finalization) — deferred
- Document linking to invoices/jobs — deferred
- Secure sharing links (no login required) — deferred
- File request links (upload without portal login) — deferred
- Client request forms (checklists with upload fields) — deferred
- Document tags (Needs review, Approved, etc.) — deferred
- Bulk upload via virtual drive — deferred
- OCR text extraction — deferred
- Folder templates auto-applied to new clients — deferred
- Virus scanning (ClamAV) — explicitly removed from MVP, Phase 3

**Responsibilities:**
- Manage file storage via S3 (production) or local (dev)
- Enforce storage limits per subscription plan
- Control document visibility (internal vs client-facing)
- Generate signed download URLs
- Track document versions (table exists)

**Interactions:**
- CRM module: documents scoped to clients
- Portal module: clients access their documents via portal
- SaaS Billing module: storage limits enforced per plan
- Storage usage trigger: auto-update storage_usage on upload/delete

---

### 2.4 Tasks Module

**Source:** Discovery §1.2 (Tasks/Workflow), §2.2 (Tasks feature table)

**Full Features:**
- Task CRUD (title, description, status, priority, due date)
- Task assignment to users
- Task status management (new, in_progress, waiting_client, review, completed)
- Task list with filters (status, client, assigned_to)
- Task delete (soft delete)
- Task comments — table exists, no API
- Task reminders (daily worker, overdue check) — deferred
- Subtasks — deferred
- Task dependencies — deferred
- Task templates — deferred
- Recurring tasks — deferred
- Task attachments — deferred
- Task time tracking — deferred
- Task priorities (low, medium, high, urgent) — implemented in schema, UI deferred
- Kanban board view — deferred
- Workflow pipelines (stages, automation) — deferred
- Calendar view (day/week/month) — deferred
- Client-facing tasks (to-dos in portal) — implemented
- Conditional logic in pipelines — deferred
- AI-powered work forecaster — deferred

**Responsibilities:**
- Manage all task lifecycle for a firm
- Assign tasks to staff members
- Expose client-facing tasks via portal
- Trigger reminder notifications (when worker service built)

**Interactions:**
- CRM module: tasks linked to clients
- Portal module: clients view their tasks
- Notifications module: task assignment emails, reminder emails
- Activity Feed module: task events logged

---

### 2.5 Billing Module

**Source:** Discovery §1.2 (Billing), §2.2 (Billing feature table)

**Full Features:**
- Invoice CRUD (line items, amounts, due date, notes)
- Invoice PDF generation (server-side)
- Invoice email (send to client via Resend)
- Invoice status management (draft, sent, paid, overdue, cancelled)
- Invoice delete (draft only, soft delete)
- Payment processing via Stripe Checkout
- Stripe webhook handling (idempotent, signature verified)
- Payment history per client
- Manual mark-paid (cash, check, wire, other)
- Recurring invoices (auto-generate on schedule) — deferred
- Invoice templates — deferred
- Tax calculations — deferred
- Discounts — deferred
- Partial payments — deferred
- Invoice reminders (daily worker) — deferred
- Credit notes — deferred
- Estimates/Quotes — deferred
- Refunds (via Stripe API) — deferred (manual via Stripe dashboard)
- Multiple payment gateways (CPACharge) — deferred
- Auto-pay for recurring invoices — deferred
- Time tracking → invoice conversion — deferred
- Service catalog with rates — deferred
- Proposals and engagement letters with e-signature — deferred
- QuickBooks Online sync — deferred

**Responsibilities:**
- Manage invoice lifecycle from draft to paid
- Process Stripe payments and webhooks
- Generate PDF invoices
- Send invoice emails to clients
- Track payment history

**Interactions:**
- CRM module: invoices linked to clients
- Portal module: clients pay invoices via portal
- Notifications module: invoice sent email, payment failure email
- SaaS Billing module: billing limits enforced per plan
- Activity Feed module: invoice and payment events logged

---

### 2.6 Notifications Module

**Source:** Discovery §1.2 (Notifications), §2.2 (Notifications feature table)

**Full Features:**
- Welcome email on registration
- Invoice email on send
- Password reset email
- Email tracking (sent, delivered, opened, clicked, bounced, complained)
- In-app notifications (task assigned, invoice sent, invoice paid, document uploaded)
- Unread count badge
- Payment failure email
- Task assignment email — deferred
- Task reminder email (daily worker) — deferred
- Invoice reminder email (daily worker) — deferred
- Custom email templates — deferred
- Email scheduling (delayed sending) — deferred
- Bulk email campaigns — deferred
- SMS notifications (Twilio) — deferred
- Push notifications (mobile) — deferred
- Portal announcements — deferred

**Responsibilities:**
- Send transactional emails via Resend
- Track email delivery events
- Manage in-app notification inbox
- Provide unread count for UI badge
- Log all email events to email_events table

**Interactions:**
- Auth module: password reset, welcome emails
- Billing module: invoice sent, payment failure emails
- Tasks module: task assignment, reminder emails
- Portal module: portal-related notifications
- Activity Feed module: notification events logged

---

### 2.7 Portal Module

**Source:** Discovery §1.2 (Portal), §2.2 (Portal feature table)

**Full Features:**
- Client portal login (separate JWT with `type: 'portal'`)
- Client portal account creation (staff-initiated)
- Portal dashboard (summary of documents, invoices, tasks)
- View documents (client-visible only)
- Upload documents to firm
- Download documents
- View invoices
- Pay invoices (Stripe Checkout)
- View tasks
- Client dashboard/analytics — deferred
- Client messaging (secure chat per account) — deferred
- Client notifications — deferred
- Client mobile app (iOS/Android) — deferred
- White-labeled portal (custom domain, logo, colors) — deferred
- Portal announcements — deferred
- Self-registration link — deferred
- E-signature in portal — deferred
- Client 2FA — deferred

**Responsibilities:**
- Provide isolated client-facing interface
- Enforce portal JWT isolation (staff JWT cannot access portal routes)
- Scope all portal data to the authenticated client's firm
- Enable clients to pay invoices and upload documents

**Interactions:**
- Auth module: portal JWT issued and validated separately
- CRM module: portal users linked to client records
- Documents module: clients access their documents
- Billing module: clients pay invoices
- Tasks module: clients view their tasks
- Notifications module: portal login events

---

### 2.8 SaaS Billing Module

**Source:** Discovery §1.2 (SaaS Billing), §2.2 (SaaS Billing feature table)

**Full Features:**
- Plan management (Starter, Professional, Enterprise)
- Subscription creation via Stripe Checkout
- Stripe subscription webhook handling
- Usage limits enforcement (clients, storage, users)
- Usage tracking (current vs plan limits)
- Admin plan management (create, update, deactivate plans)
- Subscription event log (audit trail)
- Plan upgrades/downgrades with proration — deferred
- Trial periods — deferred
- Coupons/discounts — deferred
- Usage-based billing — deferred
- Multi-currency — deferred

**Responsibilities:**
- Manage firm subscription lifecycle
- Enforce plan limits across all modules
- Sync plan data with Stripe (price IDs)
- Provide usage dashboard to firms
- Admin interface for platform-level plan management

**Interactions:**
- Auth module: subscription status checked on login
- CRM module: client count limit enforced
- Documents module: storage limit enforced
- All modules: subscription check middleware

---

### 2.9 Onboarding Module

**Source:** Discovery §1.1, §2.2 (Deferred Entirely), §3.5

**Full Features (all deferred):**
- 4-step guided wizard (create client → invite → request docs → task)
- Sample data generation
- Video tutorials
- Interactive demos
- Onboarding progress tracking
- Feature discovery tooltips

**Status:** Entirely absent. Explicitly removed in `IMPLEMENTATION-CHECKLIST.md`. Post-MVP Phase 2.

**Responsibilities (when built):**
- Guide new firms through initial setup
- Reduce time-to-value for new customers
- Track onboarding completion per firm

**Interactions:**
- CRM module: creates sample client
- Documents module: creates sample folder
- Tasks module: creates sample task
- Billing module: creates sample invoice

---

### 2.10 Activity Feed Module

**Source:** Discovery §1.1, §2.2 (Deferred Entirely), §5.1, §5.5

**Full Features (all deferred):**
- Firm-wide activity timeline
- Per-client activity timeline
- Event types: client_created, document_uploaded, task_completed, invoice_paid, portal_login, etc.
- Actor tracking (staff user or portal client)
- Metadata per event (JSONB)

**Status:** `activity_events` table exists in schema. No service writes to it. No API. No UI. Post-MVP Phase 2.

**Responsibilities (when built):**
- Log all key system events to activity_events table
- Provide firm-wide and per-client activity feeds
- Support audit trail requirements

**Interactions:**
- All modules: emit activity events on key actions
- CRM module: per-client activity feed
- Dashboard: recent activity widget

---

### 2.11 Workflow Automation Module

**Source:** Discovery §1.2 (Tasks/Workflow), §2.2 (Deferred Entirely), §3.4

**Full Features (all deferred):**
- Pipelines with stages (Kanban board)
- Jobs (task bundles per client per service)
- Automation engine: triggers → conditions → actions
- Task templates and recurring jobs
- Conditional logic in pipelines
- Calendar view with drag-and-drop
- AI-powered work forecaster

**Status:** Entirely absent. Post-MVP Phase 4.

**Responsibilities (when built):**
- Automate repetitive workflows
- Manage client service pipelines
- Trigger actions based on events (invoice paid → create task)

**Interactions:**
- Tasks module: creates and manages tasks
- CRM module: pipeline per client
- Notifications module: automation-triggered emails
- Billing module: invoice triggers

---

### 2.12 Communication (Chat) Module

**Source:** Discovery §1.2 (Communication), §2.2 (Deferred Entirely), §3.4

**Full Features (all deferred):**
- Secure client chat per account
- Internal @mentions (staff-only notes in client threads)
- Gmail/Outlook IMAP sync
- Bulk email campaigns
- SMS via Twilio
- Inbox+ unified notification feed
- Firm-wide announcements on portal homepage
- Mobile push notifications

**Status:** Entirely absent. Post-MVP Phase 3–4.

**Responsibilities (when built):**
- Provide secure messaging between firm and clients
- Sync external email into client threads
- Send bulk communications

**Interactions:**
- CRM module: messages scoped to clients
- Portal module: clients access chat
- Notifications module: message notifications

---

### 2.13 Reporting / Analytics Module

**Source:** Discovery §1.2, §2.2 (Deferred Entirely), §3.3

**Full Features (all deferred):**
- Financial reports (revenue, outstanding, collected)
- Pipeline metrics (tasks by status, by client)
- Document health reports
- Time tracking reports (billable hours)
- Analytics dashboard
- AI-powered work forecaster
- Custom report builder

**Status:** Entirely absent. Post-MVP Phase 3.

**Responsibilities (when built):**
- Aggregate data across all modules
- Generate downloadable reports
- Provide real-time analytics dashboard

**Interactions:**
- All modules: read-only data aggregation
- Dashboard: summary metrics
- Billing module: revenue analytics

---

### 2.14 Integrations Module

**Source:** Discovery §1.2 (Integrations), §2.2 (Deferred Entirely), §5.3

**Full Features (all deferred):**
- QuickBooks Online (invoice/payment sync)
- Xero (invoice/payment sync)
- Zapier (event-based automation)
- Calendly/Acuity (scheduling embed in portal)
- IRS Transcript Delivery (direct transcript download)
- Gmail/Outlook IMAP sync
- CPACharge (alternative payment gateway)
- Twilio SMS
- ClamAV (virus scanning)
- Meilisearch (advanced full-text search)
- Public API with API key authentication
- Outbound webhooks

**Status:** Entirely absent (except Stripe and Resend which are built). Post-MVP Phase 3–4.

**Responsibilities (when built):**
- Sync data with external accounting software
- Enable automation via Zapier
- Provide public API for third-party integrations

**Interactions:**
- Billing module: QuickBooks/Xero invoice sync
- Notifications module: Twilio SMS
- Documents module: ClamAV virus scanning
- All modules: outbound webhooks on events

---

## 3. FULL USER FLOWS (END-TO-END)

**Source:** Discovery §1.2, §2.2 — `main-doc.md`, `PHASE-WISE-EXECUTION-PLAN.md`

---

### 3.1 Client Lifecycle (Full System)

**Source:** Discovery §1.2 (CRM), §2.2 (CRM feature table)

1. Firm staff registers account → firm created → welcome email sent
2. Staff completes onboarding wizard (deferred) → sample data created
3. Staff creates client record (name, email, type, status)
4. Staff adds contacts and links to client
5. Staff adds client address (billing/shipping)
6. Staff applies tags to client for segmentation (deferred)
7. Staff creates portal account for client (staff-initiated)
8. Client receives portal invite email
9. Client logs into portal with credentials
10. Staff manages client through full lifecycle (active → inactive → archived)
11. Staff views per-client activity feed (deferred) — all events logged
12. Staff exports client list to CSV (deferred)
13. Staff merges duplicate clients (deferred)
14. Staff uses bulk actions (archive, tag, send requests) (deferred)

**MVP Reality:** Steps 1–3, 5, 7–10, 13 are implemented. Steps 4 (addresses), 6, 11, 12, 14 are deferred.

---

### 3.2 Document Lifecycle (Full System)

**Source:** Discovery §1.2 (Documents), §2.2 (Documents feature table)

1. Staff creates folder structure for client (nested folders)
2. Staff uploads document to folder (S3, 50MB max, MIME validated)
3. Storage usage auto-updated via PostgreSQL trigger (deferred — trigger not created)
4. Document versioning: re-upload creates new version (deferred — table exists)
5. Staff sets document visibility (internal or client-facing)
6. Client views document in portal (client-visible only)
7. Client downloads document (signed URL, 1-hour expiry)
8. Client uploads document to firm via portal
9. Staff reviews uploaded document
10. Staff annotates document (deferred)
11. Staff seals document after finalization (deferred)
12. Staff sends secure sharing link (no login required) (deferred)
13. Staff sends file request link to client (deferred)
14. Staff runs OCR on document (deferred)
15. Staff applies document tags (Needs review, Approved) (deferred)
16. Staff previews document in browser (deferred)
17. Document linked to invoice or task (deferred)
18. Virus scan on upload (ClamAV) (deferred — Phase 3)

**MVP Reality:** Steps 1–3 (trigger not created), 5–9 are implemented. All others deferred.

---

### 3.3 Task Lifecycle (Full System)

**Source:** Discovery §1.2 (Tasks/Workflow), §2.2 (Tasks feature table)

1. Staff creates task (title, description, status, priority, due date, client link)
2. Staff assigns task to one or more team members
3. Task assignment email sent to assignee (deferred)
4. Assignee views task in task list
5. Assignee updates task status (new → in_progress → waiting_client → review → completed)
6. Staff adds comments to task (deferred — table exists)
7. Staff attaches files to task (deferred)
8. Client views task in portal (client-facing tasks)
9. Task reminder email sent when overdue (deferred — no worker)
10. Staff creates subtasks (deferred)
11. Staff sets task dependencies (deferred)
12. Staff uses task template (deferred)
13. Recurring task auto-generated on schedule (deferred)
14. Task tracked in Kanban pipeline (deferred)
15. Task time tracked (billable hours) (deferred)
16. Time entries converted to invoice (deferred)
17. Task completion logged to activity feed (deferred)

**MVP Reality:** Steps 1–2, 4–5, 8 are implemented. All others deferred.

---

### 3.4 Invoice → Payment Lifecycle (Full System)

**Source:** Discovery §1.2 (Billing), §2.2 (Billing feature table)

1. Staff creates invoice (client, line items, amounts, due date)
2. Invoice saved as draft
3. Staff previews PDF
4. Staff sends invoice to client (status: draft → sent, email triggered)
5. Client receives invoice email with payment link
6. Client clicks payment link → Stripe Checkout session created
7. Client enters card details on Stripe-hosted page
8. Stripe processes payment
9. Stripe fires `payment_intent.succeeded` webhook
10. Webhook received, signature verified, idempotency checked
11. Invoice status updated to paid, payment record created
12. Payment confirmation email sent to client (deferred — not implemented)
13. Staff views payment in payment history
14. Staff manually marks invoice paid (cash/check/wire)
15. Invoice reminder email sent when overdue (deferred — no worker)
16. Staff issues credit note (deferred)
17. Staff processes partial payment (deferred)
18. Staff processes refund via Stripe (deferred — manual via Stripe dashboard)
19. Recurring invoice auto-generated on schedule (deferred)
20. Invoice synced to QuickBooks/Xero (deferred)
21. Invoice and payment events logged to activity feed (deferred)

**MVP Reality:** Steps 1–11, 13–14 are implemented. All others deferred.

---

### 3.5 Portal Interaction Flow (Full System)

**Source:** Discovery §1.2 (Portal), §2.2 (Portal feature table)

1. Staff creates portal account for client (POST /portal/auth/create-account)
2. Client receives invite email with credentials
3. Client navigates to portal URL
4. Client logs in with email/password → portal JWT issued (`type: 'portal'`)
5. Client views portal dashboard (document count, invoice summary, task count)
6. Client browses documents (client-visible only)
7. Client downloads document (signed URL)
8. Client uploads document to firm
9. Client views invoices list
10. Client views invoice detail
11. Client clicks Pay → Stripe Checkout session created
12. Client completes payment on Stripe-hosted page
13. Client redirected to payment success page
14. Client views tasks assigned to them
15. Client sends message to firm (deferred — chat not built)
16. Client receives portal notifications (deferred)
17. Client views firm announcements (deferred)
18. Client uses mobile app (deferred)
19. Client completes e-signature (deferred)
20. Client enables 2FA (deferred)

**MVP Reality:** Steps 1–14 are implemented. All others deferred.

---

### 3.6 Subscription Lifecycle (Full System)

**Source:** Discovery §1.2 (SaaS Billing), §2.2 (SaaS Billing feature table)

1. Firm registers → no subscription (or default free tier)
2. Firm views available plans (Starter, Professional, Enterprise)
3. Firm selects plan → Stripe Checkout session created
4. Firm completes payment on Stripe-hosted page
5. Stripe fires `customer.subscription.created` webhook
6. Subscription record created, plan limits activated
7. Firm uses system within plan limits (clients, storage, users)
8. Usage checked on each relevant operation
9. Firm views usage dashboard (current vs limits)
10. Firm upgrades plan (deferred — proration not implemented)
11. Firm downgrades plan (deferred)
12. Trial period starts on registration (deferred)
13. Trial-end notification sent (deferred)
14. Stripe fires `invoice.payment_failed` → subscription status → past_due
15. Payment failure email sent to firm owner
16. Firm updates payment method on Stripe
17. Stripe retries payment → subscription restored
18. Firm cancels subscription → status → canceled
19. Admin manages plans via admin panel (create, update, deactivate)
20. Subscription events logged for audit trail

**MVP Reality:** Steps 1–9, 14–15, 17–20 are implemented. Steps 10–13 deferred.

---

## 4. FULL FRONTEND SYSTEM

**Source:** Discovery §2.2, §3.1–3.4 — `PHASE-WISE-EXECUTION-PLAN-PART2.md` §9, `docs/04-development/UI-PAGES-UPTO-PHASE-5.md`

---

### 4.1 Layout Architecture

**Source:** `FRONTEND-DESIGN-SYSTEM-GOVERNANCE.md`, `.kiro/steering/layout-governance.md`

**Two distinct layout systems:**

| Layout | Used For | Status |
|--------|----------|--------|
| `DashboardLayout` | All admin/staff pages | ✅ Built — approved layout for all phases |
| `PortalLayout` | All client portal pages | ✅ Built |
| `AuthPageLayout` | Login, register, forgot password | ✅ Built |
| `AppLayout + AppSidebar + AppHeader + PageContainer` | Intended full system layout | ❌ Not validated — deferred to layout migration phase |

**Note:** Per `layout-governance.md`, `DashboardLayout` is the approved wrapper for all phases until a formal layout migration is scoped.

---

### 4.2 Admin / Staff Navigation Structure

**Source:** Discovery §2.2, §3.1–3.4 — `PHASE-WISE-EXECUTION-PLAN-PART2.md` §9

**Primary Navigation (Sidebar):**
- Dashboard
- Clients
- Contacts
- Documents
- Tasks
- Invoices
- Notifications
- Billing (subscription management)
- Settings

**Secondary Navigation (Post-MVP):**
- Activity Feed (Phase 2)
- Reports (Phase 3)
- Analytics (Phase 3)
- Time Tracking (Phase 3)
- Integrations (Phase 3)
- Workflows (Phase 4)
- Audit Trail (Phase 4)

---

### 4.3 All Pages — MVP (Built)

**Source:** `PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.1, Discovery §7.2

**Public Pages (3):**
| Route | Page | Status |
|-------|------|--------|
| `/login` | Login | ✅ Built |
| `/register` | Register | ✅ Built |
| `/forgot-password` | Forgot Password | ✅ Built |
| `/reset-password` | Reset Password | ✅ Built |

**Dashboard (1):**
| Route | Page | Status |
|-------|------|--------|
| `/dashboard` | Dashboard (live data) | ✅ Built |

**CRM Pages (5):**
| Route | Page | Status |
|-------|------|--------|
| `/clients` | Clients List | ✅ Built |
| `/clients/new` | New Client Form | ✅ Built |
| `/clients/:id` | Client Detail | ✅ Built |
| `/clients/:id/edit` | Edit Client Form | ✅ Built |
| `/contacts` | Contacts List | ✅ Built |
| `/contacts/:id` | Contact Detail | ✅ Built |

**Document Pages (1):**
| Route | Page | Status |
|-------|------|--------|
| `/documents` | Documents List | ✅ Built |
| `/documents/upload` | Upload (redirect to client docs) | ✅ Built (redirect) |

**Task Pages (3):**
| Route | Page | Status |
|-------|------|--------|
| `/tasks` | Tasks List | ✅ Built |
| `/tasks/new` | New Task Form | ✅ Built |
| `/tasks/:id` | Task Detail | ✅ Built |
| `/tasks/:id/edit` | Edit Task Form | ✅ Built |

**Invoice Pages (4):**
| Route | Page | Status |
|-------|------|--------|
| `/invoices` | Invoices List | ✅ Built |
| `/invoices/new` | New Invoice Form | ✅ Built |
| `/invoices/:id` | Invoice Detail | ✅ Built |
| `/invoices/:id/edit` | Edit Invoice Form | ✅ Built |

**Payment Pages (2):**
| Route | Page | Status |
|-------|------|--------|
| `/payments/success` | Payment Success | ✅ Built |
| `/payments/failure` | Payment Failure | ✅ Built |

**Notification Pages (1):**
| Route | Page | Status |
|-------|------|--------|
| `/notifications` | Notifications Inbox | ✅ Built |

**Billing / SaaS Pages (4):**
| Route | Page | Status |
|-------|------|--------|
| `/billing/plans` | Plans List | ✅ Built |
| `/billing/subscription` | Current Subscription | ✅ Built |
| `/billing/history` | Billing History | ✅ Built |
| `/billing/usage` | Usage Dashboard | ✅ Built |
| `/billing/admin-plans` | Admin Plan Management | ✅ Built |

**Settings (1):**
| Route | Page | Status |
|-------|------|--------|
| `/settings` | Settings (firm + user) | ✅ Built |

**Portal Pages (6):**
| Route | Page | Status |
|-------|------|--------|
| `/portal/login` | Portal Login | ✅ Built |
| `/portal/dashboard` | Portal Dashboard | ✅ Built |
| `/portal/documents` | Portal Documents | ✅ Built |
| `/portal/invoices` | Portal Invoices | ✅ Built |
| `/portal/invoices/:id` | Portal Invoice Detail | ✅ Built |
| `/portal/tasks` | Portal Tasks | ✅ Built |
| `/portal/payment-success` | Portal Payment Success | ✅ Built |

---

### 4.4 All Pages — Post-MVP (Deferred)

**Source:** `PHASE-WISE-EXECUTION-PLAN-PART2.md` §9.2, Discovery §3.1–3.4

**Phase 2 Pages (8):**
| Route | Page | Phase |
|-------|------|-------|
| `/activity` | Activity Feed | 2 |
| `/onboarding` | Onboarding Wizard | 2 |
| `/tags` | Tags Management | 2 |
| `/search` | Advanced Search | 2 |
| `/settings/emails` | Email Templates | 2 |
| `/settings/features` | Feature Flags | 2 |
| `/settings/storage` | Storage Dashboard | 2 |
| `/settings/usage` | Usage Dashboard (enhanced) | 2 |

**Phase 3 Pages (6):**
| Route | Page | Phase |
|-------|------|-------|
| `/reports` | Reports | 3 |
| `/analytics` | Analytics Dashboard | 3 |
| `/time` | Time Tracking | 3 |
| `/integrations` | Integrations | 3 |
| `/webhooks` | Webhooks | 3 |
| `/settings/api` | API Keys | 3 |

**Phase 4 Pages (5):**
| Route | Page | Phase |
|-------|------|-------|
| `/workflows` | Workflow Builder | 4 |
| `/settings/fields` | Custom Fields | 4 |
| `/signatures` | E-Signature | 4 |
| `/settings/permissions` | Advanced Permissions | 4 |
| `/audit` | Audit Trail Viewer | 4 |

---

### 4.5 Layout Separation

**Admin Layout (`DashboardLayout`):**
- All routes under `/dashboard`, `/clients`, `/contacts`, `/documents`, `/tasks`, `/invoices`, `/payments`, `/notifications`, `/billing`, `/settings`
- Includes: sidebar navigation, header with user menu, notification badge, theme toggle
- Auth guard: redirects to `/login` if no valid JWT

**Portal Layout (`PortalLayout`):**
- All routes under `/portal/*` (except `/portal/login`)
- Separate navigation (documents, invoices, tasks)
- Portal JWT required (staff JWT rejected)

**Auth Layout (`AuthPageLayout`):**
- Routes: `/login`, `/register`, `/forgot-password`, `/reset-password`
- No sidebar, centered card layout

---

## 5. FULL API SURFACE

**Source:** Discovery §7.1, §3.1–3.4 — `PHASE-WISE-EXECUTION-PLAN-PART2.md` §8, `API-SURFACE-FINAL-AUDIT.md`

All endpoints use prefix `/api/v1`.

---

### 5.1 Auth Endpoints (Built — 8)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/auth/register` | Public | ✅ Built |
| POST | `/auth/login` | Public | ✅ Built |
| POST | `/auth/forgot-password` | Public | ✅ Built |
| POST | `/auth/reset-password` | Public | ✅ Built |
| POST | `/auth/logout` | JWT | ✅ Built |
| POST | `/auth/change-password` | JWT | ✅ Built |
| GET | `/auth/me` | JWT | ✅ Built |
| PATCH | `/auth/me` | JWT | ✅ Built |

---

### 5.2 CRM Endpoints (Built — 12)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/firms/current` | JWT | ✅ Built |
| PATCH | `/firms/current` | JWT | ✅ Built |
| GET | `/clients` | JWT | ✅ Built |
| POST | `/clients` | JWT | ✅ Built |
| GET | `/clients/:id` | JWT | ✅ Built |
| PATCH | `/clients/:id` | JWT | ✅ Built |
| DELETE | `/clients/:id` | JWT | ✅ Built |
| POST | `/clients/:id/contacts/link` | JWT | ✅ Built |
| DELETE | `/clients/:id/contacts/:contactId` | JWT | ✅ Built |
| GET | `/contacts` | JWT | ✅ Built |
| POST | `/contacts` | JWT | ✅ Built |
| GET | `/contacts/:id` | JWT | ✅ Built |
| PATCH | `/contacts/:id` | JWT | ✅ Built |
| DELETE | `/contacts/:id` | JWT | ✅ Built |

**Post-MVP CRM Endpoints (Phase 2):**
| Method | Path | Status |
|--------|------|--------|
| GET | `/activity` | ❌ Deferred |
| GET | `/clients/:id/activity` | ❌ Deferred |
| GET | `/tags` | ❌ Deferred |
| POST | `/tags` | ❌ Deferred |
| POST | `/clients/:id/tags` | ❌ Deferred |
| DELETE | `/clients/:id/tags/:tagId` | ❌ Deferred |

---

### 5.3 Documents Endpoints (Built — 6)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/clients/:id/folders` | JWT | ✅ Built |
| GET | `/clients/:id/folders` | JWT | ✅ Built |
| POST | `/folders/:id/upload` | JWT | ✅ Built |
| GET | `/documents/:id/download` | JWT | ✅ Built |
| DELETE | `/documents/:id` | JWT | ✅ Built |
| GET | `/clients/:id/documents` | JWT | ✅ Built |

---

### 5.4 Tasks Endpoints (Built — 6)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/tasks` | JWT | ✅ Built |
| POST | `/tasks` | JWT | ✅ Built |
| GET | `/tasks/:id` | JWT | ✅ Built |
| PATCH | `/tasks/:id` | JWT | ✅ Built |
| DELETE | `/tasks/:id` | JWT | ✅ Built |
| GET | `/clients/:id/tasks` | JWT | ✅ Built |

---

### 5.5 Billing Endpoints (Built — 10)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/invoices` | JWT | ✅ Built |
| POST | `/invoices` | JWT | ✅ Built |
| GET | `/invoices/:id` | JWT | ✅ Built |
| PATCH | `/invoices/:id` | JWT | ✅ Built |
| DELETE | `/invoices/:id` | JWT | ✅ Built |
| POST | `/invoices/:id/send` | JWT | ✅ Built |
| GET | `/clients/:id/invoices` | JWT | ✅ Built |
| POST | `/payments/checkout-session` | JWT | ✅ Built |
| POST | `/payments/webhook` | None | ✅ Built |
| GET | `/clients/:id/payments` | JWT | ✅ Built |
| POST | `/invoices/:id/mark-paid` | JWT | ✅ Built |

---

### 5.6 Portal Endpoints (Built — 10)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/portal/auth/login` | Public | ✅ Built |
| POST | `/portal/auth/create-account` | Staff JWT | ✅ Built |
| GET | `/portal/dashboard` | Portal JWT | ✅ Built |
| GET | `/portal/documents` | Portal JWT | ✅ Built |
| POST | `/portal/documents/upload` | Portal JWT | ✅ Built |
| GET | `/portal/documents/:id/download` | Portal JWT | ✅ Built |
| GET | `/portal/invoices` | Portal JWT | ✅ Built |
| GET | `/portal/invoices/:id` | Portal JWT | ✅ Built |
| POST | `/portal/invoices/:id/pay` | Portal JWT | ✅ Built |
| GET | `/portal/tasks` | Portal JWT | ✅ Built |

---

### 5.7 SaaS Billing Endpoints (Built — 10)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/plans` | JWT | ✅ Built |
| GET | `/subscriptions/current` | JWT | ✅ Built |
| POST | `/subscriptions/checkout-session` | JWT | ✅ Built |
| POST | `/subscriptions` | JWT | ✅ Built |
| GET | `/subscriptions/:id` | JWT | ✅ Built |
| PATCH | `/subscriptions/:id` | JWT | ✅ Built |
| DELETE | `/subscriptions/:id` | JWT | ✅ Built |
| GET | `/usage` | JWT | ✅ Built |
| GET | `/subscriptions/:id/history` | JWT | ✅ Built |
| POST | `/subscriptions/webhook` | None | ✅ Built |
| GET | `/admin/plans` | Admin | ✅ Built |
| POST | `/admin/plans` | Admin | ✅ Built |
| PATCH | `/admin/plans/:id` | Admin | ✅ Built |
| DELETE | `/admin/plans/:id` | Admin | ✅ Built |

---

### 5.8 Notifications Endpoints (Built — 5)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/notifications` | JWT | ✅ Built |
| GET | `/notifications/unread-count` | JWT | ✅ Built |
| POST | `/notifications` | Internal | ✅ Built |
| PATCH | `/notifications/:id/read` | JWT | ✅ Built |
| GET | `/email-events` | JWT | ✅ Built |

---

### 5.9 Dashboard + System Endpoints (Built — 2)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/dashboard/summary` | JWT | ✅ Built |
| GET | `/health` | Public | ✅ Built |

---

### 5.10 Analytics Endpoints (Post-MVP — Phase 3)

| Method | Path | Status |
|--------|------|--------|
| GET | `/reports` | ❌ Deferred |
| POST | `/reports` | ❌ Deferred |
| GET | `/analytics` | ❌ Deferred |
| GET | `/time-entries` | ❌ Deferred |
| POST | `/time-entries` | ❌ Deferred |

---

### 5.11 Integrations Endpoints (Post-MVP — Phase 3–4)

| Method | Path | Status |
|--------|------|--------|
| GET | `/webhooks` | ❌ Deferred |
| POST | `/webhooks` | ❌ Deferred |
| GET | `/integrations` | ❌ Deferred |
| POST | `/integrations` | ❌ Deferred |
| GET | `/feature-flags` | ❌ Deferred |
| PATCH | `/feature-flags/:id` | ❌ Deferred |
| GET | `/onboarding` | ❌ Deferred |
| PATCH | `/onboarding` | ❌ Deferred |

---

### 5.12 Workflow / E-Signature Endpoints (Post-MVP — Phase 4)

| Method | Path | Status |
|--------|------|--------|
| GET | `/workflows` | ❌ Deferred |
| POST | `/workflows` | ❌ Deferred |
| POST | `/documents/:id/sign` | ❌ Deferred |
| GET | `/custom-fields` | ❌ Deferred |
| POST | `/custom-fields` | ❌ Deferred |

---

**Total Built:** 68 endpoints  
**Total Post-MVP:** 24 endpoints  
**Full System Total:** ~92 endpoints

---

## 6. FULL DATA MODEL

**Source:** Discovery §5.5 — `DATABASE-ARCHITECTURE-MASTER.md` §4–5, `packages/database/prisma/schema.prisma`

**Total tables designed and built in schema:** 36  
**Tables actively used by application:** ~22  
**Tables existing but unused:** 14 (documented below)

---

### 6.1 Domain Organization (36 Tables)

**Source:** `DATABASE-ARCHITECTURE-MASTER.md` §4.1

| Domain | Tables | Count |
|--------|--------|-------|
| Auth & Authorization | firms, users, roles, permissions, role_permissions, user_roles | 6 |
| CRM | clients, contacts, client_contacts, client_addresses | 4 |
| Documents | folders, documents, document_versions, document_permissions | 4 |
| Tasks | tasks, task_assignments, task_comments | 3 |
| Billing | invoices, invoice_items, payments, invoice_sequences | 4 |
| SaaS Billing | plans, subscriptions, subscription_events | 3 |
| Client Portal | client_users, portal_sessions | 2 |
| Notifications | notifications, email_events | 2 |
| System & Observability | activity_events, webhook_events, feature_flags, firm_feature_flags, storage_usage, failed_jobs | 6 |
| Firm Settings | firm_settings, user_settings | 2 |

---

### 6.2 Entity Definitions and Relationships

**Source:** `DATABASE-ARCHITECTURE-MASTER.md` §5

#### firms
- Tenant registry. One firm = one accounting practice.
- Fields: id, name, slug (unique), email, phone, address, website, logo_url, timezone, created_at, updated_at, deleted_at
- Relationships: → users (1:many), → clients (1:many), → subscriptions (1:1), → storage_usage (1:1)
- RLS: Not applicable (system table)

#### users
- Firm staff members.
- Fields: id, firm_id, email, password_hash, first_name, last_name, phone, avatar_url, is_active, email_verified, last_login_at, created_at, updated_at, deleted_at
- Relationships: → firm (many:1), → user_roles (1:many), → tasks (1:many as assignee), → documents (1:many as uploader)
- RLS: Enabled (firm_id isolation)

#### roles / permissions / role_permissions / user_roles
- RBAC system. System roles: owner, admin, staff, contractor, viewer.
- Permissions format: `{resource}.{action}` (e.g., clients.create, invoices.delete)
- user_roles assigns roles to users within a firm
- RLS: roles/permissions/role_permissions are system tables; user_roles has RLS

#### clients
- Core CRM entity. Each client belongs to one firm.
- Fields: id, firm_id, name, email, phone, type (individual/business/nonprofit), status (active/inactive/archived/lead), tax_id, website, notes, search_vector, created_at, updated_at, deleted_at
- Relationships: → firm (many:1), → contacts (many:many via client_contacts), → documents (1:many), → tasks (1:many), → invoices (1:many), → client_addresses (1:many)
- RLS: Enabled

#### contacts
- Individual contacts, linkable to multiple clients within same firm.
- Fields: id, firm_id, name, email, phone, title, is_primary, notes, search_vector, created_at, updated_at, deleted_at
- Relationships: → firm (many:1), → clients (many:many via client_contacts)
- RLS: Enabled

#### client_contacts
- Join table: clients ↔ contacts (many-to-many).
- Fields: id, client_id, contact_id, is_primary, created_at
- RLS: Enabled (via client_id → firm_id)

#### client_addresses
- Client billing/shipping/office addresses.
- Fields: id, client_id, type, street_line1, street_line2, city, state, postal_code, country, is_primary, created_at, updated_at
- Status: Table exists. **No API endpoint. Currently unused.**
- RLS: Enabled (via client_id → firm_id)

#### folders
- Document folder structure (nested via parent_id).
- Fields: id, firm_id, client_id (nullable), parent_id (nullable), name, description, created_at, updated_at, deleted_at
- Relationships: → firm (many:1), → client (many:1 optional), → parent folder (many:1 optional), → documents (1:many)
- RLS: Enabled

#### documents
- Uploaded files. S3 key stored, not file content.
- Fields: id, firm_id, client_id, folder_id, filename, file_key, mime_type, size_bytes, description, uploaded_by, current_version, search_vector, created_at, updated_at, deleted_at
- Relationships: → firm, → client, → folder, → uploader (user), → document_versions (1:many)
- RLS: Enabled

#### document_versions
- Version history per document.
- Fields: id, document_id, version_number, file_key, size_bytes, uploaded_by, uploaded_at, is_current
- Status: Table exists. **Versioning not implemented in service. Currently unused.**
- RLS: Enabled (via document_id → firm_id)

#### document_permissions
- Document visibility control (internal vs client).
- Fields: id, document_id, visibility (internal/client), created_at, updated_at
- RLS: Enabled (via document_id → firm_id)

#### tasks
- Task management.
- Fields: id, firm_id, client_id, title, description, status (new/in_progress/waiting_client/review/completed), priority (low/medium/high/urgent), due_date, completed_at, created_by, search_vector, created_at, updated_at, deleted_at
- Relationships: → firm, → client, → creator (user), → task_assignments (1:many), → task_comments (1:many)
- RLS: Enabled

#### task_assignments
- Assigns tasks to users (multiple assignees per task).
- Fields: id, task_id, user_id, assigned_by, assigned_at, created_at
- Status: Table exists. **Assignment via tasks.assigned_to only in current implementation. Partially used.**
- RLS: Enabled (via task_id → firm_id)

#### task_comments
- Comments on tasks.
- Fields: id, task_id, user_id, comment, created_at, updated_at, deleted_at
- Status: Table exists. **No API endpoint. Currently unused.**
- RLS: Enabled (via task_id → firm_id)

#### invoices
- Client invoices.
- Fields: id, firm_id, client_id, invoice_number, status (draft/sent/paid/overdue/cancelled), subtotal, tax_amount, total_amount, due_date, sent_at, paid_at, notes, created_by, created_at, updated_at, deleted_at
- Relationships: → firm, → client, → invoice_items (1:many), → payments (1:many)
- RLS: Enabled

#### invoice_items
- Line items on invoices.
- Fields: id, invoice_id, description, quantity, unit_price, amount, created_at
- RLS: Enabled (via invoice_id → firm_id)

#### invoice_sequences
- Atomic invoice number generation per firm (prevents race conditions).
- Fields: firm_id (PK), last_number, created_at, updated_at
- RLS: Enabled

#### payments
- Payment records (Stripe or manual).
- Fields: id, firm_id, invoice_id, amount, method (stripe/check/cash/wire/other), status (pending/completed/failed/refunded), stripe_payment_intent_id, stripe_charge_id, paid_at, created_at, updated_at
- RLS: Enabled

#### plans
- SaaS subscription plans (Starter, Professional, Enterprise).
- Fields: id, name, slug, price_monthly, price_yearly, max_clients, max_storage_gb, max_users, stripe_price_id_monthly, stripe_price_id_yearly, is_active, sort_order, created_at, updated_at
- RLS: Not applicable (system table)

#### subscriptions
- Firm subscription to a plan.
- Fields: id, firm_id, plan_id, status (trialing/active/past_due/canceled/unpaid), stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at
- RLS: Not applicable (firm_id is the tenant, not a filter)

#### subscription_events
- Audit log of subscription lifecycle events.
- Fields: id, subscription_id, event_type, data (JSONB), created_at
- Status: ✅ Actively used for billing audit trail

#### client_users
- Client portal accounts (separate from staff users).
- Fields: id, firm_id, client_id, email, password_hash, first_name, last_name, is_active, last_login_at, created_at, updated_at, deleted_at
- RLS: Enabled

#### portal_sessions
- Portal session tokens.
- Fields: id, client_user_id, token, expires_at, created_at
- Status: Table exists. **JWT used instead of session tokens. Partially used.**

#### notifications
- In-app notifications for staff users.
- Fields: id, firm_id, user_id, type, title, message, is_read, entity_type, entity_id, created_at
- RLS: Enabled

#### email_events
- Email delivery tracking (sent, delivered, opened, clicked, bounced, complained).
- Fields: id, firm_id, message_id, email_to, email_from, subject, template_name, event_type, event_data (JSONB), ip_address, user_agent, created_at
- Status: ✅ Actively used

#### activity_events
- Firm-wide and per-client activity timeline.
- Fields: id, firm_id, client_id, actor_user_id, actor_client_user_id, event_type, entity_type, entity_id, description, metadata (JSONB), created_at
- Status: Table exists. **No service writes to it. No API. No UI. Currently unused.**

#### webhook_events
- Stripe webhook idempotency tracking.
- Fields: id, event_id (unique), type, status, payload (JSONB), error, received_at, processed_at, created_at
- Status: ✅ Actively used

#### feature_flags / firm_feature_flags
- Feature toggle system (global and per-firm).
- feature_flags: id, name, description, enabled_globally, rollout_percentage, created_at, updated_at
- firm_feature_flags: id, firm_id, feature_flag_id, enabled, enabled_at, enabled_by, created_at
- Status: Tables exist. **No service reads them. No API. No UI. Currently unused.**

#### storage_usage
- Storage tracking per firm.
- Fields: id, firm_id (unique), total_bytes, document_count, last_calculated_at, created_at, updated_at
- Status: Table exists. **PostgreSQL trigger not created. Manual tracking only. Partially used.**

#### failed_jobs
- Dead letter queue for failed background jobs.
- Fields: id, queue, job_id, payload (JSONB), error, attempts, failed_at, resolved_at, resolved_by, resolution_notes
- Status: Table exists. **No workers write to it. Currently unused.**

#### firm_settings / user_settings
- Firm and user preference storage.
- Status: Tables exist. **Limited use in settings page. Partially used.**

---

### 6.3 Currently Unused Tables (Require Future Implementation)

**Source:** Discovery §5.5

| Table | Exists | Used | Required For |
|-------|--------|------|-------------|
| `activity_events` | ✅ | ❌ | Activity Feed module (Phase 2) |
| `feature_flags` | ✅ | ❌ | Feature Flags service (Phase 2) |
| `firm_feature_flags` | ✅ | ❌ | Feature Flags service (Phase 2) |
| `failed_jobs` | ✅ | ❌ | Worker service + DLQ (Phase 2) |
| `document_versions` | ✅ | ❌ | Document versioning service (Phase 3) |
| `task_comments` | ✅ | ❌ | Task comments API (Phase 2) |
| `client_addresses` | ✅ | ❌ | Client address API (Phase 2) |
| `task_assignments` | ✅ | ⚠️ | Full multi-assignee support (Phase 2) |
| `portal_sessions` | ✅ | ⚠️ | Session-based portal auth (Phase 4) |
| `storage_usage` | ✅ | ⚠️ | Storage trigger + enforcement (Phase 2) |
| `firm_settings` | ✅ | ⚠️ | Full settings API (Phase 2) |
| `user_settings` | ✅ | ⚠️ | Full user preferences API (Phase 2) |

---

## 7. PRODUCTION INFRASTRUCTURE

**Source:** Discovery §4.1, §5.4 — `MASTER-SYSTEM-BLUEPRINT.md` §2–4, §7–8

---

### 7.1 Full System Architecture

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §4.1

```
Users
  │
  ▼ HTTPS
CloudFront (CDN)
  │ Static assets + API caching
  ▼
Application Load Balancer (ALB)
  │ TLS Termination + Routing
  ├──────────────────────────────┐
  ▼                              ▼
API Container (ECS Fargate)    Web Container (ECS Fargate)
  │
  ├── Worker Container (ECS Fargate) ← separate service
  │
  ├── PostgreSQL (AWS RDS)
  ├── Redis (AWS ElastiCache)
  ├── AWS S3 (document storage)
  └── External: Stripe, Resend, Sentry
```

**No AWS API Gateway** — ALB handles routing directly. Source: `MASTER-SYSTEM-BLUEPRINT.md` §4.1.

---

### 7.2 Compute

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §2.2, §3.1

| Service | Technology | Status |
|---------|-----------|--------|
| API Server | Node.js + Express, ECS Fargate, Dockerfile | ❌ Not deployed (local only) |
| Web Frontend | React + Vite, ECS Fargate, Dockerfile | ❌ Not deployed (local only) |
| Worker Service | Node.js + BullMQ, ECS Fargate, separate Dockerfile | ❌ Not built (`apps/worker/` does not exist) |

**Worker Service (from `MASTER-SYSTEM-BLUEPRINT.md` §3.1, §7.1):**
The full system requires a separate `apps/worker/` service with four workers:
- `email-worker.ts` — processes email send jobs
- `pdf-worker.ts` — processes PDF generation jobs
- `webhook-worker.ts` — processes Stripe webhook jobs
- `reminders-worker.ts` — processes task/invoice reminder jobs

Rationale: API crash does not stop queue processing; independent scaling; different resource requirements.

---

### 7.3 Database

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §2.2, §5

| Component | Technology | Status |
|-----------|-----------|--------|
| Primary DB | PostgreSQL 15+ (AWS RDS) | ❌ Not deployed (local PostgreSQL only) |
| ORM | Prisma | ✅ Built |
| Connection Pooling | PgBouncer | ❌ Not configured |
| Read Replicas | AWS RDS read replicas (for reporting) | ❌ Not configured |
| Automated Backups | RDS automated backups | ❌ Not configured |
| RLS Policies | PostgreSQL Row Level Security | ✅ Migration created, not applied to production |

---

### 7.4 Cache and Queue

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §2.2, §7

| Component | Technology | Status |
|-----------|-----------|--------|
| Cache | Redis 7+ (AWS ElastiCache) | ❌ Not deployed |
| Queue | BullMQ (Redis-based) | ❌ Not deployed |
| Cache/Queue Separation | Two Redis instances at scale | ❌ Not configured |

**Queue Names (from `MASTER-SYSTEM-BLUEPRINT.md` §7):**
- `emails` — transactional email jobs
- `pdfs` — PDF generation jobs
- `webhooks` — Stripe webhook processing jobs
- `reminders` — task and invoice reminder jobs

---

### 7.5 Storage

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §8, Discovery §4.2

| Component | Technology | Status |
|-----------|-----------|--------|
| Document Storage | AWS S3 | ✅ S3 provider built, switched via `STORAGE_PROVIDER` env var |
| Local Storage (dev) | Local filesystem (`apps/api/uploads/`) | ✅ Built |
| CDN | AWS CloudFront | ❌ Not configured |
| Pre-signed URLs | S3 pre-signed URLs (1-hour expiry) | ✅ Built |
| Large File Upload | S3 multipart upload (files > 10MB) | ❌ Not implemented |
| Virus Scanning | ClamAV container | ❌ Not built (Phase 3) |

**Storage Provider Switch (from `MASTER-SYSTEM-BLUEPRINT.md` §8):**
- `STORAGE_PROVIDER=local` → uses `apps/api/uploads/` (development)
- `STORAGE_PROVIDER=s3` → uses AWS S3 (production)

---

### 7.6 External Services

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §2.2, Discovery §4.2

| Service | Purpose | Status |
|---------|---------|--------|
| Stripe | Payment processing + subscriptions | ✅ Built |
| Resend | Transactional email (replaced AWS SES) | ✅ Built |
| Sentry | Error tracking (backend + frontend) | ✅ Built |
| AWS SES | Original email provider (replaced by Resend) | ❌ Not used |
| Twilio | SMS notifications | ❌ Not built (Phase 3) |
| ClamAV | Virus scanning | ❌ Not built (Phase 3) |
| Meilisearch | Advanced full-text search (100k+ records) | ❌ Not built (Phase 3) |

---

### 7.7 Infrastructure as Code

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §2.2, Discovery §3.5

| Component | Technology | Status |
|-----------|-----------|--------|
| IaC | Terraform | ❌ Not built (explicitly removed in `BRUTAL-MVP.md`) |
| CI/CD (test) | GitHub Actions | ✅ Built (`.github/workflows/ci.yml`) |
| CI/CD (deploy) | GitHub Actions deploy pipelines | ❌ Not built |
| Docker Compose (dev) | `docker-compose.yml` | ❌ Not created |
| Docker Compose (prod) | `docker-compose.prod.yml` | ❌ Not created |
| Dockerfiles | Per service | ❌ Not created |

---

### 7.8 What Exists vs Not Implemented

**Source:** Discovery §5.4

| Infrastructure Component | Exists | Notes |
|--------------------------|--------|-------|
| AWS ECS Fargate | ❌ | Not deployed |
| AWS RDS (PostgreSQL) | ❌ | Local PostgreSQL only |
| AWS ElastiCache (Redis) | ❌ | Not deployed |
| AWS S3 (production) | ✅ | Code built, env var switches it on |
| AWS CloudFront | ❌ | Not configured |
| Terraform | ❌ | Not built |
| PgBouncer | ❌ | Not configured |
| BullMQ + Redis queue | ❌ | Not deployed |
| Separate Worker Service | ❌ | `apps/worker/` not created |
| Prometheus + Grafana | ❌ | Not built |
| Multi-region deployment | ❌ | Not configured |
| Automated backups | ❌ | Not configured |
| Load balancer (ALB) | ❌ | Not configured |
| TLS termination | ❌ | Not configured (no deployment) |

---

## 8. SECURITY MODEL

**Source:** Discovery §6.1 — `MASTER-SYSTEM-BLUEPRINT.md` §6, `PHASE-WISE-EXECUTION-PLAN-PART2.md` §10.3

---

### 8.1 Authentication

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §6, `MVP-FEATURE-LOCK.md` §Auth

| Mechanism | Specification | Status |
|-----------|--------------|--------|
| JWT authentication | 7-day expiry, HS256 | ✅ Built |
| bcrypt password hashing | Standard rounds | ✅ Built |
| Portal JWT isolation | `type: 'portal'` claim, separate validation | ✅ Built |
| Stateless logout | JWT not blacklisted (acceptable for MVP) | ✅ Built |
| Redis-based token revocation | For production logout | ❌ Not implemented |
| 2FA (TOTP + SMS backup) | `MASTER-SYSTEM-BLUEPRINT.md` §2.2 | ❌ Deferred |
| OAuth (Google, Microsoft) | `MASTER-SYSTEM-BLUEPRINT.md` §2.2 | ❌ Deferred |
| SSO (SAML/OIDC) | Enterprise tier | ❌ Deferred |
| Magic links | `MASTER-SYSTEM-BLUEPRINT.md` §2.2 | ❌ Deferred |

---

### 8.2 Multi-Tenant Isolation

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §6.1, `BACKEND-DEVELOPMENT-ORDER.md` §Phase 1

| Mechanism | Specification | Status |
|-----------|--------------|--------|
| firmId from JWT only (never from params) | `API-SURFACE-FINAL-AUDIT.md` §Security | ✅ Verified |
| Tenant context middleware | Sets `app.current_firm_id` session variable | ✅ Built |
| PostgreSQL RLS on all tenant tables | 13 tables covered | ✅ Migration created (`20260320200000_row_level_security`) |
| RLS applied to production database | Required before real users | ❌ Not applied (no production DB) |
| Portal isolation | Portal JWT cannot access staff routes | ✅ Built |
| Soft-delete consistency | All reads filter `deleted_at: null` | ✅ Verified |

**RLS Policy Pattern (from `MASTER-SYSTEM-BLUEPRINT.md` §6.1):**
```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON clients
  USING (firm_id = current_setting('app.current_firm_id')::uuid);
```
Applied to: clients, contacts, documents, folders, tasks, invoices, payments, notifications, email_events, activity_events, storage_usage, user_roles, client_users.

---

### 8.3 RBAC

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §6, `DATABASE-ARCHITECTURE-MASTER.md` §5.1

| Role | Access Level | Status |
|------|-------------|--------|
| owner | Full access to everything | ✅ Schema built |
| admin | Manage users and settings | ✅ Schema built |
| staff | Manage clients, documents, tasks, invoices | ✅ Schema built |
| contractor | Limited access to assigned tasks | ✅ Schema built |
| viewer | Read-only access | ✅ Schema built |
| requireAdmin middleware | Platform admin operations | ✅ Built |

**Note:** RBAC roles exist in schema and middleware. Fine-grained per-resource permission checks are partially implemented. Full RBAC enforcement across all endpoints is a post-MVP hardening item.

---

### 8.4 Network Security

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §2.3, `IMPLEMENTATION-CHECKLIST.md` §Week 15

| Mechanism | Specification | Status |
|-----------|--------------|--------|
| Rate limiting (global) | 1000 requests / 15 min | ✅ Built |
| Rate limiting (per-user) | 100 requests / min | ✅ Built |
| Rate limiting (auth endpoints) | 3–10 requests / min | ✅ Built |
| CORS configured | Allowed origins configured | ✅ Built |
| Security headers (Helmet) | Standard Helmet defaults | ✅ Built |
| TLS in transit | HTTPS via ALB | ❌ Not configured (no deployment) |
| Encrypted at rest | RDS encryption | ❌ Not configured (no RDS) |

---

### 8.5 Document Security

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §8, `PHASE-WISE-EXECUTION-PLAN-PART2.md` §10.4

| Mechanism | Specification | Status |
|-----------|--------------|--------|
| S3 bucket private by default | No public access | ✅ Built (S3 provider) |
| Pre-signed URLs (1-hour expiry) | Short-lived download links | ✅ Built |
| File size limit (50MB) | Enforced via Multer | ✅ Built |
| MIME type validation | Allowed types enforced | ✅ Built |
| Virus scanning (ClamAV) | Scan on upload | ❌ Not built (Phase 3) |

---

### 8.6 Audit and Compliance

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §6.1, `MVP-FEATURE-LOCK.md` §14

| Mechanism | Specification | Status |
|-----------|--------------|--------|
| Security audit logs | Login, password change, permission changes | ✅ Built (migration `20260319000000_security_audit_logs`) |
| Webhook idempotency | Stripe event deduplication | ✅ Built |
| Stripe signature verification | `stripe.webhooks.constructEvent` | ✅ Built |
| Activity events (full audit trail) | All key actions logged | ❌ Table exists, not populated |
| SOC 2 compliance | Certification path | ❌ Not achieved (Phase 5) |
| ISO 27001 | Certification path | ❌ Not achieved (Phase 5) |

---

## 9. SCALING STRATEGY

**Source:** Discovery §6.3 — `MASTER-SYSTEM-BLUEPRINT.md` §9

---

### 9.1 Database Scaling

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §9.1–9.2, §1.4

| Stage | Trigger | Action | Status |
|-------|---------|--------|--------|
| MVP | < 500 customers | Single PostgreSQL instance, all tenants | ✅ Architecture in place |
| Growth | 500+ customers | Add read replicas for reporting queries | ❌ Not configured |
| Scale | High concurrent load | PgBouncer connection pooling | ❌ Not configured |
| Enterprise | Largest tenants | Shard by firm_id if needed | ❌ Future |

**PgBouncer (from `MASTER-SYSTEM-BLUEPRINT.md` §9.2):**
- Required when database hits connection limits under concurrent load
- Sits between API and PostgreSQL
- Pool mode: transaction (recommended for Prisma)

---

### 9.2 Redis Separation

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §9.1

| Stage | Trigger | Action | Status |
|-------|---------|--------|--------|
| MVP | < 500 customers | Single Redis instance (cache + queue) | ❌ Redis not deployed |
| Growth | 500+ customers | Separate Redis instances: one for cache, one for BullMQ queue | ❌ Not configured |

**Rationale:** Queue failures should not affect cache performance and vice versa.

---

### 9.3 Search Migration

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §9.3

| Stage | Trigger | Action | Status |
|-------|---------|--------|--------|
| MVP | < 100k records | PostgreSQL full-text search (tsvector + GIN indexes) | ✅ Built |
| Growth | 100k+ records | Migrate to Meilisearch for advanced full-text search | ❌ Not built (Phase 3) |

**Current search implementation:** GIN indexes on `search_vector` columns in clients, contacts, documents, tasks tables.

---

### 9.4 Storage Scaling

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §9.4

| Mechanism | Trigger | Action | Status |
|-----------|---------|--------|--------|
| Pre-signed URLs | All file downloads | S3 signed URLs (1-hour expiry) | ✅ Built |
| Large file upload | Files > 10MB | S3 multipart upload | ❌ Not implemented |
| CDN | Static assets + large files | CloudFront in front of S3 | ❌ Not configured |

---

### 9.5 Worker Scaling

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §3.1, §7.1

| Mechanism | Description | Status |
|-----------|-------------|--------|
| Separate worker service | `apps/worker/` scales independently from API | ❌ Not built |
| BullMQ concurrency | Per-worker concurrency setting (e.g., 10 for webhooks) | ❌ Not deployed |
| Worker auto-scaling | ECS scales worker containers based on queue depth | ❌ Not configured |

---

### 9.6 Horizontal Scaling

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §4.1

| Component | Mechanism | Status |
|-----------|-----------|--------|
| API containers | ECS Fargate auto-scaling | ❌ Not deployed |
| Web containers | ECS Fargate auto-scaling | ❌ Not deployed |
| Worker containers | ECS Fargate auto-scaling (queue depth metric) | ❌ Not deployed |
| Load balancer | ALB distributes traffic across API containers | ❌ Not configured |

---

### 9.7 Multi-Region

**Source:** `MASTER-SYSTEM-BLUEPRINT.md` §9, Discovery §3.4

| Stage | Description | Status |
|-------|-------------|--------|
| Phase 5 (Enterprise) | Multi-region deployment for data residency | ❌ Not configured |
| Phase 5 (Enterprise) | Dedicated tenant databases for largest enterprise customers | ❌ Not configured |

---

## 10. OBSERVABILITY

**Source:** Discovery §6.4 — `MASTER-SYSTEM-BLUEPRINT.md` §10, `IMPLEMENTATION-CHECKLIST.md` §Week 10

---

### 10.1 Logging

**Source:** `IMPLEMENTATION-CHECKLIST.md` §Week 10

| Component | Technology | Status |
|-----------|-----------|--------|
| Structured logging | Winston (JSON format) | ✅ Built |
| Log levels | error, warn, info, debug | ✅ Built |
| Request logging | HTTP method, path, status, duration | ✅ Built |
| CloudWatch logs | AWS CloudWatch log groups | ❌ Not configured |

---

### 10.2 Error Tracking

**Source:** `IMPLEMENTATION-CHECKLIST.md`, `API-SURFACE-FINAL-AUDIT.md`

| Component | Technology | Status |
|-----------|-----------|--------|
| Backend error tracking | Sentry (`@sentry/node`) | ✅ Built |
| Frontend error tracking | Sentry (`@sentry/react`) | ✅ Built |
| Error pipeline | All errors → `next(err)` → Sentry → custom error handler | ✅ Built |
| Dashboard error fix | Dashboard errors now use `next(err)` (was bypassing Sentry) | ✅ Fixed |

---

### 10.3 Health Checks

**Source:** `IMPLEMENTATION-CHECKLIST.md`

| Endpoint | Description | Status |
|----------|-------------|--------|
| `GET /api/v1/health` | API health check (public) | ✅ Built |

---

### 10.4 Metrics

**Source:** `MVP-FEATURE-LOCK.md` §17, `MASTER-SYSTEM-BLUEPRINT.md` §10

| Component | Technology | Status |
|-----------|-----------|--------|
| Request metrics (count, duration) | Custom middleware | ✅ Built |
| Prometheus metrics endpoint | `MASTER-SYSTEM-BLUEPRINT.md` §10 | ❌ Removed from MVP (`IMPLEMENTATION-CHECKLIST.md`) |
| Grafana dashboards | Custom dashboards | ❌ Removed from MVP |

---

### 10.5 Missing Monitoring Systems

**Source:** Discovery §6.4, §7.3

| System | Specified In | Status |
|--------|-------------|--------|
| CloudWatch logs | `IMPLEMENTATION-CHECKLIST.md` §Week 15 | ❌ Not configured |
| Automated alerts (critical errors) | `IMPLEMENTATION-CHECKLIST.md` §Week 15 | ❌ Not configured |
| Failed job monitoring | `MASTER-SYSTEM-BLUEPRINT.md` §7.5.5 | ❌ Not wired (no workers) |
| Email deliverability monitoring | `MASTER-SYSTEM-BLUEPRINT.md` §7.4 | ⚠️ Partial (email_events table exists, Resend webhook handler built) |
| Backup monitoring | `IMPLEMENTATION-CHECKLIST.md` §Week 15 | ❌ Not configured |
| Uptime monitoring | External uptime checker | ❌ Not configured |
| Performance monitoring (APM) | `MASTER-SYSTEM-BLUEPRINT.md` §10 | ❌ Not built |

---

## 11. GAP → IMPLEMENTATION MAP

**Source:** Discovery §5.1–5.5, §7.3 — all gap sections

This section maps every documented gap to its source and the required implementation work.

---

### CRITICAL GAPS (Block Production Deployment)

| Gap | Source | Required Implementation |
|-----|--------|------------------------|
| No cloud infrastructure | Discovery §7.3 #1, `MASTER-SYSTEM-BLUEPRINT.md` §4.1 | Deploy API + Web + Worker to AWS ECS Fargate; provision RDS, ElastiCache, ALB, CloudFront via Terraform |
| No background job workers | Discovery §7.3 #2, `MASTER-SYSTEM-BLUEPRINT.md` §7.1 | Build `apps/worker/` service with email-worker, pdf-worker, webhook-worker, reminders-worker using BullMQ |
| No Redis / BullMQ | Discovery §7.3 #3, `MASTER-SYSTEM-BLUEPRINT.md` §2.2 | Deploy AWS ElastiCache Redis; wire BullMQ in API (enqueue) and worker (consume) |
| No automated backups | Discovery §7.3 #4, `IMPLEMENTATION-CHECKLIST.md` §Week 15 | Configure RDS automated backups (daily, 7-day retention minimum) |
| No virus scanning | Discovery §7.3 #5, `MVP-FEATURE-LOCK.md` §15 | Add ClamAV container to ECS; scan files on upload before S3 write (Phase 3) |
| RLS migration not applied to production | Discovery §7.3 #6, `MASTER-SYSTEM-BLUEPRINT.md` §6.1 | Apply migration `20260320200000_row_level_security` to production RDS; verify tenant isolation |

---

### HIGH GAPS (Required for Paying Customers)

| Gap | Source | Required Implementation |
|-----|--------|------------------------|
| No task/invoice reminder emails | Discovery §7.3 #7, `IMPLEMENTATION-CHECKLIST.md` §Post-Launch | Build reminders-worker in `apps/worker/`; daily cron checks overdue tasks and invoices; sends email via Resend |
| No activity feed | Discovery §7.3 #8, §5.5, `MASTER-SYSTEM-BLUEPRINT.md` §5.2 | Build ActivityService that writes to `activity_events` on all key actions; build `GET /activity` and `GET /clients/:id/activity` endpoints; build `/activity` UI page |
| No onboarding flow | Discovery §7.3 #9, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Build 4-step onboarding wizard; `GET/PATCH /onboarding` endpoints; `/onboarding` UI page |
| No document versioning | Discovery §7.3 #10, §5.5 | Implement versioning in DocumentsService: re-upload creates new `document_versions` record; update `documents.current_version`; expose version history in UI |
| No storage usage trigger | Discovery §7.3 #11, `MASTER-SYSTEM-BLUEPRINT.md` §5.1.3 | Create PostgreSQL trigger `document_storage_tracking` on documents INSERT/DELETE; auto-updates `storage_usage` table |
| No plan upgrade/downgrade | Discovery §7.3 #12, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Implement Stripe subscription update with proration; `PATCH /subscriptions/:id` with plan change; handle `customer.subscription.updated` webhook |
| No trial periods | Discovery §7.3 #13, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Implement trial logic in subscription creation; handle `trialing` status; send trial-end notification email |

---

### MEDIUM GAPS (Required for Growth)

| Gap | Source | Required Implementation |
|-----|--------|------------------------|
| No QuickBooks / Xero integration | Discovery §5.3, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Build integrations module; OAuth flow for QBO/Xero; sync invoices and payments bidirectionally (Phase 3–4) |
| No e-signature | Discovery §5.1, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Integrate DocuSign or similar; `POST /documents/:id/sign` endpoint; signing flow in portal (Phase 4) |
| No time tracking | Discovery §5.1, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Build time entries module; `GET/POST /time-entries`; billable hours → invoice conversion (Phase 3) |
| No client messaging | Discovery §5.1, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Build secure chat per client account; portal messaging UI; internal @mentions (Phase 3–4) |
| No advanced reporting | Discovery §5.1, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Build reports module; `GET/POST /reports`; financial and pipeline reports (Phase 3) |
| No mobile apps | Discovery §5.1, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Build React Native client app and firm app (Phase 4) |
| No white-labeling | Discovery §5.2, `PHASE-WISE-EXECUTION-PLAN.md` §4 | Custom domain routing; per-firm logo/colors in portal; DNS routing infrastructure (Phase 4) |
| No task comments API | Discovery §5.5 | Build `GET/POST /tasks/:id/comments` endpoints; wire to `task_comments` table |
| No client addresses API | Discovery §5.5 | Build `GET/POST /clients/:id/addresses` endpoints; wire to `client_addresses` table |
| No client tags | Discovery §2.2, §3.1 | Build tags service; `GET/POST /tags`, `POST/DELETE /clients/:id/tags` endpoints; tag UI |
| No feature flags service | Discovery §5.5 | Build FeatureFlagsService reading `feature_flags` and `firm_feature_flags`; `GET/PATCH /feature-flags` endpoints |

---

### INFRASTRUCTURE GAPS (Required Before Any Real Traffic)

| Gap | Source | Required Implementation |
|-----|--------|------------------------|
| No CDN | Discovery §5.4, `MASTER-SYSTEM-BLUEPRINT.md` §4.1 | Configure CloudFront distribution in front of S3 and ALB |
| No connection pooling | Discovery §5.4, `MASTER-SYSTEM-BLUEPRINT.md` §9.2 | Deploy PgBouncer between API and RDS; configure transaction pool mode |
| No monitoring / alerting | Discovery §7.3 #23, `IMPLEMENTATION-CHECKLIST.md` §Week 15 | Configure CloudWatch log groups; set up alerts for error rate, latency, queue depth |
| No deploy pipeline | Discovery §5.4 | Build `deploy-staging.yml` and `deploy-production.yml` GitHub Actions workflows |
| No Terraform | Discovery §5.4, `MASTER-SYSTEM-BLUEPRINT.md` §2.2 | Write Terraform modules for ECS, RDS, ElastiCache, S3, ALB, CloudFront, Route53 |
| No Dockerfiles | Discovery §4.2 | Write Dockerfiles for `apps/api`, `apps/web`, `apps/worker` |
| No docker-compose.prod.yml | `MASTER-SYSTEM-BLUEPRINT.md` §3.1 | Write production Docker Compose with api, worker, postgres, redis services |

---

### DATABASE GAPS (Require Migration or Service Work)

| Gap | Source | Required Implementation |
|-----|--------|------------------------|
| Storage trigger not created | Discovery §5.5, `MASTER-SYSTEM-BLUEPRINT.md` §5.1.3 | Write and apply migration creating `document_storage_tracking` trigger |
| activity_events not populated | Discovery §5.5 | Add `ActivityService.log()` calls in all key service methods |
| feature_flags not read | Discovery §5.5 | Build FeatureFlagsService; check flags before feature execution |
| failed_jobs not written | Discovery §5.5 | Wire worker `on('failed')` handlers to write to `failed_jobs` table |
| document_versions not used | Discovery §5.5 | Implement versioning logic in DocumentsService |
| task_comments no API | Discovery §5.5 | Build task comments controller, service, repository |
| client_addresses no API | Discovery §5.5 | Build client addresses controller, service, repository |

---

## 12. PRODUCTION READINESS

**Source:** Discovery §7.3, §7.4 — `PHASE-WISE-EXECUTION-PLAN-PART2.md` §10, §12

---

### 12.1 Is the System Production Ready?

**Answer: No. The system is demo-ready and beta-ready. It is not production-ready for serving real paying customers at scale.**

**Source:** Discovery §7.4

The system is a fully functional local development system. It covers the core workflow end-to-end and has 0 TypeScript errors, 120 passing web tests, 36 passing API tests, and a CI pipeline. However, it cannot serve real users because:

1. It runs on a local machine only — no cloud infrastructure exists
2. No TLS, no load balancer, no domain routing
3. No background job workers — reminders, retries, and async operations do not run
4. No Redis/BullMQ — all operations are synchronous; will timeout under load
5. No automated database backups — data loss risk
6. RLS migration created but never applied to a production database
7. No virus scanning on file uploads

---

### 12.2 What MUST Be Completed Before Launch

**Source:** Discovery §7.3 (CRITICAL and HIGH sections), `PHASE-WISE-EXECUTION-PLAN-PART2.md` §13

These items block any real customer from using the system:

**Infrastructure (all blocking):**
- [ ] Provision AWS RDS (PostgreSQL 15+) with automated backups
- [ ] Provision AWS ElastiCache (Redis 7+)
- [ ] Provision AWS S3 bucket (private, with lifecycle policies)
- [ ] Deploy API container to ECS Fargate
- [ ] Deploy Web container to ECS Fargate
- [ ] Configure ALB with TLS termination (HTTPS)
- [ ] Configure CloudFront CDN
- [ ] Set `STORAGE_PROVIDER=s3` with AWS credentials in production env
- [ ] Apply RLS migration to production database
- [ ] Configure DNS (domain → ALB)

**Worker Service (blocking for async operations):**
- [ ] Build `apps/worker/` service with BullMQ
- [ ] Implement email-worker (transactional emails via queue)
- [ ] Implement reminders-worker (daily task/invoice overdue checks)
- [ ] Implement webhook-worker (Stripe webhook processing via queue)
- [ ] Deploy worker container to ECS Fargate

**Security (blocking for compliance):**
- [ ] Apply RLS policies to production database
- [ ] Configure Stripe webhook URL in Stripe dashboard
- [ ] Configure Resend webhook URL for email event tracking
- [ ] Set all production environment variables (STRIPE_SECRET_KEY, RESEND_API_KEY, SENTRY_DSN, JWT_SECRET, DATABASE_URL, REDIS_URL)

**Monitoring (blocking for incident response):**
- [ ] Configure CloudWatch log groups
- [ ] Set up error rate alerts
- [ ] Configure Sentry DSN for production
- [ ] Set up uptime monitoring

---

### 12.3 What Is Post-Launch Acceptable

**Source:** Discovery §7.3 (MEDIUM section), `PHASE-WISE-EXECUTION-PLAN.md` §4

These items are important but do not block initial launch with controlled beta users:

**Post-Launch Phase 2 (Month 5–6):**
- Activity feed (table exists, service not wired)
- Onboarding wizard
- Task/invoice reminder emails (once worker service is built)
- Client tags
- Plan upgrade/downgrade with proration
- Trial periods
- Storage usage trigger
- Document versioning
- Task comments API
- Client addresses API
- Feature flags service

**Post-Launch Phase 3 (Month 7–9):**
- Advanced reporting and analytics
- Time tracking
- Integrations (QuickBooks, Xero, Zapier)
- Virus scanning (ClamAV)
- Meilisearch migration (at 100k+ records)
- Public API with API key authentication
- Outbound webhooks
- Prometheus metrics

**Post-Launch Phase 4 (Month 10–12):**
- E-signature
- Workflow automation engine
- Client messaging (chat)
- White-labeling
- Document preview in browser
- Kanban board
- Mobile apps (iOS/Android)
- Custom fields

**Post-Launch Phase 5 (Year 2):**
- SSO (SAML/OIDC)
- Multi-firm support
- AI automation
- SOC 2 certification
- Data residency
- Marketplace

---

### 12.4 Current System Capabilities (What Was Shipped)

**Source:** Discovery §7.4

The MVP pushed to GitHub (`https://github.com/taxmicllp-ship-it/taxmic.git`) represents:

| Dimension | Count / Status |
|-----------|---------------|
| API endpoints | 68 (all verified via curl) |
| Frontend pages | 37 (all routed and rendering) |
| Database tables | 36 (full schema, all migrations applied locally) |
| Web tests | 120 passing |
| API tests | 36 passing |
| TypeScript errors | 0 |
| CI pipeline | GitHub Actions (lint + test on push) |
| Core workflow | register → clients → documents → tasks → invoices → payments → portal → SaaS billing |

**Verdict:** Solid, well-structured foundation. Demo-ready. Beta-ready for a small number of controlled users with manual oversight. Not production-ready for serving real paying customers at scale without the infrastructure work documented in §12.2.

---

## DOCUMENT SUMMARY

**Source:** All sections traceable to `docs/PRODUCTION-DISCOVERY-REPORT.md` and the 14 source documents it references.

| Dimension | Full System | MVP Built | Gap |
|-----------|-------------|-----------|-----|
| Modules | 14 | 9 | 5 modules entirely absent |
| Features | ~150 | ~55 | ~95 deferred |
| API Endpoints | ~92 | 68 | ~24 deferred |
| UI Pages | ~44 | 37 | ~7 deferred |
| Database Tables | 36 | 36 (schema) | 14 tables unused |
| Infrastructure | Full AWS stack | Local dev only | Entire cloud layer missing |
| Integrations | 10+ | 2 (Stripe, Resend) | 8+ deferred |
| Background Jobs | 4 worker types | 0 async workers | Worker service not built |
| Security (full) | SOC 2, 2FA, ClamAV, RLS | RLS migration + basic | ~60% of full security model |

---

*Document generated from: `docs/PRODUCTION-DISCOVERY-REPORT.md` and all documents referenced therein: `docs/01-product/main-doc.md`, `docs/01-product/mvp-doc.md`, `docs/01-product/BRUTAL-MVP.md`, `docs/01-product/MVP-FEATURE-LOCK.md`, `docs/02-architecture/MASTER-SYSTEM-BLUEPRINT.md`, `docs/03-database/DATABASE-ARCHITECTURE-MASTER.md`, `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md`, `docs/04-development/PHASE-WISE-EXECUTION-PLAN-PART2.md`, `docs/04-development/IMPLEMENTATION-CHECKLIST.md`, `docs/04-development/BACKEND-DEVELOPMENT-ORDER.md`, `docs/audits/API-SURFACE-FINAL-AUDIT.md`, `packages/database/prisma/schema.prisma`*
