# Final Architecture Fixes

**Version:** 1.0  
**Purpose:** Address remaining structural gaps before development  
**Status:** MUST IMPLEMENT

---

## 🚨 Critical Gaps Still Missing

These were not fully addressed in previous documents and MUST be fixed before coding starts.

---

## 1. Queue Observability Dashboard 🚨 CRITICAL

**Problem:** Queues fail silently. No visibility into job status.

**Solution: Bull Board**

```typescript
// apps/api/src/config/bull-board.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue, remindersQueue, invoicesQueue } from './queue.config';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(remindersQueue),
    new BullMQAdapter(invoicesQueue)
  ],
  serverAdapter
});

export { serverAdapter };

// In app.ts
import { serverAdapter } from './config/bull-board';

// Protected by admin auth
app.use('/admin/queues', adminAuth, serverAdapter.getRouter());
```

**What You Get:**
- Real-time job status
- Failed job inspection
- Retry failed jobs
- Job metrics
- Queue health monitoring

**Access:** `https://app.domain.com/admin/queues`

---

## 2. Idempotency Keys 🚨 CRITICAL

**Problem:** Stripe webhooks can be sent multiple times. Without idempotency, duplicate payments occur.

**Schema:**

```sql
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  request_path VARCHAR(255) NOT NULL,
  request_params JSONB,
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_idempotency_key ON idempotency_keys(key);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
```

**Middleware:**

```typescript
// apps/api/src/shared/middleware/idempotency.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/connection';

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (!idempotencyKey) {
    return next();
  }
  
  // Check if we've seen this key before
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey }
  });
  
  if (existing) {
    // Return cached response
    return res
      .status(existing.responseStatus)
      .json(existing.responseBody);
  }
  
  // Store original send function
  const originalSend = res.json.bind(res);
  
  // Override send to cache response
  res.json = function(body: any) {
    // Cache the response
    prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        requestPath: req.path,
        requestParams: req.body,
        responseStatus: res.statusCode,
        responseBody: body,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    }).catch(err => console.error('Failed to cache idempotency key:', err));
    
    return originalSend(body);
  };
  
  next();
}

// Usage in Stripe webhook
app.post('/payments/stripe/webhook', 
  idempotencyMiddleware,
  stripeWebhookHandler
);
```

**Cleanup Worker:**

```typescript
// Delete expired keys daily
async function cleanupExpiredIdempotencyKeys() {
  await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
}

// Run daily
remindersQueue.add('cleanup-idempotency', {}, {
  repeat: { pattern: '0 2 * * *' } // 2 AM daily
});
```

---

## 3. Tenant-Level Rate Limiting 🚨 CRITICAL

**Problem:** Current rate limiting is global. SaaS needs per-plan limits.

**Schema:**

```sql
ALTER TABLE plans ADD COLUMN rate_limit_per_minute INTEGER DEFAULT 100;
ALTER TABLE plans ADD COLUMN rate_limit_per_hour INTEGER DEFAULT 5000;

-- Update plans
UPDATE plans SET rate_limit_per_minute = 100, rate_limit_per_hour = 5000 WHERE name = 'starter';
UPDATE plans SET rate_limit_per_minute = 500, rate_limit_per_hour = 25000 WHERE name = 'professional';
UPDATE plans SET rate_limit_per_minute = 2000, rate_limit_per_hour = 100000 WHERE name = 'enterprise';
```

**Middleware:**

```typescript
// apps/api/src/shared/middleware/tenant-rate-limiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis.config';
import { prisma } from '../database/connection';

export async function tenantRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { firmId } = req.user;
  
  // Get firm's subscription and plan
  const subscription = await prisma.subscription.findUnique({
    where: { firmId },
    include: { plan: true }
  });
  
  if (!subscription) {
    return res.status(402).json({ error: 'No active subscription' });
  }
  
  const limit = subscription.plan.rateLimitPerMinute;
  
  // Create rate limiter for this firm
  const limiter = rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: `rate-limit:${firmId}:`
    }),
    windowMs: 60 * 1000, // 1 minute
    max: limit,
    message: {
      error: 'Rate limit exceeded',
      limit,
      retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  
  limiter(req, res, next);
}

// Usage
app.use('/api/v1', authenticate, tenantContext, tenantRateLimiter);
```

---

## 4. Soft Deletes 🚨 CRITICAL

**Problem:** Hard deletes make data recovery impossible.

**Schema Changes:**

```sql
-- Add deleted_at to all major tables
ALTER TABLE clients ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE contacts ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN deleted_at TIMESTAMP;

-- Indexes for soft delete queries
CREATE INDEX idx_clients_deleted ON clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_deleted ON contacts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_deleted ON tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_deleted ON invoices(deleted_at) WHERE deleted_at IS NULL;
```

**Prisma Schema:**

```prisma
model Client {
  id        String    @id @default(uuid())
  firmId    String    @map("firm_id")
  name      String
  type      ClientType
  status    String
  deletedAt DateTime? @map("deleted_at")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  
  @@index([deletedAt])
  @@map("clients")
}
```

**Repository Pattern:**

