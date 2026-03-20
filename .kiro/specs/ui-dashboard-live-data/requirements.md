# Requirements Document

## Introduction

The dashboard at `/dashboard` currently makes zero API calls and shows only three static navigation shortcuts (Clients, Contacts, Tasks) with no live counts or metrics. The product spec (`docs/01-product/mvp-doc.md`) describes a dashboard with real metrics, and the UI audit (`docs/audits/UI-COMPLETE-INVENTORY-PHASE-10.md`) flags this as gap V-013 / GAP-008.

This feature adds:
1. A backend `GET /api/v1/dashboard/summary` endpoint that returns tenant-scoped counts for clients, contacts, tasks, invoices, and notifications.
2. A frontend dashboard page that fetches and displays those counts across three rows of metric cards (summary, task breakdown, invoice summary), with proper loading and error states.
3. A lightweight `GET /api/v1/notifications/unread-count` endpoint and a nav badge in `DashboardLayout` that shows the unread notification count next to the "Notifications" link (GAP-009), refreshing every 60 seconds or on window focus.

---

## Glossary

- **Dashboard_Summary_Endpoint**: `GET /api/v1/dashboard/summary` — returns all metric counts for the authenticated firm.
- **Unread_Count_Endpoint**: `GET /api/v1/notifications/unread-count` — returns only the unread notification count for the authenticated user.
- **Dashboard_Summary_Hook**: `useDashboardSummary` — React Query hook at `apps/web/src/features/dashboard/hooks/useDashboardSummary.ts` that calls the Dashboard_Summary_Endpoint.
- **Unread_Count_Hook**: `useUnreadNotificationCount` — React Query hook that calls the Unread_Count_Endpoint with 60-second polling and window-focus refetch.
- **MetricCard**: existing component at `apps/web/src/components/ui/MetricCard.tsx`, extended to accept an optional `count` prop (integer) and an optional `value` prop (pre-formatted string, e.g. currency). When `value` is provided it takes display priority over `count`.
- **DashboardLayout**: approved layout wrapper at `apps/web/src/components/layout/DashboardLayout.tsx`.
- **Nav_Badge**: small red circle rendered next to the "Notifications" nav link in `DashboardLayout` showing the unread count.
- **firmId**: the tenant identifier extracted from the authenticated user's JWT, used to scope all database queries.
- **Skeleton**: a loading placeholder (dash or animated element) shown in a MetricCard count position while data is being fetched.
- **outstanding_amount**: the sum of `total_amount` for all invoices with status `sent` or `overdue` belonging to the firm.

---

## Requirements

---

### Requirement 1: Dashboard Summary Endpoint

**User Story:** As a firm staff member, I want the dashboard to show real counts for my firm's data, so that I can quickly assess the current state of clients, tasks, and invoices without navigating to each section.

#### Acceptance Criteria

1. THE Dashboard_Summary_Endpoint SHALL be registered at `GET /api/v1/dashboard/summary` in the Express application.
2. WHEN a request reaches the Dashboard_Summary_Endpoint, THE Dashboard_Summary_Endpoint SHALL require a valid Bearer JWT via the `authenticate` middleware and reject unauthenticated requests with HTTP 401.
3. WHEN an authenticated request is received, THE Dashboard_Summary_Endpoint SHALL scope all counts to the `firmId` extracted from the JWT — counts from other firms SHALL NOT appear in the response.
4. WHEN an authenticated request is received, THE Dashboard_Summary_Endpoint SHALL return HTTP 200 with a JSON body matching this exact shape:
   ```json
   {
     "clients":   { "total": 0, "active": 0 },
     "contacts":  { "total": 0 },
     "tasks":     { "total": 0, "overdue": 0, "by_status": { "new": 0, "in_progress": 0, "waiting_client": 0, "review": 0, "completed": 0 } },
     "invoices":  { "total": 0, "draft": 0, "sent": 0, "paid": 0, "overdue": 0, "total_outstanding_amount": "0.00" },
     "notifications": { "unread_count": 0 }
   }
   ```
5. THE Dashboard_Summary_Endpoint SHALL compute all counts using parallel database queries (e.g. `Promise.all`) — sequential N+1 queries are not permitted.
6. WHEN computing `tasks.overdue`, THE Dashboard_Summary_Endpoint SHALL count tasks where `due_date` is before the current UTC date AND `status` is not `completed`.
7. WHEN computing `invoices.total_outstanding_amount`, THE Dashboard_Summary_Endpoint SHALL sum the `total_amount` field for all invoices with status `sent` or `overdue` belonging to the firm, and return the value as a string formatted to two decimal places.
8. WHEN computing `notifications.unread_count`, THE Dashboard_Summary_Endpoint SHALL count notifications where `is_read` is `false` AND `user_id` matches the authenticated user's id from the JWT.
9. IF a database error occurs during query execution, THEN THE Dashboard_Summary_Endpoint SHALL return HTTP 500 with `{ "error": "Internal server error" }` and log the error via the existing logger utility.

