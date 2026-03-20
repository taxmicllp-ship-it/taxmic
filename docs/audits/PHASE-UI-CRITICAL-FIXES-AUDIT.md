# Phase Audit: ui-critical-fixes

**Date:** 2026-03-18  
**Auditor:** Kiro (evidence-based, code-verified)  
**Spec:** `.kiro/specs/ui-critical-fixes/`  
**Verdict:** ✅ PASS — All critical requirements implemented correctly. No blocking bugs found.

---

## Summary

| Area | Status | Notes |
|---|---|---|
| Reset Password Page | ✅ PASS | Token handling, form, success/error states all correct |
| ClientPicker Component | ✅ PASS | Debounce, AbortController, outside-click, edit mode all correct |
| Admin Plans Page | ✅ PASS | stripe_price_id at top-level, InputField/Table components used |
| API Contract | ✅ PASS | CreatePlanPayload has stripe_price_id as top-level optional field |
| Async Safety | ✅ PASS | AbortController + stale-check guards in ClientPicker |
| Test Suite | ✅ PASS | 38 tests across 7 files, all passing |
| Spec Consistency | ✅ PASS | Implementation matches requirements and design |
| Critical Bugs | ✅ NONE | Alert showLink/linkHref/linkText props verified supported |

---

## 1. Reset Password Page

**File:** `apps/web/src/pages/auth/reset-password.tsx`

### Layout
- ✅ PASS — Uses `AuthPageLayout` wrapper (line 1 import, line 52 JSX)
- Evidence: `import AuthPageLayout from '../../components/layout/AuthPageLayout'` + `<AuthPageLayout>`

### Token Extraction
- ✅ PASS — Token read via `useSearchParams`: `const token = searchParams.get('token') ?? ''`
- Evidence: lines 32–33 of reset-password.tsx
- Token is NOT part of the Zod schema (schema only has `password` + `confirmPassword`) — correct

### Missing Token Guard
- ✅ PASS — When `!token`, renders only an error Alert, no form
- Evidence: `{!token && (<Alert variant="error" title="Invalid reset link" .../>)}` + `{token && !isSuccess && (<form ...>)}`
- Form is gated on `token && !isSuccess` — absent token = no form rendered

### Zod Schema
- ✅ PASS — `password: z.string().min(8, ...)`, `confirmPassword: z.string()`, `.refine(d => d.password === d.confirmPassword)`
- Evidence: `ResetPasswordSchema` lines 14–21 of reset-password.tsx
- Token NOT in schema — correct, token is read from URL not form

### API Call
- ✅ PASS — `useMutation` calls `resetPassword({ token, password: values.password })`
- Evidence: `mutationFn: (values) => resetPassword({ token, password: values.password })`

### Success State
- ✅ PASS — Renders `<Alert variant="success" ... showLink linkHref="/login" linkText="Sign in to your account" />`
- Evidence: lines 73–79 of reset-password.tsx
- ✅ PASS — `Alert` component DOES support `showLink`, `linkHref`, `linkText` props
- Evidence: `apps/web/src/components/ui/Alert.tsx` interface lines 8–10, renders `<Link to={linkHref}>` when `showLink=true`

### Error State
- ✅ PASS — `getErrorMessage(error)` used, rendered in `<Alert variant="error">`
- Evidence: `const errorMessage = error ? getErrorMessage(error) : null` + conditional Alert render

### Loading State
- ✅ PASS — `<Button ... disabled={isPending}>` with label `{isPending ? 'Resetting...' : 'Reset password'}`
- Evidence: lines 107–109 of reset-password.tsx

### Route Registration
- ✅ PASS — Route is PUBLIC, outside DashboardLayout
- Evidence: `apps/web/src/App.tsx` — `<Route path="/reset-password" element={<ResetPasswordPage />} />` at line 44, not nested inside the authenticated DashboardLayout routes

---

## 2. ClientPicker Component

**File:** `apps/web/src/components/form/ClientPicker.tsx`

### Props Interface
- ✅ PASS — `value: string | null`, `onChange: (id: string | null) => void`, `disabled?: boolean`, `error?: boolean`
- Evidence: `interface ClientPickerProps` lines 10–15

### Debounce
- ✅ PASS — `useEffect` with `setTimeout(300ms)` + `clearTimeout` cleanup
- Evidence:
  ```ts
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(query); }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  ```

