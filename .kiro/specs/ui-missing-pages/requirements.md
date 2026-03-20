# Requirements Document

## Introduction

Three pages identified in the UI audit (`docs/audits/UI-COMPLETE-INVENTORY-PHASE-10.md`) are missing from the frontend. This spec covers their implementation:

- **GAP-002 / GAP-003**: Contact Detail Page (`/contacts/:id`) and ContactList search
- **GAP-006**: Payment Failure Page (`/payments/failure`)
- **GAP-007**: Settings Page (`/settings`)

All staff-facing pages use `DashboardLayout` per the approved layout governance decision. The payment failure page is a standalone page (no layout wrapper), following the same pattern as `/invoices/payment-success`.

---

## Glossary

- **ContactDetail**: The read-only detail view component for a single contact, rendered at `/contacts/:id`
- **ContactList**: The existing paginated contacts table component at `/contacts`
- **ContactsAPI**: The existing REST API at `GET /api/v1/contacts/:id` and `GET /api/v1/contacts?search=&page=&limit=`
- **PaymentFailurePage**: The standalone page rendered at `/payments/failure` for Stripe Checkout cancel redirects
- **SettingsPage**: The page rendered at `/settings` containing firm profile, user profile, and change password sections
- **ChangePasswordForm**: The react-hook-form + zod form within SettingsPage for updating the authenticated user's password
- **AuthAPI**: The existing REST API at `POST /api/v1/auth/change-password` (to be added) or `PATCH /api/v1/auth/me`
- **JWT_Payload**: The decoded JWT stored in `localStorage` as `auth_token`, containing `userId`, `firmId`, `email`, `role`
- **DashboardLayout**: The approved layout wrapper for all authenticated staff pages (`apps/web/src/components/layout/DashboardLayout.tsx`)

---

## Requirements

### Requirement 1: Contact Detail Page

**User Story:** As a staff member, I want to view a read-only detail page for a contact, so that I can review contact information without accidentally triggering an edit.

#### Acceptance Criteria

1. WHEN a user navigates to `/contacts/:id`, THE ContactDetail SHALL render within `DashboardLayout`.
2. WHEN the contact data is loading, THE ContactDetail SHALL display a loading indicator in place of the contact content.
3. WHEN the API returns a 404 for the requested contact id, THE ContactDetail SHALL display a "Contact not found." message and a link back to `/contacts`.
4. WHEN contact data is successfully loaded, THE ContactDetail SHALL display a breadcrumb link labelled "← Contacts" that navigates to `/contacts`.
5. WHEN contact data is successfully loaded, THE ContactDetail SHALL display the contact's name as the page heading.
6. WHEN contact data is successfully loaded, THE ContactDetail SHALL display a detail card containing all contact fields: name, email, phone, title/position, and notes — showing "—" for any field that has no value.
7. WHEN contact data is successfully loaded, THE ContactDetail SHALL display an "Edit" button that links to `/contacts/:id/edit`.
8. WHEN a user clicks the "Delete" button on the ContactDetail, THE ContactDetail SHALL call `window.confirm` with a confirmation message before proceeding with deletion.
9. WHEN the user confirms deletion, THE ContactDetail SHALL call `DELETE /api/v1/contacts/:id` and navigate to `/contacts` on success.
10. THE ContactDetail SHALL fetch contact data using `GET /api/v1/contacts/:id` via the existing `contactsApi.get` function.
11. THE App SHALL register the route `/contacts/:id` inside the `DashboardLayout` route group in `App.tsx`, ordered before `/contacts/:id/edit` to prevent route conflicts.

---

### Requirement 2: ContactList Search (GAP-003)

**User Story:** As a staff member, I want to search contacts by name or email from the contacts list, so that I can quickly find a specific contact without scrolling through all pages.

#### Acceptance Criteria

1. THE ContactList SHALL display a search input above the contacts table, using the same layout pattern as `ClientList` (max-w-sm, left-aligned below the heading row).
2. WHEN a user types in the search input, THE ContactList SHALL debounce the input by 300ms before issuing a new API request.
3. WHEN the search value changes, THE ContactList SHALL reset the current page to 1.
4. THE ContactList SHALL pass the `search` query parameter to `GET /api/v1/contacts?search=&page=&limit=20`, which already supports this parameter on the backend.
5. WHEN the search input is cleared, THE ContactList SHALL revert to the unfiltered paginated list.
6. THE ContactList SHALL render each contact's name as a `Link` to `/contacts/:id` (the new detail page) instead of `/contacts/:id/edit`.
7. THE ContactList SHALL retain the existing "Edit" and "Delete" action buttons in the Actions column.

---

### Requirement 3: Payment Failure Page

**User Story:** As a client or staff member, I want to see a clear failure page when a Stripe payment is cancelled or fails, so that I understand the payment was not completed and know how to proceed.

#### Acceptance Criteria

