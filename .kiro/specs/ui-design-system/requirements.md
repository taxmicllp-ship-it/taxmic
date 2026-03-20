# Requirements Document

## Introduction

This spec covers four design system gaps identified in the Phase 10 UI audit (`docs/audits/UI-COMPLETE-INVENTORY-PHASE-10.md`). The work is purely frontend, scoped to `apps/web/src/`. All pages continue to use `DashboardLayout` as the approved layout wrapper per `layout-governance.md` — no layout changes are in scope.

The four items are:

1. **Badge component (V-004)** — shared `Badge` primitive + refactor of `TaskStatusBadge` and `InvoiceStatusBadge` to delegate rendering to it.
2. **Modal component (V-005)** — shared `Modal` + `ConfirmModal` primitives + replacement of all five `window.confirm()` usages.
3. **Spinner component (V-006)** — shared `Spinner` primitive for future use.
4. **Dead code removal (V-011, V-012)** — delete `TaskCard` and `PaymentHistory`, which are defined but never imported by any page.

---

## Glossary

- **Badge**: A shared `<span>` pill component at `apps/web/src/components/ui/Badge.tsx` that renders a styled label given a variant and size.
- **Modal**: A shared overlay dialog component at `apps/web/src/components/ui/Modal.tsx` that renders a centered panel with backdrop, focus trap, and keyboard dismissal.
- **ConfirmModal**: A component built on `Modal` at `apps/web/src/components/ui/ConfirmModal.tsx` used for all destructive confirmation dialogs.
- **Spinner**: A shared animated loading indicator at `apps/web/src/components/ui/Spinner.tsx`.
- **TaskStatusBadge**: Existing feature-level component at `apps/web/src/features/tasks/components/TaskStatusBadge.tsx` — keeps its external API, delegates rendering to `Badge`.
- **InvoiceStatusBadge**: Existing feature-level component at `apps/web/src/features/invoices/components/InvoiceStatusBadge.tsx` — keeps its external API, delegates rendering to `Badge`.
- **TaskCard**: Dead component at `apps/web/src/features/tasks/components/TaskCard.tsx` — never imported by any page.
- **PaymentHistory**: Dead component at `apps/web/src/features/payments/PaymentHistory.tsx` — never imported by any page.
- **window.confirm()**: Browser-native blocking dialog — currently used in 5 locations for destructive confirmations. All 5 must be replaced with `ConfirmModal`.
- **Design_System**: The shared UI component library living in `apps/web/src/components/ui/`.
- **variant**: A named style preset passed as a prop to `Badge`, `ConfirmModal`, or other design system components.

---

## Requirements

### Requirement 1: Badge Component

**User Story:** As a developer, I want a shared `Badge` component in the design system, so that status pills across the application are rendered consistently without duplicating Tailwind class strings in every feature component.

#### Acceptance Criteria

1. THE Design_System SHALL provide a `Badge` component exported from `apps/web/src/components/ui/Badge.tsx`.
2. THE Badge SHALL accept a `variant` prop with values: `success`, `warning`, `error`, `info`, `neutral`, `purple`.
3. THE Badge SHALL accept a `size` prop with values: `sm` and `md`, defaulting to `md`.
4. THE Badge SHALL accept a `children` prop of type `ReactNode` and render it as the badge label.
5. THE Badge SHALL render as an `<span>` element with `inline-flex`, `rounded-full`, and `font-medium` base classes.
6. WHEN `variant` is `success`, THE Badge SHALL apply green background and text color classes.
7. WHEN `variant` is `warning`, THE Badge SHALL apply yellow background and text color classes.
8. WHEN `variant` is `error`, THE Badge SHALL apply red background and text color classes.
9. WHEN `variant` is `info`, THE Badge SHALL apply blue background and text color classes.
10. WHEN `variant` is `neutral`, THE Badge SHALL apply gray background and text color classes.
11. WHEN `variant` is `purple`, THE Badge SHALL apply purple background and text color classes.
12. WHEN `size` is `sm`, THE Badge SHALL apply smaller padding and text size classes than `md`.
13. THE Badge SHALL support dark mode by applying appropriate `dark:` Tailwind variants for each color.
14. THE Badge SHALL accept an optional `className` prop and merge it with the base classes.

#### Correctness Properties

