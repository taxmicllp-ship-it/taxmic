# PHASE 9: SYSTEM & OBSERVABILITY

**Development Week:** 17-18  
**Purpose:** Activity tracking, webhooks, feature flags, system monitoring  
**Dependencies:** Phase 1 (Foundation)

---

## Tables Introduced

### 1. activity_events
- id, firm_id, client_id (nullable), actor_user_id (nullable), actor_client_user_id (nullable), event_type, entity_type, entity_id, description, metadata (JSONB), created_at

**Indexes:** firm_id, client_id, actor_user_id, actor_client_user_id, event_type, entity_type, created_at, (firm_id, created_at DESC), (client_id, created_at DESC)

**RLS:** Enabled (firm_id)

---

### 2. webhook_events
- id, event_id (UNIQUE), type, status, payload (JSONB), error, received_at, processed_at, created_at

**Indexes:** UNIQUE (event_id), type, status, received_at

**RLS:** Not applicable (system table)

---

### 3. feature_flags
- id, name (UNIQUE), description, enabled_globally, rollout_percentage, created_at, updated_at

**Indexes:** UNIQUE (name)

**RLS:** Not applicable (system table)

---

### 4. firm_feature_flags
- id, firm_id, feature_flag_id, enabled, enabled_at, enabled_by, created_at

**Indexes:** UNIQUE (firm_id, feature_flag_id), firm_id, feature_flag_id

**RLS:** Enabled (firm_id)

---

### 5. storage_usage
- id, firm_id (UNIQUE), total_bytes, document_count, last_calculated_at, created_at, updated_at

**Indexes:** UNIQUE (firm_id)

**RLS:** Enabled (firm_id)

---

### 6. failed_jobs
- id, queue, job_id, payload (JSONB), error, attempts, failed_at, resolved_at, resolved_by, resolution_notes

**Indexes:** queue, failed_at, resolved_at WHERE resolved_at IS NULL

**RLS:** Not applicable (system table)

---

## Triggers

- log_activity_event() — AFTER INSERT OR UPDATE OR DELETE on clients, documents, tasks, invoices, payments

---

**Phase Status:** READY  
**Estimated Time:** 2 weeks

---

**END OF PHASE 9 DOCUMENT**
