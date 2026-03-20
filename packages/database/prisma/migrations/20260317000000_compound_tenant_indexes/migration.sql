-- =============================================================================
-- Migration: compound_tenant_indexes
-- Adds tenant-first compound indexes across all major query paths.
-- Strategy: firm_id always leads. Compound indexes replace or supplement
-- single-column indexes where the query planner benefits from index-only scans.
--
-- Safety:
--   CREATE INDEX — zero downtime, no table lock.
--   IF NOT EXISTS — idempotent, safe to re-run.
--   lock_timeout / statement_timeout — abort if locks cannot be acquired.
--
-- NOTE: CONCURRENTLY removed — Prisma runs migrations inside transactions.
-- Indexes are created with a brief table lock (acceptable for dev/beta).
-- =============================================================================

SET lock_timeout = '5s';
SET statement_timeout = '120s';

-- =============================================================================
-- CLIENTS
-- Existing: clients_firm_id_idx (firm_id), clients_status_idx (status)
-- Missing:  (firm_id, created_at DESC) for default list sort
--           (firm_id, status) for active/inactive filter
-- =============================================================================

-- Default list: WHERE firm_id = ? ORDER BY created_at DESC LIMIT 20
CREATE INDEX IF NOT EXISTS idx_clients_firm_created_at
  ON clients (firm_id, created_at DESC);

-- Status filter: WHERE firm_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_clients_firm_status
  ON clients (firm_id, status);

-- =============================================================================
-- CONTACTS
-- Existing: contacts_firm_id_idx (firm_id)
-- Missing:  (firm_id, created_at DESC) for default list sort
-- =============================================================================

-- Default list: WHERE firm_id = ? ORDER BY created_at DESC LIMIT 20
CREATE INDEX IF NOT EXISTS idx_contacts_firm_created_at
  ON contacts (firm_id, created_at DESC);

-- =============================================================================
-- DOCUMENTS
-- Existing: documents_firm_id_idx, documents_firm_id_client_id_idx,
--           documents_created_at_idx
-- Missing:  (firm_id, created_at DESC) for default list sort
-- =============================================================================

-- Default list: WHERE firm_id = ? ORDER BY created_at DESC LIMIT 20
CREATE INDEX IF NOT EXISTS idx_documents_firm_created_at
  ON documents (firm_id, created_at DESC);

-- =============================================================================
-- TASKS
-- Existing: tasks_firm_id_status_due_date_idx (firm_id, status, due_date)
-- Missing:  (firm_id, created_at DESC) for default list sort
-- =============================================================================

-- Default list: WHERE firm_id = ? ORDER BY created_at DESC LIMIT 20
CREATE INDEX IF NOT EXISTS idx_tasks_firm_created_at
  ON tasks (firm_id, created_at DESC);

-- =============================================================================
-- INVOICES
-- Existing: invoices_firm_id_status_due_date_idx (firm_id, status, due_date)
-- Adding:   partial index for unpaid invoices — dashboard "outstanding" query
-- =============================================================================

-- Partial index: WHERE firm_id = ? AND status IN ('sent', 'overdue') ORDER BY created_at DESC
-- Covers the dashboard outstanding invoices widget — extremely hot query path
-- Note: invoice_status_enum has no 'unpaid' value; outstanding = sent + overdue
CREATE INDEX IF NOT EXISTS idx_invoices_firm_outstanding
  ON invoices (firm_id, created_at DESC)
  WHERE status IN ('sent', 'overdue');

-- Partial index: WHERE firm_id = ? AND status = 'sent' ORDER BY due_date
-- Covers overdue detection queries
CREATE INDEX IF NOT EXISTS idx_invoices_firm_sent
  ON invoices (firm_id, due_date)
  WHERE status = 'sent';

-- =============================================================================
-- PAYMENTS
-- Existing: payments_firm_id_idx, payments_created_at_idx
-- Missing:  (firm_id, created_at DESC) for default list sort
-- =============================================================================

-- Default list: WHERE firm_id = ? ORDER BY created_at DESC LIMIT 20
CREATE INDEX IF NOT EXISTS idx_payments_firm_created_at
  ON payments (firm_id, created_at DESC);

-- =============================================================================
-- NOTIFICATIONS
-- Existing: notifications_user_id_is_read_created_at_idx
--           (user_id, is_read, created_at) — missing firm_id as leader
-- Fix:      drop old index, add firm_id-first compound index
-- =============================================================================

-- Drop the existing index that violates tenant-first rule
-- (user_id leads instead of firm_id — wrong for multi-tenant queries)
DROP INDEX IF EXISTS notifications_user_id_is_read_created_at_idx;

-- Correct tenant-first compound index for the primary notification query:
-- WHERE firm_id = ? AND user_id = ? ORDER BY created_at DESC
-- Optionally filtered by is_read
CREATE INDEX IF NOT EXISTS idx_notifications_firm_user_created_at
  ON notifications (firm_id, user_id, created_at DESC);

-- Partial index for unread notifications — the most common UI query
-- WHERE firm_id = ? AND user_id = ? AND is_read = false
CREATE INDEX IF NOT EXISTS idx_notifications_firm_user_unread
  ON notifications (firm_id, user_id, created_at DESC)
  WHERE is_read = false;

-- =============================================================================
-- JOIN TABLE AUDIT
-- Verify all join tables have correct compound indexes.
-- =============================================================================

-- client_contacts: already has (firm_id), (client_id), (contact_id)
-- Adding (firm_id, client_id) for "all contacts for a client within a firm"
CREATE INDEX IF NOT EXISTS idx_client_contacts_firm_client
  ON client_contacts (firm_id, client_id);

-- task_assignments: already has (task_id), (user_id)
-- Adding (user_id, task_id) for "all tasks assigned to a user" — reverse lookup
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_task
  ON task_assignments (user_id, task_id);

-- =============================================================================
-- End of migration
-- =============================================================================
