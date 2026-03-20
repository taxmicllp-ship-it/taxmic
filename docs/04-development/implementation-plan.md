# Engineering Implementation Plan

**Version:** 1.0  
**Target:** MVP (4-6 months, 3-5 developers)  
**Architecture Reference:** docs/dev.md

This document provides concrete implementation guidance: repository structure, module organization, database migrations, queue workers, service layers, and deployment scripts.

---

## Table of Contents

1. Repository Structure
2. Module Architecture
3. Database Migrations Strategy
4. Queue Workers Implementation
5. Service Layer Design
6. API Layer Structure
7. Deployment Scripts
8. Development Workflow
9. Testing Strategy
10. Environment Configuration

---

## 1. Repository Structure

### Monorepo Layout (Recommended)

```
practice-management-saas/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── apps/
│   ├── api/                    # Backend API server
│   └── web/                    # Frontend React app
├── packages/
│   ├── database/               # Database schemas, migrations
│   ├── shared/                 # Shared types, utilities
│   └── email-templates/        # Email templates
├── infrastructure/
│   ├── terraform/              # Infrastructure as Code
│   └── docker/                 # Docker configurations
├── scripts/
│   ├── setup-dev.sh
│   ├── seed-data.js
│   └── deploy.sh
├── docs/
│   ├── dev.md
│   ├── implementation-plan.md
│   └── api-reference.md
├── docker-compose.yml
├── package.json
├── turbo.json                  # Turborepo config
└── README.md
```


### Backend API Structure (`apps/api/`)

```
apps/api/
├── src/
│   ├── modules/                # Modular monolith structure
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.middleware.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── auth.routes.ts
│   │   ├── crm/
│   │   │   ├── clients/
│   │   │   │   ├── clients.controller.ts
│   │   │   │   ├── clients.service.ts
│   │   │   │   ├── clients.repository.ts
│   │   │   │   └── clients.routes.ts
│   │   │   ├── contacts/
│   │   │   │   ├── contacts.controller.ts
│   │   │   │   ├── contacts.service.ts
│   │   │   │   └── contacts.routes.ts
│   │   │   └── index.ts
│   │   ├── documents/
│   │   │   ├── documents.controller.ts
│   │   │   ├── documents.service.ts
│   │   │   ├── s3.service.ts
│   │   │   ├── upload.middleware.ts
│   │   │   └── documents.routes.ts
│   │   ├── tasks/
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.service.ts
│   │   │   ├── task-statuses.service.ts
│   │   │   └── tasks.routes.ts
│   │   ├── billing/
│   │   │   ├── invoices/
│   │   │   │   ├── invoices.controller.ts
│   │   │   │   ├── invoices.service.ts
│   │   │   │   ├── pdf-generator.service.ts
│   │   │   │   └── invoices.routes.ts
│   │   │   ├── payments/
│   │   │   │   ├── payments.controller.ts
│   │   │   │   ├── stripe.service.ts
│   │   │   │   ├── webhook.controller.ts
│   │   │   │   └── payments.routes.ts
│   │   │   └── index.ts
│   │   ├── notifications/
│   │   │   ├── email.service.ts
│   │   │   ├── activity-events.service.ts
│   │   │   ├── reminders.service.ts
│   │   │   └── notifications.routes.ts
│   │   └── onboarding/
│   │       ├── onboarding.controller.ts
│   │       ├── onboarding.service.ts
│   │       └── onboarding.routes.ts
│   ├── shared/
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── base.repository.ts
│   │   │   └── transaction.ts
│   │   ├── middleware/
│   │   │   ├── error-handler.ts
│   │   │   ├── rate-limiter.ts
│   │   │   ├── tenant-context.ts
│   │   │   └── validation.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── crypto.ts
│   │   │   └── date.ts
│   │   └── types/
│   │       ├── express.d.ts
│   │       └── common.types.ts
│   ├── workers/                # Background job workers
│   │   ├── email-worker.ts
│   │   ├── reminder-worker.ts
│   │   ├── invoice-worker.ts
│   │   └── index.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── aws.config.ts
│   │   └── app.config.ts
│   ├── app.ts                  # Express app setup
│   ├── server.ts               # HTTP server
│   └── worker.ts               # Worker process entry
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Frontend Structure (`apps/web/`)

```
apps/web/
├── src/
│   ├── features/               # Feature-based organization
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── pages/
│   │   ├── clients/
│   │   ├── documents/
│   │   ├── tasks/
│   │   ├── invoices/
│   │   ├── portal/             # Client portal
│   │   └── onboarding/
│   ├── shared/
│   │   ├── components/         # Shared UI components
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── api/                # API client
│   │   └── types/
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   └── PortalLayout.tsx
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   └── PortalRoutes.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
└── vite.config.ts
```

---

## 2. Module Architecture

### Module Pattern (Modular Monolith)

Each module follows this structure:

```typescript
// Example: apps/api/src/modules/crm/clients/

