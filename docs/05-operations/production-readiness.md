# Production Readiness Addendum

**Version:** 1.0  
**Purpose:** Address critical gaps identified in CTO review  
**Status:** Required before production launch

This document addresses the missing pieces that would cause production issues.

---

## Critical Gaps to Address

### 1. ORM Instead of Raw SQL ⚠️ HIGH PRIORITY

**Current Approach (Risky):**
```typescript
this.db.query('SELECT * FROM clients WHERE firm_id = $1', [firmId])
```

**Problems:**
- No type safety
- Manual migrations
- Complex joins become messy
- No validation
- Prone to SQL injection if not careful

**Recommended: Prisma**

```typescript
// schema.prisma
model Client {
  id        String   @id @default(uuid())
  firmId    String   @map("firm_id")
  name      String
  type      ClientType
  status    String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  firm      Firm     @relation(fields: [firmId], references: [id])
  contacts  ClientContact[]
  documents Document[]
  tasks     Task[]
  invoices  Invoice[]
  
  @@index([firmId])
  @@map("clients")
}

// Usage in repository
async findByFirmId(firmId: string): Promise<Client[]> {
  return this.prisma.client.findMany({
    where: { firmId },
    include: {
      contacts: true
    }
  });
}
```

**Benefits:**
- Type-safe queries
- Auto-generated migrations
- Relation handling
- Query builder
- Faster development

**Migration Path:**
1. Add Prisma to project
2. Generate schema from existing database
3. Replace repositories one module at a time
4. Keep raw SQL for complex queries only

**Timeline:** 1-2 weeks to migrate

---

### 2. Feature Flags System 🚨 CRITICAL

**Why Needed:**
- Enable/disable features per firm
- Gradual rollouts
- A/B testing
- Emergency kill switches

**Database Schema:**

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  enabled_by_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE firm_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMP,
  enabled_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(firm_id, feature_flag_id)
);

CREATE INDEX idx_firm_feature_flags_firm ON firm_feature_flags(firm_id);
```

**Implementation:**

```typescript
// Feature flag service
class FeatureFlagService {
  async isEnabled(firmId: string, flagName: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { name: flagName },
      include: {
        firmFlags: {
          where: { firmId }
        }
      }
    });

    if (!flag) return false;
    
    // Check firm-specific override
    if (flag.firmFlags.length > 0) {
      return flag.firmFlags[0].enabled;
    }
    
    // Fall back to default
    return flag.enabledByDefault;
  }
}

// Usage in controllers
async createInvoice(req: Request, res: Response) {
  const { firmId } = req.user;
  
  // Check if e-signature is enabled
  const canUseESignature = await featureFlagService.isEnabled(
    firmId,
    'enable_e_signature'
  );
  
  if (req.body.requireSignature && !canUseESignature) {
    return res.status(403).json({
      error: 'E-signature feature not enabled for your account'
    });
  }
  
  // ... continue
}
```

**Default Flags:**

```sql
INSERT INTO feature_flags (name, description, enabled_by_default) VALUES
  ('enable_e_signature', 'Electronic signature support', false),
  ('enable_time_tracking', 'Time tracking for hourly billing', false),
  ('enable_portal_chat', 'Real-time chat in client portal', false),
  ('enable_workflow_pipelines', 'Custom workflow stages', false),
  ('enable_bulk_operations', 'Bulk email and updates', false),
  ('enable_advanced_reporting', 'Custom reports and analytics', false);
```

---

### 3. Security Audit Logs 🚨 CRITICAL

**Current:** Only activity logs (user-facing)  
**Missing:** Security audit logs (compliance)

**Schema:**

```sql
CREATE TABLE security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id),
  user_id UUID REFERENCES users(id),
  client_user_id UUID REFERENCES client_users(id),
  event_type VARCHAR(100) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  resource_type VARCHAR(100),
  resource_id UUID,
  action VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- success, failure, blocked
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_audit_firm_time ON security_audit_logs(firm_id, created_at DESC);
CREATE INDEX idx_security_audit_user ON security_audit_logs(user_id, created_at DESC);
CREATE INDEX idx_security_audit_event ON security_audit_logs(event_type, created_at DESC);
```

**Events to Log:**

```typescript
enum SecurityEvent {
  // Authentication
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  
  // Authorization
  ACCESS_DENIED = 'access_denied',
  PERMISSION_ESCALATION_ATTEMPT = 'permission_escalation_attempt',
  
  // Data Access
  DOCUMENT_DOWNLOADED = 'document_downloaded',
  DOCUMENT_DELETED = 'document_deleted',
  CLIENT_DATA_EXPORTED = 'client_data_exported',
  BULK_DATA_EXPORT = 'bulk_data_export',
  
  // Account Changes
  USER_CREATED = 'user_created',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',
  CLIENT_USER_INVITED = 'client_user_invited',
  
