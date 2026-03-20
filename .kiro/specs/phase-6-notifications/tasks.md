# Phase 6 — Notifications Module Tasks

## Status Legend
- [ ] Not started
- [x] Complete

---

## Backend — Types & Validation

- [x] Task 1: Create `apps/api/src/modules/notifications/notifications.types.ts`
  - `Notification`, `CreateNotificationDto`, `ListNotificationsQuery`
  - `CreateNotificationDto`: `user_id`, `type` (notification_type_enum), `title`, `message`, `entity_type?`, `entity_id?`

- [x] Task 2: Create `apps/api/src/modules/notifications/notifications.validation.ts`
  - `CreateNotificationSchema` — Zod, all required fields + optional entity fields
  - `ListNotificationsQuerySchema` — `is_read?`, `page`, `limit`

- [x] Task 3: Create `apps/api/src/modules/notifications/email-events/email-events.types.ts`
  - `EmailEvent`, `CreateEmailEventDto`
  - `CreateEmailEventDto`: `firmId?`, `messageId`, `emailTo`, `emailFrom`, `subject?`, `templateName?`, `eventType` (email_event_type_enum), `eventData?`

- [x] Task 4: Create `apps/api/src/modules/notifications/email/email.types.ts`
  - `SendEmailOptions`: `to`, `from?`, `subject`, `templateName`, `firmId?`, `body?`
  - `SendEmailResult`: `messageId`

---

## Backend — Repository Layer

- [x] Task 5: Create `apps/api/src/modules/notifications/notifications.repository.ts`
  - `create(firmId, data)` — deduplication guard first: `findFirst` by `(firm_id, user_id, type, entity_id)`; if found return existing record without inserting; otherwise insert and return new record. Skip entirely if `data.user_id` is null.
  - `findAll(firmId, userId, query)` — paginated, filter `is_read` if provided, order `created_at DESC`
  - `findById(firmId, notificationId)` — single record
  - `markAsRead(firmId, userId, notificationId)` — update `is_read=true`, `read_at=now()`; where includes `firm_id` AND `user_id`

- [x] Task 6: Create `apps/api/src/modules/notifications/email-events/email-events.repository.ts`
  - `create(data: CreateEmailEventDto)` — insert into `email_events`
  - `findAll(firmId, query)` — paginated, order `created_at DESC`

---

## Backend — Service Layer

- [x] Task 7: Create `apps/api/src/modules/notifications/email-events/email-events.service.ts`
  - `logEmailEvent(data)` — calls `emailEventsRepository.create(data)`
  - `listEmailEvents(firmId, query)` — calls `emailEventsRepository.findAll(firmId, query)`

- [x] Task 8: Create `apps/api/src/modules/notifications/email/email.service.ts`
  - `sendEmail(options: SendEmailOptions): Promise<SendEmailResult>`
  - Generates `messageId = randomUUID()`
  - Logs via `logger.info({ event: 'EMAIL_STUB', to, subject, template })`
  - Calls `emailEventsService.logEmailEvent(...)` with `event_type = 'sent'`
  - Returns `{ messageId }`
  - Does NOT connect to SES or any external service

- [x] Task 9: Create `apps/api/src/modules/notifications/notifications.service.ts`
  - `listNotifications(firmId, userId, query)` — delegate to repository
  - `createNotification(firmId, data)` — delegate to repository; no-op if `data.user_id` is null
  - `markAsRead(firmId, userId, notificationId)` — call repository, throw 404 if not found

---

## Backend — Controller & Routes

- [x] Task 10: Create `apps/api/src/modules/notifications/notifications.controller.ts`
  - `listNotifications` — GET, uses `req.user!.firmId` + `req.user!.userId`
  - `createNotification` — POST, uses `req.user!.firmId`
  - `markAsRead` — PATCH /:id/read, uses `req.user!.firmId` + `req.user!.userId`
  - `listEmailEvents` — GET /email-events, uses `req.user!.firmId`
  - No business logic in controller

- [x] Task 11: Create `apps/api/src/modules/notifications/notifications.routes.ts`
  - `GET /notifications` — authenticate + tenantContext
  - `POST /notifications` — authenticate + tenantContext + validate(CreateNotificationSchema)
  - `PATCH /notifications/:id/read` — authenticate + tenantContext
  - `GET /email-events` — authenticate + tenantContext

- [x] Task 12: Create `apps/api/src/modules/notifications/index.ts`
  - Default export: `notificationsRouter`
  - Named exports: `notificationsService`, `emailService`

---

## Backend — App Wiring

