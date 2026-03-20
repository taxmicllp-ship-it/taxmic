# Requirements Document

## Introduction

This spec covers six UX gaps identified in the Phase 10 UI audit (`docs/audits/UI-COMPLETE-INVENTORY-PHASE-10.md`). The gaps span the client portal, invoice management, client detail page, task assignee display, and document deletion safety. All changes are confined to `apps/web/` (React + TypeScript, react-query, Tailwind CSS) with minor backend additions where noted. Layout rules: `DashboardLayout` for all staff pages, `PortalLayout` for portal pages.

---

## Glossary

- **PortalLayout**: The authenticated layout wrapper for all `/portal/*` pages (`apps/web/src/components/layout/PortalLayout.tsx`). Renders a tab nav bar and an `<Outlet />`.
- **DashboardLayout**: The approved layout wrapper for all staff pages (`apps/web/src/components/layout/DashboardLayout.tsx`).
- **Portal_Nav**: The tab navigation bar rendered inside `PortalLayout`.
- **PortalDashboardPage**: The page at `/portal/dashboard` (`apps/web/src/pages/portal/dashboard.tsx`).
- **PortalInvoicesPage**: The page at `/portal/invoices` (`apps/web/src/pages/portal/invoices.tsx`).
- **PortalInvoiceDetailPage**: The new page at `/portal/invoices/:id`.
- **InvoiceDetailPage**: The staff-side page at `/invoices/:id` (`apps/web/src/pages/invoices/[id].tsx`).
- **InvoiceEditPage**: The new staff-side page at `/invoices/:id/edit`.
- **ClientDetails**: The component at `apps/web/src/features/clients/components/ClientDetails.tsx` rendered on `/clients/:id`.
- **LinkedRecordsPanel**: The new sub-section added to `ClientDetails` showing contacts, invoices, and tasks for a client.
- **TaskDetailPage**: The page at `/tasks/:id` (`apps/web/src/pages/tasks/[id].tsx`).
- **TaskForm**: The form component at `apps/web/src/features/tasks/components/TaskForm.tsx`.
- **ConfirmModal**: The reusable confirmation dialog from the `ui-design-system` spec.
- **InvoiceForm**: The form component at `apps/web/src/features/invoices/components/InvoiceForm.tsx`.
- **Portal_API**: The portal backend module at `apps/api/src/modules/portal/`.
- **Invoice_API**: The invoices backend module at `apps/api/src/modules/billing/invoices/`.
- **Tasks_API**: The tasks backend module at `apps/api/src/modules/tasks/`.
- **DRAFT**: Invoice status value `draft` — the only status that permits editing or deletion.
- **Sent**: Invoice status value `sent`.
- **Assignee**: A user linked to a task via the `task_assignments` table.

---

## Requirements

---

### Requirement 1: Portal Dashboard Navigation Tab (GAP-012)

**User Story:** As a portal user, I want a Dashboard tab in the portal navigation bar, so that I can navigate to my dashboard from any portal page without knowing the direct URL.

#### Acceptance Criteria

1. THE `Portal_Nav` SHALL render a "Dashboard" tab as the first item, linking to `/portal/dashboard`, before the existing Documents, Invoices, and Tasks tabs.
2. WHEN a portal user is on `/portal/dashboard`, THE `Portal_Nav` SHALL display the Dashboard tab with the active underline indicator (matching the existing active style: `border-brand-500 text-brand-600 dark:text-brand-400`).
3. WHEN a portal user is on any other portal page, THE `Portal_Nav` SHALL display the Dashboard tab without the active underline indicator.
4. THE `PortalLayout` SHALL continue to protect all portal routes by redirecting unauthenticated users to `/portal/login`.
5. THE `PortalDashboardPage` SHALL remain accessible at `/portal/dashboard` and continue to display live counts for Documents, Invoices, Outstanding Invoices, and Tasks.

---

### Requirement 2: Portal Invoice Detail Page (GAP-016)

**User Story:** As a portal user, I want to view the full details of an invoice including line items, so that I can understand what I am being charged for before paying.

#### Acceptance Criteria