---

### Requirement 2: Unread Notification Count Endpoint

**User Story:** As a firm staff member, I want the navigation bar to show how many unread notifications I have, so that I can see at a glance whether there is anything requiring my attention without loading the full dashboard.

#### Acceptance Criteria

1. THE Unread_Count_Endpoint SHALL be registered at `GET /api/v1/notifications/unread-count` in the notifications router.
2. WHEN a request reaches the Unread_Count_Endpoint, THE Unread_Count_Endpoint SHALL require a valid Bearer JWT via the `authenticate` middleware and reject unauthenticated requests with HTTP 401.
3. WHEN an authenticated request is received, THE Unread_Count_Endpoint SHALL return HTTP 200 with `{ "unread_count": <integer> }` scoped to the authenticated user's `userId` and `firmId`.
4. THE Unread_Count_Endpoint SHALL execute a single `COUNT` query against the `notifications` table — it SHALL NOT fetch full notification records.
5. IF a database error occurs, THEN THE Unread_Count_Endpoint SHALL return HTTP 500 with `{ "error": "Internal server error" }`.

---

### Requirement 3: Dashboard Summary React Query Hook

**User Story:** As a developer, I want a typed React Query hook for the dashboard summary, so that the dashboard page can fetch live data with caching, loading, and error states handled consistently.

#### Acceptance Criteria

1. THE Dashboard_Summary_Hook SHALL be located at `apps/web/src/features/dashboard/hooks/useDashboardSummary.ts` and export a function `useDashboardSummary`.
2. WHEN called, THE Dashboard_Summary_Hook SHALL call `GET /api/v1/dashboard/summary` using the shared `api` axios instance from `apps/web/src/lib/api.ts`.
3. THE Dashboard_Summary_Hook SHALL use the react-query key `['dashboard', 'summary']` so that the query can be invalidated or refetched independently.
4. THE Dashboard_Summary_Hook SHALL return the full `UseQueryResult` object so that consumers can access `data`, `isLoading`, `isError`, and `error`.
5. THE Dashboard_Summary_Hook SHALL be typed against a `DashboardSummary` TypeScript interface that mirrors the exact response shape defined in Requirement 1, Criterion 4.

---

### Requirement 4: Unread Notification Count React Query Hook

**User Story:** As a developer, I want a typed React Query hook for the unread notification count that polls automatically, so that the nav badge stays current without requiring a page reload.

#### Acceptance Criteria

1. THE Unread_Count_Hook SHALL be located at `apps/web/src/features/notifications/hooks/useUnreadNotificationCount.ts` and export a function `useUnreadNotificationCount`.
2. WHEN called, THE Unread_Count_Hook SHALL call `GET /api/v1/notifications/unread-count` using the shared `api` axios instance.
3. THE Unread_Count_Hook SHALL configure `refetchInterval: 60000` (60 seconds) so the count refreshes automatically.
4. THE Unread_Count_Hook SHALL configure `refetchOnWindowFocus: true` so the count refreshes when the browser tab regains focus.
5. THE Unread_Count_Hook SHALL use the react-query key `['notifications', 'unread-count']`.
6. THE Unread_Count_Hook SHALL return `{ unreadCount: number | undefined, isLoading: boolean }` derived from the query result.

---

### Requirement 5: MetricCard Count Display

**User Story:** As a firm staff member, I want each dashboard card to prominently display its live count or value, so that I can read the key numbers at a glance.

#### Acceptance Criteria

1. THE MetricCard SHALL accept an optional `count` prop of type `number | null | undefined` for integer counts.
2. THE MetricCard SHALL accept an optional `value` prop of type `string` for pre-formatted display values (e.g. currency strings like `$1,234.56`). When `value` is provided (non-undefined), it SHALL take display priority over `count`.
3. WHEN `count` is a non-negative integer and `value` is not provided, THE MetricCard SHALL display the count prominently above the label — the count SHALL be visually larger than the label text.
4. WHEN `count` is `undefined` or `null` and `value` is not provided, THE MetricCard SHALL display a dash (`—`) in the count position.
5. WHEN `count` is provided and `value` is not provided, THE MetricCard SHALL format counts of 1,000 or greater using locale-aware number formatting (e.g. `1,234`).
6. WHEN `value` is provided, THE MetricCard SHALL render `value` directly in the display position without further formatting.
7. THE MetricCard SHALL continue to render its `label`, `description`, `path`, `iconPath`, and `iconBg` props exactly as before — both `count` and `value` are additive and SHALL NOT break existing usages that omit them.

---

### Requirement 6: Dashboard Page Live Metrics Layout

