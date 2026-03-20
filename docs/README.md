# Documentation Index

**System:** Practice Management SaaS
**Status:** Active Development
**Last Updated:** 2026-03-15

---

## Structure Overview

```
docs/
├── 01-product/          # What we are building
├── 02-architecture/     # How the system is designed
├── 03-database/         # Database specification (source of truth)
├── 04-development/      # How we build it, phase by phase
├── 05-operations/       # How we run it in production
├── 06-reference/        # Developer notes and working materials
├── audits/              # Phase audit and repair reports
└── archive/             # Obsolete documents (do not use)
```

---

## Sources of Truth

| Domain | Document | Location |
|--------|----------|----------|
| Product scope & MVP | `mvp-doc.md` | `01-product/` |
| System architecture | `MASTER-SYSTEM-BLUEPRINT.md` | `02-architecture/` |
| Database schema | `DATABASE-ARCHITECTURE-MASTER.md` | `03-database/` |
| Development execution | `PHASE-WISE-EXECUTION-PLAN.md` | `04-development/` |

**Rule:** If a document contradicts the source of truth, the source of truth wins.

---

## Where to Start

**New developer onboarding — read in this order:**

1. `01-product/mvp-doc.md` — understand what the product does
2. `02-architecture/MASTER-SYSTEM-BLUEPRINT.md` — understand how it's built
3. `03-database/DATABASE-ARCHITECTURE-MASTER.md` — understand the data model
4. `04-development/PHASE-WISE-EXECUTION-PLAN.md` — understand the build sequence

---

## Folder Details

### 01-product
Product definition and MVP scope. Defines what features exist, what is deferred, and what the product does for users.

| File | Purpose |
|------|---------|
| `mvp-doc.md` | Full product specification — SOURCE OF TRUTH |
| `MVP-FEATURE-LOCK.md` | Locked MVP feature list, no scope creep |
| `main-doc.md` | Original product overview |
| `BRUTAL-MVP.md` | Brutal MVP scope reduction decisions |

---

### 02-architecture
System design, technology stack, infrastructure, and module structure.

| File | Purpose |
|------|---------|
| `MASTER-SYSTEM-BLUEPRINT.md` | Complete system blueprint — SOURCE OF TRUTH |
| `FINAL-ARCHITECTURE-FIXES.md` | Architecture fixes applied after review |
| `FOLDER-STRUCTURE-FINAL.md` | Repository folder structure |

**02-architecture/validation/** — Historical architecture reviews. These are reference documents, not source of truth.

| File | Purpose |
|------|---------|
| `ARCHITECTURE-VALIDATION-RESPONSE.md` | First brutal architecture review |
| `FINAL-VALIDATION-RESPONSE.md` | Final validation response |
| `CRITICAL-FIXES-SUMMARY.md` | Summary of critical fixes applied |
| `FINAL-SUMMARY.md` | Final architecture summary |
| `ARCHITECTURE-STATUS.md` | Architecture status tracking |

---

### 03-database
Complete database specification. All 36 tables, relationships, indexes, RLS policies, ENUMs, and constraints.

| File | Purpose |
|------|---------|
| `DATABASE-ARCHITECTURE-MASTER.md` | Complete database spec — SOURCE OF TRUTH |
| `DATABASE-DOCUMENTATION-SUMMARY.md` | Summary of database documentation |
| `FINAL-VALIDATION-CHECKLIST.md` | Pre-migration validation checklist (95/100) |
| `CRITICAL-FIXES-APPLIED.md` | Record of all critical fixes |
| `README.md` | Database folder navigation guide |
| `diagrams/ERD-DATABASE.md` | Entity relationship diagram |

**03-database/phases/** — Phase-by-phase migration implementation guide.

| File | Tables Covered |
|------|---------------|
| `PHASE-1-FOUNDATION.md` | firms, users, roles, permissions |
| `PHASE-2-CRM.md` | clients, contacts, addresses |
| `PHASE-3-DOCUMENTS.md` | folders, documents, versions, permissions |
| `PHASE-4-TASKS.md` | tasks, assignments, comments |
| `PHASE-5-BILLING.md` | invoices, items, payments, sequences |
| `PHASE-6-NOTIFICATIONS.md` | notifications, email_events |
| `PHASE-7-PORTAL.md` | client_users, portal_sessions |
| `PHASE-8-SAAS-BILLING.md` | plans, subscriptions, events |
| `PHASE-9-OBSERVABILITY.md` | activity_events, webhooks, flags, storage |

---

### 04-development
Development execution strategy, implementation checklists, and phase planning.

| File | Purpose |
|------|---------|
| `PHASE-WISE-EXECUTION-PLAN.md` | Phase-by-phase build plan — SOURCE OF TRUTH |
| `BACKEND-DEVELOPMENT-ORDER.md` | Strict module build order, folder structure, architecture rules — SOURCE OF TRUTH |
| `PHASE-WISE-EXECUTION-PLAN-PART2.md` | Continuation of execution plan |
| `IMPLEMENTATION-CHECKLIST.md` | Developer implementation checklist |
| `implementation-plan.md` | Detailed implementation plan |
| `OPTIMIZED-MVP-PLAN.md` | Optimized MVP delivery plan |

---

### 05-operations
Production deployment, system operations, and readiness documentation.

| File | Purpose |
|------|---------|
| `SYSTEM-OPERATIONS.md` | Full system operations guide |
| `production-readiness.md` | Production readiness checklist |

---

### 06-reference
Developer working notes and reference materials. Not authoritative.

| File | Purpose |
|------|---------|
| `dev.md` | Developer notes and quick reference |
| `prompt.md` | Working prompts and notes |

---

### archive/
Obsolete documents moved here when superseded. Do not use these as reference.

---

## Rules for New Documents

1. Every new document must go into one of the 6 numbered folders
2. If a document updates a source of truth, update the source of truth directly — do not create a new file
3. Historical reviews and validation notes go in `02-architecture/validation/`
4. No documents at the root `docs/` level except this README

---

## Database Status

- Architecture score: **95/100**
- Tables: **36**
- ENUMs: **11**
- Status: **Production Ready — awaiting migration implementation**
- Migration order: Phase 1 → Phase 9 (see `03-database/phases/`)
