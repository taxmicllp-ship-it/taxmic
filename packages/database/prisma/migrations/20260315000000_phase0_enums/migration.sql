-- =============================================================================
-- PHASE 0: ENUMs
-- Must run before any table creation. All subsequent phases depend on these types.
-- =============================================================================

-- Lock and statement timeouts (required on all migration files)
SET lock_timeout = '5s';
SET statement_timeout = '30s';

-- -----------------------------------------------------------------------------
-- 1. client_status_enum
-- Used by: clients.status
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE client_status_enum AS ENUM ('active', 'inactive', 'archived', 'lead');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2. client_type_enum
-- Used by: clients.type
-- -------------------