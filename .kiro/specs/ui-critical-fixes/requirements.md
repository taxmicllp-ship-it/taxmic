# Requirements Document

## Introduction

This spec covers three critical production blockers identified in the UI audit (`docs/audits/UI-COMPLETE-INVENTORY-PHASE-10.md`). All three gaps prevent real users from completing core workflows:

1. **GAP-001 (CRITICAL)** — The `/reset-password` route and page are missing. The forgot-password flow already sends a reset token, but there is no page to consume it, making password recovery completely broken end-to-end.
2. **GAP-004 / V-014 (HIGH)** — The `client_id` field on both `TaskForm` and `InvoiceForm` is a raw UUID text input. No real user can be expected to type a UUID. A searchable `ClientPicker` component is required.
3. **GAP-005 / BUG-001 (CRITICAL)** — The admin plans create/edit form has no `stripe_price_id` field. The `stripe_price_id` is a dedicated top-level column on the `plans` table and is required for Stripe billing to function. Additionally, the form uses raw `<input>` and `<table>` elements instead of the design system components (`InputField`, `Table`).

All backend endpoints for these features already exist. This spec covers frontend implementation only.

---

## Glossary

- **ResetPasswordPage**: The new page at `/reset-password` that allows a user to set a new password using a token received via email.
- **Reset_Token**: A short-lived, single-use token issued by the backend's `POST /api/v1/auth/forgot-password` endpoint and delivered to the user via email (or displayed in dev mode). It is passed as a `?token=` query parameter in the reset link.
- **ClientPicker**: A reusable form component (`apps/web/src/components/form/ClientPicker.tsx`) that provides a searchable dropdown for selecting a client by name, resolving to a `client_id` UUID value in the parent form.
- **AdminPlansPage**: The existing page at `/billing/admin/plans` (`apps/web/src/pages/billing/admin-plans.tsx`) used by admins to create and manage subscription plans.
- **stripe_price_id**: A Stripe-issued identifier (e.g. `price_1ABC...`) stored as a **dedicated top-level column** on the `plans` table (`stripe_price_id VARCHAR(255)`). It is NOT stored inside the `features` JSON column. Required for Stripe checkout and subscription creation to work correctly.
- **AuthPageLayout**: The shared layout component at `apps/web/src/components/layout/AuthPageLayout.tsx` used by all public auth pages (`/login`, `/register`, `/forgot-password`).
- **InputField**: The design system input component at `apps/web/src/components/form/InputField.tsx`.
- **Table / TableHeader / TableBody / TableRow / TableCell**: Design system table components at `apps/web/src/components/ui/Table.tsx`.
- **getErrorMessage**: Utility at `apps/web/src/lib/getErrorMessage.ts` used to extract a human-readable error string from API error responses.
- **Controller**: The `react-hook-form` `Controller` component used to integrate non-native inputs (like `ClientPicker`) with a form's state.

---

## Requirements

### Requirement 1: Reset Password Page (GAP-001)

**User Story:** As a user who has forgotten my password, I want to visit the reset link from my email and set a new password, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user navigates to `/reset-password`, THE ResetPasswordPage SHALL render using `AuthPageLayout`.
2. WHEN the `/reset-password` route is loaded, THE ResetPasswordPage SHALL read the `token` query parameter from the URL using `useSearchParams`.
3. THE ResetPasswordPage SHALL present a form with two fields: `password` (new password) and `confirmPassword` (confirmation).
4. THE ResetPasswordPage SHALL validate the form using `react-hook-form` with `zodResolver` and a Zod schema that enforces: `password` is a string of minimum 8 characters, and `confirmPassword` must equal `password`. The `token` is NOT a form field and NOT part of the Zod schema — it is read from the URL via `useSearchParams` and validated before the form is rendered (absent or empty token → show error Alert, no form).
5. WHEN the form is submitted with valid data, THE ResetPasswordPage SHALL call `POST /api/v1/auth/reset-password` with the body `{ token, password }`.
6. WHEN the API call succeeds, THE ResetPasswordPage SHALL display a success `Alert` (variant: success) and render a link to `/login`.
7. IF the API call returns an error, THEN THE ResetPasswordPage SHALL display an `Alert` (variant: error) with the message extracted via `getErrorMessage`.
8. WHILE a submission is in progress, THE ResetPasswordPage SHALL disable the submit `Button` and show a loading label.
9. IF the `token` query parameter is absent or empty when the page loads, THEN THE ResetPasswordPage SHALL display an `Alert` (variant: error) indicating the reset link is invalid, without rendering the password form.
10. THE `/reset-password` route SHALL be registered in `App.tsx` as a public route (outside `DashboardLayout`), alongside `/login`, `/register`, and `/forgot-password`.
11. FOR ALL valid `token` strings, submitting the reset form SHALL produce a request body where the `token` field exactly matches the value read from the URL query parameter (round-trip property: URL param → form state → API payload).

