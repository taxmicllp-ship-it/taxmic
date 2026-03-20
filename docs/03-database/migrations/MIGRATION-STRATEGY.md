# MIGRATION STRATEGY DOCUMENT

**Date:** 2026-03-15
**Schema Version:** 1.0 FINAL
**Tables:** 36 | **ENUMs:** 11 | **Phases:** 9
**Status:** PRE-MIGRATION — READY TO EXECUTE

---

## Purpose

This document defines the rules, procedures, and safety protocols for executing database migrations.
It is a companion to `MIGRATION-PLAN.md`, which contains the SQL.

`MIGRATION-PLAN.md` answers: *what* to run.
This document answers: *how* to run it safely.

---

## 1. Migration Phases Overview

```
Phase 0  ENUMs                  — types only, no tables
Phase 1  Foundation             — firms, users, roles, permissions, settings
Phase 2  CRM                    — clients, contacts, join tables
Phase 3  Documents              — folders, documents, versions, permissions
Phase 4  Tasks                  — tasks, assignments, comments
Phase 5  Billing                — invoice_sequences, invoices, items, payments
Phase 6  Notifications          — notifications, email_events
Phase 7  Portal                 — client_users, portal_sessions
Phase 8  SaaS Billing           — plans, subscriptions, events
Phase 9  Observability          — activity_events, webhooks, flags, storage, failed_jobs
Phase 10 Post-migration SQL     — RLS policies, GIN indexes, CHECK constraints, triggers
```

**Rule:** Phases must run in order. Never skip a phase. Never reorder.

---

## 2. Environment Tiers

| Tier | Purpose | Migration Policy |
|------|---------|-----------------|
| local | Developer machine | Run freely, reset anytime |
| staging | Pre-production validation | Run before every production deploy |
| production | Live system | Requires approval + backup + runbook |

**Rule:** Every migration must pass staging before production.

---

## 3. Pre-Migration Checklist

Run this checklist before executing any migration in staging or production.

### 3.1 Schema Validation

```bash
# Rebuild generated schema from domain files
./scripts/build-prisma-schema.sh

# Validate schema
cd packages/database
DATABASE_URL="..." ./node_modules/.bin/prisma validate
```

Expected output: `The schema at prisma/schema.prisma is valid 🚀`

If validation fails: **STOP. Do not proceed.**

### 3.2 Backup

**Staging:**
```bash
pg_dump $DATABASE_URL > backups/staging_$(date +%Y%m%d_%H%M%S).sql
```

**Production:**
```bash
pg_dump $DATABASE_URL > backups/production_$(date +%Y%m%d_%H%M%S).sql
```

**Rule:** Never run a production migration without a backup taken within the last 30 minutes.

### 3.3 Dependency Check

Confirm the previous phase migration was applied:

```sql
-- Check migration history (Prisma tracks this in _prisma_migrations table)
SELECT migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
ORDER BY started_at DESC
LIMIT 10;
```

### 3.4 Drift Check

```bash
DATABASE_URL="$PROD_DATABASE_URL" ./node_modules/.bin/prisma migrate status
```

Expected: `Database schema is up to date!`

If drift is detected: **STOP. Do not proceed.** See Section 7.1d.

### 3.5 Scale Down Application

Before production migration, scale application instances to minimum (see Section 7.1c).

### 3.6 Dry Run

For production migrations, always run a dry run first:

```bash
DATABASE_URL="..." ./node_modules/.bin/prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

Review the generated SQL before applying.

---

## 4. Migration Execution Procedure

### 4.1 Local / Staging

```bash
# Step 1: Rebuild schema
./scripts/build-prisma-schema.sh

# Step 2: Validate
cd packages/database
DATABASE_URL="..." ./node_modules/.bin/prisma validate

# Step 3: Run migration
DATABASE_URL="..." ./node_modules/.bin/prisma migrate dev --name <phase_name>

# Step 4: Apply custom SQL (GIN indexes, CHECK constraints, RLS, triggers)
# See MIGRATION-PLAN.md for the SQL per phase
DATABASE_URL="..." psql -f migrations/custom/<phase>.sql

# Step 5: Regenerate client
DATABASE_URL="..." ./node_modules/.bin/prisma generate

# Step 6: Smoke test
# Run basic insert + select on new tables
```

### 4.2 Production

```bash
# Step 1: Take backup
pg_dump $DATABASE_URL > backups/production_$(date +%Y%m%d_%H%M%S).sql

# Step 2: Rebuild and validate schema
./scripts/build-prisma-schema.sh
cd packages/database
DATABASE_URL="$PROD_DATABASE_URL" ./node_modules/.bin/prisma validate

