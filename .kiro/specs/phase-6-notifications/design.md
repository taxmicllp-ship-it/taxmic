# Phase 6 — Notifications Module Design

## Backend Architecture

### Folder Structure

```
apps/api/src/modules/notifications/
├── index.ts                              ← exports notificationsRouter, notificationsService, emailService
├── notifications.types.ts
├── notifications.validation.ts
├── notifications.repository.ts
├── notifications.service.ts
├── notifications.controller.ts
├── notifications.routes.ts
├── email-events/
│   ├── email-events.types.ts
│   ├── email-events.repository.ts
│   └── email-events.service.ts
└── email/
    ├── email.types.ts
    └── email.service.ts                  ← stub: logs + writes email_events, no real SES
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/notifications` | required | List notifications for current user |
| PATCH | `/api/v1/notifications/:id/read` | required | Mark notification as read |
| POST | `/api/v1/notifications` | required | Create notification (internal use) |
| GET | `/api/v1/email-events` | required | List email events for firm |

---

## Request / Response Shapes

### GET /notifications

```
Query params (all optional):
  is_read=true|false
  page=1
  limit=20
```

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "firm_id": "uuid",
      "user_id": "uuid",
      "type": "task_assigned",
      "title": "Task Assigned: Prepare Q1 Return",
      "message": "You have been assigned a task.",
      "entity_type": "task",
      "entity_id": "uuid",
      "is_read": false,
      "read_at": null,
      "created_at": "2026-03-17T10:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

### PATCH /notifications/:id/read

```json
// No request body
// Response 200
{
  "id": "uuid",
  "is_read": true,
  "read_at": "2026-03-17T10:05:00Z",
  ...
}
```

### POST /notifications

```json
// Request body
{
  "user_id": "uuid",
  "type": "invoice_sent",
  "title": "Invoice Sent: #42",
  "message": "Invoice has been sent to the client.",
  "entity_type": "invoice",
  "entity_id": "uuid"
}

// Response 201
{
  "id": "uuid",
  "firm_id": "uuid",
  "user_id": "uuid",
  "type": "invoice_sent",
  ...
}
```

### GET /email-events

```
Query params (all optional):
  page=1
  limit=20
```

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "firm_id": "uuid",
      "message_id": "uuid",
      "email_to": "client@example.com",
      "email_from": "firm@example.com",
      "subject": "Invoice #42 from Acme Accounting",
      "template_name": "invoice",
      "event_type": "sent",
      "event_data": null,
      "created_at": "2026-03-17T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

## Layer Responsibilities

### notifications.routes.ts
- Mount all notification routes.
- Apply `authenticate` + `tenantContext` on all routes.
- Apply `validate(schema)` on POST route.
- `POST /notifications` additionally applies an `internalOnly` middleware that checks `req.headers['x-internal-request'] === 'true'`. If the header is absent, respond `403 Forbidden`. This prevents authenticated end-users from calling the endpoint directly. The header is set by `notificationsService` when it calls the endpoint internally. Note: for MVP the service calls the repository directly (not via HTTP), so this guard is a defence-in-depth measure on the HTTP surface only.

### notifications.controller.ts
- Extract `req.user!.firmId` and `req.user!.userId` for all methods.
- Call `notificationsService` methods.
- Return correct HTTP status codes (200, 201, 404).
- No business logic.

### notifications.service.ts
- `listNotifications(firmId, userId, query)` — delegate to repository.
- `createNotification(firmId, data)` — delegate to repository.
- `markAsRead(firmId, userId, notificationId)` — verify ownership, update, return.

### notifications.repository.ts
- All Prisma queries for `notifications` table.
- `findAll(firmId, userId, query)` — paginated, filtered by `is_read` if provided, ordered by `created_at DESC`.
- `findById(firmId, notificationId)` — single record.
- `create(firmId, data)` — deduplication guard before insert: call `prisma.notifications.findFirst({ where: { firm_id: firmId, user_id: data.user_id, type: data.type, entity_id: data.entity_id } })`. If a matching record exists, return it without inserting. Otherwise insert and return the new record. This prevents duplicate notifications from webhook retries, bulk operations, or concurrent event triggers.
- `markAsRead(firmId, userId, notificationId)` — update `is_read = true`, `read_at = now()`.

