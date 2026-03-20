# PHASE 3: DOCUMENTS

**Development Week:** 5-6  
**Purpose:** Document management and storage  
**Dependencies:** Phase 1 (Foundation), Phase 2 (CRM)

---

## Tables Introduced

### 1. folders
- id, firm_id, client_id (nullable), parent_id (nullable), name, description
- created_at, updated_at, deleted_at

**Indexes:** firm_id, client_id, parent_id, deleted_at

**RLS:** Enabled (firm_id)

---

### 2. documents
- id, firm_id, client_id (nullable), folder_id (nullable), filename, file_key, mime_type, size_bytes, description, uploaded_by, current_version
- search_vector (tsvector)
- created_at, updated_at, deleted_at

**Indexes:** firm_id, client_id, folder_id, uploaded_by, created_at, search_vector (GIN), (firm_id, client_id)

**RLS:** Enabled (firm_id)

---

### 3. document_versions
- id, document_id, version_number, file_key, size_bytes, uploaded_by, uploaded_at, is_current

**Indexes:** UNIQUE (document_id, version_number), document_id, uploaded_by, is_current

**RLS:** Enabled (via document_id)

---

### 4. document_permissions ⚠️ SIMPLIFIED FOR MVP
- id, document_id
- visibility (document_visibility_enum) ✅ SIMPLIFIED
- created_at, updated_at

**ENUM:**
```
CREATE TYPE document_visibility_enum AS ENUM ('internal', 'client');
```

**Indexes:** document_id, visibility

**RLS:** Enabled (via document_id)

**MVP SIMPLIFICATION:**
- Removed: user_id, client_user_id (over-engineered)
- Removed: permission granularity (view, download, delete)
- Removed: expires_at (unnecessary complexity)
- Removed: granted_by, granted_at
- Simple binary: internal or client-visible
- Can expand post-MVP if needed

---

## ENUMs Required

```
CREATE TYPE document_visibility_enum AS ENUM ('internal', 'client');
```

---

## Triggers

- update_document_search_vector() — BEFORE INSERT OR UPDATE
- update_storage_usage() — AFTER INSERT OR DELETE on documents

---

## Testing Checklist

- [ ] Upload document to firm-level folder
- [ ] Upload document to client-level folder
- [ ] Create document version (re-upload same filename)
- [ ] Verify storage_usage updated automatically
- [ ] Set document visibility to 'internal'
- [ ] Set document visibility to 'client'
- [ ] Verify client portal users can only see 'client' documents
- [ ] Test full-text search on documents
- [ ] Test soft delete on documents

---

**Phase Status:** READY (WITH MVP SIMPLIFICATION)  
**Estimated Time:** 2 weeks

---

**END OF PHASE 3 DOCUMENT**
