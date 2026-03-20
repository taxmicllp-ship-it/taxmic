# Backend Development Order & Architecture Rules

**Version:** 1.0 FINAL
**Purpose:** Strict development sequence and folder structure rules for backend implementation
**Status:** Active — must be followed exactly
**Prerequisite:** Database layer complete (36 tables, 11 ENUMs, migrations applied)

---

## Table of Contents

1. [Development Order](#1-development-order)
2. [Module Folder Structure](#2-module-folder-structure)
3. [Architecture Rules](#3-architecture-rules)
4. [Immediate Next Steps](#4-immediate-next-steps)

---

## 1. Development Order

Build modules in this exact sequence. Each phase depends on the previous.

| Order | Module | Location | Depends On |
|-------|--------|----------|------------|
| 1 | Core Foundation | `packages/database`, `packages/shared-types`, `apps/api/src/shared` | Nothing |
| 2 | Auth | `apps/api/src/modules/auth` | Foundation |
| 3 | CRM | `apps/api/src/modules/crm` | Auth |
| 4 | Documents | `apps/api/src/modules/documents` | Auth, CRM |
| 5 | Tasks | `apps/api/src/modules/tasks` | Auth, CRM |
| 6 | Billing | `apps/api/src/modules/billing` | Auth, CRM |
| 7 | Notifications | `apps/api/src/modules/notifications` | Tasks, Billing, Documents |
| 8 | Portal | `apps/api/src/modules/portal` | Auth, CRM, Documents, Billing |
| 9 | Onboarding | `apps/api/src/modules/onboarding` | Auth, CRM |

**Rule:** Do NOT start a module until all its dependencies are complete and tested.

---

### Phase 1 — Core Foundation

Build first. Everything else depends on this.

**Packages:**
- `packages/database` — Prisma Client export
- `packages/shared-types` — Shared TypeScript types
- `apps/api/src/shared` — Shared backend infrastructure

**What to implement:**

| File | Purpose |
|------|---------|
| `packages/database/src/client.ts` | Prisma Client singleton |
| `apps/api/src/shared/database/base.repository.ts` | Base repository class |
| `apps/api/src/shared/middleware/tenant-context.ts` | Sets `app.current_firm_id` for RLS |
| `apps/api/src/shared/middleware/auth.middleware.ts` | JWT verification |
| `apps/api/src/shared/middleware/error-handler.ts` | Global error handler |
| `apps/api/src/shared/utils/logger.ts` | Winston logger |
| `apps/api/src/config/` | App configuration |
| `apps/api/src/app.ts` | Express app setup |
| `apps/api/src/server.ts` | Server entry point |

**Why first:** Every module imports from shared. Tenant middleware is required for RLS to work.

---

### Phase 2 — Auth Module

Build second. Every other module requires authenticated users.

**Location:** `apps/api/src/modules/auth`

**What to implement:**
- User registration
- User login (JWT)
- Password reset (email-based)
- Session management
- Logout

**Database tables used:** `firms`, `users`, `roles`, `permissions`, `user_roles`

---

### Phase 3 — CRM Module

Build third. Clients are the central entity — everything else attaches to them.

**Location:** `apps/api/src/modules/crm`

**What to implement:**
- Firm profile management
- Client CRUD + soft delete
- Client search (full-text)
- Contact CRUD
- Contact-client linking

**Database tables used:** `clients`, `contacts`, `client_contacts`, `addresses`

---

### Phase 4 — Documents Module

Build fourth. Documents attach to clients.

**Location:** `apps/api/src/modules/documents`

**What to implement:**
- Folder creation
- File upload (S3, max 50MB)
- File download (signed URLs)
- File delete
- MIME validation
- Storage limit enforcement

**Database tables used:** `folders`, `documents`, `document_versions`, `document_permissions`, `storage_usage`

---

### Phase 5 — Tasks Module

Build fifth. Tasks depend on clients and users.

**Location:** `apps/api/src/modules/tasks`

**What to implement:**
- Task creation
- Task assignment
- Task status update
- Task list and filter
- Task delete

**Database tables used:** `tasks`, `task_assignments`, `task_comments`

---

### Phase 6 — Billing Module

Build sixth. Billing depends on clients and users.

**Location:** `apps/api/src/modules/billing`

**What to implement:**
- Invoice creation with line items
- Invoice PDF generation
- Invoice email delivery
- Payment processing (Stripe Checkout)
- Stripe webhook handling
- Payment history

**Database tables used:** `invoices`, `invoice_items`, `payments`, `invoice_sequences`

---

### Phase 7 — Notifications Module

Build seventh. Depends on tasks, billing, and documents.

**Location:** `apps/api/src/modules/notifications`

**What to implement:**
- Welcome email
- Invoice email
- Password reset email
- Email event tracking (SES webhooks)
- Activity event logging

**Database tables used:** `notifications`, `email_events`, `activity_events`

---

### Phase 8 — Portal Module

Build eighth. Depends on auth, CRM, documents, and billing.

**Location:** `apps/api/src/modules/portal`

**What to implement:**
- Client user login (separate from staff auth)
- Portal session management
- View documents
- Upload documents
- View invoices
- Pay invoices (Stripe)
- View tasks

**Database tables used:** `client_users`, `portal_sessions`

---

### Phase 9 — Onboarding Module

Build last. Depends on auth and CRM.

**Location:** `apps/api/src/modules/onboarding`

**What to implement:**
- Setup wizard
- Firm setup
- First client creation
- First invoice creation

**Database tables used:** `firms`, `clients`, `invoices`

---

## 2. Module Folder Structure

Every module must follow this exact structure. No exceptions.

```
modules/
└── {module-name}/
    ├── controller.ts       # HTTP handlers only — no business logic
    ├── service.ts          # Business logic only — no DB access
    ├── repository.ts       # Database access only — no business logic
    ├── routes.ts           # Route definitions and middleware chain
    ├── validation.ts       # Zod schemas for request validation
    ├── types.ts            # Module-specific TypeScript types
    └── tests/
        ├── service.test.ts
        └── repository.test.ts
```

**Example — CRM module:**

```
modules/
└── crm/
    ├── controller.ts
    ├── service.ts
    ├── repository.ts
    ├── routes.ts
    ├── validation.ts
    ├── types.ts
    └── tests/
        ├── service.test.ts
        └── repository.test.ts
```

**Rule:** If a module grows large, split by sub-domain inside the module folder:

```
modules/
└── crm/
    ├── clients/
    │   ├── clients.controller.ts
    │   ├── clients.service.ts
    │   ├── clients.repository.ts
    │   └── clients.routes.ts
    ├── contacts/
    │   ├── contacts.controller.ts
    │   ├── contacts.service.ts
    │   ├── contacts.repository.ts
    │   └── contacts.routes.ts
    ├── validation.ts
    ├── types.ts
    └── tests/
```

---

### Shared Infrastructure Structure

```
apps/api/src/shared/
├── database/
│   └── base.repository.ts      # Base class all repositories extend
├── middleware/
│   ├── auth.middleware.ts       # JWT verification
│   ├── tenant-context.ts        # Sets app.current_firm_id for RLS
│   ├── error-handler.ts         # Global error handler
│   ├── rate-limiter.ts          # Rate limiting
│   └── validate.ts              # Zod validation middleware
├── utils/
│   ├── logger.ts                # Winston logger
│   ├── errors.ts                # Custom error classes
│   └── response.ts              # Standard response helpers
└── types/
    └── express.d.ts             # Express type augmentation (req.user)
```

---

### Full Repository Structure

```
practice-management-saas/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── crm/
│   │   │   │   ├── documents/
│   │   │   │   ├── tasks/
│   │   │   │   ├── billing/
│   │   │   │   ├── notifications/
│   │   │   │   ├── portal/
│   │   │   │   └── onboarding/
│   │   │   ├── shared/
│   │   │   │   ├── database/
│   │   │   │   ├── middleware/
│   │   │   │   ├── utils/
│   │   │   │   └── types/
│   │   │   ├── config/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   ├── worker/
│   │   ├── src/
│   │   │   ├── workers/
│   │   │   │   ├── email-worker.ts
│   │   │   │   ├── pdf-worker.ts
│   │   │   │   ├── webhook-worker.ts
│   │   │   │   └── reminders-worker.ts
│   │   │   ├── services/
│   │   │   ├── config/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   └── web/
│       ├── src/
│       ├── package.json
│       └── Dockerfile
├── packages/
│   ├── database/               # Prisma schema, migrations, client
│   ├── shared-types/           # Shared TypeScript types
│   ├── email-templates/        # Email templates
│   └── config/                 # Shared configuration
├── infrastructure/
│   ├── terraform/
│   └── docker/
├── scripts/
├── docs/
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 3. Architecture Rules

### Rule 1 — Strict Dependency Direction

The only allowed call direction is:

```
Controller
    ↓
Service
    ↓
Repository
    ↓
Database (Prisma)
```

**Violations that are forbidden:**

```
Controller → Repository    ❌
Controller → Prisma        ❌
Service → Prisma           ❌
Repository → Service       ❌
```

**Cross-module calls:**

```
Service → Service          ✅  (allowed — service layer only)
Service → Repository       ✅  (own module only)
Controller → Controller    ❌  (never)
Repository → Repository    ❌  (never)
```

---

### Rule 2 — Tenant Context is Mandatory

Every authenticated request must set `app.current_firm_id` before any database query.

The `tenant-context.ts` middleware does this. It must run after `auth.middleware.ts` and before any controller.

```
Request → auth.middleware → tenant-context → controller
```

Without this, RLS policies return no rows. This is the correct behavior — it is not a bug.

---

### Rule 3 — No Business Logic in Controllers

Controllers do exactly three things:

1. Parse and validate the request
2. Call the service
3. Return the response

```typescript
// ✅ Correct
async createClient(req: Request, res: Response) {
  const data = createClientSchema.parse(req.body);
  const client = await this.clientsService.create(req.user.firmId, data);
  return res.status(201).json({ data: client });
}

// ❌ Wrong — business logic in controller
async createClient(req: Request, res: Response) {
  const existing = await prisma.client.findFirst({ where: { email: req.body.email } });
  if (existing) return res.status(409).json({ error: 'exists' });
  const client = await prisma.client.create({ data: req.body });
  return res.status(201).json(client);
}
```

---

### Rule 4 — No Direct Prisma in Services

Services call repositories. Repositories call Prisma.

```typescript
// ✅ Correct
class ClientsService {
  constructor(private repo: ClientsRepository) {}

  async create(firmId: string, data: CreateClientDto) {
    return this.repo.create(firmId, data);
  }
}

// ❌ Wrong — Prisma in service
class ClientsService {
  async create(firmId: string, data: CreateClientDto) {
    return prisma.client.create({ data: { ...data, firmId } });
  }
}
```

---

### Rule 5 — All Repositories Extend BaseRepository

```typescript
// apps/api/src/shared/database/base.repository.ts
export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaClient) {}
}

// apps/api/src/modules/crm/clients/clients.repository.ts
export class ClientsRepository extends BaseRepository {
  async create(firmId: string, data: CreateClientDto) {
    return this.prisma.client.create({
      data: { ...data, firm_id: firmId }
    });
  }
}
```

---

### Rule 6 — Validation at the Route Layer

All request validation happens via Zod schemas before the controller runs.

```typescript
// routes.ts
router.post('/', validate(createClientSchema), clientsController.create);

// validation.ts
export const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  status: z.nativeEnum(ClientStatus).default('active')
});
```

---

## 4. Immediate Next Steps

Current status: Database complete. Next: shared backend infrastructure.

**Step 1 — Prisma Client export**

```
packages/database/src/client.ts
```

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

---

**Step 2 — Base repository**

```
apps/api/src/shared/database/base.repository.ts
```

---

**Step 3 — Tenant context middleware**

```
apps/api/src/shared/middleware/tenant-context.ts
```

This middleware must call:

```sql
SELECT set_config('app.current_firm_id', $firmId, true)
```

This activates all 27 RLS policies. Without it, all tenant queries return empty.

---

**Step 4 — Auth middleware, error handler, logger**

```
apps/api/src/shared/middleware/auth.middleware.ts
apps/api/src/shared/middleware/error-handler.ts
apps/api/src/shared/utils/logger.ts
```

---

**Step 5 — Start Auth module**

Only after all shared infrastructure is complete and tested.

---

## Status

| Layer | Status |
|-------|--------|
| Database (36 tables, 11 ENUMs) | ✅ Complete |
| Prisma schema (modular) | ✅ Complete |
| Migrations applied | ✅ Complete |
| Shared infrastructure | ⬜ Next |
| Auth module | ⬜ Pending |
| CRM module | ⬜ Pending |
| Documents module | ⬜ Pending |
| Tasks module | ⬜ Pending |
| Billing module | ⬜ Pending |
| Notifications module | ⬜ Pending |
| Portal module | ⬜ Pending |
| Onboarding module | ⬜ Pending |