// clients.types.ts
export interface Client {
  id: string;
  firmId: string;
  name: string;
  type: 'individual' | 'company';
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientDto {
  name: string;
  type: 'individual' | 'company';
  status?: string;
}

// clients.repository.ts
export class ClientsRepository {
  constructor(private db: Database) {}

  async findByFirmId(firmId: string): Promise<Client[]> {
    return this.db.query(
      'SELECT * FROM clients WHERE firm_id = $1',
      [firmId]
    );
  }

  async create(firmId: string, data: CreateClientDto): Promise<Client> {
    return this.db.query(
      'INSERT INTO clients (firm_id, name, type, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [firmId, data.name, data.type, data.status || 'active']
    );
  }

  // ... more methods
}

// clients.service.ts
export class ClientsService {
  constructor(
    private repository: ClientsRepository,
    private activityService: ActivityEventsService
  ) {}

  async getClientsByFirm(firmId: string): Promise<Client[]> {
    return this.repository.findByFirmId(firmId);
  }

  async createClient(
    firmId: string,
    userId: string,
    data: CreateClientDto
  ): Promise<Client> {
    const client = await this.repository.create(firmId, data);
    
    // Log activity
    await this.activityService.log({
      firmId,
      clientId: client.id,
      eventType: 'client_created',
      actorUserId: userId,
      description: `Created client: ${client.name}`
    });

    return client;
  }

  // ... more business logic
}

// clients.controller.ts
export class ClientsController {
  constructor(private service: ClientsService) {}

  async list(req: Request, res: Response) {
    const { firmId } = req.user;
    const clients = await this.service.getClientsByFirm(firmId);
    res.json(clients);
  }

  async create(req: Request, res: Response) {
    const { firmId, userId } = req.user;
    const client = await this.service.createClient(
      firmId,
      userId,
      req.body
    );
    res.status(201).json(client);
  }

  // ... more handlers
}

// clients.routes.ts
export function clientsRoutes(router: Router) {
  const repository = new ClientsRepository(db);
  const activityService = new ActivityEventsService(db);
  const service = new ClientsService(repository, activityService);
  const controller = new ClientsController(service);

  router.get('/clients', authenticate, controller.list);
  router.post('/clients', authenticate, validate(createClientSchema), controller.create);
  router.get('/clients/:id', authenticate, controller.getById);
  router.patch('/clients/:id', authenticate, controller.update);
  router.delete('/clients/:id', authenticate, controller.delete);

  return router;
}
```

### Module Communication

Modules communicate through service layer calls:

```typescript
// Good: Direct service call
class InvoicesService {
  constructor(
    private invoicesRepo: InvoicesRepository,
    private clientsService: ClientsService,  // Inject other module's service
    private emailService: EmailService
  ) {}

