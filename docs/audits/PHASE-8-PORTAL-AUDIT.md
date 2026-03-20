# Phase 8 — Client Portal Audit Report

**Date:** 2026-03-17
**Auditor:** Kiro
**Spec:** `.kiro/specs/phase-8-portal/`
**Scope:** Full implementation audit against requirements.md and design.md

---

## Audit Verdict: PASS WITH FINDINGS

The Phase 8 Client Portal implementation is functionally correct and production-safe. All security-critical requirements are met. Four findings are documented below — two medium, two low. None block deployment.

---

## Findings

### FINDING-1 — Medium: `uploadedBy: null` stored in documents table and passed to notification

**File:** `apps/api/src/modules/portal/portal.service.ts` — `uploadDocument()`

**Observed:**
```typescript
const doc = await documentsService.uploadDocument({
  ...
  uploadedBy: null as any,
});
```

`documentsService.uploadDocument()` accepts `uploadedBy: string` (non-nullable in its type signature). The `null as any` cast bypasses TypeScript. This results in:
1. `documents.uploaded_by` stored as `null` in the database for all portal uploads.
2. `notificationsService.createNotification()` called with `user_id: null` — the notification silently fails (caught by try/catch in `documentsService`), but the failure is logged as a warning on every portal upload.

**Spec reference:** FR-4 states `uploadedBy` is set to `null` (portal users are not staff users). The design doc confirms `uploadedBy: null` is valid because `documents.uploaded_by` is nullable in the schema. The `null as any` cast is therefore a type-safety workaround for a legitimate design decision, not a logic error.

**Impact:** The document record is created correctly. The notification silently fails on every portal upload, generating a `NOTIFICATION_CREATE_FAILED` warning log. No data loss, no crash.

**Recommendation:** In `documentsService.uploadDocument()`, skip the notification call when `uploadedBy` is null. This removes the silent failure and the spurious warning log. Alternatively, update the type signature to accept `uploadedBy: string | null`.

---

### FINDING-2 — Medium: Folder structure deviates from design spec

**Observed:**
```
apps/api/src/shared/middleware/authenticate-portal.ts   ← actual location
apps/api/src/modules/portal/                            ← flat, no subdirectories
```

**Design spec states:**
```
apps/api/src/modules/portal/
├── index.ts
├── portal.types.ts
├── portal.validation.ts
├── portal.repository.ts
├── portal.service.ts
├── portal.controller.ts
└── portal.routes.ts

apps/api/src/shared/middleware/authenticate-portal.ts   ← matches actual
```

The flat module structure matches the design spec exactly. The middleware location (`shared/middleware/`) also matches the design spec. No deviation exists.

**Verdict:** No issue. This finding is closed. The design spec was the source of truth and the implementation follows it correctly.

---

### FINDING-3 — Low: `jwtStrategy.sign()` called with `as any` cast

**File:** `apps/api/src/modules/portal/portal.service.ts` — `login()`

**Observed:**
```typescript
const token = jwtStrategy.sign({
  clientUserId: user.id,
  clientId: user.client_id,
  firmId: user.client.firm_id,
  email: user.email,
  type: 'portal',
} as any);
```

`jwtStrategy.sign()` expects `Omit<JwtPayload, 'iat' | 'exp'>` which has `userId: string`. The portal payload uses `clientUserId` instead. The `as any` cast bypasses the type check. The JWT is signed and verified correctly at runtime — `jsonwebtoken` does not validate payload shape.

**Impact:** Type safety gap only. No runtime risk. The `authenticatePortal` middleware correctly reads `payload.clientUserId` after verification.

**Recommendation:** Overload `jwtStrategy.sign()` to accept `PortalJwtPayload` as an alternative, or extract a `signPortal()` method. This is a low-priority refactor.

---

### FINDING-4 — Low: `FRONTEND_URL` read directly from `process.env` in controller

**File:** `apps/api/src/modules/portal/portal.controller.ts`

**Observed:**
```typescript
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3001';
```

All other environment variables in this codebase are accessed through the validated `config` object in `apps/api/src/config/index.ts`. `FRONTEND_URL` is not in the config schema, so it bypasses the startup validation that would catch a missing or malformed value in production.