---

### Requirement 2: Client Picker Component (GAP-004 / V-014)

**User Story:** As a staff member creating a task or invoice, I want to search for and select a client by name, so that I can associate the record with the correct client without needing to know or type a UUID.

#### Acceptance Criteria

1. THE ClientPicker SHALL be implemented as a reusable component at `apps/web/src/components/form/ClientPicker.tsx`.
2. THE ClientPicker SHALL accept a `react-hook-form` `Controller`-compatible interface: `value` (the selected `client_id` UUID string or null), `onChange` (called with the selected UUID or null), `disabled` (optional boolean), and `error` (optional boolean for error styling).
3. THE ClientPicker SHALL render a text input that accepts a search query typed by the user.
4. WHEN the user types in the search input, THE ClientPicker SHALL debounce the input by at least 300ms before issuing a search request.
5. WHEN a debounced search query is available, THE ClientPicker SHALL call `GET /api/v1/clients?search={query}&limit=50` and display the results as a dropdown list below the input.
6. WHEN a client is selected from the dropdown, THE ClientPicker SHALL call `onChange` with the selected client's `id` (UUID), close the dropdown, and display the selected client's `name` in the input field (not the UUID).
7. WHEN a client is selected, THE ClientPicker SHALL render a clear button that, when clicked, calls `onChange` with `null` and resets the input to an empty search state.
8. IF the search returns no results, THEN THE ClientPicker SHALL display a "No clients found" message in the dropdown.
9. IF the API call fails, THEN THE ClientPicker SHALL display an inline error message below the input.
10. WHILE `disabled` is true, THE ClientPicker SHALL prevent user interaction with the search input and clear button.
11. THE `client_id` raw UUID input in `TaskForm` (`apps/web/src/features/tasks/components/TaskForm.tsx`) SHALL be replaced with a `ClientPicker` integrated via `react-hook-form` `Controller`.
12. THE `client_id` raw UUID input in `InvoiceForm` (`apps/web/src/features/invoices/components/InvoiceForm.tsx`) SHALL be replaced with a `ClientPicker` integrated via `react-hook-form` `Controller`.
13. WHEN a `ClientPicker` is rendered with an existing `value` (UUID) on form load (e.g. edit mode), THE ClientPicker SHALL display the client's name by fetching `GET /api/v1/clients/{id}` or resolving from the search cache, rather than displaying the raw UUID.
14. FOR ALL sequences of: type query → select client → clear selection, THE ClientPicker SHALL return to an empty search state with `onChange` called with `null` (idempotence of clear operation).
15. FOR ALL valid client search queries, the set of client IDs returned by the dropdown SHALL be a subset of all client IDs accessible to the current tenant (metamorphic property: filtered results ⊆ full results).

---

### Requirement 3: Stripe Price ID Field in Admin Plans UI (GAP-005 / BUG-001)

**User Story:** As an admin, I want to enter and save a Stripe Price ID when creating or editing a plan, so that Stripe billing can be correctly linked to the plan and subscriptions can be created.

#### Acceptance Criteria

1. THE AdminPlansPage form SHALL include a `stripe_price_id` text input field, rendered using the `InputField` component.
2. THE `stripe_price_id` field SHALL be optional — the form SHALL submit successfully when the field is left empty (for free or internal plans).
3. WHEN the admin submits the create/edit form with a `stripe_price_id` value, THE AdminPlansPage SHALL include `stripe_price_id` as a **top-level field** in the payload sent to `PATCH /api/v1/admin/plans/:id` or `POST /api/v1/admin/plans` — NOT nested inside a `features` object.
4. WHEN an existing plan is loaded into the edit form, THE AdminPlansPage SHALL pre-populate the `stripe_price_id` field from `plan.stripe_price_id` (the top-level column), not from `plan.features`.
5. WHEN an existing plan has `stripe_price_id` as `null`, THE AdminPlansPage SHALL render the `stripe_price_id` field as empty.
6. THE AdminPlansPage form SHALL replace all raw `<input>` elements with the `InputField` design system component (V-002 compliance).
7. THE AdminPlansPage plans table SHALL replace the raw `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` elements with the `Table`, `TableHeader`, `TableBody`, `TableRow`, and `TableCell` design system components (V-003 compliance).
8. FOR ALL plans where `stripe_price_id` is saved and then the edit form is reopened, THE AdminPlansPage SHALL display the same `stripe_price_id` value that was saved (round-trip property: save → reload → field value matches).
9. WHEN `stripe_price_id` is an empty string at submit time, THE AdminPlansPage SHALL omit `stripe_price_id` from the payload (or send it as `undefined`), rather than sending an empty string to the API.
