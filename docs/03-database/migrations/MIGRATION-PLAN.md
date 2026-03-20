# Database Migration Plan

**Date:** 2026-03-15
**Schema Version:** 1.0 FINAL
**Tables:** 36 | **ENUMs:** 11 | **Phases:** 9
**Source of Truth:** `packages/database/prisma/schema.prisma`

---

## Overview

Migrations must be executed in phase order. Each phase depends on the tables created in the previous phase. Do not reorder.

```
Phase 0 → ENUMs (must run before any table)
Phase 1 → Foundation (firms, users, roles, permissions, settings)
Phase 2 → CRM (clients, contacts, join tables)
Phase 3 → Documents (folders, documents, versions, permissions)
Phase 4 → Tasks (tasks, assignments, comments)
Phase 5 → Billing (invoice_sequences, invoices, items, payments)
Phase 6 → Notifications (notifications, email_events)
Phase 7 → Portal (client_users, portal_sessions)
Phase 8 → SaaS Billing (plans, subscriptions, events)
Phase 9 → Observability (activity_events, webhooks, flags, storage, failed_jobs)
```

---

## Rules

- Run `prisma validate` before every migration
- Run `prisma format` to normalize the schema
- Run `prisma generate` after every migration to update the client
- Do NOT run `prisma migrate` in production without a backup
- Raw SQL (CHECK constraints, partial indexes, triggers, functions) must be added as custom SQL in each migration file after Prisma generates the base DDL

---

## Phase 0 — ENUMs

**Must run first. All subsequent phases depend on these types.**

```sql
CREATE TYPE client_status_enum   AS ENUM ('active', 'inactive', 'archived', 'lead');
CREATE TYPE client_type_enum     AS ENUM ('individual', 'business', 'nonprofit');
CREATE TYPE task_status_enum     AS ENUM ('new', 'in_progress', 'waiting_client', 'review', 'completed');
CREATE TYPE task_priority_enum   AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE invoice_status_enum  AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method_enum  AS ENUM ('stripe', 'check', 'cash', 'wire', 'other');
CREATE TYPE payment_status_enum  AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_status_enum AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');
CREATE TYPE document_visibility_enum AS ENUM ('internal', 'client');
CREATE TYPE notification_type_enum   AS ENUM ('task_assigned', 'task_completed', 'invoice_sent', 'invoice_paid', 'document_uploaded', 'comment_added', 'user_invited');
CREATE TYPE email_event_type_enum    AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained');
```

**Tables created:** 0 (types only)
**Dependencies:** none

---

## Phase 1 — Foundation

**Tables:** firms, users, roles, permissions, role_permissions, user_roles, firm_settings, user_settings

**Dependency order within phase:**
1. firms
2. roles
3. permissions
4. users (depends on firms)
5. role_permissions (depends on roles, permissions)
6. user_roles (depends on users, roles, firms)
7. firm_settings (depends on firms)
8. user_settings (depends on users)

**Custom SQL to append after Prisma migration:**

```sql
-- Partial unique index: one active email per firm
CREATE UNIQUE INDEX users_firm_email_unique
  ON users(firm_id, email)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings  ENABLE ROW LEVEL SECURITY;
```

**Seed data required:**
```sql
-- System roles
INSERT INTO roles (id, name, description, is_system) VALUES
  (gen_random_uuid(), 'owner',   'Firm owner — full access',      true),
  (gen_random_uuid(), 'admin',   'Firm admin — manage users',     true),
  (gen_random_uuid(), 'member',  'Standard staff member',         true),
  (gen_random_uuid(), 'viewer',  'Read-only access',              true);

-- Core permissions (resource:action pattern)
INSERT INTO permissions (id, name, resource, action) VALUES
  (gen_random_uuid(), 'clients:read',    'clients',   'read'),
  (gen_random_uuid(), 'clients:write',   'clients',   'write'),
  (gen_random_uuid(), 'clients:delete',  'clients',   'delete'),
  (gen_random_uuid(), 'documents:read',  'documents', 'read'),
  (gen_random_uuid(), 'documents:write', 'documents', 'write'),
  (gen_random_uuid(), 'tasks:read',      'tasks',     'read'),
  (gen_random_uuid(), 'tasks:write',     'tasks',     'write'),
  (gen_random_uuid(), 'invoices:read',   'invoices',  'read'),
  (gen_random_uuid(), 'invoices:write',  'invoices',  'write'),
  (gen_random_uuid(), 'users:read',      'users',     'read'),
  (gen_random_uuid(), 'users:write',     'users',     'write');
```

---

## Phase 2 — CRM

**Tables:** clients, contacts, client_contacts, client_addresses

**Dependency order within phase:**
1. clients (depends on firms)
2. contacts (depends on firms)
3. client_contacts (depends on firms, clients, contacts)
4. client_addresses (depends on firms, clients)