**Impact:** If `FRONTEND_URL` is not set in production, Stripe `successUrl` and `cancelUrl` will silently use `http://localhost:3001`, causing payment redirects to fail. No crash — the Stripe session is created, but the redirect destination is wrong.

**Recommendation:** Add `FRONTEND_URL` to the `envSchema` in `config/index.ts` and reference `config.frontendUrl` in the controller. Mark it optional with a default for local development.

---

## Requirements Coverage

### Functional Requirements

| Requirement | Status | Notes |
|---|---|---|
| FR-1: Portal Login | PASS | Email+firmSlug lookup, bcrypt compare, JWT signed, last_login_at updated |
| FR-1: Inactive account rejection | PASS | `is_active: true` filter in repository query |
| FR-1: Soft-deleted account rejection | PASS | `deleted_at: null` filter in repository query |
| FR-1: 401 on failure (no credential hint) | PASS | Same error message for both failure modes |
| FR-2: Staff-initiated account creation | PASS | `authenticate` middleware on create-account route |
| FR-2: clientId firm ownership check | PASS | `prisma.clients.findFirst({ where: { id, firm_id } })` |
| FR-2: Email uniqueness per client | PASS | Schema `@@unique([client_id, email])`, P2002 caught and mapped to 409 |
| FR-2: Password hashed (bcrypt 12 rounds) | PASS | `passwordService.hash()` used |
| FR-2: password_hash excluded from response | PASS | Destructured out in `createClientUser()` |
| FR-3: List documents (firm+client scoped) | PASS | Delegates to `documentsService.listDocuments(firmId, clientId)` |
| FR-3b: Download document | PASS | Ownership check: `doc.client_id !== clientId` → 404 |
| FR-4: Upload document | PASS | Auto-folder via `findOrCreatePortalFolder`, delegates to documentsService |
| FR-4: uploadedBy null | PASS (with FINDING-1) | Stored as null; notification silently fails |
| FR-5: List invoices | PASS | Delegates to `invoicesService.listClientInvoices(firmId, clientId)` |
| FR-6: Pay invoice | PASS | Ownership + status checks before Stripe session |
| FR-6: successUrl / cancelUrl | PASS (with FINDING-4) | Correct paths; FRONTEND_URL env risk noted |
| FR-7: List tasks | PASS | Delegates to `tasksService.listClientTasks(firmId, clientId)` |
| FR-8: Dashboard summary | PASS | Four `prisma.X.count()` calls, all scoped to (firmId, clientId) |
| FR-8: outstanding_invoice_count | PASS | Filters `status: { in: ['sent', 'overdue'] }` |

### Non-Functional Requirements

| Requirement | Status | Notes |
|---|---|---|
| NFR-1: Portal JWT separate from staff JWT | PASS | `type: 'portal'` discriminator; `authenticatePortal` rejects non-portal tokens |
| NFR-2: Strict client isolation | PASS | clientId never from request body; always from verified JWT |
| NFR-3: No modification of existing modules | PASS | Only `app.ts` modified (router mount) |
| NFR-4: Login rate limiting (5/min) | PASS | `express-rate-limit` on login route only |
| NFR-5: File upload validation (50MB, MIME) | PASS | multer config in portal.routes.ts |
| NFR-6: Audit logging | PASS | All 5 events logged with correct fields |
| NFR-7: No portal_sessions usage | PASS | Stateless JWT only |
| NFR-8: PortalLayout isolated | PASS | No DashboardLayout or AppLayout dependency |
| NFR-9: No regressions | PASS | All existing routes unmodified; portal is purely additive |

---

## Security Review

### Authentication & Authorization

| Check | Result |
|---|---|
| Portal tokens rejected by staff middleware | PASS — staff `authenticate` reads `userId`; portal tokens have `clientUserId` only |
| Staff tokens rejected by portal middleware | PASS — `authenticatePortal` checks `payload.type !== 'portal'` → 401 |
| Cross-client access via forged request body | IMPOSSIBLE — `clientId` sourced only from verified JWT |
| Cross-firm access | IMPOSSIBLE — `firmId` sourced only from verified JWT; all queries filter by `firm_id` |
| Brute-force login | MITIGATED — 5 req/min rate limit on login endpoint |
| Password exposure in logs | PASS — login failure logs `email` and `firmSlug` only |
| Password hash in API response | PASS — `password_hash` destructured out before returning |

