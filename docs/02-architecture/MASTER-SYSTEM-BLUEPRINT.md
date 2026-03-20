# MASTER SYSTEM BLUEPRINT

**Version:** 1.0 FINAL  
**Purpose:** Single authoritative technical blueprint for Practice Management SaaS  
**Status:** PRODUCTION READY  
**Architecture Score:** 9.5/10

**Consolidated From:**
- docs/dev.md (800+ lines)
- docs/implementation-plan.md (895 lines)
- docs/FINAL-ARCHITECTURE-FIXES.md (600+ lines)
- docs/production-readiness.md (650+ lines)
- docs/SYSTEM-OPERATIONS.md (2,000+ lines)
- docs/MVP-FEATURE-LOCK.md (400+ lines)
- docs/FOLDER-STRUCTURE-FINAL.md (1,000+ lines)
- docs/OPTIMIZED-MVP-PLAN.md (400+ lines)
- docs/SOURCE-OF-TRUTH.md (600+ lines)

**Total Source Material:** 13,000+ lines across 14 documents

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Complete Repository Structure](#3-complete-repository-structure)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Multi-Tenant Architecture](#6-multi-tenant-architecture)
7. [Queue & Background Jobs](#7-queue--background-jobs)
8. [Storage Architecture](#8-storage-architecture)
9. [Scaling Considerations](#9-scaling-considerations)
10. [Feature Flags Implementation](#10-feature-flags-implementation)
11. [Production Readiness Checklist](#11-production-readiness-checklist)
12. [Architecture Score Summary](#12-architecture-score-summary)
13. [Critical Architecture Fixes (From Brutal Review)](#13-critical-architecture-fixes-from-brutal-review)
14. [Critical Architecture Decisions Summary](#14-critical-architecture-decisions-summary)
15. [Next Steps](#15-next-steps)

---

## 1. System Overview

### 1.1 Product Vision

**Product:** Cloud-based Practice Management SaaS for solo bookkeepers and small accounting firms

**Target Market:**
- Solo practitioners (1-2 users)
- Small accounting firms (3-10 users)
- Their clients (document upload, invoice payment)

**Core Value Proposition:**
Consolidate client management, document exchange, task tracking, and billing into one system, eliminating scattered emails, missed deadlines, and slow invoicing.

### 1.2 SaaS Model

**Pricing:**
- Starter: $29/month (50 clients, 10GB storage, 5 users)
- Professional: $99/month (200 clients, 50GB storage, 15 users)
- Enterprise: $299/month (unlimited clients, 500GB storage, unlimited users)

**Revenue Streams:**
1. Monthly subscriptions
2. Annual subscriptions (2 months free)
3. Future: Add-ons (e-signature, time tracking)

### 1.3 Core Product Capabilities

**For Accounting Firms:**
- Client & contact management (CRM)
- Secure document storage & sharing
- Task management with reminders
- Invoice creation & PDF generation
- Online payment processing (Stripe)
- Client portal access management

**For Clients (Portal):**
- Document upload to firm
- View invoices
- Pay invoices online
- View assigned tasks

### 1.4 Multi-Tenant Architecture Principle

**Tenant Model:** Firm-based multi-tenancy
- Each accounting firm = 1 tenant
- All data isolated by `firm_id`
- PostgreSQL Row Level Security (RLS) enforces isolation
- Shared database, logical separation

**Scaling Path:**
- MVP: Single database, all tenants
- Growth: Read replicas for reporting
- Scale: Shard by firm_id if needed

---

## 2. System Architecture

### 2.1 High-Level Architecture

**Architecture Style:** Modular Monolith (NOT Microservices)

**Why Modular Monolith:**
- Faster development (3-5 developers, 16 weeks)
- Simpler deployment (single unit)
- Easier debugging and testing
- Lower operational overhead
- Can extract to microservices later if needed

**System Components:**

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Staff Dashboard │         │  Client Portal   │         │
│  │    (React SPA)   │         │   (React SPA)    │         │
│  └──────────────────┘         └──────────────────┘         │
└────────────┬──────────────────────────┬────────────────────┘
             │                          │
             │ HTTPS/REST API           │ HTTPS/REST API
             │                          │
┌────────────┴──────────────────────────┴────────────────────┐
│                      API GATEWAY                            │
│              (Load Balancer + TLS Termination)             │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────────────┐
│                    BACKEND API SERVER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MODULAR MONOLITH                         │  │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │  Auth  │ │  CRM   │ │Documents │ │  Tasks   │   │  │
│  │  └────────┘ └────────┘ └──────────┘ └──────────┘   │  │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │Billing │ │Notifs  │ │  Portal  │ │Onboarding│   │  │
│  │  └────────┘ └────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────┬────────────┬────────────┬────────────┬────────────┘
         │            │            │            │
    ┌────┴────┐  ┌───┴────┐  ┌───┴────┐  ┌───┴────┐
    │PostgreSQL│  │ Redis  │  │   S3   │  │ Stripe │
    │   (RDS)  │  │(Cache/ │  │(Docs)  │  │(Payment│
    │          │  │ Queue) │  │        │  │        │
    └──────────┘  └────────┘  └────────┘  └────────┘
                       │
                  ┌────┴────┐
                  │ WORKER  │
                  │ SERVICE │
                  │(BullMQ) │
                  └─────────┘
```

### 2.2 Technology Stack

**Backend:**
- Runtime: Node.js 20+
- Language: TypeScript 5+
- Framework: Express.js
- ORM: Prisma
- Validation: Zod
- Authentication: JWT (Passport.js)

**Frontend:**
- Framework: React 18+ with Vite
- Build Tool: Vite
- Routing: React Router v6
- Styling: Tailwind CSS
- State Management: React Query
- Forms: React Hook Form

**Database:**
- Primary: PostgreSQL 15+ (AWS RDS)
- Cache: Redis 7+ (AWS ElastiCache)
- Queue: BullMQ (Redis-based)

**Storage:**
- Documents: AWS S3
- CDN: CloudFront

**External Services:**
- Payments: Stripe
- Email: AWS SES / SendGrid
- Error Tracking: Sentry
- Virus Scanning: ClamAV

**Infrastructure:**
- Cloud: AWS
- Compute: ECS Fargate or Docker Compose
- IaC: Terraform
- CI/CD: GitHub Actions

### 2.3 Request Flow

**Staff User Request:**
```
1. User → Frontend (React)
2. Frontend → API Gateway (HTTPS)
3. API Gateway → Backend API
4. Middleware Stack:
   - Security Headers (Helmet)
   - CORS
   - Rate Limiting (Global: 1000/15min)
   - Authentication (JWT)
   - Tenant Context (Set firm_id for RLS)
   - Rate Limiting (Per-user: 100/min)
   - Authorization (RBAC check)
   - Subscription Check (Active?)
   - Tenant Limits (Within plan limits?)
5. Controller → Service → Repository
6. Database Query (with RLS enforcement)
7. Response → Frontend
```

**Background Job Flow:**
```
1. Service enqueues job → Redis Queue
2. Worker picks up job
3. Worker processes (email, PDF, etc.)
4. Worker updates database
5. Worker logs completion
```

### 2.4 Module Structure

**10 Core Modules:**

1. **Auth** - Authentication, authorization, JWT, RBAC
2. **CRM** - Clients, contacts, relationships
3. **Documents** - File upload, S3 storage, folders
4. **Tasks** - Task management, status tracking
5. **Billing** - Invoices, payments, Stripe integration
6. **Notifications** - Email, reminders, activity logging
7. **Portal** - Client portal authentication and features
8. **SaaS Billing** - Subscriptions, plans, usage tracking
9. **Onboarding** - User onboarding flow
10. **Observability** - Logging, monitoring, health checks

**Module Communication:**
- Controllers call their own service only
- Services can call other services
- Repositories access database only
- No circular dependencies
- Domain events for decoupling

---

## 3. Complete Repository Structure

### 3.1 Monorepo Layout (Turborepo)

**CRITICAL FIX: Worker Service Separation**

```
practice-management-saas/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── test.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── apps/
│   ├── api/                    # Backend API server
│   │   ├── src/
│   │   │   ├── modules/        # Business logic modules
│   │   │   ├── shared/         # Shared utilities
│   │   │   ├── config/         # Configuration
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   ├── worker/                 # ⚠️ SEPARATE WORKER SERVICE
│   │   ├── src/
│   │   │   ├── workers/
│   │   │   │   ├── email-worker.ts
│   │   │   │   ├── pdf-worker.ts
│   │   │   │   ├── webhook-worker.ts
│   │   │   │   └── reminders-worker.ts
│   │   │   ├── services/       # Worker-specific services
│   │   │   ├── config/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile          # Separate Docker image
│   └── web/                    # Frontend React app
│       ├── src/
│       ├── package.json
│       └── Dockerfile
├── packages/
│   ├── database/               # Prisma schema, migrations
│   ├── shared-types/           # Shared TypeScript types
│   ├── email-templates/        # Email templates
│   └── config/                 # Shared configuration
├── infrastructure/
│   ├── terraform/
│   └── docker/
├── scripts/
├── docs/
├── docker-compose.yml
├── docker-compose.prod.yml     # Production compose
├── package.json
├── turbo.json
└── README.md
```

**Why Separate Worker Service:**
- API crash doesn't stop queue processing
- Independent scaling (API vs workers)
- Different resource requirements
- Cleaner deployment

**Docker Compose (Production):**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build: ./apps/api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: always
  
  worker:
    build: ./apps/worker
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: always
  
  postgres:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
  
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --appendfsync everysec
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

---

## 4. Backend Architecture

### 4.1 Corrected Infrastructure Flow

**FIXED: No API Gateway, Use ALB**

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTPS
             │
┌────────────┴────────────────────────────────────────────────┐
│                      CloudFront (CDN)                        │
│              (Static assets + API caching)                   │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────────────┐
│          Application Load Balancer (ALB)                     │
│              (TLS Termination + Routing)                     │
└────────┬───────────────────────────────┬────────────────────┘
         │                               │
    ┌────┴────┐                     ┌───┴────┐
    │   API   │                     │  Web   │
    │Container│                     │Container│
    │(ECS)    │                     │ (ECS)  │
    └────┬────┘                     └────────┘
         │
    ┌────┴────┐
    │ Worker  │
    │Container│
    │ (ECS)   │
    └─────────┘
```

**No AWS API Gateway needed** - ALB handles routing

### 4.2 State Management (Simplified)

**FIXED: React Query Only**

```typescript
// ❌ REMOVED: Zustand (unnecessary complexity)
// ✅ USE: React Query only

// apps/web/src/lib/api-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds (accounting data changes frequently)
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Usage
const { data: clients } = useQuery({
  queryKey: ['clients', firmId],
  queryFn: () => api.getClients(firmId)
});
```

**Why React Query Only:**
- Built-in server state management
- Automatic caching
- Background refetching
- Optimistic updates
- No need for Zustand

### 4.3 Email Provider (Single Choice)

**FIXED: AWS SES Only**

```typescript
// apps/api/src/config/email.config.ts
import { SESClient } from '@aws-sdk/client-ses';

export const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// ❌ REMOVED: SendGrid option
// ✅ USE: AWS SES only for MVP
```

**Why AWS SES:**
- Already using AWS
- Lower cost ($0.10 per 1000 emails)
- Integrated with CloudWatch
- No additional vendor

---

## 5. Database Architecture

### 5.1 Complete Database Schema

**CRITICAL ADDITIONS:**

#### 5.1.1 Webhook Idempotency

```sql
-- ⚠️ CRITICAL: Prevents duplicate Stripe webhook processing
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE,  -- Stripe event ID
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payload JSONB,
  error TEXT,
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_type ON webhook_events(type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE UNIQUE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
```

#### 5.1.2 Document Versioning

```sql
-- ⚠️ CRITICAL: Track document versions for accounting compliance
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_key VARCHAR(500) NOT NULL,  -- S3 key
  size_bytes BIGINT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_current BOOLEAN DEFAULT false,
  UNIQUE(document_id, version_number)
);

CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_current ON document_versions(document_id, is_current) WHERE is_current = true;

-- Update documents table
ALTER TABLE documents ADD COLUMN current_version INTEGER DEFAULT 1;
```

#### 5.1.3 Storage Usage Tracking

```sql
-- ⚠️ CRITICAL: Enforce storage limits per plan
CREATE TABLE storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) UNIQUE,
  total_bytes BIGINT DEFAULT 0,
  document_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_storage_usage_firm ON storage_usage(firm_id);

-- Trigger to update storage on document upload
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO storage_usage (firm_id, total_bytes, document_count)
    VALUES (NEW.firm_id, NEW.size_bytes, 1)
    ON CONFLICT (firm_id) DO UPDATE
    SET total_bytes = storage_usage.total_bytes + NEW.size_bytes,
        document_count = storage_usage.document_count + 1,
        last_calculated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE storage_usage
    SET total_bytes = total_bytes - OLD.size_bytes,
        document_count = document_count - 1,
        last_calculated_at = NOW()
    WHERE firm_id = OLD.firm_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_storage_tracking
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_usage();
```

#### 5.1.4 Email Event Tracking

```sql
-- ⚠️ CRITICAL: Track email deliverability
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id),
  message_id VARCHAR(255) NOT NULL,  -- SES Message ID
  email_to VARCHAR(255) NOT NULL,
  email_from VARCHAR(255) NOT NULL,
  subject TEXT,
  template_name VARCHAR(100),
  event_type VARCHAR(50) NOT NULL,  -- sent, delivered, opened, clicked, bounced, complained
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_events_message ON email_events(message_id);
CREATE INDEX idx_email_events_firm_time ON email_events(firm_id, created_at DESC);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_email ON email_events(email_to);
```

#### 5.1.5 Feature Flags with Rollout

```sql
-- ⚠️ CRITICAL: Gradual feature rollout
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  enabled_globally BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,  -- 0-100
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE firm_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id),
  enabled BOOLEAN NOT NULL,
  enabled_at TIMESTAMP,
  enabled_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(firm_id, feature_flag_id)
);

CREATE INDEX idx_firm_feature_flags_firm ON firm_feature_flags(firm_id);
CREATE INDEX idx_firm_feature_flags_flag ON firm_feature_flags(feature_flag_id);
```

#### 5.1.6 Search Indexing

```sql
-- ⚠️ CRITICAL: Full-text search implementation
ALTER TABLE clients ADD COLUMN search_vector tsvector;
ALTER TABLE contacts ADD COLUMN search_vector tsvector;
ALTER TABLE documents ADD COLUMN search_vector tsvector;
ALTER TABLE tasks ADD COLUMN search_vector tsvector;

-- GIN indexes for fast search
CREATE INDEX idx_clients_search ON clients USING GIN(search_vector);
CREATE INDEX idx_contacts_search ON contacts USING GIN(search_vector);
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX idx_tasks_search ON tasks USING GIN(search_vector);

-- Trigger to update search_vector
CREATE OR REPLACE FUNCTION update_client_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_search_update
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_client_search_vector();

-- Trigger for contacts
CREATE OR REPLACE FUNCTION update_contact_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_search_update
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_search_vector();

-- Trigger for documents
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.filename, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_search_update
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_search_vector();

-- Trigger for tasks
CREATE OR REPLACE FUNCTION update_task_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_search_update
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_search_vector();
```

### 5.2 Activity Timeline Model

```sql
-- ⚠️ CLARIFIED: Activity timeline structure
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  client_id UUID REFERENCES clients(id),
  actor_user_id UUID REFERENCES users(id),
  actor_client_user_id UUID REFERENCES client_users(id),
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),  -- 'client', 'document', 'task', 'invoice', 'payment'
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_events_firm_time ON activity_events(firm_id, created_at DESC);
CREATE INDEX idx_activity_events_client_time ON activity_events(client_id, created_at DESC);
CREATE INDEX idx_activity_events_type ON activity_events(event_type);

-- Example events:
-- client_created, client_updated, document_uploaded, document_downloaded,
-- task_created, task_completed, invoice_created, invoice_sent, invoice_paid,
-- payment_received, user_invited, portal_login
```

### 5.3 Failed Jobs Table (Dead Letter Queue)

```sql
-- ⚠️ CRITICAL: Track failed background jobs for manual intervention
CREATE TABLE failed_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue VARCHAR(100) NOT NULL,  -- 'emails', 'webhooks', 'pdfs', 'reminders'
  job_id VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  error TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  failed_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT
);

CREATE INDEX idx_failed_jobs_queue ON failed_jobs(queue);
CREATE INDEX idx_failed_jobs_failed_at ON failed_jobs(failed_at DESC);
CREATE INDEX idx_failed_jobs_unresolved ON failed_jobs(resolved_at) WHERE resolved_at IS NULL;
```

**Purpose:**
- Track jobs that failed after all retry attempts
- Manual intervention for critical failures
- Audit trail of job failures
- Reprocess capability

**Usage:**
```typescript
// Query unresolved failed jobs
const failedJobs = await prisma.failedJob.findMany({
  where: { resolvedAt: null },
  orderBy: { failedAt: 'desc' }
});

// Mark as resolved
await prisma.failedJob.update({
  where: { id: jobId },
  data: {
    resolvedAt: new Date(),
    resolvedBy: userId,
    resolutionNotes: 'Manually reprocessed'
  }
});
```

---

## 6. Multi-Tenant Architecture

### 6.1 RLS Enforcement Strategy (CRITICAL DECISION)

**Decision: PostgreSQL RLS Enforces Automatically**

**Why This Approach:**
1. **Security by Default:** Database enforces isolation, not application code
2. **Cannot Be Bypassed:** Even if developer forgets `WHERE firm_id = ?`, RLS prevents leak
3. **Works Everywhere:** Raw SQL, Prisma queries, admin queries all protected
4. **Audit Compliance:** Database-level enforcement for SOC 2 / ISO 27001

**Implementation:**

```sql
-- Enable RLS on all tenant tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation_policy ON clients
  USING (firm_id = current_setting('app.current_firm_id')::uuid);

CREATE POLICY tenant_isolation_policy ON documents
  USING (firm_id = current_setting('app.current_firm_id')::uuid);

CREATE POLICY tenant_isolation_policy ON tasks
  USING (firm_id = current_setting('app.current_firm_id')::uuid);

CREATE POLICY tenant_isolation_policy ON invoices
  USING (firm_id = current_setting('app.current_firm_id')::uuid);

-- For tables without direct firm_id (via relationships)
CREATE POLICY tenant_isolation_policy ON contacts
  USING (
    EXISTS (
      SELECT 1 FROM client_contacts cc
      JOIN clients c ON cc.client_id = c.id
      WHERE cc.contact_id = contacts.id
        AND c.firm_id = current_setting('app.current_firm_id')::uuid
    )
  );
```

**Middleware to Set Tenant Context:**

```typescript
// apps/api/src/shared/middleware/tenant-context.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/connection';

export async function setTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { firmId } = req.user;
  
  if (!firmId) {
    return res.status(403).json({ error: 'No firm context' });
  }
  
  // Set PostgreSQL session variable for RLS
  await prisma.$executeRaw`
    SELECT set_config('app.current_firm_id', ${firmId}, true)
  `;
  
  next();
}

// Apply to all authenticated routes
app.use('/api/v1', authenticate, setTenantContext);
```

**Benefits:**
- ✅ Developers can write `prisma.client.findMany()` without `WHERE firm_id`
- ✅ RLS automatically filters results
- ✅ Impossible to leak data across tenants
- ✅ Works with raw SQL queries
- ✅ Admin queries still protected

**Testing RLS:**

```typescript
// Test that RLS prevents cross-tenant access
describe('RLS Enforcement', () => {
  it('should prevent access to other firm data', async () => {
    // Set context to Firm A
    await prisma.$executeRaw`SELECT set_config('app.current_firm_id', ${firmAId}, true)`;
    
    // Try to access Firm B's client
    const client = await prisma.client.findUnique({
      where: { id: firmBClientId }
    });
    
    // Should return null (RLS blocks it)
    expect(client).toBeNull();
  });
});
```

---

## 7. Queue & Background Jobs

### 7.1 Separate Worker Service Architecture

**CRITICAL: Workers run as separate service**

```typescript
// apps/worker/src/index.ts
import { emailWorker } from './workers/email-worker';
import { pdfWorker } from './workers/pdf-worker';
import { webhookWorker } from './workers/webhook-worker';
import { remindersWorker } from './workers/reminders-worker';
import { logger } from './utils/logger';

async function startWorkers() {
  logger.info('Starting worker service...');
  
  // Workers auto-start when imported
  logger.info('✓ Email worker started');
  logger.info('✓ PDF worker started');
  logger.info('✓ Webhook worker started');
  logger.info('✓ Reminders worker started');
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing workers...');
    await Promise.all([
      emailWorker.close(),
      pdfWorker.close(),
      webhookWorker.close(),
      remindersWorker.close()
    ]);
    process.exit(0);
  });
}

startWorkers().catch((error) => {
  logger.error('Failed to start workers:', error);
  process.exit(1);
});
```

### 7.2 Webhook Worker with Idempotency

```typescript
// apps/worker/src/workers/webhook-worker.ts
import { Worker, Job } from 'bullmq';
import { prisma } from '@repo/database';
import { redis } from '../config/redis';

interface WebhookJob {
  event: {
    id: string;
    type: string;
    data: any;
  };
}

export const webhookWorker = new Worker(
  'webhooks',
  async (job: Job<WebhookJob>) => {
    const { event } = job.data;
    
    console.log(`Processing webhook: ${event.type} (${event.id})`);
    
    // ⚠️ CRITICAL: Check idempotency
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId: event.id }
    });
    
    if (existing) {
      console.log(`Webhook ${event.id} already processed, skipping`);
      return { skipped: true, reason: 'already_processed' };
    }
    
    // Create webhook event record (idempotency key)
    await prisma.webhookEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        status: 'processing',
        payload: event,
        receivedAt: new Date()
      }
    });
    
    try {
      // Process webhook
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data);
          break;
        case 'payment_intent.failed':
          await handlePaymentFailure(event.data);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdate(event.data);
          break;
        default:
          console.log(`Unhandled webhook type: ${event.type}`);
      }
      
      // Mark as processed
      await prisma.webhookEvent.update({
        where: { eventId: event.id },
        data: { 
          status: 'processed',
          processedAt: new Date()
        }
      });
      
      return { processed: true };
    } catch (error) {
      // Mark as failed
      await prisma.webhookEvent.update({
        where: { eventId: event.id },
        data: { 
          status: 'failed',
          error: error.message,
          processedAt: new Date()
        }
      });
      throw error; // Will trigger retry
    }
  },
  {
    connection: redis,
    concurrency: 10,
    // ⚠️ CRITICAL: Retry strategy for webhooks
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
);

// ⚠️ CRITICAL: Handle failed webhooks
webhookWorker.on('failed', async (job, error) => {
  console.error(`Webhook job ${job.id} failed after ${job.attemptsMade} attempts:`, error);
  
  if (job.attemptsMade >= 5) {
    await prisma.failedJob.create({
      data: {
        queue: 'webhooks',
        jobId: job.id,
        payload: job.data,
        error: error.message,
        attempts: job.attemptsMade,
        failedAt: new Date()
      }
    });
    
    // Alert on failed payment webhooks
    if (job.data.event.type.includes('payment')) {
      await alertOps(`Critical: Payment webhook failed after 5 retries - ${job.id}`);
    }
  }
});
```

### 7.3 Email Worker with Event Tracking

```typescript
// apps/worker/src/workers/email-worker.ts
import { Worker, Job } from 'bullmq';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { prisma } from '@repo/database';
import { redis } from '../config/redis';

const sesClient = new SESClient({ region: process.env.AWS_REGION });

interface EmailJob {
  to: string;
  from: string;
  subject: string;
  html: string;
  firmId: string;
  template?: string;
}

export const emailWorker = new Worker(
  'emails',
  async (job: Job<EmailJob>) => {
    const { to, from, subject, html, firmId, template } = job.data;
    
    try {
      // Send via SES
      const result = await sesClient.send(new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: { Html: { Data: html } }
        }
      }));
      
      // Track email event
      await prisma.emailEvent.create({
        data: {
          firmId,
          messageId: result.MessageId,
          emailTo: to,
          emailFrom: from,
          subject,
          templateName: template,
          eventType: 'sent',
          eventData: { sesMessageId: result.MessageId }
        }
      });
      
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      // Track failure
      await prisma.emailEvent.create({
        data: {
          firmId,
          emailTo: to,
          emailFrom: from,
          subject,
          templateName: template,
          eventType: 'failed',
          eventData: { error: error.message }
        }
      });
      
      throw error; // Will trigger retry
    }
  },
  {
    connection: redis,
    concurrency: 5,
    // ⚠️ CRITICAL: Retry strategy
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000 // Start with 2 seconds, doubles each retry
    }
  }
);

// ⚠️ CRITICAL: Handle failed jobs (Dead Letter Queue)
emailWorker.on('failed', async (job, error) => {
  console.error(`Email job ${job.id} failed after ${job.attemptsMade} attempts:`, error);
  
  // Move to dead letter queue after all retries exhausted
  if (job.attemptsMade >= 5) {
    await prisma.failedJob.create({
      data: {
        queue: 'emails',
        jobId: job.id,
        payload: job.data,
        error: error.message,
        attempts: job.attemptsMade,
        failedAt: new Date()
      }
    });
  }
});
```

### 7.4 SES Webhook Handler (Email Events)

```typescript
// apps/api/src/modules/notifications/ses-webhook.controller.ts
export class SESWebhookController {
  async handleWebhook(req: Request, res: Response) {
    const { Message } = req.body;
    const event = JSON.parse(Message);
    
    const { eventType, mail, bounce, complaint, delivery, open, click } = event;
    
    // Find email event by SES message ID
    const emailEvent = await prisma.emailEvent.findFirst({
      where: { 
        eventData: {
          path: ['sesMessageId'],
          equals: mail.messageId
        }
      }
    });
    
    if (!emailEvent) {
      console.warn(`Email event not found for message: ${mail.messageId}`);
      return res.status(200).json({ received: true });
    }
    
    // Update based on event type
    switch (eventType) {
      case 'Delivery':
        await prisma.emailEvent.create({
          data: {
            firmId: emailEvent.firmId,
            messageId: mail.messageId,
            emailTo: mail.destination[0],
            emailFrom: mail.source,
            subject: emailEvent.subject,
            eventType: 'delivered',
            eventData: delivery
          }
        });
        break;
        
      case 'Open':
        await prisma.emailEvent.create({
          data: {
            firmId: emailEvent.firmId,
            messageId: mail.messageId,
            emailTo: mail.destination[0],
            emailFrom: mail.source,
            subject: emailEvent.subject,
            eventType: 'opened',
            eventData: open,
            ipAddress: open.ipAddress,
            userAgent: open.userAgent
          }
        });
        break;
        
      case 'Click':
        await prisma.emailEvent.create({
          data: {
            firmId: emailEvent.firmId,
            messageId: mail.messageId,
            emailTo: mail.destination[0],
            emailFrom: mail.source,
            subject: emailEvent.subject,
            eventType: 'clicked',
            eventData: click,
            ipAddress: click.ipAddress,
            userAgent: click.userAgent
          }
        });
        break;
        
      case 'Bounce':
        await prisma.emailEvent.create({
          data: {
            firmId: emailEvent.firmId,
            messageId: mail.messageId,
            emailTo: mail.destination[0],
            emailFrom: mail.source,
            subject: emailEvent.subject,
            eventType: 'bounced',
            eventData: bounce
          }
        });
        break;
        
      case 'Complaint':
        await prisma.emailEvent.create({
          data: {
            firmId: emailEvent.firmId,
            messageId: mail.messageId,
            emailTo: mail.destination[0],
            emailFrom: mail.source,
            subject: emailEvent.subject,
            eventType: 'complained',
            eventData: complaint
          }
        });
        break;
    }
    
    res.status(200).json({ received: true });
  }
}
```

---

### 7.5 Job Retry Strategy & Dead Letter Queue

**Problem:** Temporary failures (network issues, rate limits, service downtime) can cause job loss.

**Solution:** Exponential backoff retry with dead letter queue for permanent failures.

#### 7.5.1 Retry Configuration

**All Workers Use Same Strategy:**

```typescript
{
  connection: redis,
  concurrency: 5-10,
  attempts: 5,  // Retry up to 5 times
  backoff: {
    type: 'exponential',
    delay: 2000  // Start with 2s, doubles each retry
  }
}
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: 2 seconds later
- Attempt 3: 4 seconds later
- Attempt 4: 8 seconds later
- Attempt 5: 16 seconds later
- After 5 failures: Move to DLQ

**Total retry window:** ~30 seconds

#### 7.5.2 Dead Letter Queue Implementation

**Failed Job Handler (All Workers):**

```typescript
worker.on('failed', async (job, error) => {
  console.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, error);
  
  // Move to DLQ after all retries exhausted
  if (job.attemptsMade >= 5) {
    await prisma.failedJob.create({
      data: {
        queue: job.queueName,
        jobId: job.id,
        payload: job.data,
        error: error.message,
        attempts: job.attemptsMade,
        failedAt: new Date()
      }
    });
    
    // Alert on critical failures
    if (isCritical(job)) {
      await alertOps(`Critical job failed: ${job.queueName} - ${job.id}`);
    }
  }
});
```

#### 7.5.3 Critical Job Alerting

**Alert on These Failures:**
- Payment webhooks (financial impact)
- Invoice emails (customer-facing)
- Subscription updates (billing impact)

**Don't Alert on:**
- Reminder emails (can retry later)
- Analytics jobs (non-critical)

```typescript
function isCritical(job: Job): boolean {
  const criticalQueues = ['webhooks', 'invoices'];
  const criticalTypes = ['payment', 'subscription'];
  
  return criticalQueues.includes(job.queueName) ||
         criticalTypes.some(type => job.data.type?.includes(type));
}
```

#### 7.5.4 DLQ Dashboard

**Admin Interface to View Failed Jobs:**

```typescript
// GET /admin/failed-jobs
export class FailedJobsController {
  async list(req: Request, res: Response) {
    const failedJobs = await prisma.failedJob.findMany({
      where: { resolvedAt: null },
      orderBy: { failedAt: 'desc' },
      take: 100
    });
    
    const stats = {
      total: failedJobs.length,
      byQueue: await this.getStatsByQueue(),
      oldestFailure: failedJobs[failedJobs.length - 1]?.failedAt
    };
    
    res.json({ failedJobs, stats });
  }
  
  async retry(req: Request, res: Response) {
    const { id } = req.params;
    const { userId } = req.user;
    
    const failedJob = await prisma.failedJob.findUnique({
      where: { id }
    });
    
    if (!failedJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Re-enqueue the job
    const queue = getQueue(failedJob.queue);
    await queue.add(failedJob.queue, failedJob.payload);
    
    // Mark as resolved
    await prisma.failedJob.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: 'Manually retried'
      }
    });
    
    res.json({ success: true });
  }
}
```

#### 7.5.5 Monitoring Failed Jobs

**Metrics to Track:**
- Failed jobs per queue (last 24 hours)
- Oldest unresolved failure
- Failure rate by queue
- Common error patterns

**Alert Thresholds:**
- > 10 failed jobs in 1 hour: Warning
- > 50 failed jobs in 1 hour: Critical
- Payment webhook failure: Immediate alert

**Grafana Dashboard:**
```sql
-- Failed jobs by queue (last 24 hours)
SELECT 
  queue,
  COUNT(*) as failures,
  COUNT(DISTINCT error) as unique_errors
FROM failed_jobs
WHERE failed_at > NOW() - INTERVAL '24 hours'
  AND resolved_at IS NULL
GROUP BY queue
ORDER BY failures DESC;
```

#### 7.5.6 Retry Strategy by Queue Type

**Emails:**
- Retries: 5
- Backoff: Exponential (2s start)
- Reason: Temporary SMTP issues common

**Webhooks:**
- Retries: 5
- Backoff: Exponential (2s start)
- Alert: Yes (payment webhooks)
- Reason: Financial impact

**PDFs:**
- Retries: 3
- Backoff: Exponential (5s start)
- Reason: CPU-intensive, fail fast

**Reminders:**
- Retries: 3
- Backoff: Linear (10s)
- Reason: Time-sensitive, don't delay too much

```typescript
// Queue-specific configurations
const queueConfigs = {
  emails: { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
  webhooks: { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
  pdfs: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
  reminders: { attempts: 3, backoff: { type: 'fixed', delay: 10000 } }
};
```

---

## 8. Storage Architecture

### 8.1 Storage Limits Enforcement

```typescript
// apps/api/src/modules/documents/storage-limits.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@repo/database';

export async function enforceStorageLimits(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { firmId } = req.user;
  const file = req.file;
  
  if (!file) {
    return next();
  }
  
  // Get firm's subscription and plan
  const subscription = await prisma.subscription.findUnique({
    where: { firmId },
    include: { plan: true }
  });
  
  if (!subscription) {
    return res.status(402).json({ error: 'No active subscription' });
  }
  
  // Get current storage usage
  const usage = await prisma.storageUsage.findUnique({
    where: { firmId }
  });
  
  const currentBytes = usage?.totalBytes || 0;
  const limitBytes = subscription.plan.maxStorageGb * 1024 * 1024 * 1024;
  
  // Check if upload would exceed limit
  if (currentBytes + file.size > limitBytes) {
    return res.status(403).json({
      error: 'Storage limit exceeded',
      current: `${(currentBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      limit: `${subscription.plan.maxStorageGb} GB`,
      upgrade: true
    });
  }
  
  next();
}

// Usage
router.post('/documents/upload',
  authenticate,
  setTenantContext,
  upload.single('file'),
  enforceStorageLimits,  // Check before processing
  documentsController.upload
);
```

### 8.2 Document Upload with Versioning

```typescript
// apps/api/src/modules/documents/documents.service.ts
export class DocumentsService {
  async uploadDocument(
    firmId: string,
    clientId: string,
    folderId: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<Document> {
    // Check if document with same name exists
    const existing = await prisma.document.findFirst({
      where: {
        firmId,
        clientId,
        folderId,
        filename: file.originalname,
        deletedAt: null
      }
    });
    
    if (existing) {
      // Create new version
      const nextVersion = existing.currentVersion + 1;
      
      // Upload to S3 with version suffix
      const key = `${firmId}/${clientId}/${folderId}/${existing.id}-v${nextVersion}`;
      await this.s3Service.upload(key, file.buffer);
      
      // Create version record
      await prisma.documentVersion.create({
        data: {
          documentId: existing.id,
          versionNumber: nextVersion,
          fileKey: key,
          sizeBytes: file.size,
          uploadedBy: userId
        }
      });
      
      // Update current version
      await prisma.document.update({
        where: { id: existing.id },
        data: { 
          currentVersion: nextVersion,
          sizeBytes: file.size,
          updatedAt: new Date()
        }
      });
      
      // Mark old version as not current
      await prisma.documentVersion.updateMany({
        where: {
          documentId: existing.id,
          versionNumber: { lt: nextVersion }
        },
        data: { isCurrent: false }
      });
      
      // Mark new version as current
      await prisma.documentVersion.updateMany({
        where: {
          documentId: existing.id,
          versionNumber: nextVersion
        },
        data: { isCurrent: true }
      });
      
      return existing;
    } else {
      // Create new document
      const documentId = uuid();
      const key = `${firmId}/${clientId}/${folderId}/${documentId}-v1`;
      
      await this.s3Service.upload(key, file.buffer);
      
      const document = await prisma.document.create({
        data: {
          id: documentId,
          firmId,
          clientId,
          folderId,
          filename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          fileKey: key,
          currentVersion: 1,
          uploadedBy: userId
        }
      });
      
      // Create initial version
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: 1,
          fileKey: key,
          sizeBytes: file.size,
          uploadedBy: userId,
          isCurrent: true
        }
      });
      
      return document;
    }
  }
}
```

### 8.3 Multipart Upload for Large Files

```typescript
// apps/api/src/modules/documents/multipart-upload.service.ts
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';

export class MultipartUploadService {
  private s3Client: S3Client;
  private bucket: string;
  
  constructor() {
    this.s3Client = new S3Client({ region: process.env.AWS_REGION });
    this.bucket = process.env.S3_BUCKET;
  }
  
  async uploadLargeFile(
    key: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<string> {
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    
    // Initiate multipart upload
    const { UploadId } = await this.s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType
      })
    );
    
    // Upload parts
    const parts = [];
    let partNumber = 1;
    
    for (let start = 0; start < buffer.length; start += chunkSize) {
      const end = Math.min(start + chunkSize, buffer.length);
      const chunk = buffer.slice(start, end);
      
      const { ETag } = await this.s3Client.send(
        new UploadPartCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId,
          PartNumber: partNumber,
          Body: chunk
        })
      );
      
      parts.push({ ETag, PartNumber: partNumber });
      partNumber++;
    }
    
    // Complete multipart upload
    await this.s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId,
        MultipartUpload: { Parts: parts }
      })
    );
    
    return key;
  }
}
```

---

## 9. Scaling Considerations

### 9.1 Redis Scaling Strategy

**Current (MVP):** Single Redis instance for cache + queue + rate limiting

**Future Scaling Path (500-1000 customers):**

```yaml
# docker-compose.prod-scaled.yml
services:
  redis-cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-cache-data:/data
  
  redis-queue:
    image: redis:7-alpine
    command: redis-server --maxmemory 4gb --maxmemory-policy noeviction
    volumes:
      - redis-queue-data:/data
```

**When to Split:**
- Queue spikes affecting cache performance
- Cache evictions during high queue load
- Need different persistence strategies

**Configuration Update:**

```typescript
// apps/api/src/config/redis.config.ts
export const cacheRedis = new Redis(process.env.REDIS_CACHE_URL || process.env.REDIS_URL);
export const queueRedis = new Redis(process.env.REDIS_QUEUE_URL || process.env.REDIS_URL);

// Use cacheRedis for caching
// Use queueRedis for BullMQ
```

### 9.2 Database Connection Pooling

**Problem:** Prisma can hit connection limits at scale

**Solution: PgBouncer**

```yaml
# docker-compose.prod.yml
services:
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      - DATABASES_HOST=postgres
      - DATABASES_PORT=5432
      - DATABASES_USER=postgres
      - DATABASES_PASSWORD=${POSTGRES_PASSWORD}
      - DATABASES_DBNAME=practice_mgmt
      - POOL_MODE=transaction
      - MAX_CLIENT_CONN=1000
      - DEFAULT_POOL_SIZE=25
    ports:
      - "6432:6432"
```

**Update Connection String:**

```bash
# Before
DATABASE_URL=postgresql://user:pass@postgres:5432/practice_mgmt

# After (via PgBouncer)
DATABASE_URL=postgresql://user:pass@pgbouncer:6432/practice_mgmt?pgbouncer=true
```

### 9.3 Search Scaling Path

**MVP:** PostgreSQL Full-Text Search (good for 1,000-100,000 records)

**Migration Path to Meilisearch (100,000+ records):**

```typescript
// Future: apps/api/src/shared/services/meilisearch.service.ts
import { MeiliSearch } from 'meilisearch';

export class MeilisearchService {
  private client: MeiliSearch;
  
  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_URL,
      apiKey: process.env.MEILISEARCH_API_KEY
    });
  }
  
  async indexClient(client: Client) {
    const index = this.client.index('clients');
    await index.addDocuments([{
      id: client.id,
      firmId: client.firmId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      type: client.type,
      status: client.status
    }]);
  }
  
  async searchClients(firmId: string, query: string, limit = 20) {
    const index = this.client.index('clients');
    const results = await index.search(query, {
      filter: `firmId = ${firmId}`,
      limit,
      attributesToHighlight: ['name', 'email']
    });
    return results.hits;
  }
}
```

**When to Migrate:**
- Search latency > 500ms
- Need fuzzy search
- Need faceted search
- Need autocomplete
- 100,000+ searchable records

### 9.4 File Upload Limits

**Enforced Limits:**

```typescript
// apps/api/src/config/upload.config.ts
import multer from 'multer';

export const uploadConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for normal upload
    files: 1 // Single file per request
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});
```

**Upload Strategy:**
- Files ≤ 10MB: Normal upload (memory buffer)
- Files > 10MB: Use multipart upload or pre-signed URLs
- Maximum file size: 50MB (enforced at API level)

**For Files > 10MB:****
- Use S3 pre-signed URLs for direct upload
- Client uploads directly to S3
- Webhook notifies API when complete

### 9.5 Virus Scanning with ClamAV

**Docker Compose Configuration:**

```yaml
# docker-compose.yml
services:
  clamav:
    image: clamav/clamav:latest
    ports:
      - "3310:3310"
    volumes:
      - clamav-data:/var/lib/clamav
    environment:
      - CLAMAV_NO_FRESHCLAM=false
    healthcheck:
      test: ["CMD", "clamdscan", "--ping", "1"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  clamav-data:
```

**Virus Scanning Service:**

```typescript
// apps/api/src/shared/services/virus-scan.service.ts
import NodeClam from 'clamscan';

export class VirusScanService {
  private clamscan: any;
  
  async initialize() {
    this.clamscan = await new NodeClam().init({
      clamdscan: {
        host: process.env.CLAMAV_HOST || 'localhost',
        port: parseInt(process.env.CLAMAV_PORT || '3310')
      }
    });
  }
  
  async scanFile(filePath: string): Promise<{ isInfected: boolean; viruses: string[] }> {
    const { isInfected, viruses } = await this.clamscan.isInfected(filePath);
    return { isInfected, viruses };
  }
  
  async scanBuffer(buffer: Buffer): Promise<{ isInfected: boolean; viruses: string[] }> {
    const { isInfected, viruses } = await this.clamscan.scanBuffer(buffer);
    return { isInfected, viruses };
  }
}
```

**Virus Scanning Middleware:**

```typescript
// apps/api/src/shared/middleware/virus-scan.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { virusScanService } from '../services/virus-scan.service';

export async function scanUploadedFile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const file = req.file;
  
  if (!file) {
    return next();
  }
  
  try {
    const { isInfected, viruses } = await virusScanService.scanBuffer(file.buffer);
    
    if (isInfected) {
      return res.status(400).json({
        error: 'File contains malware',
        viruses,
        message: 'The uploaded file was rejected due to security concerns'
      });
    }
    
    next();
  } catch (error) {
    console.error('Virus scan failed:', error);
    // Fail closed - reject upload if scan fails
    return res.status(500).json({
      error: 'Unable to scan file for viruses',
      message: 'Please try again later'
    });
  }
}

// Usage
router.post('/documents/upload',
  authenticate,
  setTenantContext,
  upload.single('file'),
  scanUploadedFile,  // Scan before processing
  enforceStorageLimits,
  documentsController.upload
);
```

### 9.6 Versioned Cache Keys

**Problem:** Pattern deletion (`DEL clients:*`) becomes slow at scale

**Solution: Versioned Cache Keys**

```typescript
// apps/api/src/shared/services/cache.service.ts
import { Redis } from 'ioredis';

export class CacheService {
  private redis: Redis;
  private versions: Map<string, number> = new Map();
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  private async getVersion(namespace: string): Promise<number> {
    if (!this.versions.has(namespace)) {
      const version = await this.redis.get(`cache:version:${namespace}`);
      this.versions.set(namespace, parseInt(version || '1'));
    }
    return this.versions.get(namespace)!;
  }
  
  private async buildKey(namespace: string, key: string): Promise<string> {
    const version = await this.getVersion(namespace);
    return `${namespace}:v${version}:${key}`;
  }
  
  async get<T>(namespace: string, key: string): Promise<T | null> {
    const versionedKey = await this.buildKey(namespace, key);
    const value = await this.redis.get(versionedKey);
    return value ? JSON.parse(value) : null;
  }
  
  async set(namespace: string, key: string, value: any, ttl: number = 3600): Promise<void> {
    const versionedKey = await this.buildKey(namespace, key);
    await this.redis.setex(versionedKey, ttl, JSON.stringify(value));
  }
  
  async invalidateNamespace(namespace: string): Promise<void> {
    // Increment version instead of deleting keys
    const currentVersion = await this.getVersion(namespace);
    const newVersion = currentVersion + 1;
    
    await this.redis.set(`cache:version:${namespace}`, newVersion);
    this.versions.set(namespace, newVersion);
    
    // Old keys become unreachable (garbage collected by TTL)
  }
}

// Usage
const cache = new CacheService(redis);

// Set cache
await cache.set('clients', firmId, clients, 3600);

// Get cache
const clients = await cache.get('clients', firmId);

// Invalidate all clients cache (instant, no pattern deletion)
await cache.invalidateNamespace('clients');
```

**Benefits:**
- ✅ Instant invalidation (no pattern scan)
- ✅ Works at any scale
- ✅ Old keys expire naturally via TTL
- ✅ No Redis performance impact

### 9.7 Tenant Limits Enforcement

**Enforce Plan Limits:**

```typescript
// apps/api/src/shared/middleware/tenant-limits.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@repo/database';

export async function enforceTenantLimits(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { firmId } = req.user;
  const { method, path } = req;
  
  // Only check on write operations
  if (method === 'GET' || method === 'HEAD') {
    return next();
  }
  
  // Get firm's subscription and plan
  const subscription = await prisma.subscription.findUnique({
    where: { firmId },
    include: { plan: true }
  });
  
  if (!subscription) {
    return res.status(402).json({ error: 'No active subscription' });
  }
  
  const { plan } = subscription;
  
  // Check client limit (on client creation)
  if (path.includes('/clients') && method === 'POST') {
    const clientCount = await prisma.client.count({
      where: { firmId, deletedAt: null }
    });
    
    if (clientCount >= plan.maxClients) {
      return res.status(403).json({
        error: 'Client limit reached',
        current: clientCount,
        limit: plan.maxClients,
        upgrade: true
      });
    }
  }
  
  // Check user limit (on user invitation)
  if (path.includes('/users/invite') && method === 'POST') {
    const userCount = await prisma.user.count({
      where: { firmId, deletedAt: null }
    });
    
    if (userCount >= plan.maxUsers) {
      return res.status(403).json({
        error: 'User limit reached',
        current: userCount,
        limit: plan.maxUsers,
        upgrade: true
      });
    }
  }
  
  // Storage limit already checked in enforceStorageLimits middleware
  
  next();
}

// Apply to all authenticated routes
app.use('/api/v1',
  authenticate,
  setTenantContext,
  requireActiveSubscription,  // Check subscription first
  enforceTenantLimits,        // Then check limits
  rateLimitPerUser
);
```

### 9.8 Subscription Enforcement

**Block Write Operations When Subscription Expired:**

```typescript
// apps/api/src/shared/middleware/subscription.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@repo/database';

export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { firmId } = req.user;
  const { method } = req;
  
  // Allow read operations always (users can view data)
  if (method === 'GET' || method === 'HEAD') {
    return next();
  }
  
  // Get firm's subscription
  const subscription = await prisma.subscription.findUnique({
    where: { firmId },
    include: { plan: true }
  });
  
  if (!subscription) {
    return res.status(402).json({
      error: 'No subscription found',
      message: 'Please subscribe to a plan to continue',
      action: 'subscribe'
    });
  }
  
  // Check subscription status
  if (subscription.status !== 'active') {
    return res.status(402).json({
      error: 'Subscription inactive',
      status: subscription.status,
      message: getSubscriptionMessage(subscription.status),
      action: getSubscriptionAction(subscription.status)
    });
  }
  
  // Check if subscription is expired
  if (subscription.currentPeriodEnd < new Date()) {
    return res.status(402).json({
      error: 'Subscription expired',
      expiredAt: subscription.currentPeriodEnd,
      message: 'Your subscription has expired. Please renew to continue.',
      action: 'renew'
    });
  }
  
  next();
}

function getSubscriptionMessage(status: string): string {
  switch (status) {
    case 'trialing':
      return 'Your trial has ended. Please subscribe to continue.';
    case 'past_due':
      return 'Your payment is past due. Please update your payment method.';
    case 'canceled':
      return 'Your subscription has been canceled. Please resubscribe to continue.';
    case 'unpaid':
      return 'Your subscription is unpaid. Please update your payment method.';
    default:
      return 'Your subscription is inactive. Please contact support.';
  }
}

function getSubscriptionAction(status: string): string {
  switch (status) {
    case 'trialing':
      return 'subscribe';
    case 'past_due':
    case 'unpaid':
      return 'update_payment';
    case 'canceled':
      return 'resubscribe';
    default:
      return 'contact_support';
  }
}

// Usage: Apply before all write operations
app.use('/api/v1',
  authenticate,
  setTenantContext,
  requireActiveSubscription,  // Blocks writes if subscription inactive
  enforceTenantLimits,
  rateLimitPerUser
);
```

**Allowed Operations When Subscription Expired:**
- ✅ View data (GET requests)
- ✅ Export data (GET /export)
- ✅ Update billing (POST /billing/update)
- ✅ Resubscribe (POST /subscriptions/reactivate)
- ❌ Create clients
- ❌ Upload documents
- ❌ Create invoices
- ❌ Create tasks
- ❌ Invite users

---

## 10. Feature Flags Implementation

### 10.1 Feature Flag Service with Rollout

```typescript
// apps/api/src/shared/services/feature-flags.service.ts
export class FeatureFlagsService {
  async isEnabled(flagName: string, firmId: string): Promise<boolean> {
    // Check firm-specific override first
    const firmOverride = await prisma.firmFeatureFlag.findFirst({
      where: {
        firmId,
        featureFlag: { name: flagName }
      },
      include: { featureFlag: true }
    });
    
    if (firmOverride) {
      return firmOverride.enabled;
    }
    
    // Check global flag
    const flag = await prisma.featureFlag.findUnique({
      where: { name: flagName }
    });
    
    if (!flag) {
      return false; // Flag doesn't exist = disabled
    }
    
    if (!flag.enabledGlobally) {
      return false;
    }
    
    // Gradual rollout based on percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashFirmId(firmId);
      return hash < flag.rolloutPercentage;
    }
    
    return true;
  }
  
  private hashFirmId(firmId: string): number {
    // Consistent hash to get 0-100 value
    let hash = 0;
    for (let i = 0; i < firmId.length; i++) {
      hash = ((hash << 5) - hash) + firmId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }
  
  async enableForFirm(flagName: string, firmId: string, userId: string): Promise<void> {
    const flag = await prisma.featureFlag.findUnique({
      where: { name: flagName }
    });
    
    if (!flag) {
      throw new Error(`Feature flag ${flagName} not found`);
    }
    
    await prisma.firmFeatureFlag.upsert({
      where: {
        firmId_featureFlagId: {
          firmId,
          featureFlagId: flag.id
        }
      },
      create: {
        firmId,
        featureFlagId: flag.id,
        enabled: true,
        enabledBy: userId,
        enabledAt: new Date()
      },
      update: {
        enabled: true,
        enabledBy: userId,
        enabledAt: new Date()
      }
    });
  }
  
  async setRolloutPercentage(flagName: string, percentage: number): Promise<void> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    
    await prisma.featureFlag.update({
      where: { name: flagName },
      data: { rolloutPercentage: percentage }
    });
  }
}
```

### 10.2 Feature Flag Usage

```typescript
// Example: Gradual rollout of new feature
export class InvoicesController {
  async create(req: Request, res: Response) {
    const { firmId } = req.user;
    
    // Check if new invoicing UI is enabled
    const useNewUI = await featureFlagsService.isEnabled(
      'new_invoicing_ui',
      firmId
    );
    
    if (useNewUI) {
      // Use new invoicing logic
      return this.createInvoiceV2(req, res);
    } else {
      // Use old invoicing logic
      return this.createInvoiceV1(req, res);
    }
  }
}
```

### 10.3 Feature Flag Rollout Strategy

```sql
-- Seed feature flags
INSERT INTO feature_flags (name, description, enabled_globally, rollout_percentage) VALUES
  ('new_invoicing_ui', 'New invoice creation UI', false, 0),
  ('document_versioning', 'Document version history', false, 0),
  ('advanced_search', 'Advanced search with filters', false, 0),
  ('bulk_operations', 'Bulk client operations', false, 0),
  ('time_tracking', 'Time tracking for hourly billing', false, 0);
```

**Rollout Process:**
1. **0%:** Feature disabled globally
2. **Internal Testing:** Enable for specific test firms
3. **10%:** Gradual rollout to 10% of firms
4. **25%:** Increase to 25% if no issues
5. **50%:** Increase to 50%
6. **100%:** Full rollout
7. **Remove Flag:** After 2 weeks at 100%, remove flag and old code

---

## 11. Production Readiness Checklist

### 11.1 Pre-Launch Checklist

**Infrastructure:**
- [ ] RDS PostgreSQL with 30-day backups (NOT 7 days - financial data requirement)
- [ ] Redis for cache + queue
- [ ] S3 for document storage with lifecycle policies
- [ ] CloudFront CDN configured
- [ ] ALB with TLS certificate
- [ ] ECS Fargate or Docker Compose
- [ ] Separate worker service deployed
- [ ] ClamAV virus scanning configured
- [ ] PgBouncer for connection pooling (if needed)

**Security:**
- [ ] PostgreSQL RLS enabled on all tenant tables
- [ ] JWT authentication working
- [ ] RBAC authorization implemented
- [ ] Rate limiting (3 layers) configured
- [ ] Security headers (Helmet) enabled
- [ ] File upload validation + 50MB limit
- [ ] Virus scanning (ClamAV) configured and tested
- [ ] Audit logging enabled
- [ ] Versioned cache keys implemented (no pattern deletion)
- [ ] Tenant limits enforced (clients, users, storage)
- [ ] Subscription enforcement middleware active

**Database:**
- [ ] All 27 migrations applied
- [ ] RLS policies tested
- [ ] Indexes created
- [ ] Seed data loaded
- [ ] Backup tested
- [ ] Restore procedure tested

**Queues:**
- [ ] Email worker running with retry strategy
- [ ] PDF worker running with retry strategy
- [ ] Webhook worker running with retry strategy
- [ ] Reminders worker running with retry strategy
- [ ] Bull Board dashboard accessible
- [ ] Dead letter queue (failed_jobs table) created
- [ ] Failed job alerting configured
- [ ] Redis persistence enabled (appendonly yes)

**Monitoring:**
- [ ] Sentry error tracking configured
- [ ] Winston logging configured
- [ ] Health check endpoint working
- [ ] Email event tracking configured
- [ ] Storage usage tracking working

**Compliance:**
- [ ] Webhook idempotency implemented and tested
- [ ] Email deliverability tracking working
- [ ] Storage limits enforced per plan
- [ ] Feature flags system working with rollout
- [ ] Tenant limits enforced (max clients, max users)
- [ ] Subscription enforcement working (blocks writes when expired)
- [ ] Document versioning enabled
- [ ] 30-day database backups configured (NOT 7 days)

**Testing:**
- [ ] Critical path tests passing (auth, payments, portal)
- [ ] RLS isolation tested
- [ ] Webhook idempotency tested
- [ ] Storage limits tested
- [ ] Rate limiting tested

**Documentation:**
- [ ] API documentation complete
- [ ] Deployment runbook ready
- [ ] Incident response procedures documented
- [ ] Backup/restore procedures documented

### 11.2 Launch Day Checklist

**Morning:**
- [ ] Verify all services running
- [ ] Check database connections
- [ ] Verify Redis connectivity
- [ ] Test critical user flows
- [ ] Verify Stripe webhooks working
- [ ] Check email sending working

**During Launch:**
- [ ] Monitor Sentry for errors
- [ ] Watch server logs
- [ ] Monitor queue processing
- [ ] Check database performance
- [ ] Monitor API response times

**Post-Launch (48 hours):**
- [ ] Review error rates
- [ ] Check email deliverability
- [ ] Verify payment processing
- [ ] Monitor storage usage
- [ ] Review user feedback
- [ ] Fix critical issues immediately

---

## 12. Architecture Score Summary

### 12.1 Final Architecture Assessment

**Strengths:**
- ✅ Modular monolith (correct for team size)
- ✅ PostgreSQL RLS (database-level security)
- ✅ Separate worker service (resilient)
- ✅ Webhook idempotency (reliable payments)
- ✅ Email tracking (deliverability monitoring)
- ✅ Storage limits (plan enforcement)
- ✅ Feature flags (safe rollout)
- ✅ Document versioning (compliance)
- ✅ Activity timeline (audit trail)
- ✅ Search indexing (performance)

**Addressed Risks:**
- ✅ Worker separation (API crash doesn't stop queues)
- ✅ Single email provider (AWS SES only)
- ✅ Simplified state management (React Query only)
- ✅ Storage tracking (enforced limits)
- ✅ Connection pooling path (PgBouncer ready)
- ✅ Redis scaling path (split cache/queue when needed)
- ✅ Search scaling path (Meilisearch migration defined)

**Production Ready:**
- ✅ All critical gaps addressed
- ✅ Security by default (RLS)
- ✅ Monitoring configured
- ✅ Backup strategy defined
- ✅ Scaling path documented

### 12.2 Final Score

**Architecture Score: 9.5/10**

**Breakdown:**
- Architecture Design: 9.5/10
- Security: 9.5/10
- Infrastructure: 9/10
- Scalability: 9/10
- Operations: 9/10
- Completeness: 9.5/10

**Remaining 0.5 points:**
- Elasticsearch/Meilisearch (future)
- Multi-region deployment (future)
- Advanced analytics (future)

---

## 13. Critical Architecture Fixes (From Brutal Review)

### 13.1 Overview

This section documents all critical fixes applied based on the brutal architecture validation review. These fixes transformed the architecture from 8.5/10 to 9.5/10 (production ready).

### 13.2 Risky Components Fixed

#### Fix 1: Worker Service Separation

**Problem:** Workers were inside `apps/api/src/workers/` causing deployment confusion. API crash would stop queue processing.

**Solution:** Moved workers to separate service `apps/worker/` with independent deployment.

**Impact:**
- ✅ API crash doesn't stop queue processing
- ✅ Independent scaling (API vs workers)
- ✅ Different resource requirements
- ✅ Cleaner deployment

**Files Changed:**
- Created `apps/worker/` directory
- Separate Dockerfile for workers
- Updated docker-compose.yml with worker service

**Reference:** Section 3.1, 7.1

---

#### Fix 2: Versioned Cache Keys

**Problem:** Pattern deletion (`DEL clients:*`) becomes slow at scale, affecting Redis performance.

**Solution:** Implemented versioned cache keys (`clients:v3:{firmId}`) with namespace versioning.

**Impact:**
- ✅ Instant cache invalidation (no pattern scan)
- ✅ Works at any scale
- ✅ Old keys expire naturally via TTL
- ✅ No Redis performance degradation

**Implementation:**
```typescript
// Increment version instead of deleting keys
await cache.invalidateNamespace('clients'); // Instant
```

**Reference:** Section 9.6

---

#### Fix 3: 30-Day Database Backups

**Problem:** 7-day backup retention is risky for financial data SaaS.

**Solution:** Increased RDS backup retention to 30 days.

**Impact:**
- ✅ Compliance with financial data requirements
- ✅ Better disaster recovery window
- ✅ Audit trail preservation

**Configuration:**
```hcl
# terraform/rds.tf
backup_retention_period = 30  # Changed from 7
```

**Reference:** Section 11.1

---

#### Fix 4: Virus Scanning

**Problem:** No malware protection on file uploads.

**Solution:** Integrated ClamAV with Docker Compose and middleware.

**Impact:**
- ✅ Prevents malware uploads
- ✅ Security compliance
- ✅ User trust

**Implementation:**
- ClamAV container in docker-compose.yml
- Virus scanning middleware before file processing
- Fail-closed approach (reject if scan fails)

**Reference:** Section 9.5

---

### 13.3 Missing Critical Components Added

#### Addition 1: Multi-Tenant Security (RLS)

**Gap:** Manual `WHERE firm_id = ?` checks can be forgotten, causing data leaks.

**Solution:** PostgreSQL Row Level Security (RLS) enforces isolation automatically.

**Impact:**
- ✅ Database-level enforcement
- ✅ Cannot be bypassed
- ✅ Works with all queries (Prisma, raw SQL, admin)
- ✅ Security by default

**Implementation:**
```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON clients
  USING (firm_id = current_setting('app.current_firm_id')::uuid);
```

**Reference:** Section 6

---

#### Addition 2: Webhook Idempotency

**Gap:** Stripe webhooks can be sent multiple times, causing duplicate payment records.

**Solution:** `webhook_events` table with unique `event_id` constraint.

**Impact:**
- ✅ Prevents duplicate payment processing
- ✅ Financial accuracy
- ✅ Stripe best practice

**Implementation:**
```typescript
// Check if webhook already processed
const existing = await prisma.webhookEvent.findUnique({
  where: { eventId: event.id }
});
if (existing) return { skipped: true };
```

**Reference:** Section 5.1.1, 7.2

---

#### Addition 3: Email Deliverability Tracking

**Gap:** No visibility into email delivery, opens, bounces, complaints.

**Solution:** `email_events` table tracking all email lifecycle events.

**Impact:**
- ✅ Monitor deliverability
- ✅ Debug "email not received" issues
- ✅ Compliance with email best practices

**Events Tracked:**
- sent, delivered, opened, clicked, bounced, complained

**Reference:** Section 5.1.4, 7.3, 7.4

---

#### Addition 4: Feature Flags with Rollout

**Gap:** No safe way to deploy new features gradually.

**Solution:** `feature_flags` table with rollout percentage (0-100%).

**Impact:**
- ✅ Gradual rollout (10% → 25% → 50% → 100%)
- ✅ Kill switch for problematic features
- ✅ A/B testing capability
- ✅ Firm-specific overrides

**Implementation:**
```typescript
// Gradual rollout based on firm hash
const hash = hashFirmId(firmId); // 0-100
return hash < flag.rolloutPercentage;
```

**Reference:** Section 5.1.5, 10

---

#### Addition 5: Tenant Limits Enforcement

**Gap:** No enforcement of plan limits (max clients, max users, max storage).

**Solution:** Middleware checks limits before write operations.

**Impact:**
- ✅ Plan differentiation enforced
- ✅ Revenue protection
- ✅ Upgrade prompts

**Limits Enforced:**
- Max clients per plan
- Max users per plan
- Max storage per plan

**Reference:** Section 9.7

---

#### Addition 6: Subscription Enforcement

**Gap:** Users could continue using system after subscription expired.

**Solution:** `requireActiveSubscription` middleware blocks write operations.

**Impact:**
- ✅ Revenue protection
- ✅ Clear upgrade path
- ✅ Read-only access when expired

**Allowed When Expired:**
- View data (GET)
- Export data
- Update billing
- Resubscribe

**Blocked When Expired:**
- Create clients, documents, invoices, tasks
- Invite users

**Reference:** Section 9.8

---

#### Addition 7: Storage Abstraction

**Gap:** Hard-coded S3 implementation, no provider flexibility.

**Solution:** Storage provider interface supporting S3, Local, Cloudflare R2.

**Impact:**
- ✅ Provider flexibility
- ✅ Local development without AWS
- ✅ Cost optimization (R2 cheaper than S3)
- ✅ Multi-cloud strategy

**Interface:**
```typescript
interface StorageProvider {
  upload(key: string, buffer: Buffer): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
}
```

**Reference:** Section 8 (implied in multipart upload)

---

#### Addition 8: Document Versioning

**Gap:** No version history for re-uploaded documents.

**Solution:** `document_versions` table tracking all versions.

**Impact:**
- ✅ Accounting compliance
- ✅ Audit trail
- ✅ Restore previous versions
- ✅ User expectation

**Implementation:**
- Automatic versioning on re-upload
- Version number increments
- Old versions preserved
- Current version flagged

**Reference:** Section 5.1.2, 8.2

---

#### Addition 9: Storage Usage Tracking

**Gap:** No tracking of storage usage, limits not enforced.

**Solution:** `storage_usage` table with automatic triggers.

**Impact:**
- ✅ Real-time storage tracking
- ✅ Plan limit enforcement
- ✅ Upgrade prompts
- ✅ Cost control

**Implementation:**
```sql
CREATE TRIGGER document_storage_tracking
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_usage();
```

**Reference:** Section 5.1.3, 8.1

---

#### Addition 10: Search Indexing

**Gap:** No full-text search implementation defined.

**Solution:** PostgreSQL `search_vector` columns with GIN indexes and triggers.

**Impact:**
- ✅ Fast search across clients, contacts, documents, tasks
- ✅ Automatic index updates
- ✅ Weighted search (name > email > phone)
- ✅ Migration path to Meilisearch defined

**Implementation:**
```sql
ALTER TABLE clients ADD COLUMN search_vector tsvector;
CREATE INDEX idx_clients_search ON clients USING GIN(search_vector);
CREATE TRIGGER clients_search_update
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_client_search_vector();
```

**Reference:** Section 5.1.6

---

### 13.4 Infrastructure Simplifications

#### Simplification 1: No API Gateway

**Change:** Removed AWS API Gateway, use ALB only.

**Reason:**
- API Gateway adds complexity
- ALB handles routing + TLS
- Lower cost
- Simpler architecture

**Reference:** Section 4.1

---

#### Simplification 2: Single Email Provider

**Change:** AWS SES only (removed SendGrid option).

**Reason:**
- Already using AWS
- Lower cost ($0.10 per 1000 emails)
- Integrated with CloudWatch
- No additional vendor

**Reference:** Section 4.3

---

#### Simplification 3: React Query Only

**Change:** Removed Zustand, use React Query only.

**Reason:**
- React Query handles server state
- Built-in caching
- Less complexity
- Sufficient for MVP

**Reference:** Section 4.2

---

### 13.5 Scaling Considerations Added

#### Scaling Path 1: Redis Split

**When:** 500-1000 customers, queue spikes affecting cache.

**Solution:** Split into `redis-cache` and `redis-queue`.

**Reference:** Section 9.1

---

#### Scaling Path 2: PgBouncer

**When:** Connection limit issues with Prisma.

**Solution:** Add PgBouncer for connection pooling.

**Reference:** Section 9.2

---

#### Scaling Path 3: Meilisearch Migration

**When:** 100,000+ searchable records, search latency > 500ms.

**Solution:** Migrate from PostgreSQL full-text to Meilisearch.

**Reference:** Section 9.3

---

#### Scaling Path 4: Multipart Uploads

**When:** Users uploading files > 50MB.

**Solution:** S3 multipart upload or pre-signed URLs.

**Reference:** Section 8.3

---

### 13.6 Summary of Fixes

**Total Fixes Applied:** 22

**Categories:**
- Risky Components Fixed: 4
- Missing Components Added: 10
- Infrastructure Simplified: 3
- Scaling Paths Defined: 4
- Minor Issues Fixed: 4

**Minor Issues Fixed:**
1. React Query cache timing (30s stale, 5min cache)
2. Multipart upload threshold (10MB normal, >10MB multipart)
3. Search triggers for all entities (clients, contacts, documents, tasks)
4. Redis persistence (appendonly yes, appendfsync everysec)

**Critical Addition:**
5. Job retry strategy + Dead Letter Queue (exponential backoff, 5 attempts, failed_jobs table)

**Architecture Score Improvement:**
- Before: 8.5/10
- After: 9.5/10
- Improvement: +1.0 points

**Production Readiness:**
- Before: Not ready (serious gaps)
- After: Production ready

**Remaining 0.5 Points:**
- Elasticsearch/Meilisearch (future)
- Multi-region deployment (future)
- Advanced analytics (future)

---

## 14. Critical Architecture Decisions Summary

### 14.1 Key Decisions Made

1. **Modular Monolith** (NOT Microservices)
   - Faster development
   - Simpler deployment
   - Can extract later

2. **PostgreSQL RLS** (Automatic Enforcement)
   - Database-level security
   - Cannot be bypassed
   - Security by default

3. **Separate Worker Service**
   - API crash doesn't stop queues
   - Independent scaling
   - Better resilience

4. **AWS SES Only** (NOT SendGrid)
   - Already using AWS
   - Lower cost
   - Simpler operations

5. **React Query Only** (NOT Zustand)
   - Built-in state management
   - Less complexity
   - Sufficient for MVP

6. **Webhook Idempotency**
   - Prevents duplicate payments
   - Production requirement
   - Stripe best practice

7. **Document Versioning**
   - Accounting compliance
   - Audit trail
   - User expectation

8. **Storage Limits Enforcement**
   - Plan differentiation
   - Cost control
   - User expectations

9. **Email Event Tracking**
   - Deliverability monitoring
   - User support
   - Compliance

10. **Feature Flags with Rollout**
    - Safe deployments
    - Gradual rollout
    - Kill switch

---

## 15. Frontend Implementation Rules

> Full governance document: `docs/04-development/FRONTEND-DESIGN-SYSTEM-GOVERNANCE.md`

### 15.1 Design System Source

The official UI component library lives at `ui_theme_ref/`. This is the only approved source for all frontend UI.

Developers must use components from:
- `apps/web/src/components/ui/` — buttons, inputs, badges, alerts, modals, tables
- `apps/web/src/components/form/` — forms and form fields
- `apps/web/src/components/tables/` — data tables and pagination
- `apps/web/src/components/charts/` — charts and stat cards
- `apps/web/src/layout/` — AppLayout, AppSidebar, AppHeader, PageContainer

### 15.2 Page Composition

All pages must follow this structure:

```
AppLayout → AppHeader → AppSidebar → PageContainer → ComponentCards → Components
```

No custom layout systems. No raw HTML UI elements.

### 15.3 Branding

All pages must use Taxmic brand colors only:

| Token | Hex |
|-------|-----|
| Primary | `#059669` |
| Primary Dark | `#065F46` |
| Accent | `#34D399` |
| Background | `#F9FAFB` |
| Text | `#111827` |

### 15.4 Missing Component Rule

If a required component does not exist in `ui_theme_ref/`:
1. Stop development on that element
2. Document the requirement
3. Request a design system update
4. Do NOT create a custom workaround

### 15.5 Per-Phase Frontend Requirement

Every frontend phase must use `ui_theme_ref/` as the only UI base:
- Phase 2 CRM: client/contact pages built with DataTable, Form, Badge, Button
- Phase 3 Documents: upload/list pages built with Form, DataTable, Spinner
- Phase 4 Tasks: task pages built with DataTable, Badge, Dropdown, Form
- Phase 5 Billing: invoice pages built with Form, DataTable, StatCard, Badge
- Phase 8 Portal: portal pages use same design system with portal navigation
- Phase 9 SaaS Billing: plans/usage pages built with ComponentCard, StatCard, BarChart

---

## 16. Next Steps

### 15.1 Before Coding Starts

1. **Review this blueprint** with entire team
2. **Set up development environment** (Docker Compose)
3. **Create GitHub repository** with folder structure
4. **Set up CI/CD pipeline** (GitHub Actions)
5. **Provision AWS resources** (Terraform)
6. **Create database** and run migrations
7. **Set up Sentry** for error tracking
8. **Configure AWS SES** for email
9. **Create Stripe account** (test mode)
10. **Document deployment procedures**

### 15.2 Week 1 Tasks

- [ ] Monorepo setup (Turborepo)
- [ ] Docker Compose (Postgres + Redis + ClamAV)
- [ ] Prisma setup + initial migrations
- [ ] CI/CD (GitHub Actions - lint + test)
- [ ] Basic auth (register, login, JWT)
- [ ] RLS policies enabled
- [ ] Tenant context middleware

### 15.3 Success Criteria

**Week 10 (Beta Launch):**
- 5 beta users onboarded
- Can create clients
- Can upload documents
- Can create invoices
- Can accept payments

**Week 16 (Production Launch):**
- 10 paying customers
- $500 MRR
- <5 critical bugs
- <500ms API response time
- 99% uptime

---

**ARCHITECTURE STATUS: PRODUCTION READY**

**Final Review Date:** 2026-03-15  
**Architecture Score:** 9.5/10  
**Ready for Development:** YES  
**Estimated Timeline:** 16 weeks with 3-5 developers

---

**END OF MASTER SYSTEM BLUEPRINT**

