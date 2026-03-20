# Implementation Plan: ui-ux-polish

## Overview

Six UX improvements across portal, invoices, clients, tasks, and documents. Order: portal nav tab first (smallest change), then portal invoice detail, then client linked records, then invoice edit/delete, then task assignees, then document delete confirmation.

## Tasks

- [x] 1. Add Dashboard tab to Portal navigation
  - [x] 1.1 Update `apps/web/src/components/layout/PortalLayout.tsx`
    - Add `{ to: '/portal/dashboard', label: 'Dashboard' }` as the first entry in the nav links array, before Documents, Invoices, and Tasks
    - `NavLink` already handles active state via `isActive` — no additional logic needed
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create Portal Invoice Detail page
  - [x] 2.1 Add `getInvoice` to `apps/web/src/features/portal/api/portal-api.ts`
    - Add: `getInvoice: (id: string) => api.get(\`/portal/invoices/${id}\`).then(r => r.data)`
    - _Requirements: 2.3_

  - [x] 2.2 Add `GET /invoices/:id` to portal backend
    - `apps/api/src/modules/portal/portal.routes.ts`: add `router.get('/invoices/:id', authenticate, portalController.getInvoiceById)`
    - `apps/api/src/modules/portal/portal.controller.ts`: add `getInvoiceById` handler — fetch invoice with line items scoped to `req.portalUser.clientId`; return 404 if not found or not belonging to client
    - _Requirements: 2.11_

  - [x] 2.3 Create `apps/web/src/pages/portal/invoices/[id].tsx`
    - Use `PortalLayout` via route nesting
    - Read `:id` from `useParams`
    - Fetch with `useQuery(['portal', 'invoices', id], () => portalApi.getInvoice(id))`
    - While loading: render loading indicator
    - On 404: render "Invoice not found."
    - On other error: render `Alert` variant=error
    - On success: render breadcrumb `← Invoices` (Link to `/portal/invoices`), invoice header (number, status badge, issue date, due date), line items table (description | qty | unit price | amount), totals (subtotal, tax, total)
    - When `invoice.status === 'sent'`: render Pay button using existing payment flow pattern from `PortalInvoicesPage`
    - When status is not `sent`: no Pay button
    - _Requirements: 2.1–2.10_

  - [x] 2.4 Register `/portal/invoices/:id` route in `App.tsx`
    - Add `import PortalInvoiceDetailPage from './pages/portal/invoices/[id]'`
    - Add `<Route path="/portal/invoices/:id" element={<PortalInvoiceDetailPage />} />` inside the `PortalLayout` route group
    - _Requirements: 2.2_

  - [x] 2.5 Update `PortalInvoicesPage` to link invoice numbers
    - File: `apps/web/src/pages/portal/invoices.tsx`
    - Wrap each invoice number/reference in `<Link to={/portal/invoices/${invoice.id}}>` so users can navigate to the detail page
    - _Requirements: 2.1_

- [x] 3. Add Linked Records panel to Client Detail
  - [x] 3.1 Create `apps/web/src/features/clients/components/LinkedRecordsPanel.tsx`
    - Props: `clientId: string`
    - Three independent expand/collapse sections: Contacts, Invoices, Tasks — each with its own `boolean` state
    - Each section fetches data lazily (only when expanded) using `useQuery` with `enabled: isExpanded`
    - Contacts query: `GET /api/v1/contacts?clientId={clientId}` — table columns: name (Link to `/contacts/:id/edit`), email
    - Invoices query: `GET /api/v1/invoices?clientId={clientId}` — table columns: number (Link to `/invoices/:id`), status badge, total, due date
    - Tasks query: `GET /api/v1/tasks?clientId={clientId}` — table columns: title (Link to `/tasks/:id`), status badge, due date
    - Empty state per section: "No contacts found.", "No invoices found.", "No tasks found."
    - Loading state per section: spinner or "Loading..." text
    - Error state per section: "Failed to load contacts/invoices/tasks." — does not affect other sections
    - Read-only: no create/edit/delete actions
    - _Requirements: 3.1–3.10_

  - [x] 3.2 Update `apps/web/src/features/clients/components/ClientDetails.tsx`
    - Import `LinkedRecordsPanel`
    - Render `<LinkedRecordsPanel clientId={client.id} />` below the existing client fields section
    - All existing client fields (email, phone, type, status, tax_id, website, notes) remain unchanged
    - _Requirements: 3.1, 3.10_