# Step 3: Apply migration (deploy mode — no interactive prompts)
DATABASE_URL="$PROD_DATABASE_URL" ./node_modules/.bin/prisma migrate deploy

# Step 4: Apply custom SQL
DATABASE_URL="$PROD_DATABASE_URL" psql -f migrations/custom/<phase>.sql

# Step 5: Regenerate client
DATABASE_URL="$PROD_DATABASE_URL" ./node_modules/.bin/prisma generate

# Step 6: Verify
DATABASE_URL="$PROD_DATABASE_URL" psql -c "\dt" | grep -c "table"
# Expected: 36 tables
```

**Note:** `prisma migrate deploy` is used in production (not `migrate dev`). It applies pending migrations without prompting and never resets the database.

---

## 5. Rollback Strategy

### 5.1 Rollback Decision Tree

```
Migration failed?
│
├── Failed before any data was written?
│   └── Restore from backup → SAFE
│
├── Failed mid-migration (partial apply)?
│   └── Restore from backup → SAFE
│   └── Do NOT attempt to manually undo — restore is safer
│
└── Migration applied but application broken?
    ├── Is the change additive (new table, new column)?
    │   └── Deploy previous application version → SAFE
    │   └── New table/column is unused by old code → no data loss
    │
    └── Is the change destructive (dropped column, renamed column)?
        └── Restore from backup → ONLY OPTION
        └── This is why destructive changes are forbidden (see Section 7)
```

### 5.2 Rollback Commands

**Restore from backup:**
```bash
# Drop and recreate database (staging only)
dropdb $DB_NAME
createdb $DB_NAME
psql $DATABASE_URL < backups/staging_<timestamp>.sql

# Production: use managed database point-in-time restore
# (AWS RDS, Supabase, Neon — all support PITR)
```

**Prisma rollback (additive changes only):**
```bash
# Mark last migration as rolled back (does NOT undo SQL)
DATABASE_URL="..." ./node_modules/.bin/prisma migrate resolve --rolled-back <migration_name>
```

### 5.3 Rollback Time Targets

| Tier | Target Rollback Time |
|------|---------------------|
| Staging | < 5 minutes |
| Production | < 15 minutes |

---

## 6. Data Safety Rules

These rules prevent data loss. They are non-negotiable.

### Rule 1: Never Drop a Column in Production Without a Deprecation Period

```
Step 1: Mark column as deprecated in code (stop writing to it)
Step 2: Wait 1 full release cycle
Step 3: Remove column reads from code
Step 4: Wait 1 full release cycle
Step 5: Drop column in migration
```

### Rule 2: Never Rename a Column Directly

Renaming a column is a breaking change. Use this pattern instead:

```
Step 1: Add new column with new name
Step 2: Write to both old and new column
Step 3: Backfill new column from old column
Step 4: Switch reads to new column
Step 5: Stop writing to old column
Step 6: Drop old column (after deprecation period)
```

### Rule 3: Never Change an ENUM Value

PostgreSQL ENUMs can only be extended (add new values), never modified or removed.

```sql
-- SAFE: add new value
ALTER TYPE task_status_enum ADD VALUE 'on_hold';

-- FORBIDDEN: rename or remove a value
-- There is no safe way to do this without a full table rewrite
```

### Rule 4: Additive Migrations Only (in production)

All production migrations must be additive:
- Add tables ✅
- Add columns (nullable or with default) ✅
- Add indexes ✅
- Add constraints (if data already satisfies them) ✅
- Drop tables ❌ (requires deprecation period)
- Drop columns ❌ (requires deprecation period)
- Change column types ❌ (requires new column + backfill)
- Remove ENUM values ❌ (not possible in PostgreSQL)

### Rule 5: New NOT NULL Columns Must Have a Default

```sql
-- SAFE: new NOT NULL column with default
ALTER TABLE clients ADD COLUMN tier VARCHAR(50) NOT NULL DEFAULT 'standard';

-- UNSAFE: new NOT NULL column without default (fails on existing rows)
ALTER TABLE clients ADD COLUMN tier VARCHAR(50) NOT NULL;
```

### Rule 6: Never Modify schema.prisma Directly

`schema.prisma` is a generated file. Always:
1. Edit the domain `.prisma` file
2. Run `./scripts/build-prisma-schema.sh`
3. Run `prisma validate`
4. Then run migrations

---

## 7. Production Deploy Rules

### 7.1 Migration Window

- Run migrations during low-traffic periods
- Avoid migrations during business hours (9am–6pm local time)
- Preferred window: weekday evenings or weekend mornings

### 7.1a Lock Timeout Protection

Every migration session must set lock and statement timeouts before executing DDL. This prevents a migration from accidentally freezing production if it cannot acquire a table lock.

```sql
-- Add to the top of every migration SQL file
SET lock_timeout = '5s';
SET statement_timeout = '30s';
```

If a lock cannot be acquired within 5 seconds, the migration aborts cleanly instead of waiting indefinitely and blocking all application queries behind it.

For long-running operations (backfills, large index builds), override per-statement:
```sql
SET statement_timeout = '0';  -- disable for this statement only
CREATE INDEX CONCURRENTLY idx_clients_search ON clients USING GIN(search_vector);
SET statement_timeout = '30s';  -- restore
```

**Rule:** No migration file may omit `SET lock_timeout` and `SET statement_timeout` at the top.

### 7.1b Migration Size Limit

A single migration must complete in under 30 seconds (excluding `CONCURRENTLY` index builds, which run outside transactions).

If a migration would take longer:
- Break it into smaller migrations
- Move bulk data operations to a separate backfill script
- Use `CONCURRENTLY` for index creation

**Why:** Long-running migrations hold locks and block writes. At 30 seconds, connection pools exhaust and the application goes down.

Signs a migration is too large:
- It touches more than 1 table with data rewrites
- It backfills an existing column
- It changes a column type on a large table

### 7.1c Connection Pool Safety

Before running any production migration, reduce application load to free connections for the migration session.

```
Normal state:   N application instances running
Pre-migration:  Scale down to 2 instances (keeps app alive, frees connections)
Run migration
Post-migration: Scale back to N instances
```

For managed platforms:
- **Railway / Render:** Scale replicas to 1 before migrating
- **AWS ECS:** Set desired count to 1
- **Kubernetes:** `kubectl scale deployment app --replicas=1`

**Why:** Prisma migrations open their own database connection. If the pool is saturated by application instances, the migration connection is refused and the deploy fails.

### 7.1d Migration Drift Detection

Before every production migration, check for schema drift. Drift occurs when the database state no longer matches Prisma's migration history (e.g., a manual SQL change was applied directly).

```bash
DATABASE_URL="$PROD_DATABASE_URL" ./node_modules/.bin/prisma migrate status
```

Expected output:
```
Database schema is up to date!
```

If output shows drift or unapplied migrations: **STOP. Investigate before proceeding.**

Drift resolution:
```bash
# Mark a migration as applied without running it (if manually applied)
DATABASE_URL="..." ./node_modules/.bin/prisma migrate resolve --applied <migration_name>

# Or: reset drift baseline (staging only — never production)
DATABASE_URL="..." ./node_modules/.bin/prisma migrate reset
```

**Rule:** `prisma migrate status` must show no drift before any production migration.

---

### 7.2 Zero-Downtime Migration Requirements

For zero-downtime deploys, migrations must be compatible with the currently running application version.

**Safe (zero-downtime):**
- Adding a new nullable column
- Adding a new table
- Adding an index (use `CREATE INDEX CONCURRENTLY`)
- Adding a new ENUM value

**Requires maintenance window:**
- Adding a NOT NULL column without default
- Dropping a column or table
- Changing a column type
- Adding a constraint that existing data may violate

### 7.3 Index Creation in Production

Never use plain `CREATE INDEX` in production — it locks the table.

Always use:
```sql
CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);
```

This applies to all GIN indexes for tsvector columns:
```sql
CREATE INDEX CONCURRENTLY idx_clients_search  ON clients  USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_contacts_search ON contacts USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_tasks_search    ON tasks    USING GIN(search_vector);
```

**Note:** `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block. Run it as a standalone statement.

### 7.4 Deploy Order (Application + Migration)

For additive migrations (new tables, new columns):
```
1. Run migration first
2. Deploy new application version
```

For column removal or breaking changes:
```
1. Deploy application version that no longer uses the column
2. Wait for all instances to restart
3. Run migration to drop the column
```

### 7.5 Post-Deploy Verification

After every production migration:

```sql
-- Verify table count
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 36

-- Verify ENUM count
SELECT count(*) FROM pg_type
WHERE typtype = 'e';
-- Expected: 11

-- Verify RLS is enabled on tenant tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: 19+ tables

-- Verify indexes
SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';
-- Expected: 100+

-- Verify constraints
SELECT count(*) FROM information_schema.table_constraints
WHERE constraint_schema = 'public';
```

---

## 8. Phase-Specific Safety Notes

### Phase 0 — ENUMs
- ENUMs must be created before any table that uses them
- If an ENUM creation fails, no tables will be affected
- Safe to re-run: `CREATE TYPE ... IF NOT EXISTS` pattern

### Phase 1 — Foundation
- `firms` table has no dependencies — safe to create first
- `users` depends on `firms` — must follow
- Seed roles and permissions immediately after this phase
- Do not create any application users until roles exist

