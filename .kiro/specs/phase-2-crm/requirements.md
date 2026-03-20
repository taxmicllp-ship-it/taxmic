# Phase 2 — CRM Module Requirements

## Overview

Build the CRM module for managing clients and contacts within a multi-tenant accounting SaaS platform. Each firm manages its own isolated set of clients and contacts.

---

## Functional Requirements

### FR-01 — Firm Profile
- A firm owner can view their firm's profile (name, slug, email, phone, address, website, timezone)
- A firm owner can update their firm's profile fields (excluding slug)

### FR-02 — Client Management
- A user can create a client within their firm
- A user can view a paginated list of clients belonging to their firm
- A user can search clients by name (case-insensitive, partial match)
- A user can view a single client's full details
- A user can update a client's details
- A user can soft-delete a client (sets `deleted_at`, never permanently removed)
- Soft-deleted clients must not appear in any list or search results

### FR-03 — Contact Management
- A user can create a contact within their firm
- A user can view a paginated list of contacts belonging to their firm
- A user can view a single contact's full details
- A user can update a contact's details
- A user can hard-delete a contact

### FR-04 — Contact-Client Relationships
- A contact may be linked to multiple clients
- A user can link an existing contact to an existing client
- A user can unlink a contact from a client
- Linking the same contact to the same client twice must return a conflict error

### FR-05 — Tenant Isolation
- All data operations must be scoped to the authenticated user's `firmId`
- No user may read, write, or delete data belonging to another firm
- `firmId` is sourced from the verified JWT payload — never from request body or query params

---

## Non-Functional Requirements

### NFR-01 — Search Performance
- Client name search uses trigram indexes (applied in `20260316000000_crm_search_indexes`)
- Search must remain fast at 500k+ clients per firm

### NFR-02 — Pagination
- All list endpoints support `?page` and `?limit` query params
- Default: `page=1`, `limit=20`, max `limit=100`

### NFR-03 — Validation
- All request bodies validated with Zod before reaching the service layer
- Invalid requests return `422 VALIDATION_ERROR`

### NFR-04 — Error Codes
- All errors follow `{ error: string, code: string }` format from Phase 1
- Standard codes: `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `INTERNAL_ERROR`

### NFR-05 — Structured Logging
- All CRM operations emit structured Winston log events
- Log fields: `event`, `userId`, `firmId`, `resourceId` (where applicable)

---

## Database Tables Used

| Table | Purpose |
|-------|---------|
| `firms` | Firm profile read/update |
| `clients` | Client CRUD + soft delete |
| `contacts` | Contact CRUD |
| `client_contacts` | Contact-client join table |

No schema changes permitted. No new migrations.

---

## Out of Scope (Phase 2)

- Client notes, tasks, or activity feed
- Contact import/export
- Billing or subscription management
- Role-based access control beyond "authenticated user in firm"
- `client_addresses` management
