# Frontend Design System Governance

**Version:** 1.0  
**Status:** ENFORCED  
**Applies To:** All frontend development on `apps/web`  
**Design System Source:** `ui_theme_ref/`

---

## Purpose

This document is the single source of truth for all frontend UI development on the Taxmic platform. It defines how pages are built, which components are permitted, and what to do when a required component does not exist.

Every developer working on the frontend must read and follow this document before writing any UI code.

---

## 1. Design System Location

The official Taxmic design system lives at:

```
ui_theme_ref/
```

This folder contains the complete component library:

```
ui_theme_ref/
├── layout/           # AppLayout, AppSidebar, AppHeader, PageContainer
├── components/
│   ├── ui/           # Button, Badge, Alert, Dropdown, Modal, Table, Card, Input, Select, Spinner, Toast
│   ├── form/         # Form, FormField, FormLabel, FormError, FormGroup
│   ├── tables/       # DataTable, TableHeader, TableRow, TableCell, Pagination
│   ├── charts/       # BarChart, LineChart, PieChart, StatCard
│   └── header/       # AppHeader, PageHeader, Breadcrumb
├── icons/            # Icon library
└── pages/
    ├── 404.tsx        ✅ Reusable
    ├── login.tsx      ✅ Reusable
    └── signup.tsx     ✅ Reusable
```

This is a component library. It is not a product UI. Developers compose product pages using these components.

---

## 2. Component Usage Rules

### Rule 1 — Design System Is the Only Approved UI Source

All UI must be built using components from `ui_theme_ref/`. These are imported into the product via:

```
apps/web/src/components/ui/
apps/web/src/components/form/
apps/web/src/components/tables/
apps/web/src/components/header/
apps/web/src/layout/
```

No raw HTML UI elements (custom buttons, custom inputs, custom modals) may be written unless a component genuinely does not exist in the design system.

### Rule 2 — Component Mapping

Use the correct component for each UI element:

| UI Element | Component |
|------------|-----------|
| Button | `components/ui/button` |
| Input | `components/ui/input` |
| Select | `components/ui/select` |
| Table | `components/ui/table` |
| Form | `components/form` |
| Alert | `components/ui/alert` |
| Badge | `components/ui/badge` |
| Dropdown | `components/ui/dropdown` |
| Modal | `components/ui/modal` |
| Card | `components/ui/card` |
| Spinner | `components/ui/spinner` |
| Toast | `components/ui/toast` |
| Charts | `components/charts` |
| Page Header | `components/header` |

### Rule 3 — Missing Component Workflow

If a required UI component does not exist in the design system:

1. **STOP development on that UI element**
2. Document the missing component:
   - Component name
   - Where it is needed
   - What it should do
3. Raise a design system update request
4. Do NOT create a custom implementation as a workaround
5. Only resume development after the component is added to `ui_theme_ref/`

This rule exists to prevent design fragmentation. One-off custom components become technical debt immediately.

### Rule 4 — Prebuilt Example Pages Are Reference Only

The `ui_theme_ref/pages/` folder contains example pages (Dashboard, Charts, Tables, Forms). These are for reference only. They must NOT be copied into `apps/web/src/`.

The only pages from the theme that may be used directly in production:

| Page | Status |
|------|--------|
| `pages/404.tsx` | ✅ Use directly |
| `pages/login.tsx` | ✅ Use directly |
| `pages/signup.tsx` | ✅ Use directly |
| `pages/dashboard.tsx` | ❌ Reference only — build manually |
| `pages/charts.tsx` | ❌ Reference only |
| `pages/tables.tsx` | ❌ Reference only |
| `pages/forms.tsx` | ❌ Reference only |

All dashboard pages and feature pages must be built manually by composing components.

---

## 3. Layout Rules

### Rule 5 — Use the Theme Layout System

All pages must use the layout system provided by the theme. Do not create new layout wrappers.

**Required layout components:**

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Root layout wrapper |
| `AppSidebar` | Left navigation sidebar |
| `AppHeader` | Top header bar |
| `AppNavbar` | Navigation links |
| `SidebarWidget` | Sidebar utility widgets |
| `PageContainer` | Content area wrapper |

### Rule 6 — Page Composition Pattern

Every product page must follow this structure:

```
AppLayout
  AppHeader
  AppSidebar
    AppNavbar
    SidebarWidget (optional)
  PageContainer
    PageHeader (title + breadcrumb)
    ComponentCard
      [Feature Component]
    ComponentCard
      [Feature Component]
```

Example — Clients List Page:

```tsx
<AppLayout>
  <AppHeader />
  <AppSidebar>
    <AppNavbar />
  </AppSidebar>
  <PageContainer>
    <PageHeader title="Clients" />
    <ComponentCard>
      <DataTable columns={columns} data={clients} />
    </ComponentCard>
  </PageContainer>
</AppLayout>
```

