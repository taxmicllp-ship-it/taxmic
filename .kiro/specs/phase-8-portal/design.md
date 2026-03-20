# Phase 8 — Client Portal Design

## Backend Architecture

### Folder Structure

```
apps/api/src/modules/portal/
├── index.ts                  ← exports portalRouter as default
├── portal.types.ts
├── portal.validation.ts
├── portal.repository.ts      ← client_users CRUD + folder resolution
├── portal.service.ts         ← orchestrates auth + delegates to existing services
├── portal.controller.ts
└── portal.routes.ts
```

New middleware:
```
apps/api/src/shared/middleware/authenticate-portal.ts
```

No new files in any existing module.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/portal/auth/login` | none (rate-limited) | Portal login — returns portal JWT |
| POST | `/api/v1/portal/auth/create-account` | staff JWT (`authenticate`) | Staff creates a portal account for a client |
| GET | `/api/v1/portal/dashboard` | portal JWT | Summary counts for the portal user's client |
| GET | `/api/v1/portal/documents` | portal JWT | List documents for the portal user's client |
| POST | `/api/v1/portal/documents/upload` | portal JWT | Upload a document (auto-folder, 50MB max) |
| GET | `/api/v1/portal/documents/:id/download` | portal JWT | Get download URL for a document |
| GET | `/api/v1/portal/invoices` | portal JWT | List invoices for the portal user's client |
| POST | `/api/v1/portal/invoices/:id/pay` | portal JWT | Create Stripe Checkout session |
| GET | `/api/v1/portal/tasks` | portal JWT | List tasks for the portal user's client |

---

## Request / Response Shapes

### POST /portal/auth/login

```json
// Request
{ "firmSlug": "acme-accounting", "email": "client@example.com", "password": "secret" }

// Response 200
{
  "token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "client@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "clientId": "uuid",
    "firmId": "uuid"
  }
}
```

### POST /portal/auth/create-account

```json
// Request (staff JWT required)
{
  "clientId": "uuid",
  "email": "client@example.com",
  "password": "temporaryPassword123",
  "firstName": "Jane",
  "lastName": "Doe"
}