  // Suspicious Activity
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  MULTIPLE_FAILED_LOGINS = 'multiple_failed_logins',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern'
}

// Middleware to log all security events
class SecurityAuditMiddleware {
  async log(event: SecurityEvent, req: Request, details?: any) {
    await prisma.securityAuditLog.create({
      data: {
        firmId: req.user?.firmId,
        userId: req.user?.userId,
        eventType: event,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        action: this.extractAction(event),
        status: 'success',
        details
      }
    });
  }
}
```

**Usage:**

```typescript
// In auth controller
async login(req: Request, res: Response) {
  const { email, password } = req.body;
  
  try {
    const user = await authService.login(email, password);
    
    // Log successful login
    await securityAudit.log(SecurityEvent.LOGIN_SUCCESS, req, {
      userId: user.id,
      email: user.email
    });
    
    res.json({ token: user.token });
  } catch (error) {
    // Log failed login
    await securityAudit.log(SecurityEvent.LOGIN_FAILURE, req, {
      email,
      reason: error.message
    });
    
    res.status(401).json({ error: 'Invalid credentials' });
  }
}
```

---

### 4. Storage Strategy 🚨 CRITICAL

**Current:** Basic S3 upload  
**Missing:** Limits, scanning, retention

**Configuration:**

```typescript
// Storage limits per plan
const STORAGE_LIMITS = {
  starter: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalStorage: 5 * 1024 * 1024 * 1024, // 5GB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  professional: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxTotalStorage: 50 * 1024 * 1024 * 1024, // 50GB
    allowedMimeTypes: ['*'] // All types
  },
  enterprise: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxTotalStorage: 500 * 1024 * 1024 * 1024, // 500GB
    allowedMimeTypes: ['*']
  }
};
```

**Virus Scanning:**

```typescript
// Use ClamAV or AWS S3 Malware Protection
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ScanResult, scanFile } from './virus-scanner';

