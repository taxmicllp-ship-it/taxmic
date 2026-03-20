# Phase 6 — Notifications Module Requirements

## Overview

Phase 6 adds in-app notifications and email event tracking to the platform. Firm users receive notifications when key system events occur (task assigned, document uploaded, invoice sent, invoice paid). All email sends are logged to the `email_events` table. Actual SES delivery is stubbed — the email service logs intent and records the event without sending real email.

Scope: `notifications` + `email_events` tables. No schema changes. No new Prisma models.

---

## Functional Requirements

### FR-1: List Notifications

- A firm user can retrieve their own notifications.
- Results are scoped to the authenticated user (`user_id = req.user.userId`) and their firm (`firm_id = req.user.firmId`).
- Supports optional filter: `is_read=true|false`.
- Supports pagination: `page` and `limit` query params.
- Results are ordered by `created_at DESC`.

### FR-2: Mark Notification as Read

- `PATCH /notifications/:id/read` marks a single notification as read.
- Sets `is_read = true` and `read_at = now()`.
- Only the owning user can mark their own notification as read.
- Returns the updated notification.
- Returns 404 if the notification does not belong to the authenticated user's firm.

### FR-3: Create Notification (Internal)

- `POST /notifications` creates a notification record.
- This endpoint is for internal service use only — the frontend does NOT call it.
- Required fields: `user_id`, `type`, `title`, `message`.
- Optional fields: `entity_type`, `entity_id`.
- `firm_id` is always taken from `req.user.firmId` — never from the request body.
- Access is restricted to server-side callers only. The route applies an `internalOnly` middleware guard that rejects requests originating from non-server contexts. In practice for MVP, this means the endpoint is authenticated (JWT required) and its existence is not exposed in any client-facing API documentation. A future phase may replace this with a service token or remove the HTTP endpoint entirely in favour of direct service calls.

### FR-4: List Email Events

- `GET /email-events` returns email event records for the authenticated firm.
- Scoped to `firm_id = req.user.firmId`.
- Supports pagination: `page` and `limit`.
- Results ordered by `created_at DESC`.

### FR-5: Task Assignment Notification

- When a task is created with one or more `assignee_ids`, a notification of type `task_assigned` is created for each assigned user.
- `title`: `"Task Assigned: {task.title}"`
- `message`: `"You have been assigned a task."`
- `entity_type`: `"task"`, `entity_id`: task ID.
- Notification creation must not block or fail the task creation response.

### FR-6: Document Upload Notification

- When a document is uploaded, a notification of type `document_uploaded` is created for the uploading user.
- `title`: `"Document Uploaded: {filename}"`
- `message`: `"A new document has been uploaded."`
- `entity_type`: `"document"`, `entity_id`: document ID.
- Notification creation must not block or fail the upload response.

### FR-7: Invoice Sent Notification + Email Log

- When `POST /invoices/:id/send` is called, two things happen:
  1. A notification of type `invoice_sent` is created for the user who triggered the send.
  2. An `email_events` record is created with `event_type = sent` (stub — no real email sent).
- Notification: `title`: `"Invoice Sent: #{invoice.number}"`, `message`: `"Invoice has been sent to the client."`
- `entity_type`: `"invoice"`, `entity_id`: invoice ID.
- Email event fields: `message_id` (generated UUID), `email_to` (client email or placeholder), `email_from` (firm email or placeholder), `subject`: `"Invoice #{number} from {firmName}"`, `template_name`: `"invoice"`, `event_type`: `sent`.

### FR-8: Invoice Paid Notification

- When the Stripe webhook `checkout.session.completed` is processed, a notification of type `invoice_paid` is created.
- The notification is created for the firm (targeted at the invoice creator or firm owner — use `invoice.created_by` if available, otherwise skip user targeting and log only).
- `title`: `"Invoice Paid: #{invoice.number}"`, `message`: `"Payment has been received."`
- `entity_type`: `"invoice"`, `entity_id`: invoice ID.
- Notification creation must not block or fail the webhook response.

