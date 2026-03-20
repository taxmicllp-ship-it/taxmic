# Design Document — ui-critical-fixes

## Overview

Three production-blocking gaps in the React/TypeScript frontend (`apps/web/`) are addressed here. All backend endpoints already exist; this is purely a frontend implementation spec.

1. **Reset Password Page** — `/reset-password` route and page are missing. The forgot-password flow already issues tokens but there is nowhere to consume them.
2. **ClientPicker Component** — `TaskForm` and `InvoiceForm` expose raw UUID text inputs for `client_id`. A searchable, debounced dropdown is required.
3. **Admin Plans — stripe_price_id + design system compliance** — The admin plans form is missing the `stripe_price_id` field and uses raw HTML `<input>` / `<table>` elements instead of the design system components.

All three changes are isolated to `apps/web/src/`. No backend changes are required.

---

## Architecture

The codebase follows a feature-slice structure:

```
apps/web/src/
  components/
    form/          ← shared form primitives (InputField, Label, ClientPicker ← new)
    layout/        ← AuthPageLayout, DashboardLayout
    ui/            ← Button, Alert, Table, …
  features/
    auth/api/      ← auth-api.ts (resetPassword already exported)
    clients/api/   ← clients-api.ts (list + get already exist)
    billing/api/   ← billing-api.ts (createPlan / updatePlan)
  pages/
    auth/          ← login, register, forgot-password, reset-password ← new
    billing/       ← admin-plans.tsx ← modified
  App.tsx          ← route registry ← modified
```

`DashboardLayout` is the approved layout for all authenticated pages (see layout-governance.md). Public auth pages use `AuthPageLayout`. No layout changes are in scope.

---

## Components and Interfaces

### 1. ResetPasswordPage

**File:** `apps/web/src/pages/auth/reset-password.tsx`

```
AuthPageLayout
  └── form (react-hook-form + zod)
        ├── InputField  (password)
        ├── InputField  (confirmPassword)
        └── Button      (submit)
  └── Alert (success | error)
  └── Link  → /login
```

The page reads `?token=` via `useSearchParams`. If absent/empty, it renders only an error `Alert` — no form. On success it renders a success `Alert` with a login link and hides the form.

**Zod schema** (`ResetPasswordFormSchema`):
```ts
z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

The `token` is not a form field — it is read from the URL and injected into the mutation payload at submit time.

**Mutation:** calls `resetPassword({ token, password })` from `features/auth/api/auth-api.ts` (already implemented).

**App.tsx change:** add `<Route path="/reset-password" element={<ResetPasswordPage />} />` alongside the other public auth routes, outside `DashboardLayout`.

---

### 2. ClientPicker

**File:** `apps/web/src/components/form/ClientPicker.tsx`

Designed to be dropped into any `react-hook-form` form via `Controller`:

```tsx
<Controller
  name="client_id"
  control={control}
  render={({ field }) => (
    <ClientPicker
      value={field.value ?? null}
      onChange={field.onChange}
      disabled={isLoading}
      error={!!errors.client_id}
    />
  )}
