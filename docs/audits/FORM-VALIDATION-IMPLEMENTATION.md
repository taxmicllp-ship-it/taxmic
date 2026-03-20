# Form Validation Implementation Report

**Date:** 2026-03-17  
**Phase Coverage:** Phases 1–5 (Auth, CRM, Documents, Tasks, Billing)  
**Stack:** `react-hook-form` + `zod` + `@hookform/resolvers/zod`

---

## Summary

Client-side form validation has been implemented across all forms in Phases 1–5. Every form now:
- Validates fields before any API call is made
- Shows inline field-level error messages
- Displays top-level API error alerts on mutation failure
- Uses a consistent pattern across all modules

---

## Stack Installed

```
react-hook-form
zod
@hookform/resolvers
```

Installed in `apps/web/package.json`.

---

## Global Utilities

### `apps/web/src/lib/getErrorMessage.ts`
Normalizes API error responses into a string message.  
Handles: `error.response.data.message`, `error.response.data.error`, `error.message`, fallback `"Something went wrong"`.

---

## Forms Updated

### Phase 1 — Auth

**File:** `apps/web/src/pages/auth/login.tsx`  
**Schema:** `apps/web/src/features/auth/validation/auth.schema.ts` → `LoginSchema`

| Field | Rule |
|-------|------|
| firmSlug | min 2 characters |
| email | valid email format |
| password | min 6 characters |

- Inline errors under each field
- API error shown in `<Alert type="error">` at top of form
- Validation runs before `useAuth` mutation fires

---

**File:** `apps/web/src/pages/auth/register.tsx`  
**Schema:** `apps/web/src/features/auth/validation/auth.schema.ts` → `RegisterSchema`

| Field | Rule |
|-------|------|
| firmName | min 2 characters |
| firmSlug | min 2 chars, lowercase/numbers/hyphens only |
| firmEmail | valid email |
| firstName | required |
| lastName | required |
| email | valid email |
| password | min 8 characters |
| confirmPassword | must match password (cross-field refine) |

- Cross-field password match validation via `.refine()`
- Inline errors under each field
- API error shown in `<Alert type="error">`

---

### Phase 2 — CRM

**File:** `apps/web/src/features/clients/components/ClientForm.tsx`  
**Schema:** `apps/web/src/features/clients/validation/client.schema.ts` → `ClientSchema`

| Field | Rule |
|-------|------|
| name | required |
| email | valid email or empty string (optional) |
| phone | optional |
| type | enum: individual / business / nonprofit |
| status | enum: active / inactive / archived / lead |
| taxId | optional |
| website | optional |
| notes | optional |

- `onError` prop wired in `apps/web/src/pages/clients/new.tsx` and `apps/web/src/pages/clients/edit.tsx`

---

**File:** `apps/web/src/features/contacts/components/ContactForm.tsx`  
**Schema:** `apps/web/src/features/contacts/validation/contact.schema.ts` → `ContactSchema`

| Field | Rule |
|-------|------|
| name | required |
| email | valid email or empty string (optional) |
| phone | optional |
| title | optional |
| notes | optional |

- `onError` prop wired in `apps/web/src/pages/contacts/new.tsx` and `apps/web/src/pages/contacts/edit.tsx`

---

### Phase 3 — Documents

**File:** `apps/web/src/features/documents/components/DocumentUpload.tsx`  
**Validation:** Custom Zod-style checks (no RHF needed — file input not compatible with RHF register)

| Rule | Detail |
|------|--------|
| File required | Must select a file before submit |
| File size | Max 20MB |
| File type | Allowed: pdf, jpg, jpeg, png, docx |

- Validation runs synchronously before API call
- Error shown inline via `<p className="text-red-500 text-sm">`

---

### Phase 4 — Tasks

**File:** `apps/web/src/features/tasks/components/TaskForm.tsx`  
**Schema:** `apps/web/src/features/tasks/validation/task.schema.ts` → `TaskSchema`

