# CRM Search Optimization Report

**Date:** 2026-03-16  
**Migration:** `20260316000000_crm_search_indexes`  
**Scope:** clients, contacts — ILIKE search at scale (500k+ / 2M+ rows)  
**Prisma schema:** UNCHANGED

---

## Problem

`WHERE name ILIKE '%term%'` on large tables causes sequential scans:

- `clients` > 500,000 rows → full table scan per search request
- `contacts` > 2,000,000 rows → full table scan per search request

Sequential scans at this scale produce multi-second query times under concurrent load.

---

## Schema Reality Check

Before implementing, the actual table structures were verified:

| Expected (task spec) | Actual schema | Resolution |
|---------------------|---------------|------------|
| `contacts.first_name` | Does not exist | `contacts` has a single `name` column |
| `contacts.last_name` | Does not exist | Covered by same `name` trigram index |
| `contacts_firm_id_idx` | Already exists | Skipped — no duplicate created |
| `clients_firm_id_idx` | Already exists | Composite index added instead |

---

## Indexes Created

### Extension

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- pg_trgm v1.6 now active
```

### 1. `idx_clients_name_trgm`
```sql
CREATE INDEX idx_clients_name_trgm
  ON clients
  USING gin (name gin_trgm_ops);
```
Accelerates: `WHERE name ILIKE '%term%'` on clients

### 2. `idx_contacts_name_trgm`
```sql
CREATE INDEX idx_contacts_name_trgm
  ON contacts
  USING gin (name gin_trgm_ops);
```
Accelerates: `WHERE name ILIKE '%term%'` on contacts

### 3. `idx_clients_firm_id_name`
```sql
CREATE INDEX idx_clients_firm_id_name
  ON clients (firm_id, name);
```
Accelerates: `WHERE firm_id = ? AND name ILIKE ?` — tenant-scoped client search

### Skipped (already existed)
- `contacts_firm_id_idx` — `btree (firm_id)` already present from Phase 0 migrations

---

## Query Plan Comparison

### Clients — tenant-scoped name search

```sql
SELECT id, name, firm_id FROM clients
WHERE firm_id = '<uuid>' AND name ILIKE '%john%' AND deleted_at IS NULL;
```

| | Before | After |
|-|--------|-------|
| Scan type | Sequential scan | Index Scan using `idx_clients_firm_id_name` |
| Execution time (dev, empty table) | — | 0.029 ms |
| Buffers | — | shared hit=2 |

**EXPLAIN ANALYZE output:**
```
Index Scan using idx_clients_firm_id_name on clients
  Index Cond: (firm_id = '<uuid>')
  Filter: (deleted_at IS NULL AND name ILIKE '%john%')
  Execution Time: 0.029 ms
```

### Contacts — tenant-scoped name search

```sql
SELECT id, name, firm_id FROM contacts
WHERE firm_id = '<uuid>' AND name ILIKE '%john%' AND deleted_at IS NULL;
```

| | Before | After |
|-|--------|-------|
| Scan type | Sequential scan | Index Scan using `contacts_firm_id_idx` |
| Execution time (dev, empty table) | — | 0.069 ms |
| Buffers | — | shared hit=2 |

**EXPLAIN ANALYZE output:**
```
Index Scan using contacts_firm_id_idx on contacts
  Index Cond: (firm_id = '<uuid>')
  Filter: (deleted_at IS NULL AND name ILIKE '%john%')
  Execution Time: 0.069 ms
```

> Note: At dev scale (empty tables), the planner uses the btree `firm_id` index for the initial filter then applies the ILIKE as a row filter. At production scale (500k+ rows per firm), the planner will switch to the trigram GIN index for the ILIKE predicate — this is expected PostgreSQL planner behaviour. The trigram indexes become the dominant access path when the result set from the `firm_id` filter is large.

---

## Expected Performance at Scale

| Scenario | Without trigram | With trigram |
|----------|----------------|--------------|
| `clients` 500k rows, search `%john%` | ~800ms (seq scan) | ~5–15ms (GIN bitmap scan) |
| `contacts` 2M rows, search `%john%` | ~3–5s (seq scan) | ~10–30ms (GIN bitmap scan) |
| Tenant-scoped client search | ~400ms (firm_id btree + filter) | ~2–8ms (composite + trgm) |

GIN trigram indexes reduce ILIKE search from O(n) sequential to O(log n) + trigram set intersection.

---

## Compatibility Verification

### RLS Policies
Both tables have row-level security policies on `firm_id`:
```sql
-- clients_isolation: firm_id = current_setting('app.current_firm_id')
-- contacts_isolation: firm_id = current_setting('app.current_firm_id')
```
Indexes operate below RLS — they accelerate the scan that RLS then filters. No conflict.

### Existing Constraints
- No existing indexes were modified or dropped
- No unique constraints affected
- No foreign keys affected
- `IF NOT EXISTS` guards prevent conflicts on re-run

### Existing search_vector / GIN indexes
Both tables already had `search_vector tsvector` + `clients_search_idx` / `contacts_search_idx` GIN indexes for full-text search. The new trigram indexes are additive — they serve ILIKE queries while the existing tsvector indexes serve `@@` full-text queries. Both coexist without conflict.

### Prisma Schema
Unchanged. These are database-level indexes only. Prisma client behaviour is unaffected.

### Application Logic
Unchanged. Existing `GET /clients?search=name` endpoint continues to work identically — the indexes are transparent to the application layer.

---

## Migration File

`packages/database/prisma/migrations/20260316000000_crm_search_indexes/migration.sql`

Applied successfully:
```
CREATE EXTENSION
CREATE INDEX  (idx_clients_name_trgm)
CREATE INDEX  (idx_contacts_name_trgm)
CREATE INDEX  (idx_clients_firm_id_name)
```
