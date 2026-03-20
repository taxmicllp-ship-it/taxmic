---
inclusion: always
---

# Layout Governance — Approved Exception

## Status: Documented Mismatch (Phase 5 Billing Audit, 2026-03-17)

`FRONTEND-DESIGN-SYSTEM-GOVERNANCE.md` specifies that all pages must use the `AppLayout → AppHeader → AppSidebar → PageContainer` component system from `ui_theme_ref/layout/`.

**However:** All phases 1–4 were implemented using `DashboardLayout` from `apps/web/src/components/layout/DashboardLayout.tsx`. Phase 5 billing pages follow the same pattern for consistency.

## Decision

`DashboardLayout` is the **approved layout wrapper** for this project across all phases until a formal layout migration is scoped and executed. Do NOT migrate layouts mid-phase.

## Rationale

- Changing layouts mid-project risks breaking navigation, auth guards, and sidebar state across all 5 phases.
- The `AppLayout` system from `ui_theme_ref/` has not been validated against the existing routing and auth context.
- A layout migration must be treated as its own phase with regression testing across all routes.

## Action Required (Future Phase)

Scope a dedicated layout migration phase that:
1. Replaces `DashboardLayout` with `AppLayout + AppSidebar + AppHeader + PageContainer`
2. Runs full regression across Auth, CRM, Documents, Tasks, and Billing
3. Validates sidebar state, theme toggle, and protected route behavior
