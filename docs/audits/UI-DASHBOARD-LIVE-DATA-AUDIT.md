# Audit Report — ui-dashboard-live-data

**Date:** 2026-03-18
**Spec:** `.kiro/specs/ui-dashboard-live-data/`
**Auditor:** Post-implementation zero-trust audit
**Verdict:** PASS WITH ISSUES — fixes applied, READY for beta

---

## 1. Verdict

**PASS WITH ISSUES**

All critical and high issues have been fixed during this audit session. Two medium issues were resolved. Two low issues are documented and accepted.

---

## 2. Issues Found and Resolved

### 🔴 HIGH — invoices.total was not a true total (FIXED)

**File:** `apps/api/src/modules/dashboard/dashboard.service.ts`

**Problem:** Original implementation computed `invoices.total` as:
```ts
total: Object.values(byInvoiceStatus).reduce((a, b) => a + b, 0)
```
This summed only `draft + sent + paid + overdue`. Any invoice with a status outside those four (e.g. `cancelled`) was silently excluded. This made `invoices.total` incorrect and made the spec property test (`draft + sent + paid + overdue <= total`) trivially always-equal rather than a meaningful invariant.

**Fix applied:** Added a dedicated `prisma.invoices.count({ where: { firm_id: firmId, deleted_at: null } })` as the 10th parallel query. `invoices.total` now reflects the true count of all non-deleted invoices for the firm regardless of status.

---

### 🟠 MEDIUM — Outstanding amount missing `$` prefix (FIXED)

**File:** `apps/web/src/pages/dashboard.tsx`

**Problem:** The formatted outstanding amount was produced as `1,234.56` (no currency symbol) while the spec (design.md) specifies `$1,234.56`. The fallback `'$0.00'` had the `$` but the non-zero path did not — inconsistent user-facing display.

**Fix applied:** Template literal updated to `$${parseFloat(...).toLocaleString(...)}` so both the value path and the fallback are consistently prefixed with `$`.

---

### 🟠 MEDIUM — Dual unread count sources (documented, intentional)

**Components affected:**
- Dashboard card: reads `data?.notifications.unread_count` from `GET /dashboard/summary` (fetched once on page load, no polling)
- Nav badge: reads from `GET /notifications/unread-count` (60s polling + window focus refetch)

**Behavior:** Both show "unread notifications" but from different sources with different freshness. On the same screen, the dashboard card count and the nav badge count can temporarily show different values.

**Decision:** Kept as-is per design.md which explicitly documents this tradeoff:
> "The nav badge uses GET /notifications/unread-count with 60-second polling and is the authoritative real-time source. These two values may temporarily differ due to different refresh strategies. This is intentional and acceptable."

A code comment has been added to `dashboard.service.ts` at the `unreadCount` query to make this explicit for future developers.

**Recommendation for future phase:** If UX consistency becomes a concern, remove `notifications.unread_count` from the dashboard summary response and have the dashboard card also use `useUnreadNotificationCount` directly.

---

## 3. Low Issues (accepted, no fix required)

### 🟡 LOW — No `logger.error` in unread-count controller

**File:** `apps/api/src/modules/notifications/notifications.controller.ts`

The `getUnreadCount` handler catches errors and returns HTTP 500 correctly but does not call `logger.error`. The spec (R2.AC5) only requires the 500 response — logging is not mandated. Inconsistent with the dashboard controller which does log. Acceptable for now.

### 🟡 LOW — `parseFloat` NaN edge case

**File:** `apps/web/src/pages/dashboard.tsx`

If the API ever returns `"NaN"` as the `total_outstanding_amount` string, `parseFloat("NaN")` returns `NaN` and `NaN.toLocaleString()` renders `"NaN"` in the UI. The existing falsy guard (`data?.invoices.total_outstanding_amount ? ... : '$0.00'`) does not catch this because `"NaN"` is a truthy string. Extremely unlikely in practice since the backend always returns `(sum ?? 0).toFixed(2)`. Accepted as low risk.

---

## 4. Verified Items