1. WHEN a user navigates to `/payments/failure`, THE PaymentFailurePage SHALL render as a standalone full-screen centered page with no layout wrapper (same pattern as `/invoices/payment-success`).
2. THE PaymentFailurePage SHALL display a red or warning-coloured icon (X or warning symbol) to visually communicate failure.
3. THE PaymentFailurePage SHALL display a "Payment Failed" heading.
4. THE PaymentFailurePage SHALL display a message explaining that the payment was not completed and no charge was made.
5. WHEN the URL contains an `invoice_id` query parameter, THE PaymentFailurePage SHALL display a "Try Again" button that links to `/invoices/:invoice_id`.
6. WHEN the URL does not contain an `invoice_id` query parameter, THE PaymentFailurePage SHALL display a "Try Again" button that links to `/invoices`.
7. THE PaymentFailurePage SHALL display a "Back to Invoices" button that always links to `/invoices`.
8. THE PaymentFailurePage SHALL make no API calls — it is a static page that reads only the optional `?invoice_id` query parameter.
9. THE App SHALL register the route `/payments/failure` as a standalone route outside of `DashboardLayout` in `App.tsx`, following the same pattern as `/invoices/payment-success`.

---

### Requirement 4: Settings Page — Firm Profile Section

**User Story:** As a staff member, I want to view my firm's profile information on the settings page, so that I can confirm the firm name, slug, and email on record.

#### Acceptance Criteria

1. WHEN a user navigates to `/settings`, THE SettingsPage SHALL render within `DashboardLayout`.
2. THE SettingsPage SHALL display a "Firm Profile" section showing the firm name, firm slug, and firm email as read-only fields.
3. THE SettingsPage SHALL read firm profile data from `GET /api/v1/auth/me` using react-query.
4. WHEN the `/api/v1/auth/me` request is loading, THE SettingsPage SHALL display a loading indicator in place of the profile sections.
5. IF the `/api/v1/auth/me` request fails, THEN THE SettingsPage SHALL display an error `Alert` component with a descriptive message.
6. THE DashboardLayout navItems array SHALL include a "Settings" entry linking to `/settings`, visible to all roles, positioned at the bottom of the navigation list.
7. THE App SHALL register the route `/settings` inside the `DashboardLayout` route group in `App.tsx`.

---

### Requirement 5: Settings Page — User Profile Section

**User Story:** As a staff member, I want to view my own profile information on the settings page, so that I can confirm my name and email on record.

#### Acceptance Criteria

1. THE SettingsPage SHALL display a "User Profile" section showing the current user's first name, last name, and email as read-only fields.
2. THE SettingsPage SHALL read user profile data from the same `GET /api/v1/auth/me` response used by the Firm Profile section (single request, no duplicate fetch).
3. WHEN the user profile data is available, THE SettingsPage SHALL display the full name (first name + last name) and email address.

---

### Requirement 6: Settings Page — Change Password Form

**User Story:** As a staff member, I want to change my password from the settings page, so that I can maintain account security without contacting an administrator.

#### Acceptance Criteria

1. THE SettingsPage SHALL display a "Change Password" section containing a form with three fields: `current_password`, `new_password`, and `confirm_new_password`.
2. THE ChangePasswordForm SHALL use `react-hook-form` with `zodResolver` for client-side validation.
3. THE ChangePasswordForm SHALL validate that `new_password` is at least 8 characters long.
4. THE ChangePasswordForm SHALL validate that `confirm_new_password` matches `new_password`, displaying an inline error if they do not match.
5. WHEN the form is submitted with valid data, THE ChangePasswordForm SHALL call `POST /api/v1/auth/change-password` with `{ current_password, new_password }`.
6. WHEN the API returns a success response, THE ChangePasswordForm SHALL display a success `Alert` component and reset all form fields to empty.
7. IF the API returns an error (e.g. incorrect current password), THEN THE ChangePasswordForm SHALL display the error message in an `Alert` component with variant `error`.
8. WHILE the form submission is pending, THE ChangePasswordForm SHALL disable the submit button and display a "Saving..." label.
9. THE ChangePasswordForm SHALL use the `InputField`, `Label`, `Button`, and `Alert` components from the existing design system.
10. THE AuthAPI SHALL expose `POST /api/v1/auth/change-password` accepting `{ current_password: string, new_password: string }`, protected by the `authenticate` middleware, validating that `current_password` matches the stored hash before updating.

---

### Requirement 7: Correctness Properties

**User Story:** As a developer, I want property-based tests for the new pages' data handling logic, so that edge cases in contact data display and URL parameter parsing are caught automatically.

#### Acceptance Criteria

1. FOR ALL valid `Contact` objects, THE ContactDetail SHALL display a non-empty string for the name field and SHALL display "—" for any optional field (`email`, `phone`, `title`, `notes`) whose value is `null`, `undefined`, or an empty string.
2. FOR ALL strings passed as the `invoice_id` query parameter to `/payments/failure`, THE PaymentFailurePage SHALL construct the "Try Again" link href as `/invoices/${invoice_id}` without modification or encoding errors.
3. FOR ALL `ChangePasswordForm` submissions where `new_password` and `confirm_new_password` are non-empty strings that differ, THE ChangePasswordForm SHALL display a validation error and SHALL NOT call the API.
4. FOR ALL `ChangePasswordForm` submissions where `new_password` is a non-empty string shorter than 8 characters, THE ChangePasswordForm SHALL display a validation error and SHALL NOT call the API.
5. WHEN the search input in ContactList contains any string value, THE ContactList SHALL include that exact string as the `search` query parameter in the API request URL, without transformation.