  async createInvoice(firmId: string, data: CreateInvoiceDto) {
    // Validate client exists
    const client = await this.clientsService.getClientById(
      firmId,
      data.clientId
    );

    // Create invoice
    const invoice = await this.invoicesRepo.create(firmId, data);

    // Send email
    await this.emailService.sendInvoiceEmail(client.email, invoice);

    return invoice;
  }
}
```

**Rules:**
- Controllers only call their own service
- Services can call other services
- Repositories only access database
- No circular dependencies

---

## 3. Database Migrations Strategy

### Migration Tool: node-pg-migrate

```bash
npm install node-pg-migrate
```

### Migration Structure

```
packages/database/
├── migrations/
│   ├── 1710000001_create_firms.sql
│   ├── 1710000002_create_users.sql
│   ├── 1710000003_create_client_users.sql
│   ├── 1710000004_create_clients.sql
│   ├── 1710000005_create_contacts.sql
│   ├── 1710000006_create_client_contacts.sql
│   ├── 1710000007_create_folders.sql
│   ├── 1710000008_create_documents.sql
│   ├── 1710000009_create_messages.sql
│   ├── 1710000010_create_task_statuses.sql
│   ├── 1710000011_create_tasks.sql
│   ├── 1710000012_create_invoices.sql
│   ├── 1710000013_create_invoice_line_items.sql
│   ├── 1710000014_create_payments.sql
│   ├── 1710000015_create_activity_events.sql
│   ├── 1710000016_create_audit_logs.sql
│   ├── 1710000017_create_onboarding_progress.sql
│   ├── 1710000018_create_client_invitations.sql
│   ├── 1710000019_create_document_requests.sql
│   ├── 1710000020_add_indexes.sql
│   └── 1710000021_enable_rls.sql
├── seeds/
│   ├── 001_system_task_statuses.sql
│   └── 002_demo_data.sql
├── scripts/
│   ├── migrate.ts
│   ├── rollback.ts
│   └── seed.ts
└── package.json
```

### Example Migration

```sql
-- migrations/1710000004_create_clients.sql

-- UP
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'company')),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_firm_id ON clients(firm_id);
CREATE INDEX idx_clients_firm_name ON clients(firm_id, name);

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- DOWN
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TABLE IF EXISTS clients;
```

### Row Level Security Migration

```sql
-- migrations/1710000021_enable_rls.sql

-- UP
-- Enable RLS on all tenant tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_isolation_clients ON clients
  USING (firm_id = current_setting('app.firm_id', true)::uuid);

CREATE POLICY tenant_isolation_contacts ON contacts
  USING (firm_id = current_setting('app.firm_id', true)::uuid);

CREATE POLICY tenant_isolation_documents ON documents
  USING (firm_id = current_setting('app.firm_id', true)::uuid);

CREATE POLICY tenant_isolation_tasks ON tasks
  USING (
    client_id IN (
      SELECT id FROM clients WHERE firm_id = current_setting('app.firm_id', true)::uuid
    )
  );

CREATE POLICY tenant_isolation_invoices ON invoices
  USING (firm_id = current_setting('app.firm_id', true)::uuid);

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_clients ON clients;
DROP POLICY IF EXISTS tenant_isolation_contacts ON contacts;
DROP POLICY IF EXISTS tenant_isolation_documents ON documents;
DROP POLICY IF EXISTS tenant_isolation_tasks ON tasks;
DROP POLICY IF EXISTS tenant_isolation_invoices ON invoices;

ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
```

### Migration Scripts

```typescript
// packages/database/scripts/migrate.ts
import { migrate } from 'node-pg-migrate';
import { pool } from './connection';

