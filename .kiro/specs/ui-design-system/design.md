# Design Document — ui-design-system

## Overview

Four design system additions and two dead-code removals, all confined to `apps/web/src/`. No backend changes.

1. **Badge** — shared `<span>` pill primitive; `TaskStatusBadge` and `InvoiceStatusBadge` refactored to delegate to it
2. **Modal + ConfirmModal** — shared overlay dialog primitives; all five `window.confirm()` usages replaced
3. **Spinner** — shared animated loading indicator (additive only)
4. **Dead code removal** — delete `TaskCard` and `PaymentHistory`

---

## Architecture

```
apps/web/src/
  components/ui/
    Badge.tsx          ← new
    Modal.tsx          ← new
    ConfirmModal.tsx   ← new
    Spinner.tsx        ← new
  features/
    tasks/components/
      TaskStatusBadge.tsx   ← modified: delegate to Badge
      TaskCard.tsx          ← deleted
    invoices/components/
      InvoiceStatusBadge.tsx ← modified: delegate to Badge
    payments/
      PaymentHistory.tsx    ← deleted
    clients/components/
      ClientList.tsx        ← modified: window.confirm → ConfirmModal
    contacts/components/
      ContactList.tsx       ← modified: window.confirm → ConfirmModal
  pages/
    tasks/
      index.tsx             ← modified: window.confirm → ConfirmModal
      [id].tsx              ← modified: window.confirm → ConfirmModal
    billing/
      subscription.tsx      ← modified: window.confirm → ConfirmModal
```

---

## Components and Interfaces

### 1. Badge

**File:** `apps/web/src/components/ui/Badge.tsx`

```ts
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}
```

**Variant → Tailwind class map:**
```ts
const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  purple:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};
```

**Size → Tailwind class map:**
```ts
const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};
```

**Base classes:** `inline-flex items-center rounded-full font-medium`

Renders a single `<span>` with merged classes.

---

### 2. TaskStatusBadge Refactor

**File:** `apps/web/src/features/tasks/components/TaskStatusBadge.tsx`

External API unchanged: `{ status: TaskStatus }`.

**Status → Badge variant + label map:**
```ts
const statusMap: Record<TaskStatus, { variant: BadgeVariant; label: string }> = {
  new:            { variant: 'neutral', label: 'New' },
  in_progress:    { variant: 'info',    label: 'In Progress' },
  waiting_client: { variant: 'warning', label: 'Waiting Client' },
  review:         { variant: 'purple',  label: 'Review' },
  completed:      { variant: 'success', label: 'Completed' },
};
```

Falls back to `{ variant: 'neutral', label: status }` for unrecognised values.

Renders: `<Badge variant={entry.variant}>{entry.label}</Badge>`

---

### 3. InvoiceStatusBadge Refactor

**File:** `apps/web/src/features/invoices/components/InvoiceStatusBadge.tsx`

External API unchanged: `{ status: InvoiceStatus }`.

**Status → Badge variant + label map:**
```ts
const statusMap: Record<InvoiceStatus, { variant: BadgeVariant; label: string }> = {
  draft:     { variant: 'neutral', label: 'Draft' },
  sent:      { variant: 'info',    label: 'Sent' },
  paid:      { variant: 'success', label: 'Paid' },
  overdue:   { variant: 'error',   label: 'Overdue' },
  cancelled: { variant: 'warning', label: 'Cancelled' },
};
```

Falls back to `{ variant: 'neutral', label: status }` for unrecognised values.

---

### 4. Modal

**File:** `apps/web/src/components/ui/Modal.tsx`

```ts
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Rendering:**
- When `isOpen` is false: return `null`
- When `isOpen` is true: render via `ReactDOM.createPortal` into `document.body`

**Structure:**
```
div.fixed.inset-0.z-50 (backdrop: bg-black/50, onClick → onClose)
  └── div.fixed.inset-0.flex.items-center.justify-center.p-4
        └── div.bg-white.dark:bg-gray-900.rounded-xl.shadow-xl.w-full.max-w-md
              (onClick stopPropagation — prevents backdrop click from firing)
              ├── div (header): h2#modal-title + close button (×)
              ├── div (body): children
              └── div (footer, if provided): footer
```

**Accessibility:**
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`
- Escape key listener via `useEffect` on `document` keydown
- Focus management: on open, focus first focusable element inside dialog; on close, return focus to previously focused element
- Focus trap: Tab/Shift+Tab cycle only within the dialog

**Focus trap implementation:** `useRef` on the dialog div + `keydown` handler that queries `[href, button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])]` and wraps Tab/Shift+Tab.

---

### 5. ConfirmModal

**File:** `apps/web/src/components/ui/ConfirmModal.tsx`

```ts
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;   // default: "Confirm"
  cancelLabel?: string;    // default: "Cancel"
  variant?: 'danger' | 'warning';  // default: "danger"
}
```

Built on `Modal`. Renders `message` as the body. Footer contains:
- Cancel `Button` (variant=outline or secondary) → calls `onClose`
- Confirm `Button` → calls `onConfirm`; styled red for `danger`, yellow for `warning`

`onConfirm` does NOT call `onClose` — the caller is responsible for closing.

---

### 6. window.confirm() Replacement Pattern

Each of the five sites follows the same pattern:

