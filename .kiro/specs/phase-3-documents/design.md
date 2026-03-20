# Phase 3 — Document Management Design

## Implementation Status

Most of Phase 3 is already implemented. This design documents what exists and what remains.

### Backend — Fully Implemented
| File | Status |
|---|---|
| `documents.types.ts` | ✅ Complete |
| `documents.validation.ts` | ✅ Complete |
| `documents.repository.ts` | ✅ Complete |
| `documents.service.ts` | ✅ Complete |
| `documents.controller.ts` | ✅ Complete |
| `documents.routes.ts` | ✅ Complete |
| `folders.repository.ts` | ✅ Complete |
| `folders.service.ts` | ✅ Complete |
| `upload.middleware.ts` | ✅ Complete |
| Router registered in `app.ts` | ✅ Complete |

### Storage Layer — Fully Implemented
| File | Status |
|---|---|
| `shared/storage/storage.interface.ts` | ✅ Complete |
| `shared/storage/storage.factory.ts` | ✅ Complete |
| `shared/storage/local-storage.provider.ts` | ✅ Complete |
| `shared/storage/s3-storage.provider.ts` | ✅ Complete |

### Frontend — Fully Implemented
| File | Status |
|---|---|
| `features/documents/types.ts` | ✅ Complete |
| `features/documents/api/documents-api.ts` | ✅ Complete |
| `features/documents/hooks/useFolders.ts` | ✅ Complete |
| `features/documents/hooks/useDocuments.ts` | ✅ Complete |
| `features/documents/hooks/useUpload.ts` | ✅ Complete |
| `features/documents/components/FolderTree.tsx` | ✅ Complete |
| `features/documents/components/DocumentList.tsx` | ✅ Complete |
| `features/documents/components/DocumentUpload.tsx` | ✅ Complete |
| `pages/documents/index.tsx` | ✅ Complete |

### Genuine Gaps
| Item | Status |
|---|---|
| `apps/api/src/modules/documents/__tests__/` | ❌ Missing — test placeholder needed |

---

## Backend Architecture

### Folder Structure

```
apps/api/src/modules/documents/
├── documents.controller.ts   ✅
├── documents.service.ts      ✅
├── documents.repository.ts   ✅
├── documents.routes.ts       ✅
├── documents.types.ts        ✅
├── documents.validation.ts   ✅
├── folders.service.ts        ✅
├── folders.repository.ts     ✅
├── upload.middleware.ts      ✅
└── __tests__/                ❌ missing
    └── README.md

apps/api/src/shared/storage/
├── storage.interface.ts      ✅
├── storage.factory.ts        ✅
├── local-storage.provider.ts ✅
└── s3-storage.provider.ts    ✅
```

---

### API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/v1/clients/:id/folders | Create folder for a client |
| GET | /api/v1/clients/:id/folders | List folders for a client |
| POST | /api/v1/folders/:id/upload | Upload file to a folder |
| GET | /api/v1/documents/:id/download | Get signed download URL |
| DELETE | /api/v1/documents/:id | Soft delete a document |
| GET | /api/v1/clients/:id/documents | List documents for a client |

All routes require `authenticate` + `tenantContext` middleware.

---

### Request / Response Shapes

#### POST /clients/:id/folders
```json
// Request body
{ "name": "Tax Returns 2026", "description": "Annual filings", "parent_id": null }

// Response 201
{
  "id": "uuid",
  "firm_id": "uuid",
  "client_id": "uuid",
  "parent_id": null,
  "name": "Tax Returns 2026",
  "description": "Annual filings",
  "created_at": "...",
  "updated_at": "..."
}
```

#### POST /folders/:id/upload
```
Content-Type: multipart/form-data
Fields:
  file: <binary>
  client_id: uuid (optional — used for file key path)

Response 201:
{
  "id": "uuid",
  "firm_id": "uuid",
  "client_id": "uuid",
  "folder_id": "uuid",
  "filename": "tax-return.pdf",
  "mime_type": "application/pdf",
  "size_bytes": "204800",
  "uploaded_by": "uuid",
  "created_at": "..."
}
```

#### GET /documents/:id/download
```json
// Response 200
{
  "url": "https://signed-url-expires-in-1hr...",
  "filename": "tax-return.pdf",
  "mime_type": "application/pdf"
}
```

#### GET /clients/:id/documents
```
Query params (all optional):
  folder_id=uuid
  page=1
  limit=20
```

---

### Layer Responsibilities

**upload.middleware.ts**
- Multer memory storage
- Enforces 50MB file size limit → 413 response
- Validates MIME type against `ALLOWED_MIME_TYPES` → 415 response
- Wraps multer errors into proper HTTP responses

