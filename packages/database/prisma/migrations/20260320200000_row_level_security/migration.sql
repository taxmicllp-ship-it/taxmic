-- =============================================================================
-- Migration: Row Level Security (RLS) — Multi-Tenant Isolation
-- =============================================================================
-- IMPORTANT: This migration enables database-level tenant isolation.
-- Application-level firm_id filtering remains in place as defence-in-depth.
--
-- HOW TO APPLY:
--   Run as the database SUPERUSER or a role with BYPASSRLS privilege.
--   The application role (taxmic_user) must NOT have BYPASSRLS.
--
-- APPLY COMMAND:
--   psql $DATABASE_URL -f this_file.sql
--
-- VERIFICATION:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND rowsecurity = true;
-- =============================================================================

-- Set the application role that the API uses.
-- All RLS policies below grant access only when app.current_firm_id matches firm_id.
-- The API sets this via: SET LOCAL app.current_firm_id = '<firmId>';
-- (Add this to the tenantContext middleware — see apps/api/src/shared/middleware/tenant-context.ts)

-- =============================================================================
-- CLIENTS
-- =============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_tenant_isolation ON clients;
CREATE POLICY clients_tenant_isolation ON clients
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- CONTACTS
-- =============================================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_tenant_isolation ON contacts;
CREATE POLICY contacts_tenant_isolation ON contacts
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- CLIENT_CONTACTS (join table)
-- =============================================================================
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_contacts_tenant_isolation ON client_contacts;
CREATE POLICY client_contacts_tenant_isolation ON client_contacts
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- DOCUMENTS
-- =============================================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_tenant_isolation ON documents;
CREATE POLICY documents_tenant_isolation ON documents
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- FOLDERS
-- =============================================================================
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS folders_tenant_isolation ON folders;
CREATE POLICY folders_tenant_isolation ON folders
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- TASKS
-- =============================================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_tenant_isolation ON tasks;
CREATE POLICY tasks_tenant_isolation ON tasks
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- INVOICES
-- =============================================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoices_tenant_isolation ON invoices;
CREATE POLICY invoices_tenant_isolation ON invoices
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- INVOICE_ITEMS
-- =============================================================================
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoice_items_tenant_isolation ON invoice_items;
CREATE POLICY invoice_items_tenant_isolation ON invoice_items
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE firm_id::text = current_setting('app.current_firm_id', true)
    )
  );

-- =============================================================================
-- PAYMENTS
-- =============================================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_tenant_isolation ON payments;
CREATE POLICY payments_tenant_isolation ON payments
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_tenant_isolation ON notifications;
CREATE POLICY notifications_tenant_isolation ON notifications
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- EMAIL_EVENTS
-- =============================================================================
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_events_tenant_isolation ON email_events;
CREATE POLICY email_events_tenant_isolation ON email_events
  USING (
    firm_id IS NULL
    OR firm_id::text = current_setting('app.current_firm_id', true)
  );

-- =============================================================================
-- PORTAL_CLIENT_USERS
-- =============================================================================
ALTER TABLE portal_client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_client_users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_client_users_tenant_isolation ON portal_client_users;
CREATE POLICY portal_client_users_tenant_isolation ON portal_client_users
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_tenant_isolation ON subscriptions;
CREATE POLICY subscriptions_tenant_isolation ON subscriptions
  USING (firm_id::text = current_setting('app.current_firm_id', true));

-- =============================================================================
-- NOTE: The following tables are NOT tenant-scoped and do NOT get RLS:
--   - firms          (global, accessed by firm_id PK only)
--   - users          (global, accessed by firm_id FK — app-level filter sufficient)
--   - plans          (global, public read)
--   - webhook_events (global, processed by webhook handler with no tenant context)
--   - audit_logs     (global, security log — must not be filtered by tenant)
-- =============================================================================
