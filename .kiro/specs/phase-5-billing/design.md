# Phase 5 — Billing Module Design

## Backend Architecture

### Folder Structure

```
apps/api/src/modules/billing/
├── index.ts                          ← aggregates invoices + payments routers
├── pdf-generator.service.ts          ← PDFKit invoice PDF generation
├── invoices/
│   ├── invoices.types.ts
│   ├── invoices.validation.ts
│   ├── invoices.repository.ts
│   ├── invoices.service.ts
│   ├── invoices.controller.ts
│   └── invoices.routes.ts
└── payments/
    ├── payments.types.ts
    ├── payments.validation.ts
    ├── payments.repository.ts
    ├── payments.service.ts
    ├── payments.controller.ts
    ├── payments.routes.ts
    ├── stripe.service.ts             ← Stripe SDK wrapper
    └── webhook.controller.ts         ← raw body handler for Stripe webhooks
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/invoices` | required | List invoices (paginated, filterable) |
| POST | `/api/v1/invoices` | required | Create invoice with line items |
| GET | `/api/v1/invoices/:id` | required | Get invoice detail |
| PATCH | `/api/v1/invoices/:id` | required | Update draft invoice |
| POST | `/api/v1/invoices/:id/send` | required | Send invoice (stub) + generate PDF |
| POST | `/api/v1/invoices/:id/pay` | required | Create Stripe Checkout session |
| POST | `/api/v1/payments/stripe/webhook` | none (Stripe sig) | Stripe webhook handler |
| GET | `/api/v1/clients/:id/invoices` | required | List invoices by client |
| GET | `/api/v1/clients/:id/payments` | required | List payments by client |

---

## Request / Response Shapes

### POST /invoices — Create Invoice

```json
// Request body
{
  "client_id": "uuid",
  "issue_date": "2026-03-17",
  "due_date": "2026-04-17",
  "tax_amount": "50.00",
  "notes": "Q1 2026 services",
  "items": [
    { "description": "Tax preparation", "quantity": "1", "unit_price": "500.00", "sort_order": 0 },
    { "description": "Bookkeeping", "quantity": "2", "unit_price": "150.00", "sort_order": 1 }
  ]
}

// Response 201
{
  "id": "uuid",
  "firm_id": "uuid",
  "client_id": "uuid",
  "number": 42,
  "status": "draft",
  "issue_date": "2026-03-17",
  "due_date": "2026-04-17",
  "subtotal_amount": "800.00",
  "tax_amount": "50.00",
  "total_amount": "850.00",
  "paid_amount": "0.00",
  "notes": "Q1 2026 services",
  "pdf_url": null,
  "sent_at": null,
  "paid_at": null,
  "items": [...],
  "created_at": "...",
  "updated_at": "..."
}
```

### GET /invoices — List Invoices

```
Query params (all optional):
  status=draft|sent|paid|overdue|cancelled
  client_id=uuid
  due_date=2026-04-17
  page=1
  limit=20
```

### PATCH /invoices/:id — Update Invoice

```json
// All fields optional; items = full replace if provided
{
  "due_date": "2026-05-01",
  "tax_amount": "75.00",
  "notes": "Updated terms",
  "items": [...]
}
```

### POST /invoices/:id/send — Send Invoice

```json
// No request body
// Response 200
{
  "id": "uuid",
  "status": "sent",
  "sent_at": "2026-03-17T10:00:00Z",
  "pdf_url": "invoices/uuid/invoice-42.pdf",
  ...
}
```

### POST /invoices/:id/pay — Create Stripe Checkout

