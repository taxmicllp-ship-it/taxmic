# Design Document — ui-dashboard-live-data

## Overview

Two backend endpoints and three frontend additions replace the static dashboard with live tenant-scoped metrics and a nav notification badge.

1. **Backend** — `GET /api/v1/dashboard/summary` and `GET /api/v1/notifications/unread-count`
2. **Frontend hooks** — `useDashboardSummary` and `useUnreadNotificationCount`
3. **MetricCard** — extended with optional `count` and `value` props
4. **Dashboard page** — three rows of live metric cards with loading/error states
5. **DashboardLayout nav badge** — unread notification count badge on the Notifications link

---

## Architecture

```
apps/api/src/
  modules/
    dashboard/                    <- new module
      dashboard.routes.ts
      dashboard.controller.ts
      dashboard.service.ts
    notifications/
      notifications.routes.ts     <- modified: add /unread-count
      notifications.controller.ts <- modified: add unreadCount handler
      notifications.service.ts    <- modified: add getUnreadCount method
      notifications.repository.ts <- modified: add countUnread method

apps/web/src/
  features/
    dashboard/                    <- new feature slice
      hooks/
        useDashboardSummary.ts
      types.ts
    notifications/
      hooks/
        useUnreadNotificationCount.ts  <- new
  components/
    ui/
      MetricCard.tsx              <- modified: add count + value props
    layout/
      DashboardLayout.tsx         <- modified: add nav badge
  pages/
    dashboard.tsx                 <- modified: live data + 3 metric rows

apps/api/src/app.ts               <- modified: register dashboard router
```

---

## Components and Interfaces

### 1. Dashboard Summary Endpoint

**File:** `apps/api/src/modules/dashboard/dashboard.service.ts`

All counts fetched in parallel via `Promise.all`. Variables are explicitly named to match each query — order must be preserved:

```ts
const now = new Date();

const [
  clientsAgg,
  clientsActive,
  contactsTotal,
  tasksTotal,
  tasksOverdue,
  tasksByStatus,
  invoicesByStatus,
  invoicesOutstanding,
  unreadCount,
] = await Promise.all([
  prisma.client.aggregate({ where: { firmId }, _count: true }),
  prisma.client.count({ where: { firmId, status: 'active' } }),
  prisma.contact.count({ where: { firmId } }),
  prisma.task.count({ where: { firmId } }),
  prisma.task.count({ where: { firmId, due_date: { lt: now }, status: { not: 'completed' } } }),
  prisma.task.groupBy({ by: ['status'], where: { firmId }, _count: true }),
  prisma.invoice.groupBy({ by: ['status'], where: { firmId }, _count: true }),
  prisma.invoice.aggregate({ where: { firmId, status: { in: ['sent', 'overdue'] } }, _sum: { total_amount: true } }),
  prisma.notification.count({ where: { firmId, userId, is_read: false } }),
]);
```

`groupBy` returns a dynamic array — normalize to fixed-key objects before building the response:

```ts
// Normalize task statuses — ensures all keys exist even if no tasks have that status
const byTaskStatus = { new: 0, in_progress: 0, waiting_client: 0, review: 0, completed: 0 };
tasksByStatus.forEach(g => {
  byTaskStatus[g.status as keyof typeof byTaskStatus] = g._count;
});

// Normalize invoice statuses
const byInvoiceStatus = { draft: 0, sent: 0, paid: 0, overdue: 0 };
invoicesByStatus.forEach(g => {
  byInvoiceStatus[g.status as keyof typeof byInvoiceStatus] = g._count;
});
```

Build the response using the named variables:

```ts
return {
  clients:  { total: clientsAgg._count, active: clientsActive },
  contacts: { total: contactsTotal },
  tasks:    { total: tasksTotal, overdue: tasksOverdue, by_status: byTaskStatus },
  invoices: {
    total: Object.values(byInvoiceStatus).reduce((a, b) => a + b, 0),
    ...byInvoiceStatus,
    total_outstanding_amount: (invoicesOutstanding._sum.total_amount ?? 0).toFixed(2),
  },
  notifications: { unread_count: unreadCount },
};
```

**Response shape:**
```ts
interface DashboardSummaryResponse {
  clients:   { total: number; active: number };
  contacts:  { total: number };
  tasks:     { total: number; overdue: number; by_status: { new: number; in_progress: number; waiting_client: number; review: number; completed: number } };
  invoices:  { total: number; draft: number; sent: number; paid: number; overdue: number; total_outstanding_amount: string };
  notifications: { unread_count: number };
}
```