1. THE `PortalInvoicesPage` SHALL render each invoice number as a clickable link navigating to `/portal/invoices/:id`.
2. THE `PortalInvoiceDetailPage` SHALL be accessible at `/portal/invoices/:id` and wrapped in `PortalLayout`.
3. WHEN a portal user navigates to `/portal/invoices/:id`, THE `PortalInvoiceDetailPage` SHALL fetch invoice data from `GET /api/v1/portal/invoices/:id`.
4. THE `PortalInvoiceDetailPage` SHALL display an invoice header containing: invoice number, status badge, issue date, and due date.
5. THE `PortalInvoiceDetailPage` SHALL display a line items table with columns: description, quantity, unit price, and amount.
6. THE `PortalInvoiceDetailPage` SHALL display invoice totals: subtotal, tax, and total.
7. WHEN the invoice status is `sent`, THE `PortalInvoiceDetailPage` SHALL display a Pay button that initiates the payment flow.
8. WHEN the invoice status is not `sent`, THE `PortalInvoiceDetailPage` SHALL NOT display the Pay button.
9. IF `GET /api/v1/portal/invoices/:id` returns a 404, THEN THE `PortalInvoiceDetailPage` SHALL display "Invoice not found."
10. IF `GET /api/v1/portal/invoices/:id` returns an error, THEN THE `PortalInvoiceDetailPage` SHALL display a user-readable error message.
11. THE `Portal_API` SHALL expose a `GET /api/v1/portal/invoices/:id` endpoint that returns the invoice with its line items, restricted to the authenticated portal user's client.
12. FOR ALL valid portal invoice IDs, fetching the invoice detail SHALL return the same line items as the invoice list entry for that invoice (data consistency property).

---

### Requirement 3: Client Detail — Linked Records (GAP-015)

**User Story:** As a staff user, I want to see contacts, invoices, and tasks linked to a client on the client detail page, so that I can get a complete picture of a client's activity without navigating away.

#### Acceptance Criteria

1. THE `ClientDetails` component SHALL render a `LinkedRecordsPanel` below the existing client fields section.
2. THE `LinkedRecordsPanel` SHALL contain three collapsible or tabbed sub-sections: Contacts, Invoices, and Tasks.
3. WHEN the Contacts sub-section is expanded, THE `LinkedRecordsPanel` SHALL fetch contacts from `GET /api/v1/contacts?clientId=:id` and display them in a compact table with columns: name, email, and a link to `/contacts/:id/edit`.
4. WHEN the Invoices sub-section is expanded, THE `LinkedRecordsPanel` SHALL fetch invoices from `GET /api/v1/invoices?clientId=:id` and display them in a compact table with columns: number, status badge, total, due date, and a link to `/invoices/:id`.
5. WHEN the Tasks sub-section is expanded, THE `LinkedRecordsPanel` SHALL fetch tasks from `GET /api/v1/tasks?clientId=:id` and display them in a compact table with columns: title, status badge, due date, and a link to `/tasks/:id`.
6. WHEN a sub-section returns zero records, THE `LinkedRecordsPanel` SHALL display "No contacts found.", "No invoices found.", or "No tasks found." respectively.
7. THE `LinkedRecordsPanel` SHALL be read-only — it SHALL NOT provide create, edit, or delete actions.
8. WHILE a sub-section is loading, THE `LinkedRecordsPanel` SHALL display a loading skeleton or spinner for that sub-section.
9. IF a sub-section fetch returns an error, THEN THE `LinkedRecordsPanel` SHALL display "Failed to load [contacts/invoices/tasks]." for that sub-section only, without affecting the other sub-sections.
10. THE `ClientDetails` component SHALL continue to display all existing client fields (email, phone, type, status, tax_id, website, notes) unchanged.

---

### Requirement 4: Invoice Edit and Delete (GAP-014)

**User Story:** As a staff user, I want to edit or delete a draft invoice, so that I can correct mistakes before sending it to a client.

#### Acceptance Criteria

