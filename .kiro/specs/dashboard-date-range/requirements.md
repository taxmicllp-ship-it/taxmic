# Dashboard Date Range Picker — Requirements

## Overview
The dashboard date range picker controls the time window for all dashboard metrics. Every KPI, chart, and summary on the dashboard reflects data within the selected range.

## Current Behaviour (Implemented)
- `DateRangePicker` component at `apps/web/src/components/ui/DateRangePicker.tsx`
- Default range: last 30 days
- Quick presets: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month
- Two-month calendar view with range selection (click start → click end)
- Hover preview shows in-range highlight before second click is confirmed
- Apply/Cancel footer — changes only commit on "Apply Range"
- On apply, `useDashboardSummary(range)` re-fetches with `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- React Query key includes both dates so cache is per-range

## API Contract
```
GET /dashboard/summary?start_date=2026-02-17&end_date=2026-03-18
```
Backend must filter all counts/amounts to records created/updated within [start_date, end_date] inclusive.

## Affected Dashboard Sections
| Section | Filtered by date range |
|---|---|
| KPI Bar — Total Clients | clients.created_at |
| KPI Bar — Total Contacts | contacts.created_at |
| KPI Bar — Total Tasks | tasks.created_at |
| KPI Bar — Notifications | notifications.created_at |
| KPI Bar — Total Invoices | invoices.created_at |
| Task Pipeline chart | tasks.created_at |
| Invoice Summary donut | invoices.created_at |
| Outstanding amount | invoices with status != paid in range |

## Future Enhancements
1. **Comparison mode** — show delta vs previous equivalent period (e.g. "Last 30 days vs prior 30 days")
2. **URL persistence** — encode `?start=&end=` in query string so range survives page refresh and is shareable
3. **Fiscal year preset** — "This FY / Last FY" based on firm's configured fiscal year start month
4. **Per-section override** — allow individual dashboard cards to pin their own range independent of global picker
5. **Export with range** — CSV/PDF export of dashboard data respects the active date range