### AbortController / Stale Request Prevention
- ✅ PASS — `const controller = new AbortController()` per search, `return () => controller.abort()` cleanup
- ✅ PASS — Stale check: `if (!controller.signal.aborted)` guards all state updates in `.then`, `.catch`, `.finally`
- Evidence: search effect lines 43–57 of ClientPicker.tsx

### Outside-Click Close
- ✅ PASS — `document.addEventListener('mousedown', handler)` + `removeEventListener` cleanup
- Evidence:
  ```ts
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  ```

### Edit Mode (value pre-population)
- ✅ PASS — When `value` is non-null on mount, calls `clientsApi.get(value)` to resolve display name
- Evidence: `if (value && !query) { clientsApi.get(value).then(client => setSelectedName(client.name)) }`

### Selection
- ✅ PASS — `handleSelect` calls `onChange(client.id)`, sets `selectedName = client.name`
- Evidence: `handleSelect` function lines 73–78

### Clear
- ✅ PASS — `handleClear` calls `onChange(null)`, resets query, selectedName, results, open, searchError
- Evidence: `handleClear` function lines 80–87

### Dropdown Positioning
- ✅ PASS — Container has `style={{ position: 'relative' }}`, dropdown has `style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50 }}`
- Evidence: lines 92 and 107 of ClientPicker.tsx

### Inline Search Error
- ✅ PASS — `searchError` state rendered as `<p className="mt-1.5 text-xs text-error-500">{searchError}</p>`
- Evidence: lines 143–145 of ClientPicker.tsx

### Dropdown Item Click (mousedown vs click)
- ✅ PASS — Uses `onMouseDown` with `e.preventDefault()` to prevent blur-before-click race condition
- Evidence: `onMouseDown={(e) => { e.preventDefault(); handleSelect(client); }}`

---

## 3. Admin Plans Page

**File:** `apps/web/src/pages/billing/admin-plans.tsx`

### stripe_price_id in FormData
- ✅ PASS — `stripe_price_id: string` present in `FormData` interface
- Evidence: `interface FormData { ... stripe_price_id: string; }` lines 17–27

### emptyForm Initialization
- ✅ PASS — `emptyForm` has `stripe_price_id: ''`
- Evidence: `const emptyForm: FormData = { ... stripe_price_id: '', }`

### planToForm Mapping
- ✅ PASS — Reads `plan.stripe_price_id ?? ''` from top-level Plan field (NOT from `features`)
- Evidence: `stripe_price_id: plan.stripe_price_id ?? ''` in `planToForm` function

### handleSubmit Payload
- ✅ PASS — `stripe_price_id: formData.stripe_price_id || undefined` sent as top-level field in `CreatePlanPayload`
- Evidence: `const payload: CreatePlanPayload = { ... stripe_price_id: formData.stripe_price_id || undefined, }`

### Form Fields Use InputField
- ✅ PASS — All form inputs use `<InputField>` component with `data-testid` attributes
- Evidence: all 9 form fields in the grid use `<InputField ...>`, including `data-testid="field-stripe_price_id"`

### Table Components
- ✅ PASS — Uses `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` from `../../components/ui/Table`
- Evidence: import line + JSX usage throughout the plans table

---

## 4. API Contract

**File:** `apps/web/src/features/billing/api/billing-api.ts`

### CreatePlanPayload
- ✅ PASS — `stripe_price_id?: string` present as top-level optional field
- Evidence:
  ```ts
  export interface CreatePlanPayload {
    name: string;
    slug: string;
    ...
    stripe_price_id?: string;
  }
  ```

### Plan Type (billing/types.ts)
- ✅ PASS — `stripe_price_id: string | null` is a top-level field on `Plan` interface (NOT nested in `features`)
- Evidence: `apps/web/src/features/billing/types.ts` — `stripe_price_id: string | null` at top level of `Plan` interface

### UpdatePlanPayload
- ✅ PASS — `type UpdatePlanPayload = Partial<CreatePlanPayload>` — inherits `stripe_price_id` automatically

---

## 5. Async Safety

**File:** `apps/web/src/components/form/ClientPicker.tsx`

### Race Condition Prevention
- ✅ PASS — Each search effect creates a new `AbortController`, previous controller aborted on cleanup
- ✅ PASS — All state updates guarded by `if (!controller.signal.aborted)` check
- ✅ PASS — `isSearching` set to false only if not aborted (prevents stale loading state)

