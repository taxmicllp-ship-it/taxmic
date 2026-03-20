# Implementation Plan: ui-design-system

## Overview

Four new UI primitives, two badge refactors, five window.confirm replacements, and two dead-code deletions. All work is in `apps/web/src/`. Order: Badge first (other components depend on it), then Modal/ConfirmModal, then Spinner, then badge refactors, then window.confirm replacements, then dead code removal.

## Tasks

- [x] 1. Create Badge component
  - [x] 1.1 Create `apps/web/src/components/ui/Badge.tsx`
    - Define `BadgeVariant` type: `'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple'`
    - Define `BadgeSize` type: `'sm' | 'md'`
    - Props: `variant: BadgeVariant`, `size?: BadgeSize` (default `'md'`), `children: React.ReactNode`, `className?: string`
    - Variant class map: success=green, warning=yellow, error=red, info=blue, neutral=gray, purple=purple — each with `dark:` variants
    - Size class map: sm=`px-2 py-0.5 text-xs`, md=`px-2.5 py-1 text-xs`
    - Base classes: `inline-flex items-center rounded-full font-medium`
    - Render single `<span>` with merged classes via `cn()` or template literal
    - _Requirements: 1.1–1.14_

  - [x] 1.2 Write unit tests for Badge
    - Test: renders correct variant classes for each of the 6 variants
    - Test: renders correct size classes for `sm` and `md`
    - Test: merges optional `className` prop
    - Test: renders children as label text
    - _Requirements: 1.1–1.14_

  - [x] 1.3 Write property tests for Badge
    - P1: variant isolation — `fc.constantFrom('success','warning','error','info','neutral','purple')` — assert only that variant's color classes are present
    - P2: no-crash — `fc.record({ variant: fc.constantFrom(...), size: fc.constantFrom('sm','md') })` — assert renders without throwing; 100+ iterations
    - _Requirements: Badge Correctness Properties_

- [x] 2. Refactor TaskStatusBadge to use Badge
  - [x] 2.1 Update `apps/web/src/features/tasks/components/TaskStatusBadge.tsx`
    - Add `import Badge from '../../../components/ui/Badge'`
    - Define `statusMap` mapping each `TaskStatus` to `{ variant: BadgeVariant, label: string }`:
      - `new` → `neutral` / `'New'`
      - `in_progress` → `info` / `'In Progress'`
      - `waiting_client` → `warning` / `'Waiting Client'`
      - `review` → `purple` / `'Review'`
      - `completed` → `success` / `'Completed'`
    - Fall back to `{ variant: 'neutral', label: status }` for unrecognised values
    - Replace raw `<span>` rendering with `<Badge variant={entry.variant}>{entry.label}</Badge>`
    - External `status` prop API MUST NOT change
    - _Requirements: 2.1–2.6_

  - [x] 2.2 Write property test for TaskStatusBadge
    - P3: `fc.constantFrom(...TaskStatuses)` — assert Badge rendered with non-empty label; 100+ iterations
    - _Requirements: TaskStatusBadge Correctness Properties_

- [x] 3. Refactor InvoiceStatusBadge to use Badge
  - [x] 3.1 Update `apps/web/src/features/invoices/components/InvoiceStatusBadge.tsx`
    - Add `import Badge from '../../../components/ui/Badge'`
    - Define `statusMap` mapping each `InvoiceStatus` to `{ variant: BadgeVariant, label: string }`:
      - `draft` → `neutral` / `'Draft'`
      - `sent` → `info` / `'Sent'`
      - `paid` → `success` / `'Paid'`
      - `overdue` → `error` / `'Overdue'`
      - `cancelled` → `warning` / `'Cancelled'`
    - Fall back to `{ variant: 'neutral', label: status }` for unrecognised values
    - Replace raw `<span>` rendering with `<Badge variant={entry.variant}>{entry.label}</Badge>`
    - External `status` prop API MUST NOT change
    - _Requirements: 3.1–3.6_

  - [x] 3.2 Write property test for InvoiceStatusBadge
    - P4: `fc.constantFrom(...InvoiceStatuses)` — assert Badge rendered with non-empty label; 100+ iterations
    - _Requirements: InvoiceStatusBadge Correctness Properties_

