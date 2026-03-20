# Phase 8 — Client Portal Tasks

## Status Legend
- [ ] Not started
- [x] Complete

---

## Backend — Types, Validation, Middleware

- [x] Task 1: Create `apps/api/src/modules/portal/portal.types.ts`
  - `PortalLoginDto`: `{ firmSlug: string; email: string; password: string }`
  - `CreatePortalAccountDto`: `{ clientId: string; email: string; password: string; firstName: string; lastName: string }`
  - `PortalJwtPayload`: `{ clientUserId: string; clientId: string; firmId: string; email: string; type: 'portal'; iat: number; exp: number }`
  - `PortalAuthResponse`: `{ token: string; user: { id, email, firstName, lastName, clientId, firmId } }`
  - Express namespace augmentation: add `portalUser?: { clientUserId, clientId, firmId, email }` to `Request`

- [x] Task 2: Create `apps/api/src/modules/portal/portal.validation.ts`
  - `PortalLoginSchema`: `firmSlug` (string, min 1), `email` (email), `password` (string, min 1)
  - `CreatePortalAccountSchema`: `clientId` (uuid), `email` (email), `password` (string, min 8), `firstName` (string, min 1), `lastName` (string, min 1)

- [x] Task 3: Create `apps/api/src/shared/middleware/authenticate-portal.ts`
  - Extract `Authorization: Bearer <token>` header — return 401 if missing
  - Call `jwtStrategy.verify(token)` — reuse existing verify, catch errors → 401
  - Cast result to `PortalJwtPayload`
  - If `payload.type !== 'portal'` → return 401 with `UNAUTHORIZED`
  - Set `req.portalUser = { clientUserId: payload.clientUserId, clientId: payload.clientId, firmId: payload.firmId, email: payload.email }`
  - Call `next()`

---

## Backend — Repository

- [x] Task 4: Create `apps/api/src/modules/portal/portal.repository.ts`
  - `findClientUserByEmailAndFirmSlug(email: string, firmSlug: string)`:
    - `prisma.client_users.findFirst` joining through `clients → firms` via `where: { email, deleted_at: null, is_active: true, client: { firm: { slug: firmSlug } } }`
    - Include `client: { include: { firm: true } }`
  - `createClientUser(data: { clientId, email, passwordHash, firstName, lastName })`:
    - `prisma.client_users.create` — return record without `password_hash`
  - `updateLastLogin(clientUserId: string)`:
    - `prisma.client_users.update({ where: { id: clientUserId }, data: { last_login_at: new Date() } })`
  - `findOrCreatePortalFolder(firmId: string, clientId: string)`:
    - `prisma.folders.findFirst({ where: { firm_id: firmId, client_id: clientId, name: 'Portal Uploads', deleted_at: null } })`
    - If null: `prisma.folders.create({ data: { id: randomUUID(), firm_id: firmId, client_id: clientId, name: 'Portal Uploads' } })`
    - Return `folder.id`
  - `getDashboardCounts(firmId: string, clientId: string)`:
    - Four parallel `prisma.X.count()` calls via `Promise.all`:
      - `documents.count({ where: { firm_id, client_id, deleted_at: null } })`
      - `invoices.count({ where: { firm_id, client_id, deleted_at: null } })`
      - `invoices.count({ where: { firm_id, client_id, status: { in: ['sent', 'overdue'] }, deleted_at: null } })`
      - `tasks.count({ where: { firm_id, client_id, deleted_at: null } })`
    - Return `{ document_count, invoice_count, outstanding_invoice_count, task_count }`

---

## Backend — Service