// Response 201
{
  "id": "uuid",
  "client_id": "uuid",
  "email": "client@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "is_active": true,
  "created_at": "..."
}
```

### GET /portal/dashboard

```json
// Response 200
{
  "document_count": 12,
  "invoice_count": 3,
  "outstanding_invoice_count": 1,
  "task_count": 5
}
```

### GET /portal/documents

```json
// Response 200
[
  {
    "id": "uuid",
    "filename": "tax-return-2025.pdf",
    "mime_type": "application/pdf",
    "size_bytes": "204800",
    "created_at": "2026-03-17T10:00:00Z"
  }
]
```

### GET /portal/documents/:id/download

```json
// Response 200
{
  "url": "/uploads/firmId/clientId/folderId/uuid_filename.pdf",
  "filename": "tax-return-2025.pdf",
  "mime_type": "application/pdf"
}
```

### POST /portal/documents/upload

```
Content-Type: multipart/form-data
Field: file (binary)
```

```json
// Response 201
{
  "id": "uuid",
  "filename": "receipt.pdf",
  "size_bytes": "10240",
  "created_at": "..."
}
```

### GET /portal/invoices

```json
// Response 200
[
  {
    "id": "uuid",
    "number": 42,
    "status": "sent",
    "total_amount": "850.00",
    "due_date": "2026-04-17",
    "paid_at": null
  }
]
```

### POST /portal/invoices/:id/pay

```json
// Response 200
{ "url": "https://checkout.stripe.com/pay/cs_test_..." }
```

### GET /portal/tasks

```json
// Response 200
[
  {
    "id": "uuid",
    "title": "Sign engagement letter",
    "status": "new",
    "priority": "high",
    "due_date": "2026-04-01"
  }
]
```

---

## Portal JWT Payload

```typescript
interface PortalJwtPayload {
  clientUserId: string;
  clientId: string;
  firmId: string;
  email: string;
  type: 'portal';
  iat: number;
  exp: number;
}
```

Signed with the same `JWT_SECRET` and `JWT_EXPIRES_IN` as staff tokens. The `type: 'portal'` field is the discriminator.

---

## `authenticatePortal` Middleware

```typescript
// apps/api/src/shared/middleware/authenticate-portal.ts
export function authenticatePortal(req, res, next) {
  // 1. Extract Bearer token
  // 2. Verify with jwtStrategy.verify(token) — reuses existing verify()
  // 3. Cast payload to PortalJwtPayload
  // 4. Reject if payload.type !== 'portal'  → 401
  // 5. Set req.portalUser = { clientUserId, clientId, firmId, email }
  // 6. next()
}
```

`req.portalUser` is typed via Express namespace augmentation in `portal.types.ts`.

The existing `jwtStrategy.verify()` is reused — no new signing logic needed. The `type` field in the payload is the only addition.

---

## Layer Responsibilities

### portal.repository.ts

Owns all `client_users` and folder-resolution queries:

- `findClientUserByEmailAndFirmSlug(email, firmSlug)` — joins `client_users → clients → firms` to resolve login
- `createClientUser(data)` — insert new `client_users` record
- `updateLastLogin(clientUserId)` — set `last_login_at = now()`
- `findOrCreatePortalFolder(firmId, clientId)` — find folder named `"Portal Uploads"` for `(firmId, clientId)`; create it if absent; return folder id
- `getDashboardCounts(firmId, clientId)` — four `prisma.X.count()` calls for documents, invoices, outstanding invoices, tasks

### portal.service.ts

Orchestrates auth and delegates data access to existing services:

- `login(dto)` — lookup via repository, bcrypt compare, update last_login_at, sign portal JWT, return response. Log `PORTAL_LOGIN_SUCCESS` or `PORTAL_LOGIN_FAILURE`.
- `createAccount(firmId, dto)` — verify `clientId` belongs to `firmId`, hash password, call repository.createClientUser. Log `PORTAL_ACCOUNT_CREATED`.
- `getDashboard(firmId, clientId)` — call repository.getDashboardCounts
- `listDocuments(firmId, clientId)` → `documentsService.listDocuments(firmId, clientId)`
- `downloadDocument(firmId, clientId, documentId)` → verify ownership (document.client_id === clientId), then `documentsService.getDownloadUrl(firmId, documentId)`
- `uploadDocument(firmId, clientId, file)` → resolve folder via `repository.findOrCreatePortalFolder`, then `documentsService.uploadDocument(..., uploadedBy: null)`. Log `PORTAL_DOCUMENT_UPLOAD`.
- `listInvoices(firmId, clientId)` → `invoicesService.listClientInvoices(firmId, clientId)`
- `payInvoice(firmId, clientId, invoiceId, successUrl, cancelUrl)` → verify invoice ownership, then `paymentsService.createCheckoutSession(...)`. Log `PORTAL_INVOICE_PAYMENT_STARTED`.
- `listTasks(firmId, clientId)` → `tasksService.listClientTasks(firmId, clientId)`

### portal.controller.ts

- Extracts `req.portalUser` (portal routes) or `req.user` (create-account route).
- Calls `portalService` methods.
- Returns correct HTTP status codes.
- No business logic.

### portal.routes.ts

```
POST /portal/auth/login               → portalLoginRateLimiter (5/min) → validate → login
POST /portal/auth/create-account      → authenticate (staff JWT) → validate → createAccount
GET  /portal/dashboard                → authenticatePortal → getDashboard
GET  /portal/documents                → authenticatePortal → listDocuments
POST /portal/documents/upload         → authenticatePortal → multer (50MB, MIME filter) → uploadDocument
GET  /portal/documents/:id/download   → authenticatePortal → downloadDocument
GET  /portal/invoices                 → authenticatePortal → listInvoices
POST /portal/invoices/:id/pay         → authenticatePortal → payInvoice
GET  /portal/tasks                    → authenticatePortal → listTasks
```

Rate limiter configuration:
```typescript
const portalLoginRateLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a minute.' },
});
```

Multer configuration for portal upload:
```typescript
const portalUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf', 'image/jpeg', 'image/png', 'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});
```

### index.ts

```typescript
export { default } from './portal.routes';
```

---

## app.ts Change (only change to existing files)

```typescript
import portalRouter from './modules/portal/index';
// ...
app.use('/api/v1/portal', portalRouter);
```

Mounted before the error handler, after all other routers.

---

## Document Upload — Auto-Folder Logic

```
POST /portal/documents/upload
  → authenticatePortal sets req.portalUser = { firmId, clientId, ... }
  → portalService.uploadDocument(firmId, clientId, file)
      → portalRepository.findOrCreatePortalFolder(firmId, clientId)
          → prisma.folders.findFirst({ where: { firm_id, client_id, name: 'Portal Uploads', deleted_at: null } })
          → if null: prisma.folders.create({ firm_id, client_id, name: 'Portal Uploads' })
          → return folder.id
      → documentsService.uploadDocument({ firmId, clientId, folderId, filename, mimeType, buffer, uploadedBy: null })
```

`uploadedBy: null` is valid — `documents.uploaded_by` is nullable in the schema.

---

## Invoice Pay — Ownership Verification

```
POST /portal/invoices/:id/pay
  → req.portalUser = { firmId, clientId }
  → portalService.payInvoice(firmId, clientId, invoiceId, successUrl, cancelUrl)
      → invoicesRepository.findById(firmId, invoiceId)   ← firm_id scoped
      → if !invoice → 404
      → if invoice.client_id !== clientId → 404          ← client isolation
      → if invoice.status !== 'sent' → 422
      → paymentsService.createCheckoutSession(firmId, invoiceId, successUrl, cancelUrl)