`total_outstanding_amount` formatted as `(sum ?? 0).toFixed(2)`.

**Route:** `GET /api/v1/dashboard/summary` — protected by `authenticate` middleware.

**App.ts registration:** `app.use('/api/v1/dashboard', dashboardRouter)`.

---

### 2. Unread Count Endpoint

**File:** `apps/api/src/modules/notifications/notifications.repository.ts` — add:
```ts
async countUnread(userId: string, firmId: string): Promise<number> {
  return this.prisma.notification.count({ where: { userId, firmId, is_read: false } });
}
```

**Route:** `GET /api/v1/notifications/unread-count` — protected by `authenticate`.

**Response:** `{ unread_count: number }`

> **Note on dual unread count sources:**
> The dashboard summary includes `notifications.unread_count` for display in the dashboard card — it is fetched once on page load and is informational (may lag).
> The nav badge uses `GET /notifications/unread-count` with 60-second polling and is the **authoritative real-time source**.
> These two values may temporarily differ due to different refresh strategies. This is intentional and acceptable — the nav badge is always more current.

---

### 3. DashboardSummary TypeScript Interface

**File:** `apps/web/src/features/dashboard/types.ts`

```ts
export interface DashboardSummary {
  clients:   { total: number; active: number };
  contacts:  { total: number };
  tasks: {
    total: number;
    overdue: number;
    by_status: {
      new: number;
      in_progress: number;
      waiting_client: number;
      review: number;
      completed: number;
    };
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    total_outstanding_amount: string;
  };
  notifications: { unread_count: number };
}
```

---

### 4. useDashboardSummary Hook

**File:** `apps/web/src/features/dashboard/hooks/useDashboardSummary.ts`

```ts
export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data),
  });
}
```

Returns full `UseQueryResult` — consumers access `data`, `isLoading`, `isError`.

---

### 5. useUnreadNotificationCount Hook

**File:** `apps/web/src/features/notifications/hooks/useUnreadNotificationCount.ts`

```ts
export function useUnreadNotificationCount() {
  const { data, isLoading } = useQuery<{ unread_count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  return { unreadCount: data?.unread_count, isLoading };
}
```

---

### 6. MetricCard — count and value prop extension

**File:** `apps/web/src/components/ui/MetricCard.tsx` (existing)

Add two optional props:
- `count?: number | null` — for integer counts (clients, tasks, invoices, etc.)
- `value?: string` — for pre-formatted string values (e.g. currency like `$1,234.56`)

**Render priority:** if `value` is provided (non-undefined), render `value` directly. Otherwise render `count` formatted with `toLocaleString()`. When both are absent or `count` is `null`/`undefined`, render `—`.

```ts
// Render logic
const display = value !== undefined
  ? value
  : count != null
    ? count.toLocaleString()
    : '—';
```

The display SHALL be visually larger than the label text (e.g. `text-2xl font-bold`).

Existing props (`label`, `description`, `path`, `iconPath`, `iconBg`) remain unchanged — both new props are purely additive.

**Usage in dashboard:**
- All numeric cards use `count={data?.invoices.total}` etc.
- Outstanding Amount card uses `value={formattedOutstanding}` (pre-formatted currency string) — NOT `count`.

---

### 7. Dashboard Page — Three Metric Rows

**File:** `apps/web/src/pages/dashboard.tsx` (replace static content)

Layout tree:
- Row 1: Summary (4 cards, `xl:grid-cols-4 md:grid-cols-2 grid-cols-1`)
  - Clients Total: `count={data?.clients.total}` path="/clients"
  - Contacts Total: `count={data?.contacts.total}` path="/contacts"
  - Tasks Total: `count={data?.tasks.total}` path="/tasks"
  - Unread Notifications: `count={data?.notifications.unread_count}` path="/notifications"
- Row 2: Task Breakdown (5 cards, `xl:grid-cols-5 md:grid-cols-3 grid-cols-1`)
  - New: `count={data?.tasks.by_status.new}`
  - In Progress: `count={data?.tasks.by_status.in_progress}`
  - Waiting Client: `count={data?.tasks.by_status.waiting_client}`
  - Review: `count={data?.tasks.by_status.review}`
  - Completed: `count={data?.tasks.by_status.completed}`