- [x] Task 5: Create `apps/api/src/modules/portal/portal.service.ts`
  - Import: `portalRepository`, `passwordService`, `jwtStrategy`, `documentsService`, `invoicesService`, `tasksService`, `paymentsService`, `invoicesRepository`, `AppError`, `logger`, `config`
  - `login(dto: PortalLoginDto) → PortalAuthResponse`:
    - Call `portalRepository.findClientUserByEmailAndFirmSlug(dto.email, dto.firmSlug)`
    - If not found → `logger.warn({ event: 'PORTAL_LOGIN_FAILURE', email: dto.email, firmSlug: dto.firmSlug })` → `throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')`
    - `await passwordService.compare(dto.password, user.password_hash)`
    - If no match → same warn + same 401 error (no credential enumeration)
    - `await portalRepository.updateLastLogin(user.id)`
    - Sign JWT: `jwtStrategy.sign({ clientUserId: user.id, clientId: user.client_id, firmId: user.client.firm_id, email: user.email, type: 'portal' })`
    - Log: `logger.info({ event: 'PORTAL_LOGIN_SUCCESS', clientUserId: user.id, clientId: user.client_id, firmId: user.client.firm_id })`
    - Return `PortalAuthResponse`
  - `createAccount(firmId: string, dto: CreatePortalAccountDto)`:
    - Verify `clientId` belongs to `firmId`: `prisma.clients.findFirst({ where: { id: dto.clientId, firm_id: firmId, deleted_at: null } })` — 404 if not found
    - Hash password: `await passwordService.hash(dto.password)`
    - Call `portalRepository.createClientUser(...)` — catch unique constraint → 409
    - Log: `logger.info({ event: 'PORTAL_ACCOUNT_CREATED', clientUserId: result.id, clientId: dto.clientId, firmId, createdByUserId: callerUserId })`
    - Return created record (no `password_hash`)
  - `getDashboard(firmId: string, clientId: string)`:
    - Return `portalRepository.getDashboardCounts(firmId, clientId)`
  - `listDocuments(firmId: string, clientId: string)`:
    - Return `documentsService.listDocuments(firmId, clientId)`
  - `downloadDocument(firmId: string, clientId: string, documentId: string)`:
    - Call `documentsService.getDownloadUrl(firmId, documentId)` — this already verifies firm ownership
    - The returned document must also have `client_id === clientId` — verify via `documentsRepository.findById(firmId, documentId)` first; if `doc.client_id !== clientId` → 404
    - Return `{ url, filename, mime_type }`
  - `uploadDocument(firmId: string, clientId: string, file: { originalname, mimetype, buffer })`:
    - `const folderId = await portalRepository.findOrCreatePortalFolder(firmId, clientId)`
    - `const doc = await documentsService.uploadDocument({ firmId, clientId, folderId, filename: file.originalname, mimeType: file.mimetype, buffer: file.buffer, uploadedBy: null })`
    - Log: `logger.info({ event: 'PORTAL_DOCUMENT_UPLOAD', clientUserId: callerClientUserId, clientId, firmId, documentId: doc.id, filename: file.originalname })`
    - Return `doc`
    - Note: `uploadedBy: null` — portal users are not staff users; `documents.uploaded_by` is nullable
  - `listInvoices(firmId: string, clientId: string)`:
    - Return `invoicesService.listClientInvoices(firmId, clientId)`
  - `payInvoice(firmId: string, clientId: string, invoiceId: string, successUrl: string, cancelUrl: string)`:
    - `const invoice = await invoicesRepository.findById(firmId, invoiceId)` — 404 if not found
    - If `invoice.client_id !== clientId` → `throw new AppError('Not found', 404, 'NOT_FOUND')` (client isolation)
    - If `invoice.status !== 'sent'` → `throw new AppError('Invoice cannot be paid', 422, 'INVALID_STATUS')`
    - Log: `logger.info({ event: 'PORTAL_INVOICE_PAYMENT_STARTED', clientUserId: callerClientUserId, clientId, firmId, invoiceId })`
    - Return `paymentsService.createCheckoutSession(firmId, invoiceId, successUrl, cancelUrl)`
  - `listTasks(firmId: string, clientId: string)`:
    - Return `tasksService.listClientTasks(firmId, clientId)`

---

## Backend — Controller

- [x] Task 6: Create `apps/api/src/modules/portal/portal.controller.ts`
  - `login(req, res, next)`: call `portalService.login(req.body)` → 200
  - `createAccount(req, res, next)`: call `portalService.createAccount(req.user!.firmId, req.body)` → 201
  - `getDashboard(req, res, next)`: call `portalService.getDashboard(req.portalUser!.firmId, req.portalUser!.clientId)` → 200
  - `listDocuments(req, res, next)`: call `portalService.listDocuments(req.portalUser!.firmId, req.portalUser!.clientId)` → 200
  - `downloadDocument(req, res, next)`: call `portalService.downloadDocument(req.portalUser!.firmId, req.portalUser!.clientId, req.params.id)` → 200
  - `uploadDocument(req, res, next)`: call `portalService.uploadDocument(req.portalUser!.firmId, req.portalUser!.clientId, req.file!)` → 201
  - `listInvoices(req, res, next)`: call `portalService.listInvoices(req.portalUser!.firmId, req.portalUser!.clientId)` → 200
  - `payInvoice(req, res, next)`:
    - Build `successUrl = \`${config.frontendUrl ?? 'http://localhost:3001'}/portal/payment-success?invoice_id=${req.params.id}\``
    - Build `cancelUrl = \`${config.frontendUrl ?? 'http://localhost:3001'}/portal/invoices\``
    - Call `portalService.payInvoice(req.portalUser!.firmId, req.portalUser!.clientId, req.params.id, successUrl, cancelUrl)` → 200
  - `listTasks(req, res, next)`: call `portalService.listTasks(req.portalUser!.firmId, req.portalUser!.clientId)` → 200
  - All methods wrapped in try/catch → `next(err)`