1. THE `InvoiceDetailPage` SHALL display an Edit button when the invoice status is `draft`.
2. WHEN a staff user clicks the Edit button on a draft invoice, THE `InvoiceDetailPage` SHALL navigate to `/invoices/:id/edit`.
3. THE `InvoiceEditPage` SHALL be accessible at `/invoices/:id/edit`, wrapped in `DashboardLayout`, and render a pre-populated `InvoiceForm`.
4. WHEN the `InvoiceEditPage` loads, THE `InvoiceEditPage` SHALL fetch the existing invoice from `GET /api/v1/invoices/:id` and pre-populate all `InvoiceForm` fields including line items.
5. WHEN a staff user submits the `InvoiceEditPage` form, THE `InvoiceEditPage` SHALL call `PATCH /api/v1/invoices/:id` with the updated data and navigate to `/invoices/:id` on success.
6. IF `PATCH /api/v1/invoices/:id` returns an error, THEN THE `InvoiceEditPage` SHALL display the error message without navigating away.
7. THE `InvoiceDetailPage` SHALL display a Delete button when the invoice status is `draft`.
8. WHEN a staff user clicks the Delete button on a draft invoice, THE `InvoiceDetailPage` SHALL display a `ConfirmModal` with the message "Delete invoice #[number]? This cannot be undone."
9. WHEN a staff user confirms deletion in the `ConfirmModal`, THE `InvoiceDetailPage` SHALL call `DELETE /api/v1/invoices/:id` and navigate to `/invoices` on success.
10. WHEN a staff user cancels the `ConfirmModal`, THE `InvoiceDetailPage` SHALL dismiss the modal and take no further action.
11. IF `DELETE /api/v1/invoices/:id` returns an error, THEN THE `InvoiceDetailPage` SHALL display the error message and keep the user on the current page.
12. WHEN the invoice status is not `draft`, THE `InvoiceDetailPage` SHALL NOT display the Edit button or the Delete button.
13. FOR ALL invoices with status `sent`, `paid`, or `overdue`, the Edit and Delete buttons SHALL be absent from the `InvoiceDetailPage` (status-guard property).

---

### Requirement 5: Task Assignee UI (GAP-010)

**User Story:** As a staff user, I want to see who is assigned to a task and assign users when creating or editing a task, so that responsibility is clear and trackable.

#### Acceptance Criteria

1. WHEN a staff user views `/tasks/:id`, THE `TaskDetailPage` SHALL display a read-only "Assignees" section listing the names of all users assigned to the task.
2. WHEN a task has no assignees, THE `TaskDetailPage` SHALL display "No assignees." in the Assignees section.
3. THE `TaskDetailPage` SHALL fetch assignee data from the existing `GET /api/v1/tasks/:id` response, using the `assignments` field if populated by the backend.
4. THE `TaskForm` SHALL include an assignee input field that accepts one or more user email addresses (text input, comma-separated or multi-value).
5. WHEN a staff user submits `TaskForm` with one or more assignee emails, THE `TaskForm` SHALL include the assignee emails in the submission payload.
6. WHEN `TaskForm` is pre-populated for editing, THE `TaskForm` SHALL pre-populate the assignee field with the existing assignees' emails.
7. IF the assignee field is left empty, THE `TaskForm` SHALL submit successfully with no assignees (the field is optional).
8. WHERE the backend `POST /api/v1/tasks/:id/assign` endpoint is available, THE `TaskDetailPage` SHALL call it after task creation or update to persist assignee changes.
9. THE assignee input SHALL accept free-text email values and SHALL NOT require a full user-picker dropdown for MVP.

---

### Requirement 6: Document Delete Confirmation (GAP-018)

**User Story:** As a staff user, I want a confirmation dialog before a document is deleted, so that I do not accidentally lose files.

#### Acceptance Criteria

1. WHEN a staff user clicks the delete action for a document in `/documents`, THE `DocumentList` component SHALL display a `ConfirmModal` with the message "Delete [document name]? This cannot be undone."
2. WHEN a staff user confirms deletion in the `ConfirmModal`, THE `DocumentList` SHALL call `deleteDoc.mutate(id)` and close the modal.
3. WHEN a staff user cancels the `ConfirmModal`, THE `DocumentList` SHALL dismiss the modal and NOT call `deleteDoc.mutate`.
4. THE `DocumentList` SHALL NOT call `deleteDoc.mutate(id)` immediately on delete button click (the existing `window.confirm`-free direct call pattern SHALL be replaced).
5. IF `deleteDoc.mutate` returns an error, THEN THE `DocumentList` SHALL display a user-readable error message.
6. FOR ALL document delete actions, the deletion SHALL only proceed after explicit user confirmation (no-accidental-delete property).