**Custom SQL to append after Prisma migration:**

```sql
-- Partial unique index: one active email per firm per contact
-- Prisma cannot express partial indexes on nullable columns
CREATE UNIQUE INDEX contacts_firm_email_unique
  ON contacts(firm_id, email)
  WHERE email IS NOT NULL AND deleted_at IS NULL;

-- Full-text search vectors (trigger-maintained)
ALTER TABLE clients  ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX clients_search_idx  ON clients  USING GIN(search_vector);
CREATE INDEX contacts_search_idx ON contacts USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_clients_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.email, '') || ' ' ||
    coalesce(NEW.notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_search_vector_update
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_clients_search_vector();

CREATE OR REPLACE FUNCTION update_contacts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.email, '') || ' ' ||
    coalesce(NEW.notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_search_vector_update
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_contacts_search_vector();

-- RLS
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;
```

---

## Phase 3 — Documents

**Tables:** folders, documents, document_versions, document_permissions

**Dependency order within phase:**
1. folders (depends on firms, clients; self-referencing parent_id)
2. documents (depends on firms, clients, folders, users)
3. document_versions (depends on documents, users)
4. document_permissions (depends on documents)

**Custom SQL to append after Prisma migration:**

```sql
-- Full-text search vector
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX documents_search_idx ON documents USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.filename, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_search_vector_update
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_documents_search_vector();

-- Partial index: current document version
CREATE INDEX document_versions_current_idx
  ON document_versions(document_id)
  WHERE is_current = true;

-- RLS
ALTER TABLE folders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
```

---

## Phase 4 — Tasks

**Tables:** tasks, task_assignments, task_comments

**Dependency order within phase:**
1. tasks (depends on firms, clients, users)
2. task_assignments (depends on tasks, users)
3. task_comments (depends on tasks, users)

**Custom SQL to append after Prisma migration:**

```sql
-- Full-text search vector
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX tasks_search_idx ON tasks USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_tasks_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_search_vector_update
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_tasks_search_vector();

-- RLS
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments    ENABLE ROW LEVEL SECURITY;
```

---

## Phase 5 — Billing

**Tables:** invoice_sequences, invoices, invoice_items, payments

**Dependency order within phase:**
1. invoice_sequences (depends on firms)
2. invoices (depends on firms, clients)
3. invoice_items (depends on invoices)
4. payments (depends on firms, invoices)

**Custom SQL to append after Prisma migration:**

```sql
-- Atomic invoice number generation function
-- Uses INSERT ... ON CONFLICT DO UPDATE RETURNING — inherently atomic, no SELECT FOR UPDATE needed
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_firm_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO invoice_sequences (firm_id, last_number, created_at, updated_at)
    VALUES (p_firm_id, 1, now(), now())
    ON CONFLICT (firm_id) DO UPDATE
      SET last_number = invoice_sequences.last_number + 1,
          updated_at  = now()
    RETURNING last_number INTO v_next;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- CHECK constraints on invoice_items
ALTER TABLE invoice_items
  ADD CONSTRAINT invoice_items_quantity_positive  CHECK (quantity > 0),
  ADD CONSTRAINT invoice_items_unit_price_nonneg  CHECK (unit_price >= 0),
  ADD CONSTRAINT invoice_items_amount_nonneg      CHECK (amount >= 0);

-- CHECK constraints on invoices
ALTER TABLE invoices
  ADD CONSTRAINT invoices_total_amount_nonneg  CHECK (total_amount >= 0),
  ADD CONSTRAINT invoices_paid_amount_nonneg   CHECK (paid_amount >= 0),
  ADD CONSTRAINT invoices_paid_lte_total       CHECK (paid_amount <= total_amount);

-- Partial unique index: active invoice numbers per firm
CREATE UNIQUE INDEX invoices_firm_number_unique
  ON invoices(firm_id, number)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
```

---

## Phase 6 — Notifications

**Tables:** notifications, email_events

**Dependency order within phase:**
1. notifications (depends on firms, users)
2. email_events (depends on firms — nullable)

**Custom SQL to append after Prisma migration:**

```sql
-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events  ENABLE ROW LEVEL SECURITY;
```

---

## Phase 7 — Client Portal

**Tables:** client_users, portal_sessions

**Dependency order within phase:**
1. client_users (depends on clients)
2. portal_sessions (depends on client_users)

**Custom SQL to append after Prisma migration:**

```sql
-- Partial unique index: one active email per client
CREATE UNIQUE INDEX client_users_client_email_unique
  ON client_users(client_id, email)
  WHERE deleted_at IS NULL;

-- RLS (via clients → firm_id)
ALTER TABLE client_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;
```

---

## Phase 8 — SaaS Billing

**Tables:** plans, subscriptions, subscription_events