| Field | Rule |
|-------|------|
| title | required |
| description | optional |
| status | enum: new / in_progress / waiting_client / review / completed |
| priority | enum: low / medium / high / urgent |
| due_date | optional; if set, must be today or future |
| client_id | optional |

- `onError` prop wired in `apps/web/src/pages/tasks/new.tsx` and `apps/web/src/pages/tasks/[id].tsx`

---

### Phase 5 — Billing

**File:** `apps/web/src/features/invoices/components/InvoiceForm.tsx`  
**Schema:** `apps/web/src/features/invoices/validation/invoice.schema.ts` → `InvoiceSchema`

| Field | Rule |
|-------|------|
| client_id | required |
| issue_date | required |
| due_date | optional; if set, must be today or future |
| tax_amount | optional |
| notes | optional |
| items | array, min 1 item required |
| items[].description | required |
| items[].quantity | must be > 0 |
| items[].unit_price | must be >= 0 |

- Line items validated per-row with inline errors
- `onError` prop wired in `apps/web/src/pages/invoices/new.tsx`

---

## Component Fix

**File:** `apps/web/src/components/form/InputField.tsx`

Wrapped with `React.forwardRef` to resolve the React warning:
> "Function components cannot be given refs. Did you mean to use React.forwardRef()?"

This was required because `react-hook-form`'s `register()` passes a `ref` to inputs. Without `forwardRef`, the ref was silently dropped and validation state could not be tracked correctly.

---

## Error Display Pattern

### Field-level errors
```tsx
{errors.fieldName && (
  <p className="text-red-500 text-sm mt-1">{errors.fieldName.message}</p>
)}
```

### API error alert
```tsx
{error && <Alert type="error">{error}</Alert>}
```

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/components/form/InputField.tsx` | Wrapped with `React.forwardRef` |
| `apps/web/src/lib/getErrorMessage.ts` | Created — API error normalizer |
| `apps/web/src/features/auth/validation/auth.schema.ts` | Created |
| `apps/web/src/features/clients/validation/client.schema.ts` | Created |
| `apps/web/src/features/contacts/validation/contact.schema.ts` | Created |
| `apps/web/src/features/tasks/validation/task.schema.ts` | Created |
| `apps/web/src/features/invoices/validation/invoice.schema.ts` | Created |
| `apps/web/src/pages/auth/login.tsx` | RHF + Zod wired |
| `apps/web/src/pages/auth/register.tsx` | RHF + Zod wired |
| `apps/web/src/features/clients/components/ClientForm.tsx` | RHF + Zod wired |
| `apps/web/src/features/contacts/components/ContactForm.tsx` | RHF + Zod wired |
| `apps/web/src/features/tasks/components/TaskForm.tsx` | RHF + Zod wired |
| `apps/web/src/features/invoices/components/InvoiceForm.tsx` | RHF + Zod wired |
| `apps/web/src/features/documents/components/DocumentUpload.tsx` | File validation added |
| `apps/web/src/pages/clients/new.tsx` | `onError` wired |
| `apps/web/src/pages/clients/edit.tsx` | `onError` wired |
| `apps/web/src/pages/contacts/new.tsx` | `onError` wired |
| `apps/web/src/pages/contacts/edit.tsx` | `onError` wired |
| `apps/web/src/pages/tasks/new.tsx` | `onError` wired |
| `apps/web/src/pages/tasks/[id].tsx` | `onError` wired |
| `apps/web/src/pages/invoices/new.tsx` | `onError` wired |

---

## What Was NOT Changed

- No backend APIs modified
- No database schema changes
- No folder structure changes
- No UI theme components modified
- No new UI components created
- `DashboardLayout` untouched (per layout governance)
- All existing routes remain functional

---

## Success Criteria

| Criteria | Status |
|----------|--------|
| Field-level validation | ✅ All forms |
| API error display | ✅ All forms |
| Consistent validation pattern | ✅ RHF + Zod across all modules |
| No silent failures | ✅ All mutations have `onError` handlers |
| Same UX across modules | ✅ |
| Zero TypeScript diagnostics | ✅ Confirmed |
