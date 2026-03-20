# Design Document — ui-missing-pages

## Overview

Three missing pages and one ContactList enhancement are implemented here. All work is confined to `apps/web/src/` with one backend addition (the `POST /api/v1/auth/change-password` endpoint in `apps/api/src/`).

1. **Contact Detail Page** — `/contacts/:id` read-only view with delete action
2. **ContactList Search** — debounced search input + name links to detail page
3. **Payment Failure Page** — `/payments/failure` standalone page (no layout)
4. **Settings Page** — `/settings` with firm profile, user profile, and change-password form

---

## Architecture

```
apps/web/src/
  pages/
    contacts/
      [id].tsx          ← new: ContactDetailPage
    invoices/
      payment-failure.tsx  ← new: PaymentFailurePage
    settings/
      index.tsx         ← new: SettingsPage
  features/
    contacts/
      components/
        ContactList.tsx  ← modified: add search input + link to /contacts/:id
  App.tsx               ← modified: register 3 new routes

apps/api/src/
  modules/auth/
    auth.routes.ts      ← modified: add POST /change-password
    auth.controller.ts  ← modified: add changePassword handler
    auth.service.ts     ← modified: add changePassword method
    auth.validation.ts  ← modified: add changePassword schema
```

`DashboardLayout` wraps `/contacts/:id` and `/settings`. `/payments/failure` is standalone (same pattern as `/invoices/payment-success`).

---

## Components and Interfaces

### 1. ContactDetailPage

**File:** `apps/web/src/pages/contacts/[id].tsx`

```
DashboardLayout (via route nesting)
  └── div.max-w-3xl.mx-auto
        ├── Link ← Contacts (breadcrumb)
        ├── h1 (contact name)
        ├── detail card
        │     ├── name, email, phone, title, notes (each "—" if empty)
        │     └── action row: Edit button (Link to /contacts/:id/edit) + Delete button
        └── Alert (error, if delete fails)
```

**Data fetching:** `useQuery(['contacts', id], () => contactsApi.get(id))` — uses the existing `contactsApi.get` function from `features/contacts/api/contacts-api.ts`.

**Delete flow:**
1. User clicks Delete → `window.confirm` (per requirements; ConfirmModal is a separate spec)
2. On confirm → `useMutation` calling `contactsApi.delete(id)` → navigate to `/contacts` on success
3. On error → show `Alert` variant=error

**Loading state:** render a centered spinner/text "Loading..." in place of the card.

**404 state:** when query returns a 404 error, render "Contact not found." + Link back to `/contacts`.

**Route registration in App.tsx:**
```tsx
<Route path="/contacts/:id" element={<ContactDetailPage />} />
```
Placed before `/contacts/:id/edit` to avoid route conflicts (React Router matches top-down).

---

### 2. ContactList Search Enhancement

**File:** `apps/web/src/features/contacts/components/ContactList.tsx`

**Changes:**
- Add `search` state (`useState<string>('')`)
- Add `debouncedSearch` via `useEffect` + `setTimeout` (300 ms), same pattern as `ClientList`
- Pass `search: debouncedSearch` to the existing `contactsApi.list(...)` call
- Reset page to 1 when `debouncedSearch` changes
- Render a `<input type="text">` (or `InputField`) above the table, `max-w-sm`, left-aligned below the heading row
- Change each contact's name cell from plain text to `<Link to={/contacts/${contact.id}}>`
- Retain existing Edit and Delete action buttons unchanged

---

### 3. PaymentFailurePage

**File:** `apps/web/src/pages/invoices/payment-failure.tsx`

```
div.min-h-screen.flex.items-center.justify-center (full-screen centered, no layout)
  └── div.text-center.max-w-md
        ├── icon (red X or warning SVG)
        ├── h1 "Payment Failed"
        ├── p  "Your payment was not completed. No charge was made."
        ├── Button "Try Again" → /invoices/:invoice_id (if ?invoice_id present) or /invoices
        └── Button "Back to Invoices" → /invoices
```

**URL param:** `useSearchParams()` to read `invoice_id`. No API calls.

**Route registration in App.tsx:**
```tsx
<Route path="/payments/failure" element={<PaymentFailurePage />} />
```
Placed alongside `/invoices/payment-success` — outside `DashboardLayout`.

---

### 4. SettingsPage

**File:** `apps/web/src/pages/settings/index.tsx`

```
DashboardLayout (via route nesting)
  └── div.max-w-2xl.mx-auto
        ├── h1 "Settings"
        ├── Section: Firm Profile (read-only)
        │     ├── firm name
        │     ├── firm slug
        │     └── firm email
        ├── Section: User Profile (read-only)
        │     ├── full name (firstName + lastName)
        │     └── email
        └── Section: Change Password
              └── ChangePasswordForm
                    ├── InputField current_password (type=password)
                    ├── InputField new_password (type=password)
                    ├── InputField confirm_new_password (type=password)
                    ├── Alert (success | error)
                    └── Button "Save Password" / "Saving..."
```

**Data fetching:** single `useQuery(['auth', 'me'], () => authApi.me())` — reuses the existing `GET /api/v1/auth/me` endpoint. Both Firm Profile and User Profile sections read from the same response.

