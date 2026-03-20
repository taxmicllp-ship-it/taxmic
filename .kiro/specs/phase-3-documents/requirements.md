# Phase 3 — Document Management Requirements

## Prompt Corrections (Source of Truth Overrides)

The original prompt contains errors that must be noted before any implementation:

| Prompt Claim | Reality |
|---|---|
| `docs/03-database/phases/PHASE-3-DOCUMENTS.md` | Does NOT exist. Schema source is `packages/database/prisma/documents.prisma` |
| `apps/web/src/app/(dashboard)/documents/` | Wrong — Next.js syntax. Actual path: `apps/web/src/pages/documents/` |
| `DocumentCard` component required | Not needed — `DocumentList` covers this use case |
| Tests in `apps/api/src/modules/documents/tests/` | No `__tests__` folder exists yet — this is a genuine gap |

---

## Overview

Implement the Document Management module for Taxmic. Allows firm users to organise client files into folders, upload documents, download via signed URLs, and delete documents with soft delete.

## Schema Reality (Source of Truth: `packages/database/prisma/documents.prisma`)

### folders table
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| firm_id | UUID | FK → firms, required |
| client_id | UUID? | FK → clients, optional |
| parent_id | UUID? | FK → folders (self-referential), optional |
| name | VARCHAR(255) | required |
| description | TEXT | optional |
| created_at | TIMESTAMP | auto |
| updated_at | TIMESTAMP | auto |
| deleted_at | TIMESTAMP? | soft delete |

### documents table
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| firm_id | UUID | FK → firms, required |
| client_id | UUID? | FK → clients, optional |
| folder_id | UUID? | FK → folders, optional |
| filename | VARCHAR(500) | required |
| file_key | VARCHAR(500) | storage key, required |
| mime_type | VARCHAR(100) | optional |
| size_bytes | BigInt | required |
| description | TEXT | optional |
| uploaded_by | UUID? | FK → users |
| current_version | INT | default 1 |
| search_vector | tsvector? | full-text search, not used in MVP |
| created_at | TIMESTAMP | auto |
| updated_at | TIMESTAMP | auto |
| deleted_at | TIMESTAMP? | soft delete |

### Out-of-scope tables (exist in schema, NOT implemented in Phase 3)
- `document_versions` — versioning is out of scope for MVP
- `document_permissions` — permissions/visibility is out of scope for MVP

---

## Functional Requirements

### REQ-1: Folder Creation
- User can create a folder with name (required), description (optional), parent_id (optional)
- `firm_id` is set from JWT — never from request body
- `client_id` is taken from the route param (`/clients/:id/folders`)
- If `parent_id` is provided, the parent folder must belong to the same firm
- Default: flat folder structure (no nesting required for MVP, but schema supports it)

### REQ-2: Folder Listing
- GET /clients/:id/folders returns all non-deleted folders for a client
- Scoped to `firm_id` from JWT
- Ordered by `created_at ASC`

### REQ-3: File Upload
- POST /folders/:id/upload accepts a single file via `multipart/form-data` with field name `file`
- `client_id` is passed in request body (used for file key path construction)
- Maximum file size: 50MB — enforced by multer middleware
- MIME type must be validated against the allowed list before upload
- File is stored via the storage abstraction layer — module never calls S3 directly
- File key format: `{firmId}/{clientId}/{folderId}/{uuid}_{filename}`
- Document record created in DB after successful storage upload
- `uploaded_by` set from JWT user ID
- `size_bytes` set from `buffer.length`

### REQ-4: File Download
- GET /documents/:id/download returns a signed URL, filename, and mime_type
- Signed URL expires after 3600 seconds (1 hour)
- Direct storage paths must never be exposed
- Document must belong to the requesting firm (tenant isolation)

### REQ-5: File Deletion
- DELETE /documents/:id performs soft delete (sets `deleted_at`)
- Storage file is also deleted (best-effort — failure does not fail the request)
- Returns 204 No Content
- Document must belong to the requesting firm

### REQ-6: Document Listing
- GET /clients/:id/documents returns all non-deleted documents for a client
- Optional query param: `folder_id` to filter by folder
- Pagination: `page`, `limit` (default 20, max 100)
- `size_bytes` serialised as string in response (BigInt → JSON)
- Scoped to `firm_id` from JWT

---

## Allowed MIME Types
```
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.ms-excel
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
application/vnd.ms-powerpoint
application/vnd.openxmlformats-officedocument.presentationml.presentation
image/jpeg
image/png
image/gif
image/webp
text/plain
text/csv
application/zip
application/x-zip-compressed
```

---

## Non-Functional Requirements

### NFR-1: Tenant Isolation
Every query must include `firm_id` in the WHERE clause. `firm_id` always comes from `req.user.firmId` — never from request body or params.

### NFR-2: Storage Abstraction
The documents module must call `getStorageProvider()` from `shared/storage/storage.factory.ts`. It must never import S3 SDK directly.

### NFR-3: Shared Middleware
Must reuse `authenticate`, `tenant-context` from `shared/middleware/`.

### NFR-4: No Schema Changes
Do not modify Prisma schema, add migrations, or alter enums.

### NFR-5: BigInt Serialisation
`size_bytes` is a BigInt in Prisma. It must be serialised as a string before sending JSON responses.

---

## Out of Scope (Phase 3)

- Document versioning (`document_versions` table exists, not used)
- Document permissions (`document_permissions` table exists, not used)
- OCR / full-text search (search_vector column exists, not used)
- Document preview
- Annotations
- Sharing links
- Document tags
- Bulk uploads
- `DocumentCard` component (not needed — `DocumentList` covers the use case)