class DocumentsService {
  async uploadDocument(
    firmId: string,
    file: Express.Multer.File
  ): Promise<Document> {
    // 1. Check file size
    const limits = STORAGE_LIMITS[firm.plan];
    if (file.size > limits.maxFileSize) {
      throw new Error(`File too large. Max: ${limits.maxFileSize} bytes`);
    }
    
    // 2. Check total storage
    const currentUsage = await this.getStorageUsage(firmId);
    if (currentUsage + file.size > limits.maxTotalStorage) {
      throw new Error('Storage limit exceeded');
    }
    
    // 3. Scan for viruses
    const scanResult = await scanFile(file.buffer);
    if (scanResult.infected) {
      await securityAudit.log(SecurityEvent.MALWARE_DETECTED, req, {
        filename: file.originalname,
        virus: scanResult.virusName
      });
      throw new Error('File contains malware');
    }
    
    // 4. Upload to S3
    const key = `${firmId}/${clientId}/${uuid()}-${file.originalname}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256',
      Metadata: {
        firmId,
        clientId,
        uploadedBy: userId
      }
    }));
    
    // 5. Create document record
    return prisma.document.create({
      data: {
        firmId,
        clientId,
        folderId,
        fileKey: key,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: userId,
        scannedAt: new Date(),
        scanStatus: 'clean'
      }
    });
  }
}
```

**Retention Policy:**

```sql
CREATE TABLE document_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  document_type VARCHAR(100),
  retention_days INTEGER NOT NULL,
  auto_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Default policies
INSERT INTO document_retention_policies (firm_id, document_type, retention_days, auto_delete) VALUES
  (NULL, 'tax_documents', 2555, false), -- 7 years (IRS requirement)
  (NULL, 'invoices', 2555, false),
  (NULL, 'receipts', 2555, false),
  (NULL, 'temporary', 30, true);
```

**Cleanup Worker:**

```typescript
// Worker to delete expired documents
async function cleanupExpiredDocuments() {
  const expiredDocs = await prisma.document.findMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      folder: {
        name: 'Temporary'
      }
    }
  });
  
  for (const doc of expiredDocs) {
    // Delete from S3
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: doc.fileKey
    }));
    
    // Delete record
    await prisma.document.delete({ where: { id: doc.id } });
  }
}
```

---

### 5. Email Deliverability Tracking 🚨 CRITICAL

**Schema:**

```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id),
  message_id VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  subject TEXT,
  template_name VARCHAR(100),
  event_type VARCHAR(50) NOT NULL, -- sent, delivered, opened, clicked, bounced, complained
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_events_message ON email_events(message_id);
CREATE INDEX idx_email_events_firm_time ON email_events(firm_id, created_at DESC);
CREATE INDEX idx_email_events_type ON email_events(event_type, created_at DESC);
```

**Email Service with Tracking:**

```typescript
class EmailService {
  async send(params: EmailParams): Promise<string> {
    const messageId = uuid();
    
    // Send via SES
    const result = await ses.send(new SendEmailCommand({
      Source: params.from,
      Destination: { ToAddresses: [params.to] },
      Message: {
        Subject: { Data: params.subject },
        Body: { Html: { Data: params.html } }
      },
      Tags: [
        { Name: 'firm_id', Value: params.firmId },
        { Name: 'message_id', Value: messageId }
      ]
    }));
    
    // Log sent event
    await prisma.emailEvent.create({
      data: {
        firmId: params.firmId,
        messageId,
        toEmail: params.to,
        fromEmail: params.from,
        subject: params.subject,
        templateName: params.template,
        eventType: 'sent',
        eventData: { sesMessageId: result.MessageId }
      }
    });
    
    return messageId;
  }
  
  // Webhook handler for SES events
  async handleSESWebhook(event: any) {
    const { eventType, mail, bounce, complaint } = event;
    
    await prisma.emailEvent.create({
      data: {
        messageId: mail.messageId,
        toEmail: mail.destination[0],
        fromEmail: mail.source,
        eventType: eventType.toLowerCase(),
        eventData: { bounce, complaint }
      }
    });
    
    // Handle bounces
    if (eventType === 'Bounce' && bounce.bounceType === 'Permanent') {
      await this.markEmailAsInvalid(mail.destination[0]);
    }
  }
}
```

**Dashboard Query:**

```typescript
// Email deliverability stats
async getEmailStats(firmId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await prisma.emailEvent.groupBy({
    by: ['eventType'],
    where: {
      firmId,
      createdAt: { gte: since }
    },
    _count: true
  });
  
  return {
    sent: stats.find(s => s.eventType === 'sent')?._count || 0,
    delivered: stats.find(s => s.eventType === 'delivered')?._count || 0,
    opened: stats.find(s => s.eventType === 'opened')?._count || 0,
    bounced: stats.find(s => s.eventType === 'bounced')?._count || 0,
    complained: stats.find(s => s.eventType === 'complained')?._count || 0
  };
}
```

---

### 6. SaaS Billing (Your Own Revenue) 🚨 CRITICAL

**Current:** Client billing only  
**Missing:** Subscription billing for your SaaS

**Schema:**

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  price_monthly INTEGER NOT NULL, -- cents
  price_yearly INTEGER NOT NULL,
  max_users INTEGER,
  max_clients INTEGER,
  max_storage_gb INTEGER,
  features JSONB NOT NULL,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) UNIQUE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status VARCHAR(50) NOT NULL, -- active, past_due, canceled, trialing
  billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  trial_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  users_count INTEGER DEFAULT 0,
  clients_count INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  documents_count INTEGER DEFAULT 0,
  invoices_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed plans
INSERT INTO plans (name, display_name, price_monthly, price_yearly, max_users, max_clients, max_storage_gb, features) VALUES
  ('starter', 'Starter', 1900, 19000, 2, 25, 5, '{"e_signature": false, "time_tracking": false, "api_access": false}'),
  ('professional', 'Professional', 4900, 49000, 10, 100, 50, '{"e_signature": true, "time_tracking": true, "api_access": false}'),
  ('enterprise', 'Enterprise', 9900, 99000, NULL, NULL, 500, '{"e_signature": true, "time_tracking": true, "api_access": true}');
```

**Subscription Service:**

```typescript
class SubscriptionService {
  async createSubscription(
    firmId: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly'
  ) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    const firm = await prisma.firm.findUnique({ where: { id: firmId } });
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: firm.ownerEmail,
      metadata: { firmId }
    });
    
    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: billingCycle === 'monthly' 
          ? plan.stripePriceIdMonthly 
          : plan.stripePriceIdYearly
      }],
      trial_period_days: 14,
      metadata: { firmId, planId }
    });
    
    // Create local subscription record
    return prisma.subscription.create({
      data: {
        firmId,
        planId,
        status: 'trialing',
        billingCycle,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: customer.id,
        trialEnd: new Date(stripeSubscription.trial_end * 1000)
      }
    });
  }
  
  async handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.updated':
        await this.updateSubscriptionStatus(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
    }
  }
  
  async checkUsageLimits(firmId: string): Promise<UsageStatus> {
    const subscription = await prisma.subscription.findUnique({
      where: { firmId },
      include: { plan: true }
    });
    
    const usage = await this.getCurrentUsage(firmId);
    
    return {
      usersLimit: subscription.plan.maxUsers,
      usersCurrent: usage.usersCount,
      usersExceeded: usage.usersCount > subscription.plan.maxUsers,
      
      clientsLimit: subscription.plan.maxClients,
      clientsCurrent: usage.clientsCount,
      clientsExceeded: usage.clientsCount > subscription.plan.maxClients,
      
      storageLimit: subscription.plan.maxStorageGb,
      storageCurrent: usage.storageUsedGb,
      storageExceeded: usage.storageUsedGb > subscription.plan.maxStorageGb
    };
  }
}
```

**Middleware to Enforce Limits:**

```typescript
async function checkSubscriptionLimits(req: Request, res: Response, next: NextFunction) {
  const { firmId } = req.user;
  
  const subscription = await prisma.subscription.findUnique({
    where: { firmId }
  });
  
  // Check if subscription is active
  if (!subscription || subscription.status !== 'active') {
    return res.status(402).json({
      error: 'Subscription required',
      message: 'Please upgrade your plan to continue'
    });
  }
  
  // Check usage limits
  const usage = await subscriptionService.checkUsageLimits(firmId);
  
  if (req.path.includes('/clients') && req.method === 'POST') {
    if (usage.clientsExceeded) {
      return res.status(403).json({
        error: 'Client limit exceeded',
        message: `Your plan allows ${usage.clientsLimit} clients. Please upgrade.`
      });
    }
  }
  
  next();
}
```

---

### 7. Observability Stack 🚨 CRITICAL

**Logging:**

```typescript
// Structured logging with Winston
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'practice-mgmt-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('User logged in', {
  userId: user.id,
  firmId: user.firmId,
  ip: req.ip
});

