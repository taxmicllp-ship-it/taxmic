# Phase 3 — Document Management Implementation Tasks

## Status Note

The majority of Phase 3 is already implemented. Tasks marked [x] reflect existing working code. Only the test placeholder is genuinely missing.

---

## Backend Tasks

- [x] 1. `apps/api/src/modules/documents/documents.types.ts`
  - `Folder`, `Document`, `CreateFolderDto`, `DocumentResponse` interfaces
  - `ALLOWED_MIME_TYPES` array
  - `MAX_FILE_SIZE_BYTES` constant (50MB)
  - References: REQ-3, REQ-6

- [x] 2. `apps/api/src/modules/documents/documents.validation.ts`
  - `CreateFolderSchema` — name required (max 255), description optional, parent_id optional UUID
  - `ListDocumentsQuerySchema` — page, limit, folder_id optional
  - References: REQ-1, REQ-6

- [x] 3. `apps/api/src/modules/documents/folders.repository.ts`
  - `create(firmId, clientId, data)` — inserts folder with firm_id, client_id, parent_id
  - `findByClient(firmId, clientId)` — all non-deleted folders, ordered by created_at ASC
  - `findById(firmId, folderId)` — single folder with firm_id guard
  - All methods include `firm_id` in every `where` clause
  - References: REQ-1, REQ-2, NFR-1

- [x] 4. `apps/api/src/modules/documents/folders.service.ts`
  - `createFolder(firmId, clientId, data)` — validates parent_id if provided, delegates to repository
  - `listFolders(firmId, clientId)` — delegates to repository
  - References: REQ-1, REQ-2

- [x] 5. `apps/api/src/modules/documents/documents.repository.ts`
  - `create(data)` — inserts document record
  - `findById(firmId, documentId)` — single document with firm_id guard, deleted_at: null
  - `findByClient(firmId, clientId, folderId?)` — list with optional folder filter, ordered by created_at DESC
  - `softDelete(firmId, documentId)` — sets deleted_at via updateMany with firm_id guard
  - All methods include `firm_id` in every `where` clause
  - References: REQ-3 through REQ-6, NFR-1

- [x] 6. `apps/api/src/modules/documents/upload.middleware.ts`
  - Multer memory storage
  - 50MB file size limit → 413 `FILE_TOO_LARGE` response
  - MIME type filter against `ALLOWED_MIME_TYPES` → 415 `UNSUPPORTED_MEDIA_TYPE` response
  - `handleUpload` wrapper converts multer errors to proper HTTP responses
  - References: REQ-3, NFR-2

- [x] 7. `apps/api/src/modules/documents/documents.service.ts`
  - `uploadDocument(data)` — verifies folder exists, constructs file key, calls storage provider, creates DB record
  - `getDownloadUrl(firmId, documentId)` — verifies document exists, returns signed URL (3600s expiry)
  - `deleteDocument(firmId, documentId)` — soft deletes DB record, best-effort storage delete
  - `listDocuments(firmId, clientId, folderId?)` — delegates to repository, serialises BigInt
  - Never imports S3 SDK directly — always uses `getStorageProvider()`
  - References: REQ-3 through REQ-6, NFR-2, NFR-5

- [x] 8. `apps/api/src/modules/documents/documents.controller.ts`
  - `createFolder` — POST /clients/:id/folders
  - `listFolders` — GET /clients/:id/folders
  - `uploadDocument` — POST /folders/:id/upload (requires `req.file`)
  - `downloadDocument` — GET /documents/:id/download
  - `deleteDocument` — DELETE /documents/:id → 204
  - `listDocuments` — GET /clients/:id/documents
  - All methods pass `req.user!.firmId` — never trusts body/params for firm_id
  - References: REQ-1 through REQ-6

- [x] 9. `apps/api/src/modules/documents/documents.routes.ts`
  - Apply `authenticate` and `tenantContext` to all routes
  - Mount all 6 endpoints exactly as specified
  - Apply `handleUpload` middleware to upload route
  - References: design.md API Endpoints table

- [x] 10. Register documents router in `apps/api/src/app.ts`
  - `app.use('/api/v1', documentsRouter)` — already registered
  - No changes needed

- [ ] 11. Create `apps/api/src/modules/documents/__tests__/README.md`
  - Placeholder noting unit tests are deferred
  - Same pattern as other modules
  - References: Prompt testing requirement