- [x] 4. Create Modal component
  - [x] 4.1 Create `apps/web/src/components/ui/Modal.tsx`
    - Props: `isOpen: boolean`, `onClose: () => void`, `title: string`, `children: React.ReactNode`, `footer?: React.ReactNode`
    - When `isOpen` is false: return `null`
    - When `isOpen` is true: render via `ReactDOM.createPortal` into `document.body`
    - Structure: full-screen backdrop div (`bg-black/50 fixed inset-0 z-50`) with `onClick → onClose`; centered dialog panel div with `onClick={e => e.stopPropagation()}`
    - Dialog panel: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`
    - Header: `<h2 id="modal-title">` + close button (×) that calls `onClose`
    - Body: `children`
    - Footer: render `footer` prop if provided
    - Escape key: `useEffect` adds `keydown` listener on `document`; calls `onClose` when `key === 'Escape'` and `isOpen`; cleanup on unmount/close
    - Focus management: on open, save `document.activeElement`, focus first focusable element in dialog; on close, return focus to saved element
    - Focus trap: `keydown` handler on dialog div — Tab wraps to first focusable, Shift+Tab wraps to last focusable
    - _Requirements: 4.1–4.16_

  - [x] 4.2 Write unit tests for Modal
    - Test: renders null when isOpen=false
    - Test: renders dialog when isOpen=true
    - Test: calls onClose when Escape key pressed
    - Test: calls onClose when backdrop clicked
    - Test: does NOT call onClose when dialog panel clicked
    - Test: renders title in h2
    - Test: renders children as body
    - Test: renders footer when provided
    - _Requirements: 4.1–4.16_

  - [x] 4.3 Write property tests for Modal
    - P5: closed-state invariant — `fc.boolean()` for isOpen=false — assert no DOM nodes
    - P6: Escape key single call — assert onClose called exactly once
    - P7: backdrop click single call — assert onClose called exactly once
    - P8: panel click isolation — assert onClose NOT called; 100+ iterations each
    - _Requirements: Modal Correctness Properties_

- [x] 5. Create ConfirmModal component
  - [x] 5.1 Create `apps/web/src/components/ui/ConfirmModal.tsx`
    - Props: `isOpen`, `onClose`, `onConfirm`, `title`, `message` (required); `confirmLabel` (default `'Confirm'`), `cancelLabel` (default `'Cancel'`), `variant: 'danger' | 'warning'` (default `'danger'`)
    - Built on `Modal` — pass `isOpen`, `onClose`, `title` to Modal
    - Body: render `<p>{message}</p>`
    - Footer: cancel `Button` calling `onClose`; confirm `Button` calling `onConfirm` — styled red for `danger`, yellow for `warning`
    - `onConfirm` does NOT call `onClose` — caller's responsibility
    - _Requirements: 5.1–5.12_

  - [x] 5.2 Write unit tests for ConfirmModal
    - Test: renders message text
    - Test: cancel button calls onClose, not onConfirm
    - Test: confirm button calls onConfirm
    - Test: confirm button does NOT call onClose
    - Test: danger variant applies red classes to confirm button
    - Test: warning variant applies yellow classes to confirm button
    - _Requirements: 5.1–5.12_

  - [x] 5.3 Write property tests for ConfirmModal
    - P9: cancel isolation — assert onConfirm NOT called when cancel clicked; 100+ iterations
    - P10: confirm single call — assert onConfirm called exactly once when confirm clicked; 100+ iterations
    - _Requirements: ConfirmModal Correctness Properties_

- [x] 6. Replace window.confirm() with ConfirmModal — 5 sites
  - [x] 6.1 Replace `window.confirm` in `apps/web/src/features/clients/components/ClientList.tsx`
    - Add `import ConfirmModal from '../../../components/ui/ConfirmModal'`
    - Add state: `confirmOpen`, `pendingDeleteId`
    - Replace `window.confirm(...)` call with `setPendingDeleteId(id); setConfirmOpen(true)`
    - Add `handleConfirm`: call `deleteMutation.mutate(pendingDeleteId)`, close modal, clear pending id
    - Render `<ConfirmModal isOpen={confirmOpen} onClose={...} onConfirm={handleConfirm} title="Delete Client" message="Delete this client? This cannot be undone." variant="danger" />`
    - _Requirements: 6.1, 6.6, 6.7, 6.8_

  - [x] 6.2 Replace `window.confirm` in `apps/web/src/features/contacts/components/ContactList.tsx`
    - Same pattern as 6.1 — title: "Delete Contact", message: "Delete this contact? This cannot be undone."
    - _Requirements: 6.2, 6.6, 6.7, 6.8_

  - [x] 6.3 Replace `window.confirm` in `apps/web/src/pages/tasks/index.tsx`
    - Same pattern — title: "Delete Task", message: "Delete this task? This cannot be undone."
    - _Requirements: 6.3, 6.6, 6.7, 6.8_

  - [x] 6.4 Replace `window.confirm` in `apps/web/src/pages/tasks/[id].tsx`
    - Same pattern — title: "Delete Task", message: "Delete this task? This cannot be undone."
    - _Requirements: 6.4, 6.6, 6.7, 6.8_

  - [x] 6.5 Replace `window.confirm` in `apps/web/src/pages/billing/subscription.tsx`
    - Same pattern — title: "Cancel Subscription", message: "Cancel your subscription? This cannot be undone.", variant="warning", confirmLabel="Cancel Subscription"
    - _Requirements: 6.5, 6.6, 6.7, 6.8_

  - [x] 6.6 Write unit tests for window.confirm replacements
    - For each of the 5 sites: test that ConfirmModal is rendered (not window.confirm), cancel does not trigger mutation, confirm triggers mutation
    - _Requirements: 6.9_

- [x] 7. Create Spinner component
  - [x] 7.1 Create `apps/web/src/components/ui/Spinner.tsx`
    - Props: `size?: 'sm' | 'md' | 'lg'` (default `'md'`), `className?: string`
    - Size map: sm=`w-4 h-4`, md=`w-6 h-6`, lg=`w-8 h-8`
    - Render SVG with `animate-spin`, `aria-label="Loading"`, `role="status"`
    - SVG: circle (opacity-25) + path (opacity-75) — standard spinner shape
    - _Requirements: 7.1–7.9_

  - [x] 7.2 Write unit tests for Spinner
    - Test: renders with each size
    - Test: has aria-label="Loading"
    - Test: renders single root element
    - _Requirements: 7.1–7.9_

- [x] 8. Remove dead code — TaskCard
  - [x] 8.1 Verify no imports of `TaskCard` exist in `apps/web/src/`
    - Search for `TaskCard` imports across all files; confirm zero results
    - _Requirements: 8.2, 8.3_

  - [x] 8.2 Delete `apps/web/src/features/tasks/components/TaskCard.tsx`
    - _Requirements: 8.1, 8.4, 8.5_

- [x] 9. Remove dead code — PaymentHistory
  - [x] 9.1 Verify no imports of `PaymentHistory` exist in `apps/web/src/`
    - Search for `PaymentHistory` imports across all files; confirm zero results
    - _Requirements: 9.2, 9.3_

  - [x] 9.2 Delete `apps/web/src/features/payments/PaymentHistory.tsx`
    - _Requirements: 9.1, 9.4, 9.5_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Run TypeScript compilation check; ensure zero new errors
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional
- `fast-check` must be available as a dev dependency in `apps/web` — add if not present: `npm install -D fast-check`
- The `cn()` utility for class merging — use `clsx` or a simple template literal if `cn` is not already available
- Tasks 8 and 9 (dead code removal) are safe to execute at any point after Task 1 completes, as they have no dependencies on the new components