Example — Invoice Form Page:

```tsx
<AppLayout>
  <AppHeader />
  <AppSidebar>
    <AppNavbar />
  </AppSidebar>
  <PageContainer>
    <PageHeader title="New Invoice" />
    <ComponentCard>
      <Form onSubmit={handleSubmit}>
        <FormField name="client" label="Client">
          <Select options={clientOptions} />
        </FormField>
        <FormField name="due_date" label="Due Date">
          <Input type="date" />
        </FormField>
        <Button type="submit">Create Invoice</Button>
      </Form>
    </ComponentCard>
  </PageContainer>
</AppLayout>
```

---

## 4. Branding Rules

### Rule 7 — Taxmic Brand Colors Only

All UI must use the Taxmic brand palette. No additional colors are permitted.

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#059669` | Buttons, links, active states |
| Primary Dark | `#065F46` | Hover states, dark accents |
| Accent | `#34D399` | Highlights, tags |
| Background | `#F9FAFB` | Page background |
| Card | `#FFFFFF` | Card backgrounds |
| Text | `#111827` | Body text |
| Success | `#16A34A` | Success states |
| Warning | `#D97706` | Warning states |
| Error | `#DC2626` | Error states |

These values are defined in the theme's Tailwind config. Use the semantic class names — do not hardcode hex values in components.

```tsx
// ✅ Correct
<Button className="bg-primary text-white hover:bg-primary-dark">Save</Button>

// ❌ Wrong
<button style={{ backgroundColor: '#059669' }}>Save</button>
```

---

## 5. Per-Phase Frontend Rules

Each development phase must use the design system as the only UI base.

### Phase 2 — CRM Frontend
- Client list page: `DataTable` + `Badge` (status) + `Button` (actions)
- Client detail page: `ComponentCard` + `Form` + `DataTable` (contacts)
- Contact form: `Form` + `FormField` + `Input` + `Select`

### Phase 3 — Documents Frontend
- Folder tree: compose using `AppSidebar` pattern + custom tree (request component if missing)
- Document list: `DataTable` + `Badge` (type) + `Button` (upload/download)
- Upload form: `Form` + `Input[type=file]` + `Spinner` (progress)

### Phase 4 — Tasks Frontend
- Task list: `DataTable` + `Badge` (status/priority) + `Dropdown` (filters)
- Task form: `Form` + `FormField` + `Select` (assignee/status) + `Input` (due date)

### Phase 5 — Invoicing Frontend
- Invoice list: `DataTable` + `Badge` (status) + `Button` (send/pay)
- Invoice form: `Form` + line items table (request component if missing)
- Invoice detail: `ComponentCard` + `StatCard` (totals)

### Phase 8 — Portal Frontend
- Portal uses the same design system
- Portal layout uses `AppLayout` with portal-specific navigation
- No separate design system for the portal

### Phase 9 — SaaS Billing Frontend
- Plans page: `ComponentCard` per plan + `Badge` (current plan) + `Button` (upgrade)
- Usage dashboard: `StatCard` + `BarChart` (usage vs limit)

---

## 6. Missing Components — Must Be Created in Theme

The following components are referenced in page composition patterns but do not yet exist in `ui_theme_ref/components/ui/`. They must be added to the design system before any page that requires them can be built.

| Component | Required By | Description |
|-----------|-------------|-------------|
| `ComponentCard` | All feature pages | Wrapper card for page sections |
| `Spinner` | Upload, loading states | Loading indicator |
| `Toast` | Form submissions, actions | Transient notification messages |
| `DataTable` | Clients, Documents, Tasks, Invoices | Full-featured data table with sorting/pagination |
| `PageContainer` | All pages | Content area wrapper with consistent padding |
| `PageHeader` | All pages | Page title + breadcrumb bar |
| `Pagination` | All list pages | Page navigation for large datasets |

**Process for adding a missing component:**
1. Design the component in `ui_theme_ref/components/ui/`
2. Export it from the component library index
3. Update this table to mark it as available
4. Only then may development of dependent pages proceed

---

## 7. Validation Checklist

Before submitting any frontend PR, verify:

- [ ] All UI elements use components from `ui_theme_ref/`
- [ ] No raw HTML buttons, inputs, or modals written from scratch
- [ ] Page uses `AppLayout` → `AppHeader` → `AppSidebar` → `PageContainer` structure
- [ ] No example pages copied from `ui_theme_ref/pages/` (except 404, login, signup)
- [ ] Only Taxmic brand colors used (no hardcoded hex values)
- [ ] Missing components flagged and documented — not worked around
- [ ] No new layout systems created

---

## 8. Enforcement

This document is enforced at code review. PRs that violate these rules will be rejected with a reference to the specific rule number.

If you believe a rule needs an exception, raise it explicitly in the PR description with justification. Exceptions require team lead approval.