```json
// No request body
// Response 200
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### POST /payments/stripe/webhook

- Raw body required for signature verification.
- `Content-Type: application/json` (raw buffer, not parsed).
- Returns `200` on success or already-processed.
- Returns `400` on signature failure.

---

## Layer Responsibilities

### invoices.routes.ts
- Mount all invoice routes.
- Apply `authenticate` + `tenantContext` on all routes except webhook.
- Apply `validate(schema)` per route.

### invoices.controller.ts
- Extract `req.user!.firmId`, params, query, body.
- Call `invoicesService` methods.
- Return correct HTTP status codes.
- No business logic.

### invoices.service.ts
- Calculate totals server-side: `subtotal = sum(qty * unit_price)`, `total = subtotal + tax`.
- Call `get_next_invoice_number` via `prisma.$queryRaw` on create.
- Enforce status transition rules (only `draft` can be updated/sent).
- On send: generate PDF via `pdfGeneratorService`, store via `StorageProvider`, update `pdf_url`.
- On send: log email intent stub.
- No Prisma imports — delegates to repository.

### invoices.repository.ts
- All Prisma queries for `invoices` and `invoice_items`.
- `create`: insert invoice + items in a transaction.
- `update`: delete existing items + insert new items in a transaction if `items` provided.
- `findById`: include `invoice_items` and `payments`.
- `findAll`: paginated with filters.

### pdf-generator.service.ts
- Accepts invoice data + firm settings.
- Generates PDF buffer using `pdfkit`.
- Stores via `getStorageProvider().save(buffer, key)`.
- Returns the storage key.
- PDF layout:
  - Header: firm name, invoice prefix + number
  - Client name, issue date, due date
  - Line items table
  - Subtotal / tax / total
  - Terms (`firm_settings.invoice_terms`)
  - Footer (`firm_settings.invoice_footer`)

### stripe.service.ts
- Wraps Stripe SDK.
- `createCheckoutSession(invoice, successUrl, cancelUrl)` → returns Stripe session URL.
- Throws `AppError(503)` if `STRIPE_SECRET_KEY` is not configured.
- `constructEvent(rawBody, sig, secret)` → verifies webhook signature.

### payments.service.ts
- On `POST /invoices/:id/pay`:
  - Create a `payments` record with `status = pending`, `method = stripe`.
  - Call `stripeService.createCheckoutSession`.
  - Update payment with `stripe_payment_intent_id` from session.
  - Return checkout URL.

### webhook.controller.ts
- Reads raw body (express.raw middleware).
- Verifies Stripe signature.
- Checks `webhook_events` for duplicate `event.id`.
- Inserts `webhook_events` record with `status = processing`.
- Dispatches to handler by event type.
- Updates `webhook_events.status = processed` + `processed_at`.
- On error: updates `webhook_events.status = failed` + `error`.

---

## Total Calculation Logic

```typescript
// Server-side only — never trust client totals
const subtotal = items.reduce((sum, item) => {
  const amount = parseFloat(item.quantity) * parseFloat(item.unit_price);
  return sum + amount;
}, 0);
const tax = parseFloat(taxAmount ?? '0');
const total = subtotal + tax;
// item.amount = quantity * unit_price (also computed server-side)
```

---

## PDF Storage Key Convention

```
invoices/{invoiceId}/invoice-{number}.pdf
```

Example: `invoices/a1b2c3/invoice-42.pdf`

---

## Stripe Checkout Flow

```
POST /invoices/:id/pay
  → create payments record (pending)
  → stripeService.createCheckoutSession(invoice, successUrl, cancelUrl)
  → return { url: checkoutUrl }

User completes payment on Stripe
  → Stripe sends POST /payments/stripe/webhook
  → verify signature
  → check idempotency (webhook_events)
  → handle checkout.session.completed:
      → update payment: status=completed, paid_at=now
      → update invoice: status=paid, paid_at=now, paid_amount=total_amount
```

---

## Webhook Idempotency

```typescript
// Before processing any event:
const existing = await prisma.webhook_events.findUnique({ where: { event_id: event.id } });
if (existing?.status === 'processed') return res.sendStatus(200);

// Insert or upsert with status=processing
await prisma.webhook_events.upsert({
  where: { event_id: event.id },
  create: { event_id: event.id, type: event.type, status: 'processing', payload: event as any },
  update: { status: 'processing' },
});
```

---

## Frontend Architecture

### Folder Structure

```
apps/web/src/features/invoices/
├── api/
│   └── invoices-api.ts
├── components/
│   ├── InvoiceList.tsx
│   ├── InvoiceForm.tsx
│   ├── InvoiceDetails.tsx
│   ├── InvoiceStatusBadge.tsx
│   └── LineItemsTable.tsx
├── hooks/
│   ├── useInvoices.ts
│   ├── useInvoice.ts
│   ├── useCreateInvoice.ts
│   ├── useUpdateInvoice.ts
│   └── useSendInvoice.ts
└── types.ts

apps/web/src/pages/invoices/
├── index.tsx           → /invoices
├── new.tsx             → /invoices/new
├── [id].tsx            → /invoices/:id
└── payment-success.tsx → /invoices/payment-success
```

### Route Registration (App.tsx additions)

```tsx
import InvoicesPage from './pages/invoices/index';
import NewInvoicePage from './pages/invoices/new';
import InvoiceDetailPage from './pages/invoices/[id]';
import PaymentSuccessPage from './pages/invoices/payment-success';

// Inside DashboardLayout route group:
<Route path="/invoices" element={<InvoicesPage />} />
<Route path="/invoices/new" element={<NewInvoicePage />} />
<Route path="/invoices/:id" element={<InvoiceDetailPage />} />

// Outside DashboardLayout (no sidebar needed):
<Route path="/invoices/payment-success" element={<PaymentSuccessPage />} />
```

### InvoiceStatusBadge colors

| Status | Color |
|---|---|
| `draft` | gray |
| `sent` | blue |
| `paid` | green |
| `overdue` | red |
| `cancelled` | yellow |

---

## Data Flow

```
User action
  → React page
  → hook (useMutation / useQuery)
  → invoices-api.ts (axios via api.ts)
  → GET/POST/PATCH /api/v1/invoices
  → invoices.routes.ts
  → authenticate + tenantContext
  → invoices.controller.ts
  → invoices.service.ts
  → invoices.repository.ts
  → Prisma → PostgreSQL
```

---

## Tenant Isolation Guarantee

Every repository method receives `firmId` as first argument and includes it in every `where` clause. The controller always passes `req.user!.firmId` — never a value from the request body or params.
