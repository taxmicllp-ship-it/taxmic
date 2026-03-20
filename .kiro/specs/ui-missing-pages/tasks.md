# Implementation Plan: ui-missing-pages

## Overview

Four frontend additions plus one backend endpoint. Order: Contact Detail page first (self-contained), then ContactList search enhancement, then Payment Failure page, then Settings page (requires backend endpoint first).

## Tasks

- [x] 1. Create ContactDetailPage
  - [x] 1.1 Create `apps/web/src/pages/contacts/[id].tsx`
    - Use `DashboardLayout` via route nesting (no explicit import needed)
    - Read `:id` from URL via `useParams`
    - Fetch contact with `useQuery(['contacts', id], () => contactsApi.get(id))` from `features/contacts/api/contacts-api.ts`
    - While loading: render "Loading..." centered text
    - On 404 error: render "Contact not found." + `<Link to="/contacts">← Contacts</Link>`
    - On other error: render `Alert` variant=error with `getErrorMessage(err)`
    - On success: render breadcrumb `<Link to="/contacts">← Contacts</Link>`, `<h1>` with contact full name, detail card with fields: name, email, phone, title/position, notes — display "—" for null/undefined/empty values
    - Render "Edit" button as `<Link to={/contacts/${id}/edit}>` styled as a button
    - Render "Delete" button: on click call `window.confirm('Delete this contact?')`, on confirm call `contactsApi.delete(id)` via `useMutation`, navigate to `/contacts` on success, show `Alert` variant=error on failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [x] 1.2 Register `/contacts/:id` route in `App.tsx`
    - Add `import ContactDetailPage from './pages/contacts/[id]'`
    - Add `<Route path="/contacts/:id" element={<ContactDetailPage />} />` inside the `DashboardLayout` route group, placed BEFORE `<Route path="/contacts/:id/edit" ...>`
    - _Requirements: 1.11_

- [x] 2. Enhance ContactList with search and detail links
  - [x] 2.1 Update `apps/web/src/features/contacts/components/ContactList.tsx`
    - Add `const [search, setSearch] = useState('')` and `const [debouncedSearch, setDebouncedSearch] = useState('')`
    - Add `useEffect` with 300 ms `setTimeout` to update `debouncedSearch` from `search`; clear timeout on cleanup
    - When `debouncedSearch` changes, reset page to 1
    - Pass `search: debouncedSearch` to the existing `contactsApi.list(...)` call (the backend already supports this param)
    - Render `<input type="text" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm ..." />` above the table, below the heading row — match the layout pattern of `ClientList`
    - Change each contact name cell to `<Link to={/contacts/${contact.id}} className="...hover underline">{contact.first_name} {contact.last_name}</Link>`
    - Retain existing Edit and Delete action buttons unchanged
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 3. Create PaymentFailurePage
  - [x] 3.1 Create `apps/web/src/pages/invoices/payment-failure.tsx`
    - No layout wrapper — standalone full-screen centered page (same pattern as `payment-success.tsx`)
    - Read `invoice_id` from URL via `useSearchParams()`
    - Render: full-screen centered `div`, red X icon (SVG), `<h1>Payment Failed</h1>`, `<p>` explaining no charge was made
    - "Try Again" button: if `invoice_id` present → `<Link to={/invoices/${invoice_id}}>`, else → `<Link to="/invoices">`
    - "Back to Invoices" button: always `<Link to="/invoices">`
    - No API calls
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 3.2 Register `/payments/failure` route in `App.tsx`
    - Add `import PaymentFailurePage from './pages/invoices/payment-failure'`
    - Add `<Route path="/payments/failure" element={<PaymentFailurePage />} />` alongside `/invoices/payment-success` — outside `DashboardLayout`
    - _Requirements: 3.9_