**ChangePasswordForm:** `react-hook-form` + `zodResolver`. Schema:
```ts
z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'At least 8 characters'),
  confirm_new_password: z.string(),
}).refine(d => d.new_password === d.confirm_new_password, {
  message: 'Passwords do not match',
  path: ['confirm_new_password'],
});
```

**Mutation:** `POST /api/v1/auth/change-password` with `{ current_password, new_password }`.

**DashboardLayout nav:** add a "Settings" entry to `navItems` in `DashboardLayout.tsx`, linking to `/settings`, `adminOnly: false`, positioned last in the array.

**Route registration in App.tsx:**
```tsx
<Route path="/settings" element={<SettingsPage />} />
```
Inside the `DashboardLayout` route group.

---

### 5. Backend: POST /api/v1/auth/change-password

**Files modified:**
- `apps/api/src/modules/auth/auth.validation.ts` — add `changePasswordSchema`
- `apps/api/src/modules/auth/auth.service.ts` — add `changePassword(userId, currentPassword, newPassword)`
- `apps/api/src/modules/auth/auth.controller.ts` — add `changePassword` handler
- `apps/api/src/modules/auth/auth.routes.ts` — register `POST /change-password` with `authenticate` middleware

**Validation schema:**
```ts
export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8),
  }),
});
```

**Service logic:**
1. Fetch user by `userId` from DB
2. `bcrypt.compare(current_password, user.password_hash)` — if false, throw 400 "Current password is incorrect"
3. `bcrypt.hash(new_password, 10)` → update `password_hash` in DB
4. Return `{ message: 'Password updated successfully' }`

---

## Data Models

### ContactDetail — fields displayed
```ts
// from existing contacts types
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
  client_id: string | null;
}
```

### AuthMe response (existing)
```ts
interface AuthMeResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  firm: {
    id: string;
    name: string;
    slug: string;
    email: string;
  };
}
```

### ChangePassword request payload
```ts
interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}
```

---

## Correctness Properties

### Property 1: Contact field display — null/empty → "—"
For all valid `Contact` objects, the ContactDetailPage SHALL display "—" for any optional field (`email`, `phone`, `title`, `notes`) whose value is `null`, `undefined`, or empty string, and SHALL display a non-empty string for the `name` field.

### Property 2: Payment failure "Try Again" link construction
For all strings passed as `invoice_id` query parameter, the PaymentFailurePage SHALL construct the "Try Again" href as `/invoices/${invoice_id}` without modification.

### Property 3: ChangePasswordForm — mismatched passwords blocked
For all `ChangePasswordForm` submissions where `new_password` and `confirm_new_password` are non-empty strings that differ, the form SHALL display a validation error and SHALL NOT call the API.

### Property 4: ChangePasswordForm — short password blocked
For all `ChangePasswordForm` submissions where `new_password` is shorter than 8 characters, the form SHALL display a validation error and SHALL NOT call the API.

### Property 5: ContactList search passthrough
When the search input contains any string value, the ContactList SHALL include that exact string as the `search` query parameter in the API request URL.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `GET /contacts/:id` returns 404 | Render "Contact not found." + link back to `/contacts` |
| `GET /contacts/:id` returns other error | Render `Alert` variant=error with `getErrorMessage(err)` |
| `DELETE /contacts/:id` fails | Render `Alert` variant=error below the detail card |
| `GET /auth/me` fails on SettingsPage | Render `Alert` variant=error; hide profile sections |
| `POST /auth/change-password` — wrong current password | API returns 400; display error in `Alert` variant=error |
| `POST /auth/change-password` — other error | Display `getErrorMessage(err)` in `Alert` variant=error |
| `/payments/failure` — no `invoice_id` param | "Try Again" links to `/invoices` (fallback) |

---

## Testing Strategy

**Property-based testing library:** `fast-check` (dev dependency in `apps/web`).

**Property tests** (one per property, 100+ iterations):
- P1: `fc.record({ email: fc.option(fc.string()), phone: fc.option(fc.string()), ... })` — assert "—" for null/empty fields
- P2: `fc.string({ minLength: 1 })` for `invoice_id` — assert href construction
- P3: `fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })).filter(([a,b]) => a !== b)` — assert no API call
- P4: `fc.string({ maxLength: 7 })` for `new_password` — assert validation error
- P5: `fc.string()` for search value — assert query param passthrough

**Unit tests** (concrete examples):
- ContactDetailPage renders loading state
- ContactDetailPage renders 404 message when API returns 404
- ContactDetailPage renders all fields with "—" for null values
- ContactDetailPage calls delete API and navigates on confirm
- ContactList renders search input above table
- ContactList resets page to 1 on search change
- PaymentFailurePage renders without `invoice_id` param
- PaymentFailurePage renders "Try Again" link with `invoice_id` param
- SettingsPage renders firm profile section
- SettingsPage renders user profile section
- SettingsPage renders change password form
- ChangePasswordForm shows success Alert on API success
- ChangePasswordForm disables button while submitting
