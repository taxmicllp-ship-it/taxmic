# Design Document — ui-ux-polish

## Overview

Six UX gaps addressed across portal navigation, invoice management, client detail, task assignees, and document deletion. Work spans `apps/web/src/` with minor backend additions where noted. Layout rules: `DashboardLayout` for all staff pages, `PortalLayout` for portal pages.

1. **Portal Dashboard nav tab** — add Dashboard as first tab in `PortalLayout`
2. **Portal Invoice Detail page** — `/portal/invoices/:id` with line items and pay button
3. **Client Detail — Linked Records** — contacts, invoices, tasks panels on `/clients/:id`
4. **Invoice Edit and Delete** — edit/delete actions for draft invoices
5. **Task Assignee UI** — display and assign users on task pages
6. **Document Delete Confirmation** — `ConfirmModal` before document deletion

---

## Architecture

```
apps/web/src/
  components/layout/
    PortalLayout.tsx              ← modified: add Dashboard tab
  pages/
    portal/
      invoices/[id].tsx           ← new: PortalInvoiceDetailPage
    invoices/
      [id]/edit.tsx               ← new: InvoiceEditPage
  features/
    clients/components/
      ClientDetails.tsx           ← modified: add LinkedRecordsPanel
      LinkedRecordsPanel.tsx      ← new
    portal/api/
      portal-api.ts               ← modified: add getPortalInvoice(id)
    documents/components/
      DocumentList.tsx            ← modified: window.confirm → ConfirmModal
    tasks/components/
      TaskForm.tsx                ← modified: add assignee field
  pages/
    tasks/[id].tsx                ← modified: add assignees display
    invoices/[id].tsx             ← modified: add edit/delete for draft
  App.tsx                         ← modified: register 2 new routes

apps/api/src/
  modules/portal/
    portal.controller.ts          ← modified: add getInvoiceById handler
    portal.routes.ts              ← modified: add GET /invoices/:id
```

---

## Components and Interfaces

### 1. Portal Dashboard Nav Tab

**File:** `apps/web/src/components/layout/PortalLayout.tsx`

Add `{ to: '/portal/dashboard', label: 'Dashboard' }` as the first entry in the nav links array, before Documents, Invoices, and Tasks.

```tsx
{[
  { to: '/portal/dashboard', label: 'Dashboard' },
  { to: '/portal/documents', label: 'Documents' },
  { to: '/portal/invoices', label: 'Invoices' },
  { to: '/portal/tasks', label: 'Tasks' },
].map(({ to, label }) => (
  <NavLink key={to} to={to} className={({ isActive }) => `...`}>
    {label}
  </NavLink>
))}
```

`NavLink` already handles active state via `isActive` — no additional logic needed.

---

### 2. Portal Invoice Detail Page

**File:** `apps/web/src/pages/portal/invoices/[id].tsx`

```
PortalLayout (via route nesting)
  └── div.max-w-3xl.mx-auto
        ├── Link ← Invoices (breadcrumb)
        ├── Invoice header: number, status badge, issue date, due date
        ├── Line items table: description | qty | unit price | amount
        ├── Totals: subtotal, tax, total
        ├── Pay button (only when status === 'sent') → initiates payment flow
        └── Alert (error state)
```

**Data fetching:** `useQuery(['portal', 'invoices', id], () => portalApi.getInvoice(id))`

**Payment flow:** reuse existing `usePayment` hook or `PaymentButton` component from `features/payments/` — same pattern as `PortalInvoicesPage`.

**404 handling:** when API returns 404, render "Invoice not found."

**Route registration in App.tsx:**
```tsx
<Route path="/portal/invoices/:id" element={<PortalInvoiceDetailPage />} />
```
Inside the `PortalLayout` route group, placed before any catch-all.

**PortalInvoicesPage change:** wrap each invoice number in `<Link to={/portal/invoices/${invoice.id}}>`.

**Backend — portal.routes.ts:** add `GET /invoices/:id` route protected by portal `authenticate` middleware.

**Backend — portal.controller.ts:** add `getInvoiceById` handler that fetches the invoice with line items, scoped to the authenticated portal user's `clientId`. Returns 404 if not found or not belonging to the client.

**portalApi.getInvoice:** add to `apps/web/src/features/portal/api/portal-api.ts`:
```ts
getInvoice: (id: string) => api.get(`/portal/invoices/${id}`).then(r => r.data),
```

---

### 3. Client Detail — Linked Records Panel

**File:** `apps/web/src/features/clients/components/LinkedRecordsPanel.tsx` (new)