**User Story:** As a firm staff member, I want the dashboard to show three rows of metric cards covering summary totals, task breakdown, and invoice summary, so that I have a complete operational overview on a single screen.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL call `useDashboardSummary` on mount and pass the returned counts to the appropriate MetricCard instances.
2. THE Dashboard_Page SHALL render Row 1 (summary) with four MetricCards: Clients (total), Contacts (total), Tasks (total), Unread Notifications — laid out in a responsive grid (4 columns on `xl`, 2 on `md`, 1 on `sm`).
3. THE Dashboard_Page SHALL render Row 2 (task breakdown) with five MetricCards: Tasks New, In Progress, Waiting Client, Review, Completed — laid out in a responsive grid (5 columns on `xl`, 3 on `md`, 1 on `sm`).
4. THE Dashboard_Page SHALL render Row 3 (invoice summary) with six MetricCards: Total Invoices, Draft, Sent, Paid, Overdue, Outstanding Amount — laid out in a responsive grid (6 columns on `xl`, 3 on `md`, 1 on `sm`).
5. WHEN `useDashboardSummary` returns `isLoading: true`, THE Dashboard_Page SHALL pass `count={undefined}` to all MetricCards so each card renders its Skeleton/dash state.
6. WHEN `useDashboardSummary` returns `isError: true`, THE Dashboard_Page SHALL render an `Alert` component (variant: error) above the metric rows with a human-readable error message, and SHALL still render the metric card rows with `count={undefined}`.
7. EACH MetricCard on the dashboard SHALL retain its navigation `path` link to the relevant page (Clients → `/clients`, Contacts → `/contacts`, Tasks → `/tasks`, Notifications → `/notifications`, Invoices → `/invoices`).
8. THE Dashboard_Page SHALL display `invoices.total_outstanding_amount` formatted as a currency string (e.g. `$1,234.56`) in the Outstanding Amount card, passed via the MetricCard `value` prop (not `count`, since it is a string not a number).
9. THE Dashboard_Page SHALL continue to use `DashboardLayout` as its layout wrapper, consistent with layout governance.

---

### Requirement 7: Unread Notification Badge in Navigation

**User Story:** As a firm staff member, I want to see a red badge with the unread count next to "Notifications" in the nav bar, so that I am always aware of pending notifications without visiting the notifications page.

#### Acceptance Criteria

1. THE DashboardLayout SHALL call `useUnreadNotificationCount` and use the returned `unreadCount` to conditionally render the Nav_Badge.
2. WHEN `unreadCount` is a positive integer (greater than 0), THE DashboardLayout SHALL render the Nav_Badge as a small red circle containing the count, positioned adjacent to the "Notifications" label in both the desktop nav and the mobile drawer.
3. WHEN `unreadCount` is 0 or `undefined`, THE DashboardLayout SHALL NOT render the Nav_Badge — no empty badge or zero badge SHALL be visible.
4. THE Nav_Badge SHALL display counts up to 99 as the raw number; WHEN `unreadCount` exceeds 99, THE Nav_Badge SHALL display `99+`.
5. THE Nav_Badge SHALL use a red background (e.g. Tailwind `bg-red-500`) with white text and be sized to remain legible at small scale (minimum 16×16px touch target area).
6. THE Nav_Badge SHALL be visible in both light and dark mode.
7. WHEN the user navigates to `/notifications` and marks notifications as read, THE DashboardLayout SHALL reflect the updated count within the next polling interval (≤ 60 seconds) or immediately if `useUnreadNotificationCount` is invalidated.

---

### Requirement 8: Correctness Properties

**User Story:** As a developer, I want property-based tests to verify the invariants of the dashboard summary data, so that regressions in count logic are caught automatically.

#### Acceptance Criteria

1. FOR ALL valid `DashboardSummary` response objects, THE Dashboard_Summary_Endpoint SHALL return values where every integer count field is a non-negative integer (≥ 0) — a count SHALL never be negative.
2. FOR ALL valid `DashboardSummary` response objects, THE `tasks.by_status` sub-counts SHALL sum to a value less than or equal to `tasks.total` — the breakdown SHALL NOT exceed the total.
3. FOR ALL valid `DashboardSummary` response objects, `invoices.draft + invoices.sent + invoices.paid + invoices.overdue` SHALL be less than or equal to `invoices.total` (cancelled invoices account for the remainder).
4. FOR ALL valid `DashboardSummary` response objects, `invoices.total_outstanding_amount` SHALL be a string parseable as a non-negative decimal number — it SHALL never be negative.
5. FOR ALL valid `DashboardSummary` response objects, `notifications.unread_count` SHALL be a non-negative integer.
6. WHEN `unreadCount` is 0, THE Nav_Badge SHALL NOT be rendered — this invariant SHALL hold regardless of how the count reaches 0 (initial load, polling update, or manual mark-as-read).
7. WHEN `count` is provided to MetricCard as any non-negative integer `n`, THE MetricCard SHALL render a string representation of `n` in the DOM — the displayed value SHALL equal the input value (round-trip display property). WHEN `value` is provided as any string `s`, THE MetricCard SHALL render `s` directly in the DOM unchanged.