### email-events.repository.ts
- All Prisma queries for `email_events` table.
- `create(data)` — insert email event record.
- `findAll(firmId, query)` — paginated, ordered by `created_at DESC`.

### email-events.service.ts
- `logEmailEvent(data)` — calls `emailEventsRepository.create(data)`.
- `listEmailEvents(firmId, query)` — calls `emailEventsRepository.findAll(firmId, query)`.

### email.service.ts (stub)
- `sendEmail(options: SendEmailOptions)` — does NOT call SES.
- Logs intent via `logger.info({ event: 'EMAIL_STUB', to: options.to, subject: options.subject })`.
- Calls `emailEventsService.logEmailEvent(...)` to write to `email_events`.
- Returns `{ messageId: string }` — a generated UUID.
- Interface is designed to be drop-in replaceable with real SES in a future phase.

### index.ts
- Exports `notificationsRouter` (default export for app.ts mounting).
- Exports `notificationsService` (for use in tasks, documents, invoices, webhook).
- Exports `emailService` (for use in invoices.service.ts).

---

## Email Service Interface

```typescript
// email/email.types.ts
export interface SendEmailOptions {
  to: string;
  from?: string;
  subject: string;
  templateName: string;
  firmId?: string;
  body?: string;
}

export interface SendEmailResult {
  messageId: string;
}
```

```typescript
// email/email.service.ts (stub implementation)
async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const messageId = randomUUID();
  logger.info({ event: 'EMAIL_STUB', to: options.to, subject: options.subject, template: options.templateName });
  await emailEventsService.logEmailEvent({
    firmId: options.firmId ?? null,
    messageId,
    emailTo: options.to,
    emailFrom: options.from ?? 'noreply@taxmic.com',
    subject: options.subject,
    templateName: options.templateName,
    eventType: 'sent',
  });
  return { messageId };
}
```

---

## Event Integration Points

### tasks.service.ts — createTask()

After the task is created and `data.assignee_ids` is non-empty, call for each assignee:

```typescript
// Wrapped in try/catch — must not block task creation
try {
  for (const userId of data.assignee_ids) {
    await notificationsService.createNotification(firmId, {
      user_id: userId,
      type: 'task_assigned',
      title: `Task Assigned: ${task.title}`,
      message: 'You have been assigned a task.',
      entity_type: 'task',
      entity_id: task.id,
    });
  }
} catch (err) {
  logger.warn({ event: 'NOTIFICATION_CREATE_FAILED', error: err });
}
```

### documents.service.ts — uploadDocument()

After the document is created:

```typescript
try {
  await notificationsService.createNotification(data.firmId, {
    user_id: data.uploadedBy,
    type: 'document_uploaded',
    title: `Document Uploaded: ${data.filename}`,
    message: 'A new document has been uploaded.',
    entity_type: 'document',
    entity_id: doc.id,
  });
} catch (err) {
  logger.warn({ event: 'NOTIFICATION_CREATE_FAILED', error: err });
}
```

### invoices.service.ts — sendInvoice()

Replace the existing `INVOICE_EMAIL_STUB` log with real calls:

```typescript
// Send stub email + log to email_events
try {
  await emailService.sendEmail({
    to: existing.client?.email ?? 'client@placeholder.com',
    from: firm?.email ?? 'noreply@taxmic.com',
    subject: `Invoice #${existing.number} from ${firmName}`,
    templateName: 'invoice',
    firmId,
  });
} catch (err) {
  logger.warn({ event: 'EMAIL_SEND_FAILED', error: err });
}

