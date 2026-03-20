# Implementation Plan: ui-critical-fixes

## Overview

Three isolated frontend fixes in `apps/web/src/`. No backend changes. Order: Reset Password page first (self-contained), then ClientPicker component, then ClientPicker integration into forms, then Admin Plans fixes.

## Tasks

- [x] 1. Create ResetPasswordPage
  - [x] 1.1 Create `apps/web/src/pages/auth/reset-password.tsx`
    - Use `AuthPageLayout` as the wrapper (same pattern as `forgot-password.tsx`)
    - Read `?token=` from URL via `useSearchParams`
    - If token is absent or empty string, render only an `Alert` variant=error ("Invalid or missing reset link") — no form
    - Build form with `react-hook-form` + `zodResolver` using the schema: `password` min 8 chars, `confirmPassword` must equal `password`
    - Render two `InputField` components (type="password"): `password` and `confirmPassword`
    - Call `resetPassword({ token, password })` from `features/auth/api/auth-api.ts` on submit — token comes from URL, not the form
    - On success: hide form, show `Alert` variant=success with a `<Link to="/login">` inside
    - On error: show `Alert` variant=error with message from `getErrorMessage(err)` (import from `lib/getErrorMessage.ts`)
    - Disable submit `Button` and show "Resetting..." label while `isPending`
    - Use `useMutation` from `@tanstack/react-query` (same pattern as `forgot-password.tsx`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 1.2 Register `/reset-password` route in `App.tsx`
    - Add `import ResetPasswordPage from './pages/auth/reset-password'`
    - Add `<Route path="/reset-password" element={<ResetPasswordPage />} />` alongside `/login`, `/register`, `/forgot-password` — outside `DashboardLayout`
    - _Requirements: 1.10_

  - [x] 1.3 Write unit tests for ResetPasswordPage
    - Test: renders with `AuthPageLayout` (Req 1.1)
    - Test: shows error Alert (no form) when `?token=` is absent (Req 1.9)
    - Test: shows error Alert (no form) when `?token=` is empty string (Req 1.9)
    - Test: renders two password fields when token is present (Req 1.3)
    - Test: disables submit button while `isPending` (Req 1.8)
    - Test: shows success Alert + login link on API success (Req 1.6)
    - Test: shows error Alert with `getErrorMessage` output on API error (Req 1.7)
    - _Requirements: 1.1, 1.3, 1.6, 1.7, 1.8, 1.9_

  - [x] 1.4 Write property test — P1: Token round-trip
    - File: `apps/web/src/__tests__/reset-password.property.test.tsx`
    - `// Feature: ui-critical-fixes, Property 1: Token round-trip`
    - Use `fc.string({ minLength: 1 })` for token values; render page with `?token={token}`, submit form, assert API call body `token` === URL param value
    - Use fake timers and mock `resetPassword`; minimum 100 iterations
    - _Requirements: 1.11_

  - [x] 1.5 Write property test — P2: Form validation rejects invalid inputs
    - `// Feature: ui-critical-fixes, Property 2: Form validation rejects invalid inputs`
    - Use `fc.string()` for password/confirmPassword combinations; assert Zod schema rejects when `password.length < 8` or `confirmPassword !== password`
    - Test the schema directly (no render needed); minimum 100 iterations
    - _Requirements: 1.4_

  - [x] 1.6 Write property test — P3: Error messages extracted via getErrorMessage
    - `// Feature: ui-critical-fixes, Property 3: Error messages extracted via getErrorMessage`
    - Use `fc.record(...)` to generate varied error shapes (axios-style with `response.data.error`, `response.data.message`, plain `message`); assert displayed text equals `getErrorMessage(error)`
    - Render page with token present, mock `resetPassword` to reject with generated error; minimum 100 iterations
    - _Requirements: 1.7_

- [x] 2. Create ClientPicker component
  - [x] 2.1 Create `apps/web/src/components/form/ClientPicker.tsx`
    - Props: `value: string | null`, `onChange: (id: string | null) => void`, `disabled?: boolean`, `error?: boolean`
    - Internal state: `query`, `open`, `results: Client[]`, `selectedName`, `searchError`, `isSearching`
    - Render a text input showing `selectedName` when a client is selected, or `query` when searching
    - Debounce: separate `debouncedQuery` state updated via `useEffect` + `setTimeout` (300 ms); cleanup: `return () => clearTimeout(timer)`
    - Search effect: when `debouncedQuery` changes, create `const controller = new AbortController()`; call `clientsApi.list({ search: debouncedQuery, limit: 50 }, controller.signal)`; on response check `!controller.signal.aborted` before setting state; cleanup: `return () => controller.abort()` — this prevents stale responses and wasted state updates after unmount
    - When `value` is non-null and `query` is empty on mount (edit mode), call `clientsApi.get(value)` to resolve display name; fall back to showing raw UUID on error
    - Render dropdown list below input when `open && results.length > 0`; each item shows `client.name`; dropdown uses `position: absolute; top: 100%; left: 0; right: 0; z-index: 50` on a `position: relative` container
    - On item click: call `onChange(client.id)`, set `selectedName`, close dropdown, clear `results`
    - Show "No clients found" in dropdown when `open && results.length === 0 && !isSearching && debouncedQuery.length > 0`
    - Show loading indicator in dropdown while `isSearching`
    - Render a clear button (×) when `selectedName` is set; on click: `onChange(null)`, reset all state
    - Show `searchError` string below input when set
    - Respect `disabled` prop: disable input and clear button
    - Outside-click close: `useRef` on container + `mousedown` listener on `document`; cleanup: `return () => document.removeEventListener('mousedown', handler)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.13_

  - [x] 2.2 Write unit tests for ClientPicker
    - Test: renders a text input (Req 2.3)
    - Test: respects `disabled` prop — input and clear button are disabled (Req 2.10)
    - Test: shows "No clients found" when API returns empty array (Req 2.8)
    - Test: shows inline error when API call fails (Req 2.9)
    - _Requirements: 2.3, 2.8, 2.9, 2.10_

  - [x] 2.3 Write property test — P4: Debounce — no API call before 300 ms
    - File: `apps/web/src/__tests__/client-picker.property.test.tsx`
    - `// Feature: ui-critical-fixes, Property 4: Debounce — no API call before 300 ms`
    - Use `fc.string()` for keystroke sequences with `vi.useFakeTimers()`; assert `clientsApi.list` is NOT called before 300 ms elapses; minimum 100 iterations
    - _Requirements: 2.4_

  - [x] 2.4 Write property test — P5: Search query produces correct API call
    - `// Feature: ui-critical-fixes, Property 5: Search query produces correct API call`
    - Use `fc.string({ minLength: 1 })` for query strings; advance timers 300 ms; assert `clientsApi.list` called with `{ search: query, limit: 50 }`; minimum 100 iterations
    - _Requirements: 2.5_

  - [x] 2.5 Write property test — P6: Client selection calls onChange with UUID and shows name
    - `// Feature: ui-critical-fixes, Property 6: Client selection calls onChange with UUID and shows name`
    - Use `fc.record({ id: fc.uuid(), name: fc.string({ minLength: 1 }) })` for client objects; mock API to return the generated client; simulate selection; assert `onChange` called with `client.id` and input displays `client.name`; minimum 100 iterations
    - _Requirements: 2.6_

  - [x] 2.6 Write property test — P7: Clear selection round-trip
    - `// Feature: ui-critical-fixes, Property 7: Clear selection round-trip`
    - Use `fc.record(...)` for client + query combinations; simulate type → select → clear; assert `onChange` called with `null`, input is empty, dropdown is closed; minimum 100 iterations
    - _Requirements: 2.7, 2.14_

  - [x] 2.7 Write property test — P8: Existing UUID value resolves to client name on load
    - `// Feature: ui-critical-fixes, Property 8: Existing UUID value resolves to client name on load`
    - Use `fc.uuid()` for value prop; mock `clientsApi.get` to return `{ id, name: 'Test Client' }`; assert input displays `name` not raw UUID; minimum 100 iterations
    - _Requirements: 2.13_

- [x] 3. Integrate ClientPicker into TaskForm and InvoiceForm
  - [x] 3.1 Replace raw `client_id` input in `TaskForm` with `ClientPicker`
    - File: `apps/web/src/features/tasks/components/TaskForm.tsx`
    - Add `import { Controller } from 'react-hook-form'` and `import ClientPicker from '../../../components/form/ClientPicker'`
    - Replace the raw `client_id` input block with a `Controller`-wrapped `ClientPicker`
    - Pass `control` from `useForm` to `Controller`; wire `field.value ?? null`, `field.onChange`, `disabled={isLoading}`, `error={!!errors.client_id}`
    - Keep the `Label` and surrounding `<div>` unchanged
    - **Update the zod schema** in `apps/web/src/features/tasks/validation/task.schema.ts`: change `client_id: z.string().optional()` to `client_id: z.string().nullable().optional()` — `null` (cleared selection) is a valid value and must not be rejected
    - _Requirements: 2.11_

  - [x] 3.2 Replace raw `client_id` input in `InvoiceForm` with `ClientPicker`
    - File: `apps/web/src/features/invoices/components/InvoiceForm.tsx`
    - Add `import { Controller } from 'react-hook-form'` and `import ClientPicker from '../../../components/form/ClientPicker'`
    - Replace the raw `client_id` input block with a `Controller`-wrapped `ClientPicker`
    - Wire `field.value ?? null`, `field.onChange`, `disabled={isLoading}`, `error={!!errors.client_id}`
    - Keep the `Label` and surrounding `<div>` unchanged
    - **Update the invoice zod schema** similarly: `client_id: z.string().nullable().optional()`
    - _Requirements: 2.12_

  - [x] 3.3 Write unit tests for form integration
    - Test: `TaskForm` renders `ClientPicker` (not a raw text input) for `client_id` (Req 2.11)
    - Test: `InvoiceForm` renders `ClientPicker` (not a raw text input) for `client_id` (Req 2.12)
    - _Requirements: 2.11, 2.12_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Fix AdminPlansPage — add stripe_price_id field and design system compliance
  - [x] 5.1 Add `stripe_price_id` to `CreatePlanPayload` in `billing-api.ts`
    - File: `apps/web/src/features/billing/api/billing-api.ts`
    - Add `stripe_price_id?: string` as a **top-level field** to `CreatePlanPayload` interface — NOT inside a `features` object
    - `UpdatePlanPayload` inherits via `Partial<CreatePlanPayload>` — no change needed there
    - _Requirements: 3.3_

  - [x] 5.2 Update `FormData` interface, `emptyForm`, `planToForm`, and `handleSubmit` in `admin-plans.tsx`
    - File: `apps/web/src/pages/billing/admin-plans.tsx`
    - Add `stripe_price_id: string` to `FormData` interface
    - Add `stripe_price_id: ''` to `emptyForm`
    - In `planToForm`: add `stripe_price_id: plan.stripe_price_id ?? ''` — read from the top-level column, NOT from `plan.features`
    - In `handleSubmit`: add `stripe_price_id: formData.stripe_price_id || undefined` to the payload — do NOT send empty string, do NOT nest in `features`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.9_

  - [x] 5.3 Replace raw `<input>` elements with `InputField` in the form section of `admin-plans.tsx`
    - Add `import InputField from '../../components/form/InputField'` and `import Label from '../../components/form/Label'`
    - Replace every `<label>` + `<input>` pair in the form grid with `<Label>` + `<InputField>`
    - Keep all `data-testid` attributes on the `InputField` components (pass as props)
    - Add the `stripe_price_id` field as a new `<div>` in the grid: `<Label>Stripe Price ID</Label>` + `<InputField data-testid="field-stripe_price_id" type="text" value={formData.stripe_price_id} onChange={handleChange('stripe_price_id')} placeholder="price_1ABC..." />`
    - _Requirements: 3.1, 3.6_

  - [x] 5.4 Replace raw `<table>` with design system `Table` components in `admin-plans.tsx`
    - Add `import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table'`
    - Replace `<table>` → `<Table>`, `<thead>` → `<TableHeader>`, `<tbody>` → `<TableBody>`, `<tr>` → `<TableRow>`, `<th>` → `<TableCell isHeader>`, `<td>` → `<TableCell>`
    - Preserve all existing `className` values, `data-testid` attributes, and cell content exactly
    - _Requirements: 3.7_

  - [x] 5.5 Write unit tests for AdminPlansPage stripe_price_id and design system
    - Test: form includes a `stripe_price_id` InputField (Req 3.1)
    - Test: all form fields use `InputField` component, not raw `<input>` (Req 3.6)
    - Test: table uses `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` components (Req 3.7)
    - Test: `stripe_price_id` field is empty when `plan.stripe_price_id` is null (Req 3.5)
    - Test: payload omits `stripe_price_id` when field is empty (Req 3.9)
    - _Requirements: 3.1, 3.5, 3.6, 3.7, 3.9_

  - [x] 5.6 Write property test — P9: stripe_price_id included as top-level field when non-empty
    - File: `apps/web/src/__tests__/admin-plans.property.test.tsx` (extend existing file)
    - `// Feature: ui-critical-fixes, Property 9: stripe_price_id included as top-level field when non-empty`
    - Use `fc.string({ minLength: 1 })` for price IDs; fill form and submit; assert `billingApi.createPlan` called with a top-level `stripe_price_id` field equal to the generated value — NOT nested inside `features`; minimum 100 iterations
    - _Requirements: 3.3_

  - [x] 5.7 Write property test — P10: stripe_price_id round-trip — save then reload
    - `// Feature: ui-critical-fixes, Property 10: stripe_price_id round-trip — save then reload`
    - Use `fc.string({ minLength: 1 })` for price IDs; mock `billingApi.listAllPlans` to return a plan with top-level `stripe_price_id` set to the generated value; open edit form; assert field value equals `plan.stripe_price_id` — NOT read from `plan.features`; minimum 100 iterations
    - _Requirements: 3.4, 3.8_

- [x] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` — add as dev dependency if not present: `npm install -D fast-check` in `apps/web`
- `DashboardLayout` remains the approved layout wrapper per layout-governance.md — no layout changes in scope