```typescript
// Base repository with soft delete support
class BaseRepository<T> {
  constructor(protected model: any) {}
  
  async findAll(includeDeleted = false) {
    return this.model.findMany({
      where: includeDeleted ? {} : { deletedAt: null }
    });
  }
  
  async findById(id: string, includeDeleted = false) {
    return this.model.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null })
      }
    });
  }
  
  async softDelete(id: string) {
    return this.model.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
  
  async restore(id: string) {
    return this.model.update({
      where: { id },
      data: { deletedAt: null }
    });
  }
  
  async hardDelete(id: string) {
    return this.model.delete({ where: { id } });
  }
}

// Usage
class ClientsRepository extends BaseRepository<Client> {
  constructor() {
    super(prisma.client);
  }
}
```

---

## 5. Storage Abstraction Layer ⚠️ HIGH PRIORITY

**Problem:** Direct S3 coupling makes migration difficult.

**Interface:**

```typescript
// apps/api/src/shared/storage/storage.interface.ts
export interface StorageProvider {
  upload(key: string, buffer: Buffer, metadata?: Record<string, string>): Promise<string>;
  download(key: string): Promise<Buffer>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<Record<string, any>>;
}
```

**S3 Implementation:**

```typescript
// apps/api/src/shared/storage/s3-storage.provider.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  
  constructor() {
    this.client = new S3Client({ region: process.env.AWS_REGION });
    this.bucket = process.env.S3_BUCKET;
  }
  
  async upload(key: string, buffer: Buffer, metadata?: Record<string, string>): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      Metadata: metadata,
      ServerSideEncryption: 'AES256'
    }));
    
    return key;
  }
  
  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    }));
    
    return Buffer.from(await response.Body.transformToByteArray());
  }
  
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    
    return getSignedUrl(this.client, command, { expiresIn });
  }
  
  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    }));
  }
  
  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      }));
      return true;
    } catch {
      return false;
    }
  }
  
  async getMetadata(key: string): Promise<Record<string, any>> {
    const response = await this.client.send(new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key
    }));
    
    return response.Metadata || {};
  }
}
```

**Local Storage (Development):**

```typescript
// apps/api/src/shared/storage/local-storage.provider.ts
import fs from 'fs/promises';
import path from 'path';

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  
  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH || './storage';
  }
  
  async upload(key: string, buffer: Buffer, metadata?: Record<string, string>): Promise<string> {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    
    // Store metadata separately
    if (metadata) {
      await fs.writeFile(`${filePath}.meta.json`, JSON.stringify(metadata));
    }
    
    return key;
  }
  
  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);
    return fs.readFile(filePath);
  }
  
  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // For local dev, return direct path
    return `/storage/${key}`;
  }
  
  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    await fs.unlink(filePath);
    await fs.unlink(`${filePath}.meta.json`).catch(() => {});
  }
  
  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.basePath, key));
      return true;
    } catch {
      return false;
    }
  }
  
  async getMetadata(key: string): Promise<Record<string, any>> {
    try {
      const content = await fs.readFile(`${path.join(this.basePath, key)}.meta.json`, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
}
```

**Factory:**

```typescript
// apps/api/src/shared/storage/storage.factory.ts
export class StorageFactory {
  static create(): StorageProvider {
    const provider = process.env.STORAGE_PROVIDER || 's3';
    
    switch (provider) {
      case 's3':
        return new S3StorageProvider();
      case 'local':
        return new LocalStorageProvider();
      case 'cloudflare-r2':
        return new CloudflareR2StorageProvider();
      default:
        throw new Error(`Unknown storage provider: ${provider}`);
    }
  }
}

// Usage in documents service
const storage = StorageFactory.create();
await storage.upload(key, buffer, { firmId, clientId });
```

---

## 6. Domain Events (Decoupling) ⚠️ RECOMMENDED

**Problem:** Direct service calls create tight coupling.

**Event System:**

```typescript
// apps/api/src/shared/events/event-emitter.ts
import { EventEmitter } from 'events';

export enum DomainEvent {
  CLIENT_CREATED = 'client.created',
  DOCUMENT_UPLOADED = 'document.uploaded',
  TASK_COMPLETED = 'task.completed',
  INVOICE_CREATED = 'invoice.created',
  INVOICE_PAID = 'invoice.paid',
  USER_REGISTERED = 'user.registered'
}

class DomainEventEmitter extends EventEmitter {
  async emit(event: DomainEvent, data: any): Promise<boolean> {
    console.log(`[Event] ${event}`, data);
    return super.emit(event, data);
  }
}

export const domainEvents = new DomainEventEmitter();
```

**Event Handlers:**

```typescript
// apps/api/src/modules/notifications/event-handlers.ts
import { domainEvents, DomainEvent } from '../../shared/events/event-emitter';
import { emailQueue } from '../../config/queue.config';

// Register handlers
domainEvents.on(DomainEvent.INVOICE_CREATED, async (data) => {
  await emailQueue.add('send-invoice', {
    invoiceId: data.invoiceId,
    clientEmail: data.clientEmail
  });
});

domainEvents.on(DomainEvent.TASK_COMPLETED, async (data) => {
  await emailQueue.add('task-completed-notification', {
    taskId: data.taskId,
    assigneeEmail: data.assigneeEmail
  });
});

domainEvents.on(DomainEvent.USER_REGISTERED, async (data) => {
  await emailQueue.add('welcome-email', {
    userId: data.userId,
    email: data.email
  });
});
```