async function runMigrations() {
  try {
    await migrate({
      databaseUrl: process.env.DATABASE_URL,
      direction: 'up',
      migrationsTable: 'pgmigrations',
      dir: './migrations',
      count: Infinity
    });
    console.log('✓ Migrations completed');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
```

### Seed Data

```sql
-- seeds/001_system_task_statuses.sql
INSERT INTO task_statuses (id, firm_id, name, color, is_system, sort_order) VALUES
  (gen_random_uuid(), NULL, 'NEW', '#3B82F6', true, 1),
  (gen_random_uuid(), NULL, 'IN_PROGRESS', '#F59E0B', true, 2),
  (gen_random_uuid(), NULL, 'WAITING_CLIENT', '#8B5CF6', true, 3),
  (gen_random_uuid(), NULL, 'REVIEW', '#EC4899', true, 4),
  (gen_random_uuid(), NULL, 'COMPLETED', '#10B981', true, 5);
```

---

## 4. Queue Workers Implementation

### Queue Setup (BullMQ + Redis)

```typescript
// apps/api/src/config/queue.config.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

// Define queue names
export enum QueueName {
  EMAIL = 'email',
  REMINDERS = 'reminders',
  INVOICES = 'invoices',
  DOCUMENTS = 'documents'
}

// Create queues
export const emailQueue = new Queue(QueueName.EMAIL, { connection });
export const remindersQueue = new Queue(QueueName.REMINDERS, { connection });
export const invoicesQueue = new Queue(QueueName.INVOICES, { connection });
export const documentsQueue = new Queue(QueueName.DOCUMENTS, { connection });

// Queue schedulers (for delayed/repeated jobs)
export const emailScheduler = new QueueScheduler(QueueName.EMAIL, { connection });
export const remindersScheduler = new QueueScheduler(QueueName.REMINDERS, { connection });
```

### Email Worker

```typescript
// apps/api/src/workers/email-worker.ts
import { Worker, Job } from 'bullmq';
import { EmailService } from '../modules/notifications/email.service';
import { QueueName } from '../config/queue.config';

interface EmailJob {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

const emailService = new EmailService();

export const emailWorker = new Worker(
  QueueName.EMAIL,
  async (job: Job<EmailJob>) => {
    const { to, subject, template, data } = job.data;

    try {
      await emailService.send({
        to,
        subject,
        template,
        data
      });

      return { success: true, sentAt: new Date() };
    } catch (error) {
      console.error('Email send failed:', error);
      throw error; // Will trigger retry
    }
  },
  {
    connection: new Redis(process.env.REDIS_URL),
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000 // 100 emails per minute
    }
  }
);

emailWorker.on('completed', (job) => {
  console.log(`✓ Email sent: ${job.id}`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`✗ Email failed: ${job?.id}`, err);
});
```

### Reminder Worker

```typescript
// apps/api/src/workers/reminder-worker.ts
import { Worker, Job } from 'bullmq';
import { RemindersService } from '../modules/notifications/reminders.service';
import { QueueName } from '../config/queue.config';

const remindersService = new RemindersService();

export const reminderWorker = new Worker(
  QueueName.REMINDERS,
  async (job: Job) => {
    console.log('Processing reminders...');

    // Check for overdue tasks
    const overdueTasks = await remindersService.findOverdueTasks();
    for (const task of overdueTasks) {
      await remindersService.sendTaskReminder(task);
    }

    // Check for overdue invoices
    const overdueInvoices = await remindersService.findOverdueInvoices();
    for (const invoice of overdueInvoices) {
      await remindersService.sendInvoiceReminder(invoice);
    }

    return {
      tasksProcessed: overdueTasks.length,
      invoicesProcessed: overdueInvoices.length
    };
  },
  {
    connection: new Redis(process.env.REDIS_URL)
  }
);

// Schedule reminder checks every hour
import { remindersQueue } from '../config/queue.config';

remindersQueue.add(
  'check-reminders',
  {},
  {
    repeat: {
      pattern: '0 * * * *' // Every hour
    }
  }
);
```

### Invoice PDF Worker

```typescript
// apps/api/src/workers/invoice-worker.ts
import { Worker, Job } from 'bullmq';
import { InvoicesService } from '../modules/billing/invoices/invoices.service';
import { QueueName } from '../config/queue.config';

interface InvoicePdfJob {
  invoiceId: string;
  firmId: string;
}

const invoicesService = new InvoicesService();

export const invoiceWorker = new Worker(
  QueueName.INVOICES,
  async (job: Job<InvoicePdfJob>) => {
    const { invoiceId, firmId } = job.data;

    // Generate PDF
    const pdfBuffer = await invoicesService.generatePdf(firmId, invoiceId);

    // Upload to S3
    const pdfUrl = await invoicesService.uploadPdf(invoiceId, pdfBuffer);

    // Update invoice record
    await invoicesService.updatePdfUrl(invoiceId, pdfUrl);

    return { pdfUrl };
  },
  {
    connection: new Redis(process.env.REDIS_URL),
    concurrency: 3
  }
);
```

### Worker Process Entry

```typescript
// apps/api/src/worker.ts
import { emailWorker } from './workers/email-worker';
import { reminderWorker } from './workers/reminder-worker';
import { invoiceWorker } from './workers/invoice-worker';
import { logger } from './shared/utils/logger';

async function startWorkers() {
  logger.info('Starting background workers...');

  // Workers are already initialized and listening
  logger.info('✓ Email worker started');
  logger.info('✓ Reminder worker started');
  logger.info('✓ Invoice worker started');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing workers...');
    await Promise.all([
      emailWorker.close(),
      reminderWorker.close(),
      invoiceWorker.close()
    ]);
    process.exit(0);
  });
}

