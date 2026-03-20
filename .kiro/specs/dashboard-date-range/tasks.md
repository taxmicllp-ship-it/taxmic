# Dashboard Date Range Picker — Tasks

## Phase 1: Core (DONE ✅)

- [x] **TASK-DR-01** Create `DateRangePicker` component
  - File: `apps/web/src/components/ui/DateRangePicker.tsx`
  - Two-month dual calendar, quick presets sidebar, footer with Apply/Cancel
  - Internal `MonthCalendar` sub-component with day grid
  - State machine: closed → open → selecting → applied

- [x] **TASK-DR-02** Update `useDashboardSummary` hook to accept date range
  - File: `apps/web/src/features/dashboard/hooks/useDashboardSummary.ts`
  - Accepts optional `{ start: Date; end: Date }`
  - Passes `start_date` / `end_date` as query params
  - React Query key includes both dates for per-range caching

- [x] **TASK-DR-03** Wire `DateRangePicker` into dashboard page
  - File: `apps/web/src/pages/dashboard.tsx`
  - Default range: last 30 days
  - Replaces static "Today" button
  - `onChange` triggers `useDashboardSummary` re-fetch

---

## Phase 2: Backend Date Filtering (TODO)

- [x] **TASK-DR-04** Update `dashboard.service.ts` to accept and apply date range
  - File: `apps/api/src/modules/dashboard/dashboard.service.ts`
  - Read `start_date` and `end_date` from query params
  - Apply `WHERE created_at >= start_date AND created_at <= end_date` to all queries:
    - `clients` count
    - `contacts` count
    - `tasks` count and `by_status` breakdown
    - `invoices` count, status breakdown, and `total_outstanding_amount`
    - `notifications` unread count
  - If no dates provided, return all-time totals (current behaviour preserved)

- [x] **TASK-DR-05** Update `dashboard.controller.ts` to parse date params
  - File: `apps/api/src/modules/dashboard/dashboard.controller.ts`
  - Extract `start_date` and `end_date` from `req.query`
  - Validate format is `YYYY-MM-DD` (use zod or manual check)
  - Pass parsed `Date` objects to service

- [x] **TASK-DR-06** Add validation schema for dashboard query params
  - File: `apps/api/src/modules/dashboard/dashboard.validation.ts` (create)
  - Zod schema: `{ start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end_date: ... }`
  - Both optional, but if one is present both must be present
  - `end_date` must be >= `start_date`

---

## Phase 3: UX Polish (TODO)

- [x] **TASK-DR-07** URL persistence for date range
  - Encode active range as `?start=YYYY-MM-DD&end=YYYY-MM-DD` in URL query string
  - On mount, read from URL and initialise state (falls back to last 30 days)
  - Use `useSearchParams` from react-router-dom
  - Enables shareable dashboard links and browser back/forward navigation

- [x] **TASK-DR-08** Mobile-responsive dropdown
  - On screens < 768px, show single-month calendar instead of dual
  - Dropdown becomes full-width bottom sheet (position fixed, slide up animation)
  - Quick presets collapse into a horizontal scroll row above the calendar

- [ ] **TASK-DR-09** Loading state on range change
  - Show skeleton shimmer on KPI cards and charts while new range is fetching
  - Trigger button shows a subtle spinner while `isLoading` is true
  - Prevent double-apply while fetch is in flight

---

## Phase 4: Advanced Features (Future)

- [ ] **TASK-DR-10** Comparison mode
  - Add toggle "Compare to previous period" in picker footer
  - When enabled, fetch two ranges: selected + equivalent prior period
  - Show delta badges on KPI cards (e.g. `+12% vs prior period`)
  - Chart overlays prior period as a dashed line

- [ ] **TASK-DR-11** Fiscal year presets
  - Add "This FY" and "Last FY" to sidebar presets
  - Fiscal year start month configurable per firm (settings page)
  - Default: January (calendar year)

- [ ] **TASK-DR-12** Per-section date override
  - Each dashboard card gets an optional local date range override
  - Small calendar icon on card header opens a mini picker
  - Card shows "(custom range)" label when overridden
  - Global picker change does not affect overridden cards

- [ ] **TASK-DR-13** Export respects active range
  - "Export CSV" button on dashboard passes active `start_date`/`end_date` to export API
  - PDF report header shows the active date range

---

## Acceptance Criteria (Phase 1 — already met)

- Clicking trigger opens dropdown with correct default range (last 30 days)
- Clicking a quick preset updates both calendar view and footer inputs immediately
- Clicking a day sets it as range start; clicking a second day finalises the range
- Hovering over days while selecting shows live in-range preview
- Cancel closes dropdown without changing the active range
- Apply closes dropdown and triggers dashboard re-fetch with new dates
- Clicking outside the dropdown closes it without applying
- Dark mode renders correctly across all elements
- No TypeScript errors (`getDiagnostics` clean)