**Usage in Services:**

```typescript
// Before (tight coupling)
class InvoicesService {
  async createInvoice(data: CreateInvoiceDto) {
    const invoice = await this.repository.create(data);
    
    // Direct call to email service
    await this.emailService.sendInvoiceEmail(invoice);
    
    return invoice;
  }
}

// After (decoupled)
class InvoicesService {
  async createInvoice(data: CreateInvoiceDto) {
    const invoice = await this.repository.create(data);
    
    // Emit event
    await domainEvents.emit(DomainEvent.INVOICE_CREATED, {
      invoiceId: invoice.id,
      clientEmail: invoice.client.email,
      firmId: invoice.firmId
    });
    
    return invoice;
  }
}
```

---

## 7. Cache Layer ⚠️ RECOMMENDED

**Redis Caching:**

```typescript
// apps/api/src/shared/cache/cache.service.ts
import { redis } from '../config/redis.config';

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async delete(key: string): Promise<void> {
    await redis.del(key);
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const cache = new CacheService();
```

**Cache Decorator:**

```typescript
// apps/api/src/shared/decorators/cacheable.ts
export function Cacheable(ttl: number = 3600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      // Try cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Call original method
      const result = await originalMethod.apply(this, args);
      
      // Cache result
      await cache.set(cacheKey, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}

// Usage
class ClientsService {
  @Cacheable(300) // 5 minutes
  async getClientsByFirm(firmId: string): Promise<Client[]> {
    return this.repository.findByFirmId(firmId);
  }
}
```

**Cache Invalidation:**

```typescript
// Invalidate on updates
class ClientsService {
  async updateClient(id: string, data: UpdateClientDto): Promise<Client> {
    const client = await this.repository.update(id, data);
    
    // Invalidate cache
    await cache.invalidatePattern(`ClientsService:getClientsByFirm:*`);
    
    return client;
  }
}
```

---

## 8. Audit Log Middleware ⚠️ RECOMMENDED

**Automatic Audit Logging:**

```typescript
// apps/api/src/shared/middleware/audit-logger.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/connection';

const AUDITABLE_ACTIONS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export async function auditLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!AUDITABLE_ACTIONS.includes(req.method)) {
    return next();
  }
  
  const originalSend = res.json.bind(res);
  
  res.json = function(body: any) {
    // Log after response
    if (res.statusCode >= 200 && res.statusCode < 300) {
      prisma.securityAuditLog.create({
        data: {
          firmId: req.user?.firmId,
          userId: req.user?.userId,
          eventType: `${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          action: req.method,
          resourceType: extractResourceType(req.path),
          resourceId: extractResourceId(req.path, body),
          status: 'success',
          details: {
            path: req.path,
            body: sanitize(req.body),
            response: sanitize(body)
          }
        }
      }).catch(err => console.error('Audit log failed:', err));
    }
    
    return originalSend(body);
  };
  
  next();
}

function extractResourceType(path: string): string {
  const match = path.match(/\/api\/v1\/(\w+)/);
  return match ? match[1] : 'unknown';
}

function extractResourceId(path: string, body: any): string | null {
  const match = path.match(/\/([a-f0-9-]{36})/);
  return match ? match[1] : body?.id || null;
}

function sanitize(obj: any): any {
  if (!obj) return obj;
  const sanitized = { ...obj };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  return sanitized;
}

// Usage
app.use('/api/v1', authenticate, tenantContext, auditLogger);
```

---

## Summary of Fixes

| Fix | Priority | Impact | Effort |
|-----|----------|--------|--------|
| Queue Dashboard | 🚨 Critical | High | 1 day |
| Idempotency Keys | 🚨 Critical | High | 2 days |
| Tenant Rate Limiting | 🚨 Critical | High | 1 day |
| Soft Deletes | 🚨 Critical | Medium | 2 days |
| Storage Abstraction | ⚠️ High | Medium | 3 days |
| Domain Events | ⚠️ Recommended | Medium | 2 days |
| Cache Layer | ⚠️ Recommended | Medium | 2 days |
| Audit Middleware | ⚠️ Recommended | Low | 1 day |

**Total Additional Time:** 2 weeks

**Updated Timeline:** 21 weeks (5 months)

---

## Updated Implementation Order

**Week 1:** Setup + Prisma + These Fixes  
**Week 2-3:** Auth + Security  
**Week 4-5:** CRM  
**Week 6-7:** Documents  
**Week 8:** Tasks  
**Week 9-10:** Client Billing  
**Week 11-12:** SaaS Billing  
**Week 13-14:** Portal  
**Week 15:** Notifications  
**Week 16:** Onboarding  
**Week 17:** Observability  
**Week 18-21:** Testing & Polish

---

**These fixes prevent production disasters. Implement them BEFORE coding features.**