**Dependency order within phase:**
1. plans (no dependencies — system table)
2. subscriptions (depends on firms, plans)
3. subscription_events (depends on subscriptions)

**Custom SQL to append after Prisma migration:**

```sql
-- CHECK: rollout_percentage range (on feature_flags — added here for convenience)
-- Note: feature_flags table is created in Phase 9 but this constraint can be deferred

-- Seed: subscription plans
INSERT INTO plans (id, name, slug, description, price_monthly, price_annual, max_clients, max_users, max_storage_gb, is_active, sort_order) VALUES
  (gen_random_uuid(), 'Starter',      'starter',      'For solo practitioners',    29.00,  290.00,  50,   3,   10,  true, 1),
  (gen_random_uuid(), 'Professional', 'professional', 'For growing firms',         99.00,  990.00,  250,  10,  50,  true, 2),
  (gen_random_uuid(), 'Enterprise',   'enterprise',   'For large practices',       299.00, 2990.00, NULL, NULL, NULL, true, 3);
```

---

## Phase 9 — System & Observability

**Tables:** activity_events, webhook_events, feature_flags, firm_feature_flags, storage_usage, failed_jobs

**Dependency order within phase:**
1. webhook_events (no dependencies — system table)
2. feature_flags (no dependencies — system table)
3. failed_jobs (depends on users — nullable)
4. storage_usage (depends on firms)
5. activity_events (depends on firms, clients, users, client_users)
6. firm_feature_flags (depends on firms, feature_flags, users)

**Custom SQL to append after Prisma migration:**

```sql
-- XOR CHECK constraint on activity_events
-- Exactly one actor must be set: either a staff user or a client portal user
ALTER TABLE activity_events
  ADD CONSTRAINT activity_events_actor_xor CHECK (
    (actor_user_id IS NOT NULL AND actor_client_user_id IS NULL)
    OR
    (actor_user_id IS NULL AND actor_client_user_id IS NOT NULL)
  );

-- CHECK: feature flag rollout percentage range
ALTER TABLE feature_flags
  ADD CONSTRAINT feature_flags_rollout_range CHECK (
    rollout_percentage >= 0 AND rollout_percentage <= 100
  );

-- Partial index: unresolved failed jobs
CREATE INDEX failed_jobs_unresolved_idx
  ON failed_jobs(failed_at)
  WHERE resolved_at IS NULL;

-- Storage usage trigger: auto-update on document insert/delete
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO storage_usage (firm_id, total_bytes, document_count, last_calculated_at, created_at, updated_at)
      VALUES (NEW.firm_id, NEW.size_bytes, 1, now(), now(), now())
      ON CONFLICT (firm_id) DO UPDATE
        SET total_bytes        = storage_usage.total_bytes + NEW.size_bytes,
            document_count     = storage_usage.document_count + 1,
            last_calculated_at = now(),
            updated_at         = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE storage_usage
      SET total_bytes        = GREATEST(0, total_bytes - OLD.size_bytes),
          document_count     = GREATEST(0, document_count - 1),
          last_calculated_at = now(),
          updated_at         = now()
      WHERE firm_id = OLD.firm_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_storage_usage_update
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_storage_usage();

-- RLS
ALTER TABLE activity_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_usage      ENABLE ROW LEVEL SECURITY;
```

---

## RLS Policy Templates

After enabling RLS on each table, create policies. Template for firm-scoped tables:

```sql
-- Example: clients table
CREATE POLICY clients_firm_isolation ON clients
  USING (firm_id = current_setting('app.current_firm_id')::uuid);

-- Example: documents table
CREATE POLICY documents_firm_isolation ON documents
  USING (firm_id = current_setting('app.current_firm_id')::uuid);
```

The application must set `app.current_firm_id` at the start of each request:
```sql
SET LOCAL app.current_firm_id = '<firm_uuid>';
```

---

## Migration Execution Checklist

Before running each phase:
- [ ] `prisma validate` passes
- [ ] Previous phase migration confirmed applied
- [ ] Database backup taken (staging/production)

After running each phase:
- [ ] `prisma generate` run to update client
- [ ] Custom SQL appended and executed
- [ ] Seed data inserted (phases 1, 8)
- [ ] Basic smoke test: insert + select on new tables

---

## File Naming Convention

```
migrations/
  0000_enums.sql
  0001_phase1_foundation.sql
  0002_phase2_crm.sql
  0003_phase3_documents.sql
  0004_phase4_tasks.sql
  0005_phase5_billing.sql
  0006_phase6_notifications.sql
  0007_phase7_portal.sql
  0008_phase8_saas_billing.sql
  0009_phase9_observability.sql
  0010_rls_policies.sql
```

---

**Migration Plan Status:** READY
**Blocking Issues:** 0
**Next Step:** Generate Prisma migrations with `prisma migrate dev --name phase1_foundation`