logger.error('Payment failed', {
  error: error.message,
  stack: error.stack,
  invoiceId,
  firmId
});
```

**Error Tracking (Sentry):**

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  }
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

**Metrics (OpenTelemetry):**

```typescript
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const exporter = new PrometheusExporter({ port: 9464 });
const meterProvider = new MeterProvider();
meterProvider.addMetricReader(exporter);

const meter = meterProvider.getMeter('practice-mgmt');

// Track metrics
const requestCounter = meter.createCounter('http_requests_total');
const requestDuration = meter.createHistogram('http_request_duration_ms');

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    requestCounter.add(1, {
      method: req.method,
      route: req.route?.path,
      status: res.statusCode
    });
    
    requestDuration.record(duration, {
      method: req.method,
      route: req.route?.path
    });
  });
  
  next();
});
```

---

## MVP Feature Lock 🔒

**MUST HAVE (Core MVP):**
- ✅ Auth (login, register, JWT)
- ✅ Clients CRUD
- ✅ Contacts (many-to-many)
- ✅ Documents (upload, download, S3)
- ✅ Tasks (CRUD, status)
- ✅ Invoices (create, PDF)
- ✅ Payments (Stripe)
- ✅ Client Portal (login, upload, pay)
- ✅ Email notifications
- ✅ Onboarding flow

**MUST ADD (Production Requirements):**
- ✅ Feature flags
- ✅ Security audit logs
- ✅ Storage limits + virus scanning
- ✅ Email tracking
- ✅ SaaS billing (subscriptions)
- ✅ Observability (Sentry + logs)

**CAN DEFER (Post-MVP):**
- ❌ E-signature
- ❌ Time tracking
- ❌ Workflow pipelines
- ❌ Real-time chat
- ❌ Advanced reporting
- ❌ API access
- ❌ Bulk operations
- ❌ Multi-currency

---

## Updated Timeline

**With Production Requirements:**

| Phase | Duration | Tasks |
|-------|----------|-------|
| Setup + Prisma | 1 week | Repo, ORM, migrations |
| Auth + Security | 2 weeks | Auth, audit logs, feature flags |
| CRM | 2 weeks | Clients, contacts |
| Documents | 2 weeks | Upload, S3, virus scan, limits |
| Tasks | 1 week | CRUD, status |
| Billing (Client) | 2 weeks | Invoices, Stripe |
| Billing (SaaS) | 2 weeks | Subscriptions, plans, limits |
| Portal | 2 weeks | Auth, upload, pay |
| Notifications | 1 week | Email, tracking |
| Onboarding | 1 week | Guided flow |
| Observability | 1 week | Sentry, logs, metrics |
| Testing | 2 weeks | Unit, integration, E2E |
| **Total** | **19 weeks** | **~4.5 months** |

**Team:** 3-5 developers  
**Realistic:** Yes, with proper planning

---

## Final Production Checklist

Before launch, ensure:

- [ ] Prisma ORM implemented
- [ ] Feature flags system working
- [ ] Security audit logs capturing all events
- [ ] Storage limits enforced
- [ ] Virus scanning enabled
- [ ] Email tracking configured
- [ ] SaaS billing (Stripe subscriptions)
- [ ] Usage limits enforced
- [ ] Sentry error tracking
- [ ] Structured logging
- [ ] Metrics collection
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Backup/restore tested
- [ ] Disaster recovery plan
- [ ] Monitoring dashboards
- [ ] On-call rotation

---

**Document Version:** 1.0  
**Status:** Production Requirements Defined  
**Next:** Implement in order listed above