**documents.controller.ts**
- Extracts `req.user.firmId`, `req.params`, `req.body`, `req.file`
- Delegates to `foldersService` or `documentsService`
- Serialises `size_bytes` BigInt to string on upload response
- No business logic

**folders.service.ts**
- Validates parent folder belongs to same firm if `parent_id` provided
- Delegates to `foldersRepository`

**documents.service.ts**
- Verifies folder exists before upload
- Constructs file key: `{firmId}/{clientId}/{folderId}/{uuid}_{filename}`
- Calls `getStorageProvider()` — never imports S3 directly
- Handles soft delete + best-effort storage deletion
- Serialises BigInt on list response

**documents.repository.ts / folders.repository.ts**
- All Prisma queries
- Every query includes `firm_id` in WHERE clause
- `softDelete` uses `updateMany` with `firm_id` guard

**storage.factory.ts**
- Singleton pattern
- Returns `LocalStorageProvider` when `STORAGE_PROVIDER=local` (default)
- Returns `S3StorageProvider` when `STORAGE_PROVIDER=s3`

---

### Storage Provider Behaviour

| Operation | Local | S3 |
|---|---|---|
| upload | Write to `./uploads/` (flat, `/` replaced with `_`) | PutObject to S3 bucket |
| getSignedUrl | Returns `/api/v1/documents/serve/{base64token}` | S3 presigned URL (1hr expiry) |
| delete | `fs.unlinkSync` | DeleteObject |

---

## Frontend Architecture

### Folder Structure

```
apps/web/src/features/documents/
├── api/
│   └── documents-api.ts      ✅
├── components/
│   ├── DocumentList.tsx       ✅
│   ├── DocumentUpload.tsx     ✅
│   └── FolderTree.tsx         ✅
├── hooks/
│   ├── useFolders.ts          ✅
│   ├── useDocuments.ts        ✅
│   └── useUpload.ts           ✅
└── types.ts                   ✅

apps/web/src/pages/documents/
└── index.tsx                  ✅  → /documents?clientId=uuid
```

Note: The prompt referenced `app/(dashboard)/documents/` (Next.js syntax). This project uses React Router. The correct path is `apps/web/src/pages/documents/index.tsx`.

---

### Component Responsibilities

**FolderTree.tsx** — sidebar panel listing folders for the selected client. "All Documents" option clears folder filter. Highlights selected folder.

**DocumentList.tsx** — table of documents using `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`. Columns: Name, Type, Size, Uploaded, Actions (Download, Delete). Download triggers signed URL fetch then browser download.

**DocumentUpload.tsx** — folder selector dropdown + hidden file input + Upload button. Requires a folder to be selected before upload is enabled.

**pages/documents/index.tsx** — reads `clientId` from query string. Shows "Select a client" message if no clientId. Orchestrates all three components.

---

### Hooks

**useFolders(clientId)** — `useQuery(['folders', clientId])`, enabled only when clientId is set

**useCreateFolder(clientId)** — `useMutation`, invalidates `['folders', clientId]`

**useDocuments(clientId, folderId?)** — `useQuery(['documents', clientId, folderId])`

**useDeleteDocument(clientId)** — `useMutation`, invalidates `['documents', clientId]`

**useUpload(clientId)** — `useMutation`, invalidates `['documents', clientId]`

---

### API Client (`documents-api.ts`)

| Method | Endpoint |
|---|---|
| `createFolder(clientId, data)` | POST /clients/:id/folders |
| `listFolders(clientId)` | GET /clients/:id/folders |
| `uploadDocument(folderId, clientId, file)` | POST /folders/:id/upload (multipart) |
| `getDownloadUrl(documentId)` | GET /documents/:id/download |
| `deleteDocument(documentId)` | DELETE /documents/:id |
| `listDocuments(clientId, folderId?)` | GET /clients/:id/documents |

---

## Data Flow

```
User action (upload/download/delete)
  → React page (pages/documents/index.tsx)
  → hook (useMutation / useQuery)
  → documents-api.ts (axios via lib/api.ts)
  → POST/GET/DELETE /api/v1/...
  → documents.routes.ts
  → authenticate + tenantContext middleware
  → [upload.middleware.ts for uploads]
  → documents.controller.ts
  → folders.service.ts / documents.service.ts
  → folders.repository.ts / documents.repository.ts
  → Prisma → PostgreSQL
  → getStorageProvider() → LocalStorageProvider / S3StorageProvider
```

---

## Tenant Isolation Guarantee

Every repository method receives `firmId` as first argument and includes it in every `where` clause. The controller always passes `req.user!.firmId` — never a value from the request body or params.