```tsx
// 1. Add state
const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingId, setPendingId] = useState<string | null>(null);

// 2. Replace window.confirm call
const handleDeleteClick = (id: string) => {
  setPendingId(id);
  setConfirmOpen(true);
};

// 3. Handle confirm
const handleConfirm = () => {
  if (pendingId) deleteMutation.mutate(pendingId);
  setConfirmOpen(false);
  setPendingId(null);
};

// 4. Render ConfirmModal
<ConfirmModal
  isOpen={confirmOpen}
  onClose={() => { setConfirmOpen(false); setPendingId(null); }}
  onConfirm={handleConfirm}
  title="Delete [entity]"
  message="Delete [entity name]? This cannot be undone."
  variant="danger"
/>
```

**Five replacement sites:**
1. `ClientList.tsx` — delete client
2. `ContactList.tsx` — delete contact
3. `pages/tasks/index.tsx` — delete task
4. `pages/tasks/[id].tsx` — delete task
5. `pages/billing/subscription.tsx` — cancel subscription (variant="warning", confirmLabel="Cancel Subscription")

---

### 7. Spinner

**File:** `apps/web/src/components/ui/Spinner.tsx`

```ts
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Size → dimensions:**
```ts
const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
```

Renders an SVG circle with `animate-spin`. Includes `aria-label="Loading"` and `role="status"`.

```tsx
<svg
  className={cn('animate-spin text-brand-500', sizeClasses[size], className)}
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  aria-label="Loading"
  role="status"
>
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
</svg>
```

---

### 8. Dead Code Removal

**TaskCard** (`apps/web/src/features/tasks/components/TaskCard.tsx`):
- Verify zero imports across `apps/web/src/` before deletion
- Delete file

**PaymentHistory** (`apps/web/src/features/payments/PaymentHistory.tsx`):
- Verify zero imports across `apps/web/src/` before deletion
- Delete file

---

## Correctness Properties

### Property 1: Badge variant isolation
For all valid `variant` values `v`, rendering `<Badge variant={v}>label</Badge>` SHALL produce a `<span>` whose className contains the color classes for `v` and no color classes for any other variant.

### Property 2: Badge no-crash
For all valid `variant` and `size` combinations, Badge SHALL render without throwing.

### Property 3: TaskStatusBadge completeness
For all `TaskStatus` values, TaskStatusBadge SHALL render a Badge with a non-empty label.

### Property 4: InvoiceStatusBadge completeness
For all `InvoiceStatus` values, InvoiceStatusBadge SHALL render a Badge with a non-empty label.

### Property 5: Modal closed-state invariant
When `isOpen` is false, Modal SHALL render no DOM nodes.

### Property 6: Modal Escape key — single onClose call
When `isOpen` is true and Escape is pressed, `onClose` SHALL be called exactly once.

### Property 7: Modal backdrop click — single onClose call
When `isOpen` is true and the backdrop is clicked, `onClose` SHALL be called exactly once.

### Property 8: Modal panel click — no onClose call
When the dialog panel itself is clicked (not the backdrop), `onClose` SHALL NOT be called.

### Property 9: ConfirmModal cancel isolation
When the cancel button is clicked, `onConfirm` SHALL NOT be called.

### Property 10: ConfirmModal confirm — single call
When the confirm button is clicked, `onConfirm` SHALL be called exactly once.

---

## Error Handling

| Scenario | Handling |
|---|---|
| Unrecognised `TaskStatus` passed to `TaskStatusBadge` | Fall back to `neutral` variant, display raw status string as label |
| Unrecognised `InvoiceStatus` passed to `InvoiceStatusBadge` | Fall back to `neutral` variant, display raw status string as label |
| Modal rendered with no focusable children | Focus trap gracefully no-ops (no crash) |
| Delete mutation fails after ConfirmModal confirm | Existing error handling in each page remains unchanged |

---

## Testing Strategy

**Property-based testing library:** `fast-check`.

**Property tests** (100+ iterations each):
- P1: `fc.constantFrom(...BadgeVariants)` — assert variant class isolation
- P2: `fc.record({ variant: fc.constantFrom(...), size: fc.constantFrom(...) })` — assert no-crash
- P3: `fc.constantFrom(...TaskStatuses)` — assert non-empty label
- P4: `fc.constantFrom(...InvoiceStatuses)` — assert non-empty label
- P5–P10: Modal/ConfirmModal interaction properties using mock callbacks

**Unit tests** (concrete examples):
- Badge renders correct classes for each variant
- Badge renders correct size classes
- Badge accepts and merges className prop
- TaskStatusBadge renders Badge (not raw span) for each status
- InvoiceStatusBadge renders Badge (not raw span) for each status
- Modal renders null when isOpen=false
- Modal renders dialog when isOpen=true
- Modal calls onClose on Escape key
- Modal calls onClose on backdrop click
- Modal does NOT call onClose on panel click
- ConfirmModal renders message text
- ConfirmModal cancel button calls onClose, not onConfirm
- ConfirmModal confirm button calls onConfirm
- Spinner renders with each size
- Spinner has aria-label="Loading"
- ClientList uses ConfirmModal (not window.confirm)
- ContactList uses ConfirmModal (not window.confirm)
- TasksPage index uses ConfirmModal (not window.confirm)
- TaskDetailPage uses ConfirmModal (not window.confirm)
- SubscriptionPage uses ConfirmModal (not window.confirm)