### FR-9: Email Event Logging

- Every call to `emailService.sendEmail()` must create an `email_events` record.
- Required fields on every log: `message_id` (UUID), `email_to`, `email_from`, `subject`, `template_name`, `event_type = sent`.
- `firm_id` must always be set when available — it is passed as part of `SendEmailOptions` and written to the record. It is only null when the email is triggered outside a firm context (e.g. password reset before login), which does not occur in Phase 6.
- No real email is sent. The service logs intent and records the event only.

---

## Scalability Note (Future)

### SN-1: Bulk Notification Insert

- FR-5 (task assignment) creates one notification per assignee in a loop.
- For MVP this is acceptable — tasks typically have 1–3 assignees.
- When task assignment scales beyond ~10 assignees, this should be replaced with a single `createMany` bulk insert.
- This is documented here as a known future improvement, not a current requirement.

---

## Non-Functional Requirements

### NFR-1: Tenant Isolation

- All notification queries include `firm_id` from `req.user.firmId`.
- Users can only read and update their own notifications (`user_id` filter applied).
- No cross-firm data leakage is possible.

### NFR-2: Non-Blocking Event Integration

- Calls to `notificationsService.create()` from tasks, documents, invoices, and webhook modules must be wrapped in try/catch.
- A failure to create a notification must never cause the parent operation to fail.

### NFR-3: No Schema Changes

- Only the existing `notifications` and `email_events` tables are used.
- No new Prisma models. No migrations.

### NFR-4: No Regressions

- Phases 1–5 (auth, CRM, documents, tasks, billing) must continue to work without modification to their core logic.
- The only permitted changes to prior phase files are additive: calling `notificationsService.create()` or `emailService.sendEmail()` after the primary operation succeeds.

### NFR-5: Email Stub Behaviour

- `emailService.sendEmail()` does NOT connect to AWS SES or any external service.
- It logs the send intent via `logger.info` and writes one record to `email_events`.
- The stub must accept the same interface that a real SES implementation would use, so the swap is seamless in a future phase.

---

## Future Architecture: Event-Worker Pattern

### Current Design (Phase 6 MVP)

Business logic modules call `notificationsService.createNotification()` directly after the primary operation succeeds. This is synchronous, simple, and correct for MVP scale.

```
tasks.service.ts → notificationsService.createNotification() → notifications table
```

### Upgrade Threshold

Switch to the event-worker pattern when the system reaches approximately:
- 10,000 notifications/day, or
- 100+ firms actively using the product

### Target Architecture

```
Business Module (tasks, documents, invoices)
  ↓
Event Table (write event record)
  ↓
Notification Worker (async, polls or subscribes)
  ↓
notifications table
```

The worker handles deduplication, rate limiting (e.g. "50 new tasks" digest instead of 50 individual notifications), and retry safety for webhook-originated events.

### Natural Event Source

A dedicated `notification_events` table (or a lightweight queue) is the cleanest event source for this pattern. The existing `activity_events` table is NOT suitable as the event source because it has an XOR constraint on `actor_user_id` / `actor_client_user_id` — this constraint makes it unsuitable as a universal notification trigger source across all firm-side events.

### Deduplication Guard (Phase 6)

As a lightweight protection against notification storms at MVP scale, `notifications.repository.create()` performs a deduplication check before every insert:

```typescript
const existing = await prisma.notifications.findFirst({
  where: { firm_id: firmId, user_id: data.user_id, type: data.type, entity_id: data.entity_id }
});
if (existing) return existing; // skip insert, return existing record
```

This prevents duplicates from Stripe webhook retries and any accidental double-calls without requiring a worker architecture.

---

## Out of Scope (Phase 6)

- Real AWS SES email delivery
- Push notifications (browser/mobile)
- Notification preferences / opt-out
- Bulk notification creation
- Notification deletion
- Email template rendering (HTML templates)
- Task completion notifications
- Comment added notifications
- User invited notifications
- Unread count badge in the UI (future enhancement)
