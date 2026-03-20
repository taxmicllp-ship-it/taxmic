# Implementation Plan: ui-dashboard-live-data

## Overview

Backend endpoints first, then frontend hooks, then MetricCard extension, then dashboard page, then nav badge. The backend must be complete before frontend hooks can be tested end-to-end.

## Tasks

- [x] 1. Create dashboard summary backend endpoint
  - [x] 1.1 Create `apps/api/src/modules/dashboard/dashboard.service.ts`
    - Method: `async getSummary(firmId: string, userId: string): Promise<DashboardSummaryResponse>`
    - Use `Promise.all` to run all DB queries in parallel — no sequential N+1 queries
    - Destructure with explicit named variables matching query order (9 queries, 9 variables):
      `[clientsAgg, clientsActive, contactsTotal, tasksTotal, tasksOverdue, tasksByStatus, invoicesByStatus, invoicesOutstanding, unreadCount]`
    - Queries in order: `client.aggregate` (total), `client.count` (active), `contact.count`, `task.count` (total), `task.count` (overdue), `task.groupBy` (by status), `invoice.groupBy` (by status), `invoice.aggregate` (outstanding sum), `notification.count` (unread)
    - `overdue` tasks: `due_date < now AND status != 'completed'`
    - After `Promise.all`, normalize both `groupBy` results to fixed-key objects before building the response:
      - `byTaskStatus = { new: 0, in_progress: 0, waiting_client: 0, review: 0, completed: 0 }` — populate via `tasksByStatus.forEach`
      - `byInvoiceStatus = { draft: 0, sent: 0, paid: 0, overdue: 0 }` — populate via `invoicesByStatus.forEach`
    - `total_outstanding_amount`: `(invoicesOutstanding._sum.total_amount ?? 0).toFixed(2)`
    - Return typed `DashboardSummaryResponse` object built from named variables
    - _Requirements: 1.1–1.9_

  - [x] 1.2 Create `apps/api/src/modules/dashboard/dashboard.controller.ts`
    - Handler: `getSummary(req, res)` — extract `firmId` and `userId` from `req.user`, call `dashboardService.getSummary`, return HTTP 200 with JSON
    - On error: log via logger, return HTTP 500 `{ error: 'Internal server error' }`
    - _Requirements: 1.1, 1.9_

  - [x] 1.3 Create `apps/api/src/modules/dashboard/dashboard.routes.ts`
    - Register `GET /summary` with `authenticate` middleware → `dashboardController.getSummary`
    - _Requirements: 1.1, 1.2_

  - [x] 1.4 Register dashboard router in `apps/api/src/app.ts`
    - Add `import dashboardRouter from './modules/dashboard/dashboard.routes'`
    - Add `app.use('/api/v1/dashboard', dashboardRouter)`
    - _Requirements: 1.1_

- [x] 2. Add unread-count endpoint to notifications module
  - [x] 2.1 Add `countUnread` method to `apps/api/src/modules/notifications/notifications.repository.ts`
    - `async countUnread(userId: string, firmId: string): Promise<number>`
    - Single `prisma.notification.count({ where: { userId, firmId, is_read: false } })`
    - _Requirements: 2.4_

  - [x] 2.2 Add `getUnreadCount` method to `apps/api/src/modules/notifications/notifications.service.ts`
    - Calls `notificationsRepository.countUnread(userId, firmId)`
    - Returns `{ unread_count: number }`
    - _Requirements: 2.3_

  - [x] 2.3 Add `getUnreadCount` handler to `apps/api/src/modules/notifications/notifications.controller.ts`
    - Extract `userId` and `firmId` from `req.user`
    - Call `notificationsService.getUnreadCount(userId, firmId)`
    - Return HTTP 200 `{ unread_count: number }`
    - On error: return HTTP 500 `{ error: 'Internal server error' }`
    - _Requirements: 2.1–2.5_

  - [x] 2.4 Register `GET /unread-count` in `apps/api/src/modules/notifications/notifications.routes.ts`
    - Add `router.get('/unread-count', authenticate, notificationsController.getUnreadCount)`
    - _Requirements: 2.1, 2.2_

- [x] 3. Create frontend types and hooks
  - [x] 3.1 Create `apps/web/src/features/dashboard/types.ts`
    - Export `DashboardSummary` interface matching the exact response shape from Requirement 1, Criterion 4
    - _Requirements: 3.5_

  - [x] 3.2 Create `apps/web/src/features/dashboard/hooks/useDashboardSummary.ts`
    - Export `useDashboardSummary()` function
    - Use `useQuery<DashboardSummary>` with key `['dashboard', 'summary']`
    - Query fn: `api.get('/dashboard/summary').then(r => r.data)` using shared `api` axios instance from `lib/api.ts`
    - Return full `UseQueryResult`
    - _Requirements: 3.1–3.5_

  - [x] 3.3 Create `apps/web/src/features/notifications/hooks/useUnreadNotificationCount.ts`
    - Export `useUnreadNotificationCount()` function
    - Use `useQuery` with key `['notifications', 'unread-count']`
    - Query fn: `api.get('/notifications/unread-count').then(r => r.data)`
    - Configure `refetchInterval: 60_000` and `refetchOnWindowFocus: true`
    - Return `{ unreadCount: data?.unread_count, isLoading }`
    - _Requirements: 4.1–4.6_

