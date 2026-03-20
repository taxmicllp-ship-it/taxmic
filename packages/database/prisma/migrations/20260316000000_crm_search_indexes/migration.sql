-- Migration: CRM Search Optimization
-- Adds pg_trgm extension and trigram indexes for fast ILIKE search
-- on clients and contacts at scale (500k+ clients, 2M+ contacts)
-- Prisma schema is NOT modified — these are database-level optimizations only.

-- Step 1: Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: Trigram index on clients.name for fast ILIKE '%term%' search
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm
  ON clients
  USING gin (name gin_trgm_ops);

-- Step 3: Trigram index on contacts.name for fast ILIKE '%term%' search
-- Note: contacts table uses a single 'name' column (not first_name/last_name)
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm
  ON contacts
  USING gin (name gin_trgm_ops);

-- Step 4: Composite index on clients (firm_id, name) for tenant-scoped name search
-- Ensures WHERE firm_id = ? AND name ILIKE ? uses index scan not sequential scan
CREATE INDEX IF NOT EXISTS idx_clients_firm_id_name
  ON clients (firm_id, name);

-- Step 5: contacts_firm_id_idx already exists — no duplicate needed
-- Verified: contacts_firm_id_idx btree (firm_id) already present