/>
```

**Props interface:**
```ts
interface ClientPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  error?: boolean;
}
```

**Internal state:**
```ts
const [query, setQuery]           // text in the search input
const [open, setOpen]             // dropdown visibility
const [results, setResults]       // Client[] from API
const [selectedName, setSelectedName] // display name of selected client
const [searchError, setSearchError]   // inline API error string
const [isSearching, setIsSearching]   // loading indicator
```

**Debounce approach:** `useEffect` with `setTimeout` / `clearTimeout` — 300 ms delay. The effect MUST return a cleanup function: `return () => clearTimeout(timer)`. When `value` is non-null and `query` is empty (initial render with existing value), a single `GET /api/v1/clients/{id}` call resolves the display name.

**Async / race condition handling:** Use `AbortController` for all search requests. Each new search creates a new controller and aborts the previous one:
```ts
useEffect(() => {
  if (!debouncedQuery) return;
  const controller = new AbortController();
  setIsSearching(true);
  clientsApi.list({ search: debouncedQuery, limit: 50 }, controller.signal)
    .then(res => { if (!controller.signal.aborted) setResults(res.data); })
    .catch(err => { if (!controller.signal.aborted) setSearchError(getErrorMessage(err)); })
    .finally(() => { if (!controller.signal.aborted) setIsSearching(false); });
  return () => controller.abort();
}, [debouncedQuery]);
```
This prevents stale responses from overwriting newer results and avoids wasted state updates after unmount.

**Outside-click close:** `useRef` on the container + `mousedown` event listener on `document`. MUST clean up: `return () => document.removeEventListener('mousedown', handler)`.

**Dropdown positioning:** The container div uses `position: relative`. The dropdown uses `position: absolute; top: 100%; left: 0; right: 0; z-index: 50` so it renders below the input without affecting layout. This works correctly inside modals and scroll containers as long as the container is not `overflow: hidden`.

**Search:** `clientsApi.list({ search: query, limit: 50 })` — uses the existing `ListClientsQuery` interface. Backend confirmed to support `search` and `limit` params.

**Selection:** sets `selectedName` to `client.name`, calls `onChange(client.id)`, closes dropdown, clears `results`.

**Clear:** calls `onChange(null)`, resets `query`, `selectedName`, `results`, `open`.

**Integration in TaskForm and InvoiceForm:** the raw `client_id` input is replaced with a `Controller`-wrapped `ClientPicker`. The zod schema for `client_id` MUST be updated to `z.string().nullable().optional()` — `null` (cleared selection) is a valid value and must not be rejected by Zod.

---

### 3. AdminPlansPage — stripe_price_id + design system

**File:** `apps/web/src/pages/billing/admin-plans.tsx` (modified in-place)

> **Architecture fact:** `stripe_price_id` is a dedicated top-level column on the `plans` table — confirmed by the migration (`ALTER TABLE plans ADD COLUMN stripe_price_id VARCHAR(255)`) and `plans.repository.ts`. It is NOT stored inside the `features` JSON column. The `Plan` type in `features/billing/types.ts` has `stripe_price_id: string | null` as a top-level field.

**FormData interface** gains one field:
```ts
interface FormData {
  // … existing fields …
  stripe_price_id: string;
}
```

**planToForm** reads `stripe_price_id` directly from the top-level plan field:
```ts
stripe_price_id: plan.stripe_price_id ?? '',
```

**handleSubmit** sends it as a top-level field in the payload:
```ts
stripe_price_id: formData.stripe_price_id || undefined,
```

**`CreatePlanPayload` in `billing-api.ts`** gains:
```ts
stripe_price_id?: string;
```

No `features` field is involved. Do NOT nest `stripe_price_id` inside `features`.

**Design system compliance:**
- All `<label>` + `<input>` pairs replaced with `<Label>` + `<InputField>` (already imported in the file's sibling components).
- The `<table>` / `<thead>` / `<tbody>` / `<tr>` / `<th>` / `<td>` block replaced with `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` from `components/ui/Table.tsx`.

---

## Data Models

### ResetPasswordFormValues (frontend only)
```ts
interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}
// token is sourced from useSearchParams, not from the form
```

### ClientPicker — relevant slice of Client
```ts
// from features/clients/types.ts (already exists)
interface Client {
  id: string;
  name: string;
  // … other fields not used by ClientPicker
}
```

### AdminPlansPage FormData (extended)
```ts
interface FormData {
  name: string;
  slug: string;
  description: string;
  price_monthly: string;
  price_annual: string;
  max_users: string;
  max_clients: string;
  max_storage_gb: string;
  stripe_price_id: string;   // ← new; maps to top-level plans.stripe_price_id column
}
```

### API payload for plan create/update (extended)
```ts
// billing-api.ts CreatePlanPayload gains:
stripe_price_id?: string;   // top-level field — NOT nested in features
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Token round-trip

*For any* non-empty token string present in the URL query parameter `?token=`, when the reset-password form is submitted, the API request body's `token` field SHALL equal that exact string.

**Validates: Requirements 1.2, 1.5, 1.11**

---

### Property 2: Form validation rejects invalid inputs

*For any* combination of `password` shorter than 8 characters, or `confirmPassword` that does not equal `password`, the Zod schema SHALL produce a validation error and the form SHALL not submit.

**Validates: Requirements 1.4**

---

### Property 3: Error messages extracted via getErrorMessage

*For any* API error response shape (axios error with `response.data.error`, `response.data.message`, or plain `message`), the displayed error text SHALL equal the output of `getErrorMessage(error)`.

**Validates: Requirements 1.7**

---

### Property 4: Debounce — no API call before 300 ms

*For any* sequence of keystrokes typed into the ClientPicker search input, no call to `GET /api/v1/clients` SHALL be issued until at least 300 ms have elapsed since the last keystroke.

**Validates: Requirements 2.4**

---

### Property 5: Search query produces correct API call

*For any* debounced search query string, the ClientPicker SHALL call `clientsApi.list({ search: query, limit: 50 })` and render the returned client names as dropdown options.