- [x] Task 13: Update `apps/api/src/app.ts`
  - Import `notificationsRouter` from `./modules/notifications/index`
  - Mount: `app.use('/api/v1', notificationsRouter)`
  - Place after billing router, before error handler

---

## Backend — Event Integrations

- [x] Task 14: Update `apps/api/src/modules/tasks/tasks.service.ts`
  - Import `notificationsService` from `../../modules/notifications/index`
  - In `createTask()`: after task is created, if `data.assignee_ids` is non-empty, call `notificationsService.createNotification()` for each assignee
  - Wrap in try/catch — failure must not affect task creation response
  - Notification type: `task_assigned`

- [x] Task 15: Update `apps/api/src/modules/documents/documents.service.ts`
  - Import `notificationsService` from `../../modules/notifications/index`
  - In `uploadDocument()`: after document is created, call `notificationsService.createNotification()`
  - Wrap in try/catch — failure must not affect upload response
  - Notification type: `document_uploaded`

- [x] Task 16: Update `apps/api/src/modules/billing/invoices/invoices.service.ts`
  - Import `notificationsService` from `../../notifications/index`
  - Import `emailService` from `../../notifications/index`
  - In `sendInvoice()`: replace `INVOICE_EMAIL_STUB` logger call with `emailService.sendEmail()`
  - In `sendInvoice()`: after status update, call `notificationsService.createNotification()`
  - Update `sendInvoice` signature to accept `userId` as third argument (passed from controller)
  - Wrap both calls in try/catch
  - Notification type: `invoice_sent`

- [x] Task 17: Update `apps/api/src/modules/billing/invoices/invoices.controller.ts`
  - Pass `req.user!.userId` to `invoicesService.sendInvoice()` (third argument)

- [x] Task 18: Update `apps/api/src/modules/billing/payments/webhook.controller.ts`
  - Import `notificationsService` from `../../notifications/index`
  - In `checkout.session.completed` handler: after invoice is marked paid, call `notificationsService.createNotification()`
  - Wrap in try/catch — failure must not affect webhook response
  - Notification type: `invoice_paid`
  - Skip notification if `invoice.created_by` is null

---

## Frontend — Feature Layer

- [x] Task 19: Create `apps/web/src/features/notifications/types.ts`
  - `Notification` type matching API response shape
  - `NotificationType` union type

- [x] Task 20: Create `apps/web/src/features/notifications/api/notifications-api.ts`
  - `list(params?: { is_read?: boolean; page?: number; limit?: number })` — GET /notifications
  - `markAsRead(id: string)` — PATCH /notifications/:id/read

- [x] Task 21: Create `apps/web/src/features/notifications/hooks/useNotifications.ts`
  - `useNotifications(params?)` — `useQuery(['notifications', params], ...)`
  - `useMarkAsRead()` — `useMutation`, invalidates `['notifications']`

---

## Frontend — Page

- [x] Task 22: Create `apps/web/src/pages/notifications/index.tsx`
  - Page heading: "Notifications"
  - Filter state: `all` | `unread` (toggle buttons)
  - Table: Type, Title, Message, Date, Status columns
  - "Mark as read" Button per unread row — calls `useMarkAsRead`
  - Loading state: text "Loading notifications..."
  - Empty state: text "No notifications."
  - Uses `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` from `components/ui/Table`
  - Uses `Button` from `components/ui/Button`
  - Wrapped in `DashboardLayout` via React Router `<Outlet />`

---

## Frontend — Routing & Navigation

- [x] Task 23: Update `apps/web/src/App.tsx`
  - Import `NotificationsPage` from `./pages/notifications/index`
  - Add `<Route path="/notifications" element={<NotificationsPage />} />` inside `DashboardLayout` route group

- [x] Task 24: Update `apps/web/src/components/layout/DashboardLayout.tsx`
  - Add Notifications entry to `navItems` array
  - Path: `/notifications`
  - Bell icon SVG path: `M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9`

---

## Regression Verification

- [x] Task 25: Verify Phase 1 auth endpoints still respond (register, login, logout)
- [x] Task 26: Verify Phase 2 CRM endpoints still respond (clients list, contacts list)
- [x] Task 27: Verify Phase 3 documents endpoints still respond (documents list, upload)
- [x] Task 28: Verify Phase 4 tasks endpoints still respond (tasks list, create task)
- [x] Task 29: Verify Phase 5 billing endpoints still respond (invoices list, send invoice, webhook)
- [x] Task 30: Verify task creation with assignees creates notification records
- [x] Task 31: Verify document upload creates notification record
- [x] Task 32: Verify invoice send creates notification + email_events record
- [x] Task 33: Verify webhook checkout.session.completed creates notification record