- [x] 4. Add Invoice Edit and Delete for draft invoices
  - [x] 4.1 Update `apps/web/src/pages/invoices/[id].tsx`
    - Import `ConfirmModal` from `components/ui/ConfirmModal` (from `ui-design-system` spec; use `window.confirm` as placeholder if not yet available)
    - Add state: `deleteConfirmOpen: boolean`, `deleteError: string | null`
    - When `invoice.status === 'draft'`: render Edit button as `<Link to={/invoices/${id}/edit}>` styled as a secondary button
    - When `invoice.status === 'draft'`: render Delete button that sets `deleteConfirmOpen = true`
    - Render `<ConfirmModal isOpen={deleteConfirmOpen} onClose={...} onConfirm={handleDelete} title="Delete Invoice" message={\`Delete invoice #${invoice.number}? This cannot be undone.\`} variant="danger" />`
    - `handleDelete`: call `DELETE /api/v1/invoices/:id` via `useMutation`; on success navigate to `/invoices`; on error set `deleteError` and show `Alert` variant=error
    - When status is not `draft`: neither Edit nor Delete button is rendered
    - _Requirements: 4.1, 4.2, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12_

  - [x] 4.2 Create `apps/web/src/pages/invoices/[id]/edit.tsx`
    - Use `DashboardLayout` via route nesting
    - Read `:id` from `useParams`
    - Fetch existing invoice with `useQuery(['invoices', id], () => invoicesApi.get(id))`
    - While loading: render loading indicator
    - On success: render `<InvoiceForm>` pre-populated with all invoice fields including line items
    - On submit: call `PATCH /api/v1/invoices/:id` via `useMutation` with updated data; navigate to `/invoices/:id` on success
    - On error: show `Alert` variant=error, stay on page
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 4.3 Register `/invoices/:id/edit` route in `App.tsx`
    - Add `import InvoiceEditPage from './pages/invoices/[id]/edit'`
    - Add `<Route path="/invoices/:id/edit" element={<InvoiceEditPage />} />` inside `DashboardLayout` route group, placed BEFORE `<Route path="/invoices/:id" ...>` to avoid route conflicts
    - _Requirements: 4.3_

- [x] 5. Add Task Assignee display and input
  - [x] 5.1 Update `apps/web/src/pages/tasks/[id].tsx`
    - Add an "Assignees" read-only section below existing task fields
    - Read `task.assignments` from the existing `GET /api/v1/tasks/:id` response
    - When `task.assignments?.length > 0`: render each assignee's email or name in a list
    - When `task.assignments` is empty or absent: render "No assignees."
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.2 Update `apps/web/src/features/tasks/components/TaskForm.tsx`
    - Add `assignees: z.string().optional()` to the task zod schema (comma-separated emails)
    - Add `assignees` field to the form's default values: `''`
    - Render `<Label htmlFor="assignees">Assignees (emails, comma-separated)</Label>` + `<InputField id="assignees" type="text" placeholder="user@example.com" {...register('assignees')} />` below the existing fields
    - When pre-populating for edit: join `task.assignments` emails into a comma-separated string
    - On submit: parse `assignees` string into trimmed email array; include in payload
    - The field is optional — empty string submits successfully with no assignees
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 6. Add Document Delete Confirmation
  - [x] 6.1 Update `apps/web/src/features/documents/components/DocumentList.tsx`
    - Import `ConfirmModal` from `components/ui/ConfirmModal` (from `ui-design-system` spec; use `window.confirm` as placeholder if not yet available)
    - Add state: `confirmOpen: boolean`, `pendingDeleteId: string | null`, `pendingDeleteName: string`
    - Replace existing direct delete call (or `window.confirm`) with: `setPendingDeleteId(id); setPendingDeleteName(doc.name); setConfirmOpen(true)`
    - Add `handleConfirm`: call `deleteDoc.mutate(pendingDeleteId)`, close modal, clear pending state
    - Render `<ConfirmModal isOpen={confirmOpen} onClose={...} onConfirm={handleConfirm} title="Delete Document" message={\`Delete "${pendingDeleteName}"? This cannot be undone.\`} variant="danger" />`
    - On `deleteDoc` error: display user-readable error message
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Write property-based tests
  - [x] 8.1 P2: Invoice status guard — Edit/Delete buttons absent for non-draft
    - File: `apps/web/src/__tests__/invoice-detail.property.test.tsx`
    - `fc.constantFrom('sent', 'paid', 'overdue', 'cancelled')` for invoice status — render `InvoiceDetailPage`, assert Edit and Delete buttons are not in the DOM; 100+ iterations
    - _Requirements: 4.13_

  - [x] 8.2 P3: Document delete — ConfirmModal shown before mutation
    - `fc.record({ id: fc.uuid(), name: fc.string({ minLength: 1 }) })` for document — simulate delete click, assert ConfirmModal is open and `deleteDoc.mutate` has NOT been called; 100+ iterations
    - _Requirements: 6.6_

## Notes

- Tasks marked with `*` are optional
- Task 4.1 and 6.1 depend on `ConfirmModal` from the `ui-design-system` spec — use `window.confirm` as a temporary placeholder if executing this spec first
- Task 4.2 creates a nested route file at `pages/invoices/[id]/edit.tsx` — ensure the directory `pages/invoices/[id]/` is created
- `DashboardLayout` remains the approved layout wrapper for all staff pages per layout-governance.md
- `PortalLayout` is used for all `/portal/*` pages