```
div (LinkedRecordsPanel)
  ├── Section: Contacts
  │     ├── toggle/expand button
  │     └── table: name | email | Edit link → /contacts/:id/edit
  ├── Section: Invoices
  │     ├── toggle/expand button
  │     └── table: number | status badge | total | due date | link → /invoices/:id
  └── Section: Tasks
        ├── toggle/expand button
        └── table: title | status badge | due date | link → /tasks/:id
```

**Props:** `clientId: string`

**Data fetching:** each section uses its own `useQuery`, fetching only when expanded (lazy). Queries:
- Contacts: `GET /api/v1/contacts?clientId={clientId}`
- Invoices: `GET /api/v1/invoices?clientId={clientId}`
- Tasks: `GET /api/v1/tasks?clientId={clientId}`

**Expand state:** `useState<'contacts' | 'invoices' | 'tasks' | null>` — one section open at a time (accordion pattern), or use three independent `boolean` states for independent toggling. Independent booleans are simpler and preferred.

**Empty state:** "No contacts found.", "No invoices found.", "No tasks found."

**Error state:** "Failed to load contacts.", etc. — per-section, does not affect other sections.

**Loading state:** spinner or "Loading..." text per section.

**Read-only:** no create/edit/delete actions in this panel.

**ClientDetails.tsx change:** import and render `<LinkedRecordsPanel clientId={client.id} />` below the existing fields section.

---

### 4. Invoice Edit and Delete

**InvoiceDetailPage changes** (`apps/web/src/pages/invoices/[id].tsx`):

- When `invoice.status === 'draft'`: render Edit button (`<Link to={/invoices/${id}/edit}>`) and Delete button
- Delete button: open `ConfirmModal` with title "Delete Invoice" and message `Delete invoice #${invoice.number}? This cannot be undone.`
- On confirm: call `DELETE /api/v1/invoices/:id` via `useMutation`, navigate to `/invoices` on success
- On error: show `Alert` variant=error
- When status is not `draft`: neither button is rendered

**InvoiceEditPage** (`apps/web/src/pages/invoices/[id]/edit.tsx`):

```
DashboardLayout (via route nesting)
  └── div.max-w-3xl.mx-auto
        ├── h1 "Edit Invoice"
        └── InvoiceForm (pre-populated)
```

- Fetch existing invoice via `useQuery(['invoices', id], () => invoicesApi.get(id))`
- Pre-populate `InvoiceForm` with all fields including line items
- On submit: call `PATCH /api/v1/invoices/:id` via `useMutation`, navigate to `/invoices/:id` on success
- On error: show `Alert` variant=error, stay on page

**Route registration in App.tsx:**
```tsx
<Route path="/invoices/:id/edit" element={<InvoiceEditPage />} />
```
Inside `DashboardLayout` route group, placed BEFORE `/invoices/:id` to avoid route conflicts.

**ConfirmModal dependency:** this task depends on `ui-design-system` spec completing Task 5 (ConfirmModal). If executing before that spec, use `window.confirm` as a temporary placeholder.

---

### 5. Task Assignee UI

**TaskDetailPage changes** (`apps/web/src/pages/tasks/[id].tsx`):

Add an "Assignees" read-only section below the existing task fields:
```tsx
<div>
  <h3>Assignees</h3>
  {task.assignments?.length > 0
    ? task.assignments.map(a => <span key={a.userId}>{a.user?.email ?? a.userId}</span>)
    : <p>No assignees.</p>
  }
</div>
```

The `assignments` field is expected from `GET /api/v1/tasks/:id` — if the backend already includes it, use it directly. If not populated, display "No assignees." gracefully.

**TaskForm changes** (`apps/web/src/features/tasks/components/TaskForm.tsx`):

Add an assignee input field:
```tsx
<div>
  <Label htmlFor="assignees">Assignees (emails, comma-separated)</Label>
  <InputField
    id="assignees"
    type="text"
    placeholder="user@example.com, user2@example.com"
    {...register('assignees')}
  />
</div>
```

**Zod schema addition:**
```ts
assignees: z.string().optional(), // comma-separated emails, optional
```

**On submit:** parse `assignees` string into an array of trimmed email strings. Include in submission payload. If `POST /api/v1/tasks/:id/assign` endpoint is available, call it after task creation/update. If not available, include `assignees` in the task payload and let the backend handle it.

**Pre-population (edit mode):** when `TaskForm` receives existing task data, join `task.assignments` emails into a comma-separated string for the field.

---

### 6. Document Delete Confirmation