// Create in-app notification for the requesting user
try {
  await notificationsService.createNotification(firmId, {
    user_id: userId,   // passed into sendInvoice from controller
    type: 'invoice_sent',
    title: `Invoice Sent: #${existing.number}`,
    message: 'Invoice has been sent to the client.',
    entity_type: 'invoice',
    entity_id: invoiceId,
  });
} catch (err) {
  logger.warn({ event: 'NOTIFICATION_CREATE_FAILED', error: err });
}
```

Note: `sendInvoice` signature changes from `(firmId, invoiceId)` to `(firmId, invoiceId, userId)`.

### webhook.controller.ts — checkout.session.completed

After marking invoice as paid:

```typescript
try {
  // Look up invoice to get firm_id and number
  const paidInvoice = await prisma.invoices.findUnique({ where: { id: invoiceId } });
  if (paidInvoice) {
    await notificationsService.createNotification(paidInvoice.firm_id, {
      user_id: paidInvoice.created_by ?? null,  // may be null — skip if null
      type: 'invoice_paid',
      title: `Invoice Paid: #${paidInvoice.number}`,
      message: 'Payment has been received.',
      entity_type: 'invoice',
      entity_id: invoiceId,
    });
  }
} catch (err) {
  logger.warn({ event: 'NOTIFICATION_CREATE_FAILED', error: err });
}
```

Note: `createNotification` must handle `user_id = null` gracefully — skip insert if `user_id` is null.

---

## Validation Schemas

### CreateNotificationSchema (Zod)

```typescript
z.object({
  user_id: z.string().uuid(),
  type: z.enum(['task_assigned', 'task_completed', 'invoice_sent', 'invoice_paid', 'document_uploaded', 'comment_added', 'user_invited']),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  entity_type: z.string().max(50).optional(),
  entity_id: z.string().uuid().optional(),
})
```

### ListNotificationsQuerySchema (Zod)

```typescript
z.object({
  is_read: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
```

### ListEmailEventsQuerySchema (Zod)

```typescript
z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
```

---

## Frontend Architecture

### Folder Structure

```
apps/web/src/features/notifications/
├── api/
│   └── notifications-api.ts
├── hooks/
│   └── useNotifications.ts
└── types.ts

apps/web/src/pages/notifications/
└── index.tsx
```

### Route Registration (App.tsx addition)

```tsx
import NotificationsPage from './pages/notifications/index';

// Inside DashboardLayout route group:
<Route path="/notifications" element={<NotificationsPage />} />
```

### DashboardLayout nav addition

Add to `navItems` array in `DashboardLayout.tsx`:

```typescript
{
  label: 'Notifications',
  path: '/notifications',
  icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
}
```

### Notification type display

| Type | Label |
|---|---|
| `task_assigned` | Task Assigned |
| `task_completed` | Task Completed |
| `invoice_sent` | Invoice Sent |
| `invoice_paid` | Invoice Paid |
| `document_uploaded` | Document Uploaded |
| `comment_added` | Comment Added |
| `user_invited` | User Invited |

### NotificationsPage layout

- Page heading: "Notifications"
- Filter buttons: All / Unread
- Table columns: Type, Title, Message, Date, Status (Read/Unread)
- "Mark as read" button per unread row
- Uses `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` from `components/ui/Table`
- Uses `Button` from `components/ui/Button`
- Wrapped in `DashboardLayout` (via React Router `<Outlet />`)

---

## Data Flow

```
User action (mark as read)
  → NotificationsPage
  → useNotifications hook (useMutation)
  → notifications-api.ts (PATCH /api/v1/notifications/:id/read)
  → notifications.routes.ts
  → authenticate + tenantContext
  → notifications.controller.ts
  → notificationsService.markAsRead(firmId, userId, id)
  → notificationsRepository.markAsRead(firmId, userId, id)
  → Prisma → PostgreSQL notifications table

System event (task created with assignees)
  → tasksService.createTask()
  → notificationsService.createNotification() [try/catch]
  → notificationsRepository.create()
  → Prisma → PostgreSQL notifications table
```

---

## Tenant Isolation Guarantee

- `notifications.repository.ts`: every query includes `firm_id` from service argument.
- `markAsRead` includes both `firm_id` AND `user_id` in the `where` clause — prevents one user marking another user's notification.
- `email_events.repository.ts`: `findAll` filters by `firm_id`.
- Controller always passes `req.user!.firmId` and `req.user!.userId` — never values from request body.