- FOR ALL valid `variant` values, THE Badge SHALL render exactly one `<span>` element (invariant: single root element).
- FOR ALL valid `variant` values `v`, rendering `<Badge variant={v}>label</Badge>` SHALL produce a `<span>` whose `className` contains the color classes defined for `v` and no color classes defined for any other variant (variant isolation property).
- FOR ALL valid `size` values, THE Badge SHALL render without throwing (no-crash property).

---

### Requirement 2: TaskStatusBadge Refactor

**User Story:** As a developer, I want `TaskStatusBadge` to delegate its rendering to the shared `Badge` component, so that task status pills stay visually consistent with all other badges without maintaining a separate inline `<span>` implementation.

#### Acceptance Criteria

1. THE TaskStatusBadge SHALL continue to accept a `status` prop of type `TaskStatus` — the external API MUST NOT change.
2. THE TaskStatusBadge SHALL map each `TaskStatus` value to a `Badge` variant and label string internally.
3. WHEN rendered, THE TaskStatusBadge SHALL render a `Badge` component rather than a raw `<span>`.
4. THE TaskStatusBadge SHALL map `new` → `neutral`, `in_progress` → `info`, `waiting_client` → `warning`, `review` → `purple`, `completed` → `success`.
5. IF an unrecognised `status` value is passed, THE TaskStatusBadge SHALL fall back to the `neutral` variant.
6. THE TaskStatusBadge SHALL NOT expose any new props beyond the existing `status` prop.

#### Correctness Properties

- FOR ALL `TaskStatus` values, THE TaskStatusBadge SHALL render a `Badge` with a non-empty label (completeness property).
- FOR ALL `TaskStatus` values, THE TaskStatusBadge SHALL render the same visual output before and after the refactor (behavioural equivalence — verified by snapshot or visual comparison).

---

### Requirement 3: InvoiceStatusBadge Refactor

**User Story:** As a developer, I want `InvoiceStatusBadge` to delegate its rendering to the shared `Badge` component, so that invoice status pills are consistent with the design system.

#### Acceptance Criteria

1. THE InvoiceStatusBadge SHALL continue to accept a `status` prop of type `InvoiceStatus` — the external API MUST NOT change.
2. THE InvoiceStatusBadge SHALL map each `InvoiceStatus` value to a `Badge` variant and label string internally.
3. WHEN rendered, THE InvoiceStatusBadge SHALL render a `Badge` component rather than a raw `<span>`.
4. THE InvoiceStatusBadge SHALL map `draft` → `neutral`, `sent` → `info`, `paid` → `success`, `overdue` → `error`, `cancelled` → `warning`.
5. IF an unrecognised `status` value is passed, THE InvoiceStatusBadge SHALL fall back to the `neutral` variant.
6. THE InvoiceStatusBadge SHALL NOT expose any new props beyond the existing `status` prop.

#### Correctness Properties

- FOR ALL `InvoiceStatus` values, THE InvoiceStatusBadge SHALL render a `Badge` with a non-empty label (completeness property).
- FOR ALL `InvoiceStatus` values, THE InvoiceStatusBadge SHALL render the same visual output before and after the refactor (behavioural equivalence).

---

### Requirement 4: Modal Component

**User Story:** As a developer, I want a shared `Modal` component in the design system, so that dialogs across the application have a consistent, accessible overlay pattern.

#### Acceptance Criteria