- Row 3: Invoice Summary (6 cards, `xl:grid-cols-6 md:grid-cols-3 grid-cols-1`)
  - Total Invoices: `count={data?.invoices.total}`
  - Draft: `count={data?.invoices.draft}`
  - Sent: `count={data?.invoices.sent}`
  - Paid: `count={data?.invoices.paid}`
  - Overdue: `count={data?.invoices.overdue}`
  - Outstanding: `value={formattedOutstanding}` — uses `value` prop, NOT `count`

When `isLoading`, pass `count={undefined}` to all cards (renders `—`). When `isError`, render `Alert` variant=error above the rows; cards still render with `count={undefined}`.

Outstanding amount formatting:
```ts
const formattedOutstanding = data?.invoices.total_outstanding_amount
  ? `$${parseFloat(data.invoices.total_outstanding_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : '$0.00';
```

Each card retains its `path` link to the relevant section.

---

### 8. DashboardLayout — Nav Badge

**File:** `apps/web/src/components/layout/DashboardLayout.tsx`

- Import `useUnreadNotificationCount` from `features/notifications/hooks/useUnreadNotificationCount`
- Call `const { unreadCount } = useUnreadNotificationCount()` inside the `DashboardLayout` component
- In the nav link render for the "Notifications" item (both desktop and mobile), add the badge inline:

```tsx
{item.label === 'Notifications' && unreadCount && unreadCount > 0 && (
  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}
```

Badge is rendered only when `unreadCount > 0`. Zero and undefined produce no badge.

---

## Data Models

### Backend — Prisma queries (existing tables)
- `client` table: `firmId`, `status`
- `contact` table: `firmId`
- `task` table: `firmId`, `status`, `due_date`
- `invoice` table: `firmId`, `status`, `total_amount`
- `notification` table: `firmId`, `userId`, `is_read`

All tables already exist per the database schema.

---

## Correctness Properties

### Property 1: All counts non-negative
For all valid `DashboardSummary` responses, every integer count field SHALL be >= 0.

### Property 2: Task by_status sum <= tasks.total
`tasks.by_status` sub-counts summed SHALL be <= `tasks.total`.

### Property 3: Invoice status counts <= invoices.total
`draft + sent + paid + overdue` SHALL be <= `invoices.total`.

### Property 4: outstanding_amount non-negative decimal string
`invoices.total_outstanding_amount` SHALL be parseable as a non-negative decimal number.

### Property 5: unread_count non-negative
`notifications.unread_count` SHALL be a non-negative integer.

### Property 6: Nav badge hidden when count is 0
When `unreadCount` is 0, the Nav_Badge SHALL NOT be rendered.

### Property 7: MetricCard display round-trip
For any non-negative integer `n` passed as `count`, MetricCard SHALL render a string representation of `n` in the DOM.
For any string `s` passed as `value`, MetricCard SHALL render `s` directly in the DOM.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `GET /dashboard/summary` returns error | Dashboard page renders `Alert` variant=error; all MetricCards show `—` |
| `GET /notifications/unread-count` returns error | Nav badge simply not rendered (no badge on error) |
| DB error in dashboard service | Return HTTP 500 `{ error: 'Internal server error' }`, log via logger |
| `total_outstanding_amount` parse fails | Display `$0.00` as fallback |

---

## Testing Strategy

**Property tests** (100+ iterations each):
- P1-P5: Generate mock `DashboardSummary` objects with `fc.record(...)` — assert invariants
- P6: `fc.constantFrom(0, undefined)` for unreadCount — assert badge not rendered
- P7: `fc.nat()` for count — assert MetricCard renders correct string

**Unit tests:**
- `useDashboardSummary` calls correct endpoint
- `useUnreadNotificationCount` configures 60s polling and window focus refetch
- MetricCard renders `—` when count is undefined
- MetricCard renders `—` when count is null
- MetricCard renders formatted number when count is provided
- MetricCard renders `1,234` for count=1234
- MetricCard renders value string directly when value prop is provided
- Dashboard page renders 3 rows of metric cards
- Dashboard page renders Alert on error
- Dashboard page passes undefined count to all cards when loading
- Dashboard page passes value prop (not count) to Outstanding Amount card
- DashboardLayout renders nav badge when unreadCount > 0
- DashboardLayout does NOT render nav badge when unreadCount is 0
- DashboardLayout renders `99+` when unreadCount > 99