- [x] 4. Add change-password backend endpoint
  - [x] 4.1 Add `changePasswordSchema` to `apps/api/src/modules/auth/auth.validation.ts`
    - Add zod schema: `body: z.object({ current_password: z.string().min(1), new_password: z.string().min(8) })`
    - Export as `changePasswordSchema`
    - _Requirements: 6.5, 6.10_

  - [x] 4.2 Add `changePassword` method to `apps/api/src/modules/auth/auth.service.ts`
    - Method signature: `async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>`
    - Fetch user by `userId` from DB
    - `bcrypt.compare(currentPassword, user.password_hash)` — if false, throw `AppError` with status 400 and message "Current password is incorrect"
    - `bcrypt.hash(newPassword, 10)` → update `password_hash` in DB via prisma
    - _Requirements: 6.10_

  - [x] 4.3 Add `changePassword` handler to `apps/api/src/modules/auth/auth.controller.ts`
    - Handler calls `authService.changePassword(req.user.userId, body.current_password, body.new_password)`
    - On success: respond with `{ message: 'Password updated successfully' }`
    - _Requirements: 6.5, 6.10_

  - [x] 4.4 Register `POST /change-password` in `apps/api/src/modules/auth/auth.routes.ts`
    - Add route: `router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword)`
    - _Requirements: 6.10_

- [x] 5. Create SettingsPage
  - [x] 5.1 Create `apps/web/src/pages/settings/index.tsx`
    - Use `DashboardLayout` via route nesting
    - Fetch `GET /api/v1/auth/me` via `useQuery(['auth', 'me'], () => authApi.me())` — single request for both profile sections
    - While loading: render loading indicator in place of profile sections
    - On error: render `Alert` variant=error with descriptive message
    - Render "Firm Profile" section: firm name, firm slug, firm email — all read-only (plain text or disabled inputs)
    - Render "User Profile" section: full name (`firstName + ' ' + lastName`), email — all read-only
    - Render "Change Password" section with `ChangePasswordForm` (see 5.2)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3_

  - [x] 5.2 Create `ChangePasswordForm` within SettingsPage (or as a co-located component)
    - Use `react-hook-form` + `zodResolver` with schema: `current_password` min 1, `new_password` min 8, `confirm_new_password` must equal `new_password`
    - Three `InputField` components (type="password"): `current_password`, `new_password`, `confirm_new_password`
    - On submit: call `POST /api/v1/auth/change-password` with `{ current_password, new_password }` via `useMutation`
    - On success: show `Alert` variant=success, reset all form fields
    - On error: show `Alert` variant=error with `getErrorMessage(err)`
    - While submitting: disable submit `Button`, show "Saving..." label
    - Use `InputField`, `Label`, `Button`, `Alert` from existing design system
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 5.3 Add "Settings" nav item to `DashboardLayout`
    - File: `apps/web/src/components/layout/DashboardLayout.tsx`
    - Add to `navItems` array (last position): `{ label: 'Settings', path: '/settings', icon: '<gear SVG path>', adminOnly: false }`
    - Use a gear/cog SVG path for the icon
    - _Requirements: 4.6_

  - [x] 5.4 Register `/settings` route in `App.tsx`
    - Add `import SettingsPage from './pages/settings/index'`
    - Add `<Route path="/settings" element={<SettingsPage />} />` inside the `DashboardLayout` route group
    - _Requirements: 4.7_

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Write property-based tests
  - [x] 7.1 P1: Contact field display — null/empty → "—"
    - File: `apps/web/src/__tests__/contact-detail.property.test.tsx`
    - Use `fc.record({ email: fc.option(fc.emailAddress()), phone: fc.option(fc.string()), title: fc.option(fc.string()), notes: fc.option(fc.string()) })` — assert "—" rendered for null/undefined/empty fields; minimum 100 iterations
    - _Requirements: 7.1_

  - [x] 7.2 P2: Payment failure "Try Again" link construction
    - Use `fc.string({ minLength: 1 })` for `invoice_id` — render page with `?invoice_id={value}`, assert "Try Again" href equals `/invoices/${value}`; minimum 100 iterations
    - _Requirements: 7.2_

  - [x] 7.3 P3 + P4: ChangePasswordForm validation
    - P3: `fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })).filter(([a,b]) => a !== b)` — assert no API call when passwords differ
    - P4: `fc.string({ maxLength: 7 })` for `new_password` — assert validation error and no API call
    - Minimum 100 iterations each
    - _Requirements: 7.3, 7.4_

  - [x] 7.4 P5: ContactList search passthrough
    - Use `fc.string()` for search value — assert `search` query param in API call equals input value; minimum 100 iterations
    - _Requirements: 7.5_

## Notes

- Tasks marked with `*` are optional
- `DashboardLayout` remains the approved layout wrapper per layout-governance.md
- The `window.confirm` in ContactDetailPage will be replaced by `ConfirmModal` when the `ui-design-system` spec is executed
- Backend endpoint in Task 4 must be completed before Task 5 (SettingsPage depends on it)
