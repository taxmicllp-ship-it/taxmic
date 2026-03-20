# Phase 8 — Client Portal Requirements

## Overview

Phase 8 introduces the Client Portal — a separate, isolated authentication surface that allows clients of an accounting firm to log in and access their own documents, invoices, tasks, and make payments.

The portal reuses existing service-layer logic from Phases 1–5. It does not modify any existing module. It introduces one new backend module (`portal`), one new middleware (`authenticatePortal`), one new frontend layout (`PortalLayout`), and five new frontend pages.

**Confirmed design decisions (pre-spec review):**
- `PortalLayout` is a new component — not `AppLayout`, not `DashboardLayout`
- Portal account creation is staff-initiated only — no public self-registration
- Document upload auto-creates a "Portal Uploads" folder per client on first upload
- Portal JWT uses a separate payload shape (`clientUserId`, `clientId`, `firmId`)
- Stateless JWT only — `portal_sessions` table is not used

---

## Functional Requirements

### FR-1: Portal Login

- `POST /api/v1/portal/auth/login` accepts `email` and `password`.
- The request must also include `firmSlug` to scope the lookup to the correct firm.
- Lookup: find `client_users` record where `email` matches AND `client.firm_id` matches the firm resolved from `firmSlug`.
- Verify password against `client_users.password_hash` using bcrypt.
- On success: return a signed JWT with payload `{ clientUserId, clientId, firmId, email, type: 'portal' }`.
- On failure: return `401 Invalid credentials` — do not reveal whether email or password was wrong.
- Inactive accounts (`is_active = false`) must be rejected with `401`.
- Soft-deleted accounts (`deleted_at IS NOT NULL`) must be rejected with `401`.
- On successful login: update `client_users.last_login_at`.

### FR-2: Staff-Initiated Portal Account Creation

- `POST /api/v1/portal/auth/create-account` is a staff-only endpoint (requires standard staff JWT via `authenticate` middleware).
- Staff provides: `clientId`, `email`, `password`, `firstName`, `lastName`.
- `clientId` must belong to the authenticated staff member's firm (`firm_id` check).
- Email must be unique within the client (`@@unique([client_id, email])` — enforced by schema).
- Password is hashed with bcrypt (12 rounds) before storage.
- Returns the created `client_users` record (without `password_hash`).
- A client can have multiple portal accounts (e.g. multiple contacts at the same client).

### FR-3: Portal Documents — List

- `GET /api/v1/portal/documents` — requires portal JWT.
- Returns all documents where `firm_id = req.portalUser.firmId` AND `client_id = req.portalUser.clientId`.
- Delegates to `documentsService.listDocuments(firmId, clientId)`.
- Soft-deleted documents are excluded.

### FR-3b: Portal Documents — Download

- `GET /api/v1/portal/documents/:id/download` — requires portal JWT.
- Verify the document belongs to `req.portalUser.clientId` AND `req.portalUser.firmId` — return `404` if not.
- Delegates to `documentsService.getDownloadUrl(firmId, documentId)`.
- Returns `{ url, filename, mime_type }` — the signed/local download URL.
- This is in scope for Phase 8. Clients must be able to download documents shared with them.

### FR-4: Portal Documents — Upload

- `POST /api/v1/portal/documents/upload` — requires portal JWT, multipart form data.
- Portal user uploads a file. No `folderId` is provided by the client.
- Before upload: check if a folder named `"Portal Uploads"` exists for this `(firmId, clientId)`. If not, create it.
- Delegates to `documentsService.uploadDocument(...)` with the resolved `folderId`.
- The `uploadedBy` field is set to `null` (portal users are not staff users — no `users.id`).
- Returns the created document record.

### FR-5: Portal Invoices — List

- `GET /api/v1/portal/invoices` — requires portal JWT.
- Returns all invoices where `firm_id = req.portalUser.firmId` AND `client_id = req.portalUser.clientId`.
- Delegates to `invoicesService.listClientInvoices(firmId, clientId)`.
- Excludes soft-deleted invoices.

### FR-6: Portal Invoices — Pay

- `POST /api/v1/portal/invoices/:id/pay` — requires portal JWT.
- Before creating a Stripe session: verify the invoice belongs to `req.portalUser.clientId` AND `req.portalUser.firmId`. Return `404` if not found or not owned.
- Invoice must be in `sent` status. Return `422` if not.
- Delegates to `paymentsService.createCheckoutSession(firmId, invoiceId, successUrl, cancelUrl)`.
- `successUrl` redirects to `/portal/payment-success?invoice_id={invoiceId}`.
- `cancelUrl` redirects to `/portal/invoices`.
- Returns `{ url: string }`.

