# Phase 6 – Notifications Implementation Audit Report

**Date:** 2026-03-17
**Auditor:** Kiro
**Scope:** Phase 6 Notifications — Backend + Frontend + Database + Event Integrations
**Type:** Static code analysis only. No server was running. No code was modified.

---

## Overall Status: PARTIAL PASS — 3 issues found

---

## Section 1: Folder Structure Validation

### Expected vs Actual

| File | Expected | Present |
|------|----------|---------|
| notifications.types.ts | ✅ | ✅ |
| notifications.validation.ts | ✅ | ✅ |
| notifications.repository.ts | ✅ | ✅ |
| notifications.service.ts | ✅ | ✅ |
| notifications.controller.ts | ✅ | ✅ |
| notifications.routes.ts | ✅ | ✅ |
| index.ts | ✅ | ✅ |
| email-events/email-events.types.ts | ✅ | ✅ |
| email-events/email-events.repository.ts | ✅ | ✅ |
| email-events/email-events.service.ts | ✅ | ✅ |
| email/email.types.ts | ✅ | ✅ |
| email/email.service.ts | ✅ | ✅ |

**Verdict: PASS** — All 12 required files present. No extra files. Structure matches CRM/Tasks/Billing patterns.

---

## Section 2: Database Validation

### Tables Used

| Table | Exists in Schema | Used by Module |
|-------|-----------------|----------------|
| notifications | ✅ | ✅ |
| email_events | ✅ | ✅ |

### No New Migrations Added

Confirmed: no new migration files were added for Phase 6. Module uses existing tables only.

### Column Verification — notifications

| Column | Schema | Code |
|--------|--------|------|
| id | ✅ | ✅ |
| firm_id | ✅ | ✅ |
| user_id | ✅ | ✅ |
| type (notification_type_enum) | ✅ | ✅ |
| title | ✅ | ✅ |
| message | ✅ | ✅ |
| entity_type | ✅ | ✅ |
| entity_id | ✅ | ✅ |
| is_read | ✅ | ✅ |
| read_at | ✅ | ✅ |
| created_at | ✅ | ✅ |


### Column Verification — email_events