```

The `firmId` scope on `invoicesRepository.findById` prevents cross-firm access. The explicit `client_id` check prevents cross-client access within the same firm.

---

## Frontend Architecture

### Layout

```
apps/web/src/components/layout/PortalLayout.tsx
```

`PortalLayout` is a new, isolated layout component. It renders:
- A top header bar with the Taxmic logo and the portal user's name
- A simple horizontal nav: Documents | Invoices | Tasks
- A Logout button (clears portal token from localStorage, redirects to `/portal/login`)
- A `<Outlet />` for page content

It does NOT use `DashboardLayout`, `AppLayout`, or any `ui_theme_ref/layout/` component. It is self-contained, consistent with `AuthPageLayout` which is also a standalone layout.

### Portal Auth Context

```
apps/web/src/features/portal/context/PortalAuthContext.tsx
```

Separate from the staff `AuthContext`. Stores portal token and user in localStorage under keys `portal_token` and `portal_user`. Provides `usePortalAuth()` hook.

### Folder Structure

```
apps/web/src/features/portal/
├── context/
│   └── PortalAuthContext.tsx
├── api/
│   └── portal-api.ts           ← all portal API calls (axios, uses portal token)
├── hooks/
│   ├── usePortalDocuments.ts
│   ├── usePortalInvoices.ts
│   └── usePortalTasks.ts
└── types.ts

apps/web/src/pages/portal/
├── login.tsx                   → /portal/login
├── dashboard.tsx               → /portal/dashboard
├── documents.tsx               → /portal/documents
├── invoices.tsx                → /portal/invoices
├── tasks.tsx                   → /portal/tasks
└── payment-success.tsx         → /portal/payment-success
```

### Route Registration (App.tsx additions)

```tsx
import PortalLayout from './components/layout/PortalLayout';
import PortalLoginPage from './pages/portal/login';
import PortalDashboardPage from './pages/portal/dashboard';
import PortalDocumentsPage from './pages/portal/documents';
import PortalInvoicesPage from './pages/portal/invoices';
import PortalTasksPage from './pages/portal/tasks';
import PortalPaymentSuccessPage from './pages/portal/payment-success';

// Portal login — no layout
<Route path="/portal/login" element={<PortalLoginPage />} />

// Portal authenticated pages — PortalLayout
<Route element={<PortalLayout />}>
  <Route path="/portal/dashboard" element={<PortalDashboardPage />} />
  <Route path="/portal/documents" element={<PortalDocumentsPage />} />
  <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
  <Route path="/portal/tasks" element={<PortalTasksPage />} />
</Route>

// Portal payment success — no layout
<Route path="/portal/payment-success" element={<PortalPaymentSuccessPage />} />
```

### portal-api.ts

Uses a separate axios instance that reads the portal token from localStorage (`portal_token`), not the staff token. Base URL is the same `/api/v1/portal`.

### PortalLayout — Auth Guard

`PortalLayout` checks for `portal_token` in localStorage on mount. If absent, redirects to `/portal/login`. This mirrors how `DashboardLayout` guards staff routes.

---

## Data Flow (Portal)

```
Portal user action
  → React portal page
  → hook (useQuery / useMutation)
  → portal-api.ts (axios with portal token)
  → GET/POST /api/v1/portal/...
  → portal.routes.ts
  → authenticatePortal middleware
  → portal.controller.ts
  → portal.service.ts
  → existing service (documentsService / invoicesService / tasksService)
  → existing repository
  → Prisma → PostgreSQL
```

---

## Tenant + Client Isolation Guarantee

| Layer | Enforcement |
|---|---|
| JWT | `clientId` and `firmId` embedded in signed token — cannot be forged |
| `authenticatePortal` | Rejects non-portal tokens; sets `req.portalUser` |
| `portal.service.ts` | Passes `firmId` and `clientId` from `req.portalUser` — never from request body |
| Existing services | Already filter by `firmId`; portal adds `clientId` filter |
| Invoice pay | Explicit `invoice.client_id === clientId` check before Stripe session |
| Document download | Explicit `document.client_id === clientId` check before returning URL |

Cross-client access is structurally impossible. `clientId` never comes from user input.

---

## Audit Logging

All portal events are logged via `logger.info` with structured fields:

| Event | Fields |
|---|---|
| `PORTAL_LOGIN_SUCCESS` | `clientUserId`, `clientId`, `firmId` |
| `PORTAL_LOGIN_FAILURE` | `email`, `firmSlug` (no password, no credential detail) |
| `PORTAL_ACCOUNT_CREATED` | `clientUserId`, `clientId`, `firmId`, `createdByUserId` |
| `PORTAL_DOCUMENT_UPLOAD` | `clientUserId`, `clientId`, `firmId`, `documentId`, `filename` |
| `PORTAL_INVOICE_PAYMENT_STARTED` | `clientUserId`, `clientId`, `firmId`, `invoiceId` |

Login failures log `email` and `firmSlug` only — never the attempted password, and never a hint about whether the email exists.

---

## Express Type Augmentation

```typescript
// portal.types.ts — added to Express namespace
declare global {
  namespace Express {
    interface Request {
      portalUser?: {
        clientUserId: string;
        clientId: string;
        firmId: string;
        email: string;
      };
    }
  }
}
```