### FR-7: Portal Tasks — List

- `GET /api/v1/portal/tasks` — requires portal JWT.
- Returns all tasks where `firm_id = req.portalUser.firmId` AND `client_id = req.portalUser.clientId`.
- Delegates to `tasksService.listClientTasks(firmId, clientId)`.
- Excludes soft-deleted tasks.

### FR-8: Portal Dashboard Summary

- `GET /api/v1/portal/dashboard` — requires portal JWT.
- Returns a summary object:
  ```json
  {
    "document_count": 12,
    "invoice_count": 3,
    "outstanding_invoice_count": 1,
    "task_count": 5
  }
  ```
- All counts are scoped to `(firmId, clientId)`.
- Implemented in `portalService` using direct Prisma count queries (not delegating to other services for counts — avoids N+1).

---

## Non-Functional Requirements

### NFR-1: Portal JWT is Separate from Staff JWT

- Portal tokens carry `type: 'portal'` in the payload.
- The `authenticatePortal` middleware rejects tokens that do not have `type: 'portal'`.
- Staff tokens (`type` absent or not `'portal'`) are rejected by `authenticatePortal`.
- Portal tokens are rejected by the existing `authenticate` middleware (it does not check `type`, but portal tokens carry `clientUserId` not `userId` — staff routes will fail authorization naturally).

### NFR-2: Strict Client Isolation

- Every portal endpoint filters by both `firmId` AND `clientId` from the JWT.
- No portal endpoint accepts `clientId` from the request body or query string.
- Cross-client access is structurally impossible — the `clientId` comes only from the verified JWT.

### NFR-3: No Modification of Existing Modules

- The portal module calls existing services (`documentsService`, `invoicesService`, `tasksService`, `paymentsService`) via their exported instances.
- No existing service, repository, controller, or route file is modified.
- The only change to existing files is adding the portal router mount in `app.ts`.

### NFR-4: Portal Login Rate Limiting

- `POST /api/v1/portal/auth/login` is rate-limited to 5 requests per minute per IP using `express-rate-limit`.
- Exceeding the limit returns `429 Too Many Requests`.
- The rate limiter is applied only to the portal login route — not to all portal routes.
- `express-rate-limit` is already installed in `apps/api/package.json`.

### NFR-5: File Upload Validation

- `POST /api/v1/portal/documents/upload` enforces:
  - Max file size: 50 MB
  - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/gif`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Files that exceed size or have disallowed MIME types are rejected with `400 Bad Request` before reaching the service layer.
- Validation is applied in the multer configuration in `portal.routes.ts`.

### NFR-6: Portal Audit Logging

The following events must be logged via `logger.info`:
- `PORTAL_LOGIN_SUCCESS` — `{ clientUserId, clientId, firmId }`
- `PORTAL_LOGIN_FAILURE` — `{ email, firmSlug }` (no password, no credential detail)
- `PORTAL_ACCOUNT_CREATED` — `{ clientUserId, clientId, firmId, createdByUserId }`
- `PORTAL_DOCUMENT_UPLOAD` — `{ clientUserId, clientId, firmId, documentId, filename }`
- `PORTAL_INVOICE_PAYMENT_STARTED` — `{ clientUserId, clientId, firmId, invoiceId }`

### NFR-7: No `portal_sessions` Table Usage

- The `portal_sessions` table exists in the schema but is not used in Phase 8.
- Authentication is stateless JWT only, consistent with Phase 1 staff auth.

### NFR-8: `PortalLayout` is Isolated from Staff Layout

- Portal pages use `PortalLayout` — a new component in `apps/web/src/components/layout/`.
- `PortalLayout` renders a minimal nav: Documents, Invoices, Tasks, and a Logout button.
- `DashboardLayout` (staff layout) is not used for any portal page.
- `AppLayout` from `ui_theme_ref/` is not used (per `layout-governance.md`).

### NFR-9: No Regressions

- All Phase 1–7 functionality must continue to work without modification.
- The portal module is purely additive.

---

## Out of Scope (Phase 8)

- Portal account self-registration (public-facing)
- Portal password reset flow
- Portal notifications
- Portal task creation or updates (read-only)
- Portal invoice creation
- Email delivery of portal credentials (manual handoff for beta)
- `portal_sessions` table usage