---

## Storage Layer Tasks

- [x] 12. `apps/api/src/shared/storage/storage.interface.ts`
  - `StorageProvider` interface: `upload`, `getSignedUrl`, `delete`
  - `UploadResult` interface: `fileKey`, `url`

- [x] 13. `apps/api/src/shared/storage/local-storage.provider.ts`
  - Writes files to `./uploads/` (flat, `/` replaced with `_`)
  - `getSignedUrl` returns token-based local URL
  - `delete` removes file if exists

- [x] 14. `apps/api/src/shared/storage/s3-storage.provider.ts`
  - S3 PutObject, presigned URL, DeleteObject
  - Reads bucket/region from environment variables

- [x] 15. `apps/api/src/shared/storage/storage.factory.ts`
  - Singleton pattern
  - Returns `LocalStorageProvider` by default, `S3StorageProvider` when `STORAGE_PROVIDER=s3`

---

## Frontend Tasks

- [x] 16. `apps/web/src/features/documents/types.ts`
  - `Folder`, `Document`, `DownloadResponse`, `CreateFolderDto` interfaces
  - `size_bytes` typed as `string` (BigInt serialised from API)

- [x] 17. `apps/web/src/features/documents/api/documents-api.ts`
  - `createFolder`, `listFolders`, `uploadDocument`, `getDownloadUrl`, `deleteDocument`, `listDocuments`
  - Upload uses `multipart/form-data`

- [x] 18. `apps/web/src/features/documents/hooks/useFolders.ts`
  - `useFolders(clientId)` — `useQuery(['folders', clientId])`, enabled when clientId set
  - `useCreateFolder(clientId)` — `useMutation`, invalidates `['folders', clientId]`

- [x] 19. `apps/web/src/features/documents/hooks/useDocuments.ts`
  - `useDocuments(clientId, folderId?)` — `useQuery(['documents', clientId, folderId])`
  - `useDeleteDocument(clientId)` — `useMutation`, invalidates `['documents', clientId]`

- [x] 20. `apps/web/src/features/documents/hooks/useUpload.ts`
  - `useUpload(clientId)` — `useMutation`, invalidates `['documents', clientId]`

- [x] 21. `apps/web/src/features/documents/components/FolderTree.tsx`
  - Sidebar with "All Documents" + folder list
  - Highlights selected folder
  - Uses brand colour classes for active state

- [x] 22. `apps/web/src/features/documents/components/DocumentList.tsx`
  - Table using `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
  - Columns: Name, Type, Size (formatted), Uploaded date, Actions
  - Download triggers signed URL fetch then browser anchor click
  - Empty state message

- [x] 23. `apps/web/src/features/documents/components/DocumentUpload.tsx`
  - Folder selector dropdown + hidden file input + Upload button
  - Upload disabled until folder selected
  - Accepts same MIME types as backend

- [x] 24. `apps/web/src/pages/documents/index.tsx`
  - Route: `/documents?clientId=uuid`
  - Reads `clientId` from query string via `useSearchParams`
  - Shows "Select a client" message when no clientId
  - Orchestrates FolderTree + DocumentList + DocumentUpload

---

## Verification Tasks

- [x] 25. Curl test — create folder
  - POST /api/v1/clients/:id/folders with valid JWT
  - Verify 201 response with correct fields

- [x] 26. Curl test — upload file
  - POST /api/v1/folders/:id/upload with multipart file
  - Verify 201 response, size_bytes is a string

- [x] 27. Curl test — download
  - GET /api/v1/documents/:id/download
  - Verify signed URL returned, not a raw storage path

- [x] 28. Curl test — MIME validation
  - Upload a `.exe` file
  - Verify 415 response

- [x] 29. Curl test — size limit
  - Upload a file > 50MB
  - Verify 413 response

- [x] 30. Curl test — soft delete
  - DELETE /api/v1/documents/:id → 204
  - GET /api/v1/documents/:id/download → 404

- [x] 31. Curl test — tenant isolation
  - Attempt to download a document belonging to a different firm
  - Verify 404 response

- [x] 32. Regression — Phase 1 auth endpoints still functional
  - POST /api/v1/auth/login → 200
  - POST /api/v1/auth/register → 201

- [x] 33. Regression — Phase 2 CRM endpoints still functional
  - GET /api/v1/clients → 200
  - GET /api/v1/contacts → 200