### Tenant Isolation

Every portal data endpoint passes both `firmId` and `clientId` from `req.portalUser` (never from request input) to the service layer. The service layer passes these to existing repositories which already enforce `firm_id` scoping. The portal adds the `client_id` layer on top.

Invoice pay and document download include explicit ownership checks (`invoice.client_id !== clientId`, `doc.client_id !== clientId`) before proceeding — these are the two mutation-adjacent operations where cross-client access would be most harmful.

---

## API Endpoint Coverage

| Method | Path | Auth | Implemented | Notes |
|---|---|---|---|---|
| POST | `/api/v1/portal/auth/login` | none | YES | Rate limited |
| POST | `/api/v1/portal/auth/create-account` | staff JWT | YES | |
| GET | `/api/v1/portal/dashboard` | portal JWT | YES | |
| GET | `/api/v1/portal/documents` | portal JWT | YES | |
| POST | `/api/v1/portal/documents/upload` | portal JWT | YES | multer, 50MB |
| GET | `/api/v1/portal/documents/:id/download` | portal JWT | YES | |
| GET | `/api/v1/portal/invoices` | portal JWT | YES | |
| POST | `/api/v1/portal/invoices/:id/pay` | portal JWT | YES | |
| GET | `/api/v1/portal/tasks` | portal JWT | YES | |

All 9 endpoints from the design spec are implemented and registered.

---

## Frontend Coverage

| Page | Route | Layout | Auth Guard | Implemented |
|---|---|---|---|---|
| Portal Login | `/portal/login` | AuthPageLayout | none | YES |
| Portal Dashboard | `/portal/dashboard` | PortalLayout | token check | YES |
| Portal Documents | `/portal/documents` | PortalLayout | token check | YES |
| Portal Invoices | `/portal/invoices` | PortalLayout | token check | YES |
| Portal Tasks | `/portal/tasks` | PortalLayout | token check | YES |
| Payment Success | `/portal/payment-success` | none | none | YES |

`PortalLayout` auth guard: checks `portalToken` from context on render; redirects to `/portal/login` if absent. Correct.

`PortalAuthContext`: separate from staff `AuthContext`. Uses `portal_token` / `portal_user` localStorage keys. No collision with staff auth keys.

`portal-api.ts`: separate axios instance. Reads `portal_token` from localStorage. 401 interceptor clears portal storage and redirects to `/portal/login`. Does not touch staff token.

`PortalAuthProvider` placement in `main.tsx`: correctly inside `<BrowserRouter>` (required because `PortalAuthProvider` calls `useNavigate()`).

---

## Regression Safety

The following existing modules were verified as unmodified:

- `apps/api/src/modules/auth/` — no changes
- `apps/api/src/modules/crm/` — no changes
- `apps/api/src/modules/documents/` — no changes
- `apps/api/src/modules/tasks/` — no changes
- `apps/api/src/modules/billing/` — no changes
- `apps/api/src/modules/notifications/` — no changes
- `apps/api/src/app.ts` — one line added: portal router mount

The portal module is purely additive. No existing route, service, repository, or type was modified.

---

## Summary

| Category | Result |
|---|---|
| Security | PASS |
| Tenant isolation | PASS |
| API completeness | PASS (9/9 endpoints) |
| Frontend completeness | PASS (6/6 pages) |
| Regression safety | PASS |
| Spec conformance | PASS WITH FINDINGS |

**Open findings requiring action before next phase:**

| ID | Severity | Action |
|---|---|---|
| FINDING-1 | Medium | Skip notification in `documentsService` when `uploadedBy` is null, or update type to accept null |
| FINDING-3 | Low | Overload or separate `jwtStrategy.sign()` for portal payload |
| FINDING-4 | Low | Add `FRONTEND_URL` to `config/index.ts` env schema; use `config.frontendUrl` in controller |

FINDING-2 was closed during audit — no deviation found.