1. THE Design_System SHALL provide a `Modal` component exported from `apps/web/src/components/ui/Modal.tsx`.
2. THE Modal SHALL accept an `isOpen` prop of type `boolean` that controls visibility.
3. THE Modal SHALL accept an `onClose` prop of type `() => void` called when the modal requests dismissal.
4. THE Modal SHALL accept a `title` prop of type `string` rendered as the dialog heading.
5. THE Modal SHALL accept a `children` prop of type `ReactNode` rendered as the dialog body.
6. THE Modal SHALL accept an optional `footer` prop of type `ReactNode` rendered below the body.
7. WHEN `isOpen` is `false`, THE Modal SHALL render nothing (no DOM nodes).
8. WHEN `isOpen` is `true`, THE Modal SHALL render a full-screen backdrop overlay behind the dialog panel.
9. WHEN the user clicks the backdrop, THE Modal SHALL call `onClose`.
10. WHEN the user presses the Escape key while the modal is open, THE Modal SHALL call `onClose`.
11. THE Modal SHALL trap focus within the dialog panel while open, so that Tab and Shift+Tab cycle only through focusable elements inside the modal.
12. THE Modal SHALL set `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the title element.
13. WHEN `isOpen` transitions from `false` to `true`, THE Modal SHALL move focus to the first focusable element inside the dialog.
14. WHEN `isOpen` transitions from `true` to `false`, THE Modal SHALL return focus to the element that was focused before the modal opened.
15. THE Modal SHALL render the dialog panel centered horizontally and vertically on the viewport.
16. THE Modal backdrop SHALL have a semi-transparent dark overlay (`bg-black/50` or equivalent).

#### Correctness Properties

- WHEN `isOpen` is `false`, THE Modal SHALL render no DOM nodes (closed-state invariant).
- WHEN `isOpen` is `true` and the Escape key is fired, THE Modal SHALL call `onClose` exactly once (single-call property).
- WHEN `isOpen` is `true` and the backdrop is clicked, THE Modal SHALL call `onClose` exactly once.
- WHEN the dialog panel itself is clicked (not the backdrop), THE Modal SHALL NOT call `onClose` (click-isolation property).

---

### Requirement 5: ConfirmModal Component

**User Story:** As a developer, I want a `ConfirmModal` component built on `Modal`, so that all destructive confirmation dialogs share a consistent, non-blocking, accessible pattern instead of `window.confirm()`.

#### Acceptance Criteria

1. THE Design_System SHALL provide a `ConfirmModal` component exported from `apps/web/src/components/ui/ConfirmModal.tsx`.
2. THE ConfirmModal SHALL be built on top of the `Modal` component.
3. THE ConfirmModal SHALL accept `isOpen` (`boolean`), `onClose` (`() => void`), `onConfirm` (`() => void`), `title` (`string`), and `message` (`string`) as required props.
4. THE ConfirmModal SHALL accept `confirmLabel` (string, default `"Confirm"`), `cancelLabel` (string, default `"Cancel"`), and `variant` (`"danger" | "warning"`, default `"danger"`) as optional props.
5. THE ConfirmModal SHALL render the `message` string as the dialog body.
6. THE ConfirmModal SHALL render a cancel button that calls `onClose` when clicked.
7. THE ConfirmModal SHALL render a confirm button that calls `onConfirm` when clicked.
8. WHEN `variant` is `"danger"`, THE ConfirmModal SHALL style the confirm button with red/destructive colors.
9. WHEN `variant` is `"warning"`, THE ConfirmModal SHALL style the confirm button with yellow/warning colors.
10. THE ConfirmModal SHALL be non-blocking — `onConfirm` is a synchronous callback invoked when the user clicks confirm; the caller is responsible for any async operations.
11. WHEN the user clicks cancel, THE ConfirmModal SHALL call `onClose` and SHALL NOT call `onConfirm`.
12. WHEN the user dismisses via Escape or backdrop click, THE ConfirmModal SHALL call `onClose` and SHALL NOT call `onConfirm`.

#### Correctness Properties

- WHEN the cancel button is clicked, `onConfirm` SHALL NOT be called (cancel isolation property).
- WHEN the Escape key is pressed, `onConfirm` SHALL NOT be called.
- WHEN the confirm button is clicked, `onConfirm` SHALL be called exactly once (single-call property).
- WHEN the confirm button is clicked, `onClose` SHALL NOT be called by `ConfirmModal` itself (separation of concerns — the caller decides whether to close).

---

### Requirement 6: Replace window.confirm() with ConfirmModal

**User Story:** As a user, I want destructive actions to show a proper modal confirmation dialog, so that I can review what I'm about to delete before committing, without the browser's native blocking dialog interrupting the page.

#### Acceptance Criteria

1. THE ClientList (`apps/web/src/features/clients/components/ClientList.tsx`) SHALL replace its `window.confirm()` delete confirmation with a `ConfirmModal`.
2. THE ContactList (`apps/web/src/features/contacts/components/ContactList.tsx`) SHALL replace its `window.confirm()` delete confirmation with a `ConfirmModal`.
3. THE TasksPage index (`apps/web/src/pages/tasks/index.tsx`) SHALL replace its `window.confirm()` delete confirmation with a `ConfirmModal`.
4. THE TaskDetail page (`apps/web/src/pages/tasks/[id].tsx`) SHALL replace its `window.confirm()` delete confirmation with a `ConfirmModal`.
5. THE SubscriptionPage (`apps/web/src/pages/billing/subscription.tsx`) SHALL replace its `window.confirm()` cancel-subscription confirmation with a `ConfirmModal`.
6. WHEN a `ConfirmModal` is shown for a delete action, THE page SHALL pass a `title` describing the entity being deleted and a `message` asking the user to confirm.
7. WHEN the user confirms in the `ConfirmModal`, THE page SHALL proceed with the delete/cancel API call.
8. WHEN the user cancels or dismisses the `ConfirmModal`, THE page SHALL NOT make any API call.
9. THE Design_System SHALL have zero remaining `window.confirm()` calls in `apps/web/src/` after this change.

#### Correctness Properties

- FOR ALL 5 replacement sites, WHEN the cancel button is clicked, no mutation SHALL be triggered (cancel-safety property).
- FOR ALL 5 replacement sites, WHEN the confirm button is clicked, exactly one mutation SHALL be triggered (single-mutation property).

---

### Requirement 7: Spinner Component

**User Story:** As a developer, I want a shared `Spinner` component in the design system, so that future loading states can use a consistent animated indicator rather than ad-hoc text or skeleton patterns.

#### Acceptance Criteria

1. THE Design_System SHALL provide a `Spinner` component exported from `apps/web/src/components/ui/Spinner.tsx`.
2. THE Spinner SHALL accept a `size` prop with values: `sm`, `md`, `lg`, defaulting to `md`.
3. THE Spinner SHALL accept an optional `className` prop merged with the base classes.
4. THE Spinner SHALL render an animated circular indicator using either an SVG or CSS animation.
5. WHEN `size` is `sm`, THE Spinner SHALL render at approximately 16×16px.
6. WHEN `size` is `md`, THE Spinner SHALL render at approximately 24×24px.
7. WHEN `size` is `lg`, THE Spinner SHALL render at approximately 32×32px.
8. THE Spinner SHALL include an `aria-label="Loading"` or equivalent accessible label so screen readers announce the loading state.
9. THE Spinner SHALL NOT replace existing skeleton loading patterns in portal pages — it is additive only.

#### Correctness Properties

- FOR ALL valid `size` values, THE Spinner SHALL render without throwing (no-crash property).
- FOR ALL valid `size` values, THE Spinner SHALL render exactly one root element (single-root invariant).

---

### Requirement 8: Dead Code Removal — TaskCard

**User Story:** As a developer, I want the unused `TaskCard` component removed from the codebase, so that the component inventory accurately reflects what is actually in use and new developers are not confused by orphaned files.

#### Acceptance Criteria

1. THE codebase SHALL have no file at `apps/web/src/features/tasks/components/TaskCard.tsx` after this change.
2. BEFORE removal, THE Developer SHALL verify that no file in `apps/web/src/` imports `TaskCard` directly or via barrel exports.
3. IF any import of `TaskCard` is found, THE Developer SHALL resolve the import before deleting the file.
4. THE removal of `TaskCard` SHALL NOT cause any TypeScript compilation errors.
5. THE removal of `TaskCard` SHALL NOT cause any runtime errors on any existing page.

#### Correctness Properties

- AFTER removal, a full TypeScript compilation of `apps/web/` SHALL produce zero new errors attributable to the deleted file (compilation invariant).

---

### Requirement 9: Dead Code Removal — PaymentHistory

**User Story:** As a developer, I want the unused `PaymentHistory` component removed from the codebase, so that the payments feature folder contains only components that are actively rendered.

#### Acceptance Criteria

1. THE codebase SHALL have no file at `apps/web/src/features/payments/PaymentHistory.tsx` after this change.
2. BEFORE removal, THE Developer SHALL verify that no file in `apps/web/src/` imports `PaymentHistory` directly or via barrel exports.
3. IF any import of `PaymentHistory` is found, THE Developer SHALL resolve the import before deleting the file.
4. THE removal of `PaymentHistory` SHALL NOT cause any TypeScript compilation errors.
5. THE removal of `PaymentHistory` SHALL NOT cause any runtime errors on any existing page.

#### Correctness Properties

- AFTER removal, a full TypeScript compilation of `apps/web/` SHALL produce zero new errors attributable to the deleted file (compilation invariant).