startWorkers().catch((error) => {
  logger.error('Failed to start workers:', error);
  process.exit(1);
});
```

### Enqueuing Jobs from Services

```typescript
// Example: Enqueue email from service
import { emailQueue } from '../config/queue.config';

class InvoicesService {
  async sendInvoiceEmail(invoice: Invoice, client: Client) {
    await emailQueue.add('send-invoice', {
      to: client.email,
      subject: `Invoice ${invoice.number} from ${invoice.firmName}`,
      template: 'invoice',
      data: {
        invoiceNumber: invoice.number,
        amount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        paymentLink: invoice.paymentLink
      }
    });
  }
}
```

---

## 5. Service Layer Design

### Base Service Pattern

```typescript
// apps/api/src/shared/base.service.ts
export abstract class BaseService<T> {
  constructor(protected repository: BaseRepository<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async findAll(filters?: Record<string, any>): Promise<T[]> {
    return this.repository.findAll(filters);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
```

### Service with Business Logic

```typescript
// apps/api/src/modules/tasks/tasks.service.ts
import { BaseService } from '../../shared/base.service';
import { Task, CreateTaskDto, UpdateTaskDto } from './tasks.types';
import { TasksRepository } from './tasks.repository';
import { ActivityEventsService } from '../notifications/activity-events.service';
import { EmailService } from '../notifications/email.service';

export class TasksService extends BaseService<Task> {
  constructor(
    repository: TasksRepository,
    private activityService: ActivityEventsService,
    private emailService: EmailService
  ) {
    super(repository);
  }

  async createTask(
    firmId: string,
    userId: string,
    data: CreateTaskDto
  ): Promise<Task> {
    // Create task
    const task = await this.repository.create({
      ...data,
      firmId,
      createdBy: userId
    });

    // Log activity
    await this.activityService.log({
      firmId,
      clientId: task.clientId,
      eventType: 'task_created',
      actorUserId: userId,
      description: `Created task: ${task.title}`,
      metadata: { taskId: task.id }
    });

    // Send notification to assignee
    if (task.assignedTo) {
      await this.emailService.sendTaskAssignedEmail(task);
    }

    return task;
  }

  async updateTaskStatus(
    taskId: string,
    statusId: string,
    userId: string
  ): Promise<Task> {
    const task = await this.repository.findById(taskId);
    if (!task) throw new Error('Task not found');

    const updatedTask = await this.repository.update(taskId, { statusId });

    // Log activity
    await this.activityService.log({
      firmId: task.firmId,
      clientId: task.clientId,
      eventType: 'task_status_changed',
      actorUserId: userId,
      description: `Changed task status: ${task.title}`,
      metadata: { taskId, oldStatus: task.statusId, newStatus: statusId }
    });

    // Check if completed
    if (statusId === 'COMPLETED') {
      await this.handleTaskCompletion(updatedTask, userId);
    }

    return updatedTask;
  }

  private async handleTaskCompletion(task: Task, userId: string) {
    // Send completion notification
    await this.emailService.sendTaskCompletedEmail(task);

    // Additional business logic...
  }
}
```

### Service Dependency Injection

```typescript
// apps/api/src/modules/tasks/index.ts
import { db } from '../../shared/database/connection';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ActivityEventsService } from '../notifications/activity-events.service';
import { EmailService } from '../notifications/email.service';

// Create instances
const tasksRepository = new TasksRepository(db);
const activityService = new ActivityEventsService(db);
const emailService = new EmailService();

const tasksService = new TasksService(
  tasksRepository,
  activityService,
  emailService
);

const tasksController = new TasksController(tasksService);

export { tasksService, tasksController };
```

