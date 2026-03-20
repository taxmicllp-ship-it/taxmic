# PHASE 4: TASKS

**Development Week:** 7-8  
**Purpose:** Task management  
**Dependencies:** Phase 1 (Foundation), Phase 2 (CRM)

---

## Tables Introduced

### 1. tasks
- id, firm_id, client_id (nullable), title, description, status, priority, due_date, completed_at, created_by
- search_vector (tsvector)
- created_at, updated_at, deleted_at

**Indexes:** firm_id, client_id, status, priority, due_date, created_by, search_vector (GIN), (firm_id, status, due_date)

**RLS:** Enabled (firm_id)

---

### 2. task_assignments
- id, task_id, user_id, assigned_by, assigned_at, created_at

**Indexes:** UNIQUE (task_id, user_id), task_id, user_id, assigned_by

**RLS:** Enabled (via task_id)

---

### 3. task_comments
- id, task_id, user_id, comment
- created_at, updated_at, deleted_at

**Indexes:** task_id, user_id, created_at, deleted_at

**RLS:** Enabled (via task_id)

---

## Triggers

- update_task_search_vector() — BEFORE INSERT OR UPDATE

---

**Phase Status:** READY  
**Estimated Time:** 2 weeks

---

**END OF PHASE 4 DOCUMENT**
