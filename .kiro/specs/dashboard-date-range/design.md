# Dashboard Date Range Picker — Design

## Component Architecture

```
DateRangePicker (apps/web/src/components/ui/DateRangePicker.tsx)
├── Trigger Button          — shows active range label, opens dropdown
├── Dropdown Panel (720px wide)
│   ├── Sidebar (176px)     — quick preset buttons
│   └── Calendar Area
│       ├── Left MonthCalendar   — current view month
│       ├── Right MonthCalendar  — next month
│       └── Footer
│           ├── Start Date input (read-only display)
│           ├── End Date input   (read-only display)
│           ├── Cancel button
│           └── Apply Range button
└── MonthCalendar (internal sub-component)
    ├── Day headers (Su Mo Tu We Th Fr Sa)
    └── Day grid (7-col, aspect-square cells)
```

## State Machine

```
CLOSED
  → click trigger → OPEN (draft = current value)

OPEN
  → click quick preset → draft updated, activeQuick set, calendars navigate to start month
  → click day (no selecting) → selecting = clicked date, draft.start = draft.end = date
  → click day (selecting active) → range finalized, selecting = null
  → hover day (selecting active) → hovered = date (live preview)
  → click Cancel → draft reset to value, CLOSED
  → click Apply → onChange(draft) called, CLOSED
  → click outside → CLOSED (draft discarded)
```

## Visual States per Day Cell

| State | Classes |
|---|---|
| Normal | `text-slate-700 hover:bg-slate-100 hover:text-brand-600` |
| Selected (start or end) | `bg-brand-500 text-white font-bold shadow-sm rounded-lg` |
| In range | `bg-brand-500/10 text-brand-600 rounded-none` |
| Hover preview (in range) | same as in-range, computed live from `hovered` state |

## Trigger Button Label Format

- Single day selected: `Mar 18, 2026`
- Range: `Feb 17, 2026 – Mar 18, 2026`
- Format function: `MMM D, YYYY` using `Date.toLocaleDateString` equivalent

## Layout Dimensions

| Element | Value |
|---|---|
| Dropdown width | 720px |
| Sidebar width | 176px (w-44) |
| Dropdown z-index | 200 |
| Animation | `slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)` |
| Day cell | `aspect-square`, `text-[13px]`, `rounded-lg` |
| Month header font | `text-sm font-bold text-slate-800` |

## Sidebar Quick Presets

```
Today
Yesterday
Last 7 Days
Last 30 Days
This Month
Last Month
──────────
Custom Range  (label only, no action yet)
```

Active preset: `bg-white text-brand-600 font-semibold shadow-sm`
Inactive preset: `text-slate-500 hover:bg-white hover:text-slate-800`

## Calendar Navigation

- Left calendar shows `leftMonth / leftYear` (state)
- Right calendar always shows `leftMonth + 1` (derived, wraps Dec → Jan)
- `←` button on left header decrements left month
- `→` button on right header increments left month
- Quick preset selection navigates left calendar to `range.start` month (capped so right shows start+1)

## Footer Inputs

Two read-only text inputs with floating labels (`position: absolute, top: -8px`):
- Label: `START DATE` / `END DATE` — `text-[10px] font-bold text-slate-400 uppercase tracking-wider`
- Input: `bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm font-semibold text-slate-700`
- Background of label matches parent (`bg-white`) to cut through the border

## Hook Integration

```ts
// useDashboardSummary accepts optional DateRange
useDashboardSummary(range?: { start: Date; end: Date })

// Params sent to API
{ start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }

// React Query cache key
['dashboard', 'summary', '2026-02-17', '2026-03-18']
```

## Responsive Behaviour

- Dropdown is fixed 720px — on screens < 768px it will overflow; mobile support is a future task
- Trigger button is full-width on mobile (`w-full sm:w-auto`)
- On mobile, the "Today" quick preset is the recommended default interaction

## Dark Mode

All elements have `dark:` variants:
- Dropdown bg: `dark:bg-gray-900`
- Sidebar bg: `dark:bg-gray-800/50`
- Borders: `dark:border-gray-800`
- Day text: inherits from parent dark text classes
- Footer inputs: `dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300`