| Column | Schema | Code |
|--------|--------|------|
| id | ✅ | ✅ |
| firm_id | ✅ | ✅ |
| message_id | ✅ | ✅ |
| email_to | ✅ | ✅ |
| email_from | ✅ | ✅ |
| subject | ✅ | ✅ |
| template_name | ✅ | ✅ |
| event_type (email_event_type_enum) | ✅ | ✅ (see Issue #1) |
| event_data | ✅ | ✅ |
| created_at | ✅ | ✅ |

### notification_type_enum Values

| Enum Value | Schema | Validation Schema | Types File |
|------------|--------|-------------------|------------|
| task_assigned | ✅ | ✅ | ✅ |
| task_completed | ✅ | ✅ | ✅ |
| invoice_sent | ✅ | ✅ | ✅ |
| invoice_paid | ✅ | ✅ | ✅ |
| document_uploaded | ✅ | ✅ | ✅ |
| comment_added | ✅ | ✅ | ✅ |
| user_invited | ✅ | ✅ | ✅ |

**Verdict: PASS** — All 7 enum values match exactly.

---

## Section 3: API Endpoint Verification

### Route Registration

Notifications router is mounted in `app.ts` at `/api/v1` after billing. All routes apply `authenticate` + `tenantContext` middleware via `router.use()`.

| Endpoint | Method | Route | Auth | Tenant |
|----------|--------|-------|------|--------|
| List notifications | GET | /api/v1/notifications | ✅ | ✅ |
| Create notification (internal) | POST | /api/v1/notifications | ✅ | ✅ |
| Mark as read | PATCH | /api/v1/notifications/:id/read | ✅ | ✅ |
| List email events | GET | /api/v1/email-events | ✅ | ✅ |

### Endpoint Behavior Analysis

**GET /api/v1/notifications**
- Filters by `user_id` from JWT: ✅
- Filters by `firm_id` from JWT: ✅
- Ordered by `created_at DESC`: ✅
- Supports `?is_read=true/false` filter: ✅
- Pagination via `page` + `limit`: ✅

**PATCH /api/v1/notifications/:id/read**
- Uses `updateMany` with `{ id, firm_id, user_id }` — user cannot mark another user's notification: ✅
- Returns 404 if count = 0 (not found or wrong user): ✅
- Sets `is_read = true` and `read_at = new Date()`: ✅

**POST /api/v1/notifications**
- Protected by `x-internal-request: true` header check — returns 403 if missing: ✅
- Not intended for direct client use — internal-only guard is correct

**GET /api/v1/email-events**
- Filters by `firm_id` only (not user-scoped — correct, email events are firm-level): ✅
- Ordered by `created_at DESC`: ✅
- Pagination supported: ✅

**Verdict: PASS**


## Section 4: Event Integration Validation

| Trigger | File | Notification Type | try/catch | Non-blocking |
|---------|------|-------------------|-----------|--------------|
| Task assigned | tasks.service.ts | task_assigned | ✅ | ✅ |
| Document uploaded | documents.service.ts | document_uploaded | ✅ | ✅ |
| Invoice sent | invoices.service.ts | invoice_sent | ✅ | ✅ |
| Invoice paid (webhook) | webhook.controller.ts | invoice_paid | ✅ | ✅ |

All four integrations call `notificationsService.createNotification()` inside try/catch blocks and do not block the primary operation on failure. **Verdict: PASS**

---

## Section 5: Tenant Isolation Validation

- `authenticate` middleware sets `req.user.firmId` from JWT
- `tenantContext` middleware sets `req.tenantId = req.user.firmId`
- All repository queries include `firm_id` in `where` clauses
- `markAsRead` uses `{ id, firm_id, user_id }` — cross-user access impossible
- POST /notifications requires `x-internal-request: true` — firm_id cannot be overridden by client

**Verdict: PASS**

---

## Section 6: Issues Found

### ISSUE #1 — EmailEventTypeEnum mismatch (MEDIUM)

**File:** `apps/api/src/modules/notifications/email-events/email-events.types.ts`

The TypeScript type defines `'failed'` as a valid `EmailEventTypeEnum` value:
```ts
| 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
```

However, the database `email_event_type_enum` in `schema.prisma` defines:
```
sent, delivered, opened, clicked, bounced, complained
```

`'failed'` does not exist in the DB enum. `'complained'` is missing from the TS type.

The repository casts with `as any` so this won't throw at runtime unless `'failed'` is actually passed. Currently `email.service.ts` only ever passes `'sent'`, so no runtime error today — but the type contract is wrong.

**Risk:** If any code path passes `eventType: 'failed'`, Prisma will throw a DB constraint error at runtime.

---

### ISSUE #2 — invoice_paid notification always skips (LOW-MEDIUM)

**File:** `apps/api/src/modules/billing/payments/webhook.controller.ts`

The `invoice_paid` notification uses:
```ts
user_id: (invoice as any).created_by ?? null,
```

The `invoices` table has no `created_by` column in the schema. This expression always evaluates to `null`. The repository's `create()` method returns `null` early when `user_id` is null, so no notification is ever persisted for `invoice_paid`.

**Risk:** `invoice_paid` notifications are silently dropped for all webhook events.

---

### ISSUE #3 — tenantContext middleware is redundant (INFO)

**File:** `apps/api/src/shared/middleware/tenant-context.ts`

`authenticate` already sets `req.tenantId = req.user.firmId`. The `tenantContext` middleware sets it again to the same value. No functional impact, but it's dead code.

---

## Section 7: Regression Safety (Phases 1–5)

Phase 6 changes were additive only:

| Module touched | Change | Risk |
|----------------|--------|------|
| app.ts | Added `notificationsRouter` mount | None — appended after billing |
| tasks.service.ts | Added notification call in try/catch | None — non-blocking |
| documents.service.ts | Added notification call in try/catch | None — non-blocking |
| invoices.service.ts | Replaced email stub, added notification | Low — email is still stubbed |
| invoices.controller.ts | Passes `req.user!.userId` to sendInvoice | None — additive param |
| webhook.controller.ts | Added notification call in try/catch | None — non-blocking |

No existing routes, middleware, or DB schemas were modified. All Phase 1–5 endpoints remain unaffected.

**Verdict: PASS**

---

## Section 8: Frontend Validation

| File | Present | Layout |
|------|---------|--------|
| features/notifications/types.ts | ✅ | — |
| features/notifications/api/notifications-api.ts | ✅ | — |
| features/notifications/hooks/useNotifications.ts | ✅ | — |
| pages/notifications/index.tsx | ✅ | DashboardLayout ✅ |

- `/notifications` route added to `App.tsx`: ✅
- Bell icon nav item added to `DashboardLayout.tsx`: ✅
- Layout uses `DashboardLayout` consistent with all phases: ✅

**Verdict: PASS**

---

## Final Verdict: PARTIAL PASS

| Section | Status |
|---------|--------|
| Folder structure | ✅ PASS |
| Database validation | ✅ PASS |
| API endpoints | ✅ PASS |
| Event integrations | ✅ PASS |
| Tenant isolation | ✅ PASS |
| Regression safety | ✅ PASS |
| Frontend | ✅ PASS |
| Issues | ⚠️ 2 bugs, 1 info |

**Do not fix issues in this step. Audit only.**