- [x] 4. Extend MetricCard with count and value props
  - [x] 4.1 Update `apps/web/src/components/ui/MetricCard.tsx`
    - Add optional `count?: number | null` prop and optional `value?: string` prop to the component's props interface
    - Render priority: if `value` is defined (not undefined), render `value` string directly in the display position; otherwise fall back to `count`
    - When rendering `count`: format with `toLocaleString()` for numbers ≥ 1000; render `—` when `count` is `undefined` or `null`
    - When rendering `value`: render the string as-is (caller is responsible for formatting)
    - When both are `undefined`/`null`: render `—`
    - The display SHALL be visually larger than the label text (e.g. `text-2xl font-bold`)
    - All existing props (`label`, `description`, `path`, `iconPath`, `iconBg`) remain unchanged — no breaking changes
    - _Requirements: 5.1–5.6_

- [x] 5. Update Dashboard page with live data
  - [x] 5.1 Update `apps/web/src/pages/dashboard.tsx`
    - Import `useDashboardSummary` from `features/dashboard/hooks/useDashboardSummary`
    - Call `const { data, isLoading, isError } = useDashboardSummary()` on mount
    - When `isError`: render `Alert` variant=error above the metric rows
    - When `isLoading`: pass `count={undefined}` to all MetricCards (renders `—`)
    - Replace static navigation shortcuts with three responsive metric card rows:
      - Row 1 (4 cards, `grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4`): Clients Total, Contacts Total, Tasks Total, Unread Notifications — each with `path` to respective section
      - Row 2 (5 cards, `grid xl:grid-cols-5 md:grid-cols-3 grid-cols-1 gap-4`): Tasks New, In Progress, Waiting Client, Review, Completed
      - Row 3 (6 cards, `grid xl:grid-cols-6 md:grid-cols-3 grid-cols-1 gap-4`): Total Invoices, Draft, Sent, Paid, Overdue, Outstanding Amount
    - Outstanding Amount card: compute `formattedOutstanding` = `data?.invoices.total_outstanding_amount ? '$' + parseFloat(data.invoices.total_outstanding_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$0.00'` — pass as `value={formattedOutstanding}` (not `count`) to the MetricCard
    - _Requirements: 6.1–6.9_

- [x] 6. Add unread notification badge to DashboardLayout nav
  - [x] 6.1 Update `apps/web/src/components/layout/DashboardLayout.tsx`
    - Import `useUnreadNotificationCount` from `features/notifications/hooks/useUnreadNotificationCount`
    - Call `const { unreadCount } = useUnreadNotificationCount()` inside the `DashboardLayout` component
    - In the desktop nav link render loop: when `item.label === 'Notifications'` and `unreadCount > 0`, render a badge `<span>` after the label text: `min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold` — display `unreadCount > 99 ? '99+' : unreadCount`
    - Apply the same badge in the mobile drawer nav link render loop
    - When `unreadCount` is 0 or `undefined`: render nothing (no empty badge)
    - _Requirements: 7.1–7.7_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Write property-based tests
  - [x] 8.1 P1–P5: DashboardSummary invariants
    - File: `apps/web/src/__tests__/dashboard-summary.property.test.ts`
    - Generate mock `DashboardSummary` objects with `fc.record(...)` using `fc.nat()` for all count fields
    - Assert: all counts ≥ 0, by_status sum ≤ tasks.total, invoice status sum ≤ invoices.total, outstanding_amount parseable as non-negative decimal
    - Minimum 100 iterations
    - _Requirements: 8.1–8.5_

  - [x] 8.2 P6: Nav badge hidden when count is 0
    - `fc.constantFrom(0, undefined)` for unreadCount — render DashboardLayout, assert no badge element rendered; 100+ iterations
    - _Requirements: 8.6_

  - [x] 8.3 P7: MetricCard count and value round-trip display
    - `fc.nat()` for count — render MetricCard with `count`, assert rendered text equals `count.toLocaleString()`; 100+ iterations
    - `fc.string()` for value — render MetricCard with `value`, assert rendered text equals the value string directly (value takes priority over count)
    - _Requirements: 8.7_





## Notes

- Tasks marked with `*` are optional
- Tasks 1 and 2 (backend) must be completed before Tasks 3–6 (frontend) can be fully tested end-to-end
- Task 4 (MetricCard) must be completed before Task 5 (Dashboard page)
- Task 3.3 (useUnreadNotificationCount) must be completed before Task 6 (nav badge)
- `DashboardLayout` remains the approved layout wrapper per layout-governance.md