### Memory Leak Prevention
- ✅ PASS — `clearTimeout` in debounce effect cleanup
- ✅ PASS — `controller.abort()` in search effect cleanup
- ✅ PASS — `removeEventListener` in outside-click effect cleanup

### Form Integration (TaskForm + InvoiceForm)
- ✅ PASS — Both forms use `Controller` + `ClientPicker`, no raw UUID text input
- Evidence:
  - `apps/web/src/features/tasks/components/TaskForm.tsx` — `<Controller name="client_id" ... render={({ field }) => <ClientPicker value={field.value ?? null} onChange={field.onChange} .../>}/>`
  - `apps/web/src/features/invoices/components/InvoiceForm.tsx` — same pattern

### Schema Compatibility
- ✅ PASS — `task.schema.ts`: `client_id: z.string().nullable().optional()`
- ✅ PASS — `invoice.schema.ts`: `client_id: z.string().nullable().optional()`
- Both schemas accept `null` and `undefined`, compatible with ClientPicker's `onChange(null)` on clear

---

## 6. Test Audit

**Test runner:** Vitest  
**Total:** 38 tests across 7 files — all passing

| File | Tests | Status |
|---|---|---|
| `reset-password.test.tsx` | Unit tests for token guard, form, success/error states | ✅ PASS |
| `reset-password.property.test.tsx` | PBT: token presence invariants, password validation | ✅ PASS |
| `client-picker.test.tsx` | Unit tests for debounce, selection, clear, outside-click | ✅ PASS |
| `client-picker.property.test.tsx` | PBT: onChange contract, value/null invariants | ✅ PASS |
| `form-integration.test.tsx` | Integration: TaskForm + InvoiceForm use ClientPicker | ✅ PASS |
| `admin-plans.test.tsx` | Unit tests for CRUD, stripe_price_id field, table render | ✅ PASS |
| `admin-plans.property.test.tsx` | PBT: planToForm/formToPayload round-trip, stripe_price_id invariants | ✅ PASS |

---

## 7. Spec Consistency

**Requirements:** `.kiro/specs/ui-critical-fixes/requirements.md`  
**Design:** `.kiro/specs/ui-critical-fixes/design.md`

| Requirement | Implemented | Verified |
|---|---|---|
| Reset password reads token from URL query param | ✅ | `searchParams.get('token')` |
| Missing token shows error, no form | ✅ | `!token` guard on Alert + form |
| Password min 8 chars, confirm match | ✅ | Zod schema with `.refine` |
| Success state shows login link | ✅ | Alert with showLink + linkHref="/login" |
| ClientPicker debounce 300ms | ✅ | setTimeout 300ms in useEffect |
| ClientPicker AbortController per search | ✅ | New controller per debouncedQuery change |
| ClientPicker outside-click closes dropdown | ✅ | mousedown listener on document |
| ClientPicker edit mode resolves name | ✅ | clientsApi.get(value) on mount |
| TaskForm uses ClientPicker (not raw input) | ✅ | Controller + ClientPicker |
| InvoiceForm uses ClientPicker (not raw input) | ✅ | Controller + ClientPicker |
| Admin Plans has stripe_price_id field | ✅ | FormData + emptyForm + planToForm + handleSubmit |
| stripe_price_id at top-level (not in features) | ✅ | plan.stripe_price_id (not plan.features.stripe_price_id) |
| Admin Plans uses InputField components | ✅ | All 9 fields use InputField |
| Admin Plans uses Table components | ✅ | Table/TableHeader/TableBody/TableRow/TableCell |

---

## 8. Critical Bugs

**None found.**

One potential issue was flagged during audit planning — whether `Alert` supported `showLink`/`linkHref`/`linkText` props. This was verified:

- ✅ `apps/web/src/components/ui/Alert.tsx` interface explicitly declares `showLink?: boolean`, `linkHref?: string`, `linkText?: string`
- ✅ Component renders `<Link to={linkHref}>{linkText}</Link>` when `showLink=true`
- ✅ `reset-password.tsx` passes `showLink linkHref="/login" linkText="Sign in to your account"` — login link will render correctly on success

---

## Recommendation

**SHIP.** All requirements from the ui-critical-fixes spec are implemented correctly and verified against source code. The test suite provides solid coverage including property-based tests for the core invariants. No regressions or blocking issues found.
