# Phase 2 — CRM Module Design

## Architecture

Follows the same layered pattern as Phase 1:

```
Request → Router → Middleware (authenticate, tenantContext, validate) → Controller → Service → Repository → Prisma
```

---

## Module Structure

Per `docs/02-architecture/FOLDER-STRUCTURE-FINAL.md`, the CRM module is split into sub-modules:

```
apps/api/src/modules/crm/
├── clients/
│   ├── clients.controller.ts
│   ├── clients.service.ts
│   ├── clients.repository.ts
│   ├── clients.routes.ts
│   ├── clients.types.ts
│   └── clients.validation.ts
├── contacts/
│   ├── contacts.controller.ts
│   ├── contacts.service.ts
│   ├── contacts.repository.ts
│   ├── contacts.routes.ts
│   ├── contacts.types.ts
│   └── contacts.validation.ts
└── index.ts
```

`index.ts` aggregates both sub-routers and the firms endpoints into a single Express router mounted in `app.ts`.

---

## API Endpoints

All routes prefixed `/api/v1`, require `Authorization: Bearer <token>`.

### Firms

| Method | Path | Description |
|--------|------|-------------|
| GET | `/firms/:id` | Get firm profile |
| PATCH | `/firms/:id` | Update firm profile |

### Clients

| Method | Path | Description |
|--------|------|-------------|
| GET | `/clients` | List clients (paginated, searchable) |
| POST | `/clients` | Create client |
| GET | `/clients/:id` | Get client by ID |
| PATCH | `/clients/:id` | Update client |
| DELETE | `/clients/:id` | Soft delete client |

### Contacts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/contacts` | List contacts (paginated) |
| POST | `/contacts` | Create contact |
| GET | `/contacts/:id` | Get contact by ID |
| PATCH | `/contacts/:id` | Update contact |
| DELETE | `/contacts/:id` | Hard delete contact |

### Relationships

| Method | Path | Description |
|--------|------|-------------|
| POST | `/clients/:id/contacts/link` | Link contact to client |
| DELETE | `/clients/:id/contacts/:contactId` | Unlink contact from client |

---

## Request / Response Shapes

### POST /clients
```json
{
  "name": "string (required)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "type": "individual | business | nonprofit (optional)",
  "status": "active | inactive | archived | lead (optional, default: active)",
  "taxId": "string (optional)",
  "website": "string (optional)",
  "notes": "string (optional)"
}
```
Response: `201` with client object

### GET /clients
Query: `?search=string&page=number&limit=number`
Response: `{ data: Client[], total: number, page: number, limit: number }`

### POST /contacts
```json
{
  "name": "string (required)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "title": "string (optional)",
  "notes": "string (optional)"
}
```
Response: `201` with contact object

### POST /clients/:id/contacts/link
```json
{ "contactId": "uuid (required)" }
```
Response: `201` with `{ clientId, contactId }`

### PATCH /firms/:id
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "address": "string (optional)",
  "website": "string (optional)",
  "timezone": "string (optional)"
}
```

---

## Repository Contracts

### clients.repository.ts
```typescript
findByFirm(firmId, opts: { search?: string; page: number; limit: number })
findById(firmId, clientId)
create(firmId, data: CreateClientDto)
update(firmId, clientId, data: UpdateClientDto)
softDelete(firmId, clientId)
linkContact(firmId, clientId, contactId)
unlinkContact(firmId, clientId, contactId)
findLink(firmId, clientId, contactId)
```

### contacts.repository.ts
```typescript
findByFirm(firmId, opts: { page: number; limit: number })
findById(firmId, contactId)
create(firmId, data: CreateContactDto)
update(firmId, contactId, data: UpdateContactDto)
delete(firmId, contactId)
```

### firms (in clients.repository.ts or separate)
```typescript
findFirmById(firmId)
updateFirm(firmId, data: UpdateFirmDto)
```

---

## Service Rules

- `firmId` always comes from `req.user.firmId` (JWT) — never from request body
- `findById` must verify resource belongs to requesting firm — returns `404` otherwise
- Soft delete sets `deleted_at = new Date()` — no permanent deletion for clients
- Duplicate link returns `409 CONFLICT`
- Service never imports Prisma directly — only calls repository

---

## Database Schema (actual columns)

### clients
```
id, firm_id, name, email, phone, type (enum), status (enum),
tax_id, website, notes, search_vector, created_at, updated_at, deleted_at
```

### contacts
```
id, firm_id, name, email, phone, title, is_primary,
notes, search_vector, created_at, updated_at, deleted_at
```

### client_contacts
```
id, firm_id, client_id, contact_id, is_primary, created_at
UNIQUE (firm_id, client_id, contact_id)
```

---

## Middleware Stack

```
authenticate     → verifies JWT, sets req.user + req.tenantId
tenantContext    → ensures req.tenantId is set
validate(Schema) → Zod validation on body
```

---

## Error Handling

| Scenario | HTTP | Code |
|----------|------|------|
| Resource not found | 404 | `NOT_FOUND` |
| Duplicate link | 409 | `CONFLICT` |
| Validation failure | 422 | `VALIDATION_ERROR` |
| Unauthenticated | 401 | `UNAUTHORIZED` |
| Unhandled | 500 | `INTERNAL_ERROR` |

---

## Frontend Structure

Per `docs/02-architecture/FOLDER-STRUCTURE-FINAL.md`:

```
apps/web/src/features/
├── clients/
│   ├── components/
│   │   ├── ClientList.tsx
│   │   ├── ClientForm.tsx
│   │   └── ClientDetails.tsx
│   ├── hooks/
│   │   ├── useClients.ts
│   │   ├── useClient.ts
│   │   ├── useCreateClient.ts
│   │   └── useUpdateClient.ts
│   ├── api/
│   │   └── clients-api.ts
│   └── types.ts
└── contacts/
    ├── components/
    │   ├── ContactList.tsx
    │   └── ContactForm.tsx
    ├── hooks/
    │   ├── useContacts.ts
    │   └── useCreateContact.ts
    ├── api/
    │   └── contacts-api.ts
    └── types.ts
```

Pages (in `apps/web/src/pages/` or Next.js app router):
- Dashboard
- Clients List
- Client Detail
- Client Form (new/edit)
- Contacts List
- Contact Form (new/edit)

All pages use `AppLayout` → `AppHeader` → `AppSidebar` → `PageContainer` per governance doc.
UI components: `DataTable`, `Badge`, `Button`, `Form`, `FormField`, `Input`, `Select`, `ComponentCard`, `PageHeader`.