### Phase 5 — Billing
- `invoice_sequences` uses `firm_id` as PK — no separate `id` column
- The `get_next_invoice_number()` function must be created before any invoice is generated
- Test atomic number generation with concurrent requests before going live

### Phase 9 — Observability
- `activity_events` will be the highest-volume table
- The XOR CHECK constraint must be applied before any events are written
- The `update_storage_usage()` trigger must be applied before any documents are uploaded
- Plan for partitioning at 1M+ rows/month (future — not needed at launch)

---

## 9. Monitoring After Migration

After each phase in production, monitor for 30 minutes:

| Signal | Tool | Alert Threshold |
|--------|------|----------------|
| Query errors | Application logs | Any 500 errors |
| Slow queries | pg_stat_statements | > 1s average |
| Lock waits | pg_locks | Any lock > 5s |
| Connection count | pg_stat_activity | > 80% of max_connections |
| Replication lag | pg_stat_replication | > 30s (if using replicas) |

---

## 10. Migration File Naming

```
packages/database/prisma/migrations/
  20260315000000_phase0_enums/
    migration.sql
  20260315000001_phase1_foundation/
    migration.sql
  20260315000002_phase2_crm/
    migration.sql
  20260315000003_phase3_documents/
    migration.sql
  20260315000004_phase4_tasks/
    migration.sql
  20260315000005_phase5_billing/
    migration.sql
  20260315000006_phase6_notifications/
    migration.sql
  20260315000007_phase7_portal/
    migration.sql
  20260315000008_phase8_saas_billing/
    migration.sql
  20260315000009_phase9_observability/
    migration.sql
  20260315000010_post_migration_sql/
    migration.sql   ← GIN indexes, CHECK constraints, RLS, triggers
```

Prisma generates the timestamp prefix automatically when using `prisma migrate dev --name <phase_name>`.

---

## 11. Custom SQL Tracking

Prisma does not track custom SQL (GIN indexes, CHECK constraints, RLS policies, triggers).
These must be tracked manually.

Create a file for each phase's custom SQL:

```
docs/03-database/migrations/custom/
  phase1_custom.sql
  phase2_custom.sql
  ...
  phase9_custom.sql
  phase10_post_migration.sql
```

Each file must be idempotent (safe to re-run):

```sql
-- Use IF NOT EXISTS / OR REPLACE patterns
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING GIN(search_vector);
CREATE OR REPLACE FUNCTION update_clients_search_vector() ...
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;  -- idempotent
```

---

## 12. Emergency Procedures

### Database is Unresponsive After Migration

```bash
# 1. Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle' AND query_start < now() - interval '30 seconds'
ORDER BY duration DESC;

# 2. Kill blocking queries if necessary
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE state != 'idle' AND query_start < now() - interval '5 minutes';

# 3. If still unresponsive: restore from backup
```

### Migration Applied But Application Crashes

```bash
# 1. Roll back application to previous version (keep migration applied)
# 2. Investigate error logs
# 3. If migration must be undone: restore from backup
# 4. Never attempt manual SQL rollback of a Prisma migration
```

### Partial Migration (Failed Mid-Run)

```bash
# 1. Do NOT re-run the migration — it will fail on already-created objects
# 2. Restore from backup
# 3. Fix the migration SQL
# 4. Re-run from clean state
```

---

## 13. Sign-Off Requirements

| Environment | Required Sign-Off |
|-------------|------------------|
| Local | Developer self-review |
| Staging | Developer + 1 peer review |
| Production | Developer + tech lead + backup confirmed |

---

## Summary

| Rule | Status |
|------|--------|
| Phase order enforced | Required |
| Backup before production | Required |
| Staging before production | Required |
| Additive-only in production | Required |
| CONCURRENTLY for production indexes | Required |
| Custom SQL tracked separately | Required |
| schema.prisma never edited manually | Required |
| Lock timeout set on every migration | Required — Section 7.1a |
| Migration completes in < 30 seconds | Required — Section 7.1b |
| Scale down app before production migration | Required — Section 7.1c |
| Drift check before production migration | Required — Section 7.1d |
| Rollback plan documented | ✅ Section 5 |
| Data safety rules documented | ✅ Section 6 |
| Production deploy rules documented | ✅ Section 7 |

---

**Document Status:** COMPLETE
**Ready for Migration Execution:** YES
**Next Step:** Run `prisma migrate dev --name phase0_enums` in local environment

---

*See also:*
- `MIGRATION-PLAN.md` — SQL for each phase
- `DATABASE-ARCHITECTURE-MASTER.md` — schema source of truth
- `PRODUCTION-AUDIT-REPORT.md` — pre-migration validation results