| # | Check | Result |
|---|---|---|
| 1.1 | `GET /api/v1/dashboard/summary` registered in app.ts | ✅ PASS |
| 1.2 | Route protected by `authenticate` middleware | ✅ PASS |
| 1.3 | All queries scoped to `firmId` | ✅ PASS |
| 1.4 | Notifications query also scoped to `userId` | ✅ PASS |
| 1.5 | `deleted_at: null` soft-delete filter on all relevant tables | ✅ PASS |
| 1.6 | All queries in single `Promise.all` — no N+1 | ✅ PASS |
| 1.7 | 10 destructured variables match 10 queries in order | ✅ PASS |
| 1.8 | `tasks.by_status` normalized with all 5 keys defaulting to 0 | ✅ PASS |
| 1.9 | `invoices` status map normalized with all 4 keys defaulting to 0 | ✅ PASS |
| 1.10 | `invoices.total` is true DB count (post-fix) | ✅ PASS |
| 1.11 | `total_outstanding_amount` sums `sent + overdue` only | ✅ PASS |
| 1.12 | `total_outstanding_amount` returned as `.toFixed(2)` string | ✅ PASS |
| 1.13 | Error handling: try/catch, HTTP 500, logger.error | ✅ PASS |
| 2.1 | `GET /api/v1/notifications/unread-count` registered | ✅ PASS |
| 2.2 | Route protected via `router.use(authenticate, tenantContext)` | ✅ PASS |
| 2.3 | Uses single `COUNT` query — no full row fetch | ✅ PASS |
| 2.4 | Scoped to `userId` + `firmId` + `is_read: false` | ✅ PASS |
| 3.1 | `useDashboardSummary` at correct path, correct endpoint | ✅ PASS |
| 3.2 | Query key `['dashboard', 'summary']` | ✅ PASS |
| 3.3 | Returns full `UseQueryResult` | ✅ PASS |
| 3.4 | Typed against `DashboardSummary` interface | ✅ PASS |
| 4.1 | `useUnreadNotificationCount` at correct path | ✅ PASS |
| 4.2 | `refetchInterval: 60_000` | ✅ PASS |
| 4.3 | `refetchOnWindowFocus: true` | ✅ PASS |
| 4.4 | Query key `['notifications', 'unread-count']` | ✅ PASS |
| 4.5 | Returns `{ unreadCount, isLoading }` | ✅ PASS |
| 5.1 | `MetricCard` accepts `count?: number \| null` | ✅ PASS |
| 5.2 | `MetricCard` accepts `value?: string` | ✅ PASS |
| 5.3 | `value` takes display priority over `count` | ✅ PASS |
| 5.4 | `undefined`/`null` count renders `—` | ✅ PASS |
| 5.5 | Count uses `toLocaleString()` | ✅ PASS |
| 6.1 | Dashboard page uses `DashboardLayout` via router (App.tsx) | ✅ PASS |
| 6.2 | Row 1: 4 cards — Clients, Contacts, Tasks, Notifications | ✅ PASS |
| 6.3 | Row 2: 5 cards — new, in_progress, waiting_client, review, completed | ✅ PASS |
| 6.4 | Row 3: 6 cards — total, draft, sent, paid, overdue, outstanding | ✅ PASS |
| 6.5 | Grid classes match spec (xl:4/5/6, md:2/3/3, 1) | ✅ PASS |
| 6.6 | Loading: `count={undefined}` passed to all cards | ✅ PASS |
| 6.7 | Error: `Alert` rendered, cards still render | ✅ PASS |
| 6.8 | All nav paths correct | ✅ PASS |
| 6.9 | Outstanding uses `value` prop (not `count`) | ✅ PASS |
| 6.10 | Outstanding formatted as `$X,XXX.XX` (post-fix) | ✅ PASS |
| 7.1 | `useUnreadNotificationCount` called inside `DashboardLayout` | ✅ PASS |
| 7.2 | Badge renders only when `unreadCount > 0` | ✅ PASS |
| 7.3 | Badge hidden when 0 or undefined | ✅ PASS |
| 7.4 | Badge shows `99+` when count > 99 | ✅ PASS |
| 7.5 | Badge present in both desktop nav and mobile drawer | ✅ PASS |

---

## 5. Spec vs Implementation Gaps

| Gap | Severity | Status |
|---|---|---|
| `invoices.total` excluded cancelled invoices | HIGH | Fixed |
| Outstanding amount missing `$` prefix | MEDIUM | Fixed |
| Dual unread count sources (dashboard vs nav badge) | MEDIUM | Intentional — documented |
| No logger in unread-count controller | LOW | Accepted |
| `parseFloat` NaN edge case | LOW | Accepted |

---

## 6. Performance Observations

- Backend: all 10 queries run in parallel via `Promise.all` — no sequential queries, no N+1
- Frontend: `useDashboardSummary` fetches once on mount with React Query caching; `useUnreadNotificationCount` polls every 60s — no redundant calls
- No duplicate API calls observed between dashboard page and layout

---

## 7. Final Recommendation

**READY for beta.**

The one production-blocking issue (`invoices.total` logic flaw) has been fixed. Both medium issues are resolved. The remaining low issues are accepted risks with no user-facing impact in normal operation.
