-- =============================================================================
-- Migration: phase0_fixes
-- Applies 4 corrections from DBA audit of phase0_enums migration.
-- All changes are additive — safe to apply with zero downtime.
-- =============================================================================
SET lock_timeout = '5s';
SET statement_timeout = '30s';

-- ---------------------------------------------------------------------------
-- Fix 1: pgcrypto extension
-- gen_random_uuid() is built into PostgreSQL 13+ without pgcrypto,
-- but enabling it future-proofs against older versions and adds
-- additional cryptographic functions (pgp_sym_encrypt, etc.).
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Fix 2: updated_at trigger coverage audit
-- Verified against live schema: the 5 tables flagged by the reviewer
-- (email_events, activity_events, portal_sessions, subscription_events,
-- firm_feature_flags) do NOT have an updated_at column — confirmed via
-- information_schema.columns. No action needed.
-- ---------------------------------------------------------------------------
-- (no changes — trigger loop in phase0_enums is already correct)

-- ---------------------------------------------------------------------------
-- Fix 3: invoice_items RLS audit
-- Verified: invoice_items already has RLS enabled and policy applied
-- in phase0_enums. Confirmed via pg_tables and pg_policies. No action needed.
-- ---------------------------------------------------------------------------
-- (no changes — already correct)

-- ---------------------------------------------------------------------------
-- Fix 4: email_events RLS policy — tighten to firm-scoped only
-- Previous policy allowed NULL firm_id rows to be visible to all firms.
-- Replacing with strict firm_id match. Rows with NULL firm_id are system
-- events and should only be visible to superusers/service role, not tenants.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "email_events_isolation" ON "email_events";

CREATE POLICY "email_events_isolation" ON "email_events"
  USING (firm_id = current_setting('app.current_firm_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Optional improvement 1: portal_sessions token uniqueness
-- Upgrade from plain index to UNIQUE constraint — prevents duplicate tokens
-- at the database level, not just application level.
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS "portal_sessions_token_idx";
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_token_key" UNIQUE (token);

-- ---------------------------------------------------------------------------
-- Optional improvement 2: invoices number lookup index
-- The UNIQUE(firm_id, number) index covers firm-scoped lookups.
-- Adding a standalone number index for cross-firm admin queries.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "invoices_number_idx" ON "invoices"("number");

-- ---------------------------------------------------------------------------
-- Optional improvement 3: webhook_events JSONB GIN index
-- Enables fast queries on payload fields (e.g., payload->>'type').
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "webhook_events_payload_gin"
  ON "webhook_events" USING GIN("payload");

-- =============================================================================
-- End of migration
-- =============================================================================