**File:** `apps/web/src/features/documents/components/DocumentList.tsx`

Replace the existing direct `deleteDoc.mutate(id)` call (or any `window.confirm` pattern) with `ConfirmModal`:

```tsx
const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
const [pendingDeleteName, setPendingDeleteName] = useState<string>('');

const handleDeleteClick = (id: string, name: string) => {
  setPendingDeleteId(id);
  setPendingDeleteName(name);
  setConfirmOpen(true);
};

const handleConfirm = () => {
  if (pendingDeleteId) deleteDoc.mutate(pendingDeleteId);
  setConfirmOpen(false);
  setPendingDeleteId(null);
};
```

Render:
```tsx
<ConfirmModal
  isOpen={confirmOpen}
  onClose={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
  onConfirm={handleConfirm}
  title="Delete Document"
  message={`Delete "${pendingDeleteName}"? This cannot be undone.`}
  variant="danger"
/>
```

**ConfirmModal dependency:** depends on `ui-design-system` spec Task 5. If executing before that spec, use `window.confirm` as a temporary placeholder.

---

## Data Models

### Portal Invoice Detail response
```ts
interface PortalInvoiceDetail {
  id: string;
  number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total_amount: number;
  line_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}
```

### Task with assignments
```ts
interface TaskWithAssignments {
  // ... existing task fields
  assignments?: Array<{
    userId: string;
    user?: { email: string; firstName: string; lastName: string };
  }>;
}
```

### LinkedRecordsPanel — compact contact row
```ts
interface CompactContact { id: string; first_name: string; last_name: string; email: string | null; }
```

---

## Correctness Properties

### Property 1: Portal invoice data consistency
For all valid portal invoice IDs, fetching the invoice detail SHALL return the same line items as the invoice list entry for that invoice.

### Property 2: Invoice edit/delete status guard
For all invoices with status `sent`, `paid`, or `overdue`, the Edit and Delete buttons SHALL be absent from `InvoiceDetailPage`.

### Property 3: Document delete — no accidental delete
For all document delete actions, deletion SHALL only proceed after explicit user confirmation via `ConfirmModal`.

### Property 4: ConfirmModal cancel safety (all sites)
For all 5+ replacement sites (clients, contacts, tasks index, tasks detail, subscription, documents), when the cancel button is clicked, no mutation SHALL be triggered.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `GET /portal/invoices/:id` returns 404 | Render "Invoice not found." |
| `GET /portal/invoices/:id` returns error | Render `Alert` variant=error |
| `GET /contacts?clientId=` returns error | LinkedRecordsPanel shows "Failed to load contacts." for that section only |
| `PATCH /invoices/:id` returns error | InvoiceEditPage shows `Alert` variant=error, stays on page |
| `DELETE /invoices/:id` returns error | InvoiceDetailPage shows `Alert` variant=error |
| `deleteDoc.mutate` returns error | DocumentList shows user-readable error message |
| Task `assignments` field absent from API response | TaskDetailPage renders "No assignees." gracefully |

---

## Testing Strategy

**Unit tests:**
- PortalLayout renders Dashboard tab as first nav item
- PortalLayout Dashboard tab is active when on `/portal/dashboard`
- PortalInvoiceDetailPage renders invoice header fields
- PortalInvoiceDetailPage renders line items table
- PortalInvoiceDetailPage shows Pay button when status=sent
- PortalInvoiceDetailPage hides Pay button when status=paid
- PortalInvoiceDetailPage renders "Invoice not found." on 404
- LinkedRecordsPanel renders three section headers
- LinkedRecordsPanel shows "No contacts found." when contacts array is empty
- LinkedRecordsPanel shows error message when contacts fetch fails
- InvoiceDetailPage shows Edit and Delete buttons when status=draft
- InvoiceDetailPage hides Edit and Delete buttons when status=sent
- InvoiceDetailPage hides Edit and Delete buttons when status=paid
- InvoiceEditPage pre-populates form with existing invoice data
- InvoiceEditPage calls PATCH on submit
- TaskDetailPage renders Assignees section
- TaskDetailPage shows "No assignees." when assignments is empty
- TaskForm renders assignees input field
- DocumentList renders ConfirmModal on delete click (not window.confirm)
- DocumentList does not call deleteDoc.mutate when ConfirmModal is cancelled

**Property tests:**
- P2: `fc.constantFrom('sent', 'paid', 'overdue')` for invoice status — assert Edit/Delete buttons absent; 100+ iterations
- P3: document delete actions — assert ConfirmModal shown before any mutation; 100+ iterations