---

## Backend — Routes

- [x] Task 7: Create `apps/api/src/modules/portal/portal.routes.ts`
  - Import: `rateLimit` from `express-rate-limit`, `authenticate`, `authenticatePortal`, `validate`, `multer`, `portalController`
  - Define `portalLoginRateLimiter`: `rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false })`
  - Define `portalUpload`: `multer({ storage: memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 }, fileFilter })` — allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/gif`, `application/msword`, `.docx`, `.xls`, `.xlsx` MIME types
  - `POST /auth/login` — `portalLoginRateLimiter` — `validate(PortalLoginSchema)` — `portalController.login`
  - `POST /auth/create-account` — `authenticate` — `validate(CreatePortalAccountSchema)` — `portalController.createAccount`
  - `GET /dashboard` — `authenticatePortal` — `portalController.getDashboard`
  - `GET /documents` — `authenticatePortal` — `portalController.listDocuments`
  - `POST /documents/upload` — `authenticatePortal` — `portalUpload.single('file')` — `portalController.uploadDocument`
  - `GET /documents/:id/download` — `authenticatePortal` — `portalController.downloadDocument`
  - `GET /invoices` — `authenticatePortal` — `portalController.listInvoices`
  - `POST /invoices/:id/pay` — `authenticatePortal` — `portalController.payInvoice`
  - `GET /tasks` — `authenticatePortal` — `portalController.listTasks`

- [x] Task 8: Create `apps/api/src/modules/portal/index.ts`
  - `export { default } from './portal.routes'`

---

## Backend — Wiring

- [x] Task 9: Update `apps/api/src/app.ts`
  - Add import: `import portalRouter from './modules/portal/index'`
  - Add mount: `app.use('/api/v1/portal', portalRouter)` — after `notificationsRouter`, before error handler
  - This is the ONLY change to any existing file

---

## Frontend — Portal Auth Context

- [x] Task 10: Create `apps/web/src/features/portal/context/PortalAuthContext.tsx`
  - `PortalUser` type: `{ id, email, firstName, lastName, clientId, firmId }`
  - Context provides: `portalUser`, `portalToken`, `portalLogin(token, user)`, `portalLogout()`
  - `portalLogin`: stores `portal_token` and `portal_user` in localStorage
  - `portalLogout`: removes both keys, redirects to `/portal/login`
  - `usePortalAuth()` hook exported
  - Wrap `<App>` or portal routes in `<PortalAuthProvider>`

---

## Frontend — Portal API

- [x] Task 11: Create `apps/web/src/features/portal/types.ts`
  - `PortalDocument`: `{ id, filename, mime_type, size_bytes, created_at }`
  - `PortalInvoice`: `{ id, number, status, total_amount, due_date, paid_at }`
  - `PortalTask`: `{ id, title, status, priority, due_date }`
  - `PortalDashboard`: `{ document_count, invoice_count, outstanding_invoice_count, task_count }`

- [x] Task 12: Create `apps/web/src/features/portal/api/portal-api.ts`
  - Separate axios instance: reads token from `localStorage.getItem('portal_token')`, sets `Authorization: Bearer <token>` header
  - Base URL: `/api/v1/portal`
  - `login(data: { firmSlug, email, password })` → POST `/auth/login`
  - `getDashboard()` → GET `/dashboard`
  - `listDocuments()` → GET `/documents`
  - `downloadDocument(id: string)` → GET `/documents/${id}/download` → returns `{ url, filename, mime_type }`
  - `uploadDocument(file: File)` → POST `/documents/upload` (FormData)
  - `listInvoices()` → GET `/invoices`
  - `payInvoice(id: string)` → POST `/invoices/${id}/pay`
  - `listTasks()` → GET `/tasks`

---

## Frontend — Hooks

- [x] Task 13: Create `apps/web/src/features/portal/hooks/usePortalDocuments.ts`
  - `useQuery(['portal', 'documents'], portalApi.listDocuments)`
  - `useUploadDocument()`: `useMutation`, invalidates `['portal', 'documents']`

- [x] Task 14: Create `apps/web/src/features/portal/hooks/usePortalInvoices.ts`
  - `useQuery(['portal', 'invoices'], portalApi.listInvoices)`
  - `usePayInvoice()`: `useMutation(portalApi.payInvoice)` → on success redirect to Stripe URL

- [x] Task 15: Create `apps/web/src/features/portal/hooks/usePortalTasks.ts`
  - `useQuery(['portal', 'tasks'], portalApi.listTasks)`

---

## Frontend — PortalLayout

- [x] Task 16: Create `apps/web/src/components/layout/PortalLayout.tsx`
  - Check `localStorage.getItem('portal_token')` on mount — if absent, `<Navigate to="/portal/login" />`
  - Render a top header: Taxmic logo (left) + portal user name (right) + Logout button
  - Logout button calls `portalLogout()` from `usePortalAuth()`
  - Horizontal nav links below header: Documents (`/portal/documents`), Invoices (`/portal/invoices`), Tasks (`/portal/tasks`)
  - Active link highlighted using `NavLink` from react-router-dom
  - `<Outlet />` renders page content below nav
  - Uses Tailwind classes consistent with existing components — no `DashboardLayout` or `AppLayout` imports

---

## Frontend — Pages

- [x] Task 17: Create `apps/web/src/pages/portal/login.tsx`
  - Uses `AuthPageLayout` (same as staff login — reuse the existing layout component)
  - Form fields: `firmSlug`, `email`, `password`
  - On submit: call `portalApi.login(...)` → on success call `portalLogin(token, user)` → navigate to `/portal/dashboard`
  - Show error alert on failure using existing `Alert` component
  - Uses existing `InputField`, `Label`, `Button` components

- [x] Task 18: Create `apps/web/src/pages/portal/dashboard.tsx`
  - `useQuery(['portal', 'dashboard'], portalApi.getDashboard)`
  - Render 4 stat cards: Documents, Invoices, Outstanding Invoices, Tasks
  - Each card shows count + label
  - Links to respective portal pages
  - Loading state: show spinner / skeleton

- [x] Task 19: Create `apps/web/src/pages/portal/documents.tsx`
  - `usePortalDocuments()` for list
  - `useUploadDocument()` for upload
  - Render document list: filename, size, date
  - File upload input: `<input type="file">` → on change call `uploadDocument(file)`
  - Show upload progress/success/error feedback using `Alert`

- [x] Task 20: Create `apps/web/src/pages/portal/invoices.tsx`
  - `usePortalInvoices()` for list
  - `usePayInvoice()` for payment
  - Render invoice list: number, status badge, total, due date
  - "Pay" button visible only for invoices with `status === 'sent'`
  - On pay: call `payInvoice(id)` → redirect to `url` from response (`window.location.href = url`)
  - Reuse `InvoiceStatusBadge` component from Phase 5

- [x] Task 21: Create `apps/web/src/pages/portal/tasks.tsx`
  - `usePortalTasks()` for list
  - Render task list: title, status badge, priority, due date
  - Read-only — no create/edit actions
  - Reuse `TaskStatusBadge` component from Phase 4

- [x] Task 22: Create `apps/web/src/pages/portal/payment-success.tsx`
  - Reads `?invoice_id=` from query string
  - Shows success message: "Payment received. Your invoice has been updated."
  - Link back to `/portal/invoices`
  - No layout wrapper (standalone page, same pattern as staff `payment-success.tsx`)

---

## Frontend — Routing

- [x] Task 23: Update `apps/web/src/App.tsx`
  - Import `PortalLayout` and all 6 portal pages
  - Add portal routes:
    ```tsx
    <Route path="/portal/login" element={<PortalLoginPage />} />
    <Route element={<PortalLayout />}>
      <Route path="/portal/dashboard" element={<PortalDashboardPage />} />
      <Route path="/portal/documents" element={<PortalDocumentsPage />} />
      <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
      <Route path="/portal/tasks" element={<PortalTasksPage />} />
    </Route>
    <Route path="/portal/payment-success" element={<PortalPaymentSuccessPage />} />
    ```
  - All existing routes remain unchanged

---

## Regression Verification

- [x] Task 24: Verify Phase 1 staff auth endpoints still respond (login, register)
- [x] Task 25: Verify Phase 2 CRM endpoints still respond (clients list, contacts list)
- [x] Task 26: Verify Phase 3 documents endpoints still respond (documents list)
- [x] Task 27: Verify Phase 4 tasks endpoints still respond (tasks list)
- [x] Task 28: Verify Phase 5 billing endpoints still respond (invoices list, webhook)
- [x] Task 29: Verify Phase 6 notifications endpoints still respond