**Validates: Requirements 2.5**

---

### Property 6: Client selection calls onChange with UUID and shows name

*For any* client returned in the dropdown, selecting it SHALL call `onChange` with that client's `id` (UUID) and SHALL display that client's `name` in the input field.

**Validates: Requirements 2.6**

---

### Property 7: Clear selection round-trip

*For any* sequence of: type query → select client → click clear, the ClientPicker SHALL call `onChange(null)`, reset the input to empty, and close the dropdown — returning to the initial empty state.

**Validates: Requirements 2.7, 2.14**

---

### Property 8: Existing UUID value resolves to client name on load

*For any* valid client UUID passed as the `value` prop on initial render, the ClientPicker SHALL fetch the client and display its `name` in the input field rather than the raw UUID.

**Validates: Requirements 2.13**

---

### Property 9: stripe_price_id included as top-level field when non-empty

*For any* non-empty `stripe_price_id` string entered in the admin plans form, the submitted API payload SHALL contain a top-level `stripe_price_id` field equal to that string — NOT nested inside a `features` object.

**Validates: Requirements 3.3**

---

### Property 10: stripe_price_id round-trip — save then reload

*For any* plan saved with a non-empty `stripe_price_id`, reopening the edit form for that plan SHALL pre-populate the `stripe_price_id` field with the same value that was saved (read from `plan.stripe_price_id`, not `plan.features`).

**Validates: Requirements 3.4, 3.8**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `?token=` absent or empty on `/reset-password` | Render error `Alert` only; hide form entirely |
| Reset password API error | Display `Alert` variant=error with `getErrorMessage(err)` |
| ClientPicker search API error | Inline error string below the input; dropdown stays closed |
| ClientPicker initial-load fetch error (UUID → name) | Fall back to displaying the raw UUID |
| Admin plans API error (create/update) | Existing `setError` state renders the error banner |
| Empty `stripe_price_id` at submit | Omit `stripe_price_id` from payload (send `undefined`, not empty string) |

---

## Testing Strategy

**Dual approach:** unit tests for concrete examples and edge cases; property-based tests for universal properties.

**Property-based testing library:** `fast-check` (already available in the JS ecosystem; add as a dev dependency to `apps/web`).

**Property test configuration:** minimum 100 iterations per property. Each test is tagged with a comment:
```
// Feature: ui-critical-fixes, Property N: <property text>
```

**Unit tests** (specific examples and edge cases):
- ResetPasswordPage renders with `AuthPageLayout` (Req 1.1)
- ResetPasswordPage renders form with two fields (Req 1.3)
- ResetPasswordPage shows success Alert + login link on API success (Req 1.6)
- ResetPasswordPage disables button during submission (Req 1.8)
- ResetPasswordPage shows error Alert when token is absent (Req 1.9 — edge case)
- ResetPasswordPage shows error Alert when token is empty string (Req 1.9 — edge case)
- ClientPicker renders a text input (Req 2.3)
- ClientPicker respects `disabled` prop (Req 2.10)
- ClientPicker shows "No clients found" when results are empty (Req 2.8 — edge case)
- TaskForm renders ClientPicker via Controller (Req 2.11)
- InvoiceForm renders ClientPicker via Controller (Req 2.12)
- AdminPlansPage form includes stripe_price_id InputField (Req 3.1)
- AdminPlansPage form uses InputField for all fields (Req 3.6)
- AdminPlansPage table uses Table design system components (Req 3.7)
- AdminPlansPage renders stripe_price_id as empty when plan.features has no stripe_price_id (Req 3.5 — edge case)
- AdminPlansPage omits stripe_price_id from payload when field is empty (Req 3.9 — edge case)

**Property tests** (one test per property, 100+ iterations each):
- P1: Token round-trip — `fc.string()` for token values
- P2: Form validation — `fc.string()` for password/confirmPassword combinations
- P3: Error message extraction — `fc.record(...)` for error shapes
- P4: Debounce timing — `fc.string()` for keystroke sequences with fake timers
- P5: Search API call correctness — `fc.string()` for query strings
- P6: Selection onChange + display — `fc.record({ id: fc.uuid(), name: fc.string() })`
- P7: Clear round-trip — `fc.record(...)` for client + query combinations
- P8: UUID → name resolution — `fc.uuid()` for value prop
- P9: stripe_price_id in payload — `fc.string({ minLength: 1 })` for price IDs
- P10: stripe_price_id save/reload — `fc.string({ minLength: 1 })` for price IDs
