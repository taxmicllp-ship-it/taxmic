# PHASE 2: CRM

**Development Week:** 3-4  
**Purpose:** Client and contact management  
**Dependencies:** Phase 1 (Foundation)

---

## Tables Introduced

### 1. clients
- id, firm_id, name, email, phone
- type (client_type_enum) ✅ ENUM
- status (client_status_enum) ✅ ENUM
- tax_id, website, notes
- search_vector (tsvector)
- created_at, updated_at, deleted_at

**Indexes:** firm_id, email, status, type, search_vector (GIN), deleted_at

**RLS:** Enabled (firm_id)

---

### 2. contacts ⚠️ CRITICAL FIX APPLIED
- id, firm_id ✅ ADDED, name, email, phone, title, is_primary, notes
- search_vector (tsvector)
- created_at, updated_at, deleted_at

**Foreign Keys:**
- firm_id → firms.id (CASCADE) ✅ ADDED

**Indexes:**
- firm_id ✅ ADDED
- UNIQUE (firm_id, email) WHERE deleted_at IS NULL ✅ CHANGED FROM GLOBAL
- email, search_vector (GIN), deleted_at

**RLS:** Enabled (firm_id) ✅ CHANGED FROM via client_contacts

**CRITICAL FIX:**
- Added firm_id column for proper tenant isolation
- Changed email uniqueness from global to per-firm
- Prevents cross-tenant contact leakage
- Direct RLS enforcement

---

### 3. client_contacts
- id, client_id, contact_id, is_primary, created_at

**Indexes:** UNIQUE (client_id, contact_id), client_id, contact_id

**RLS:** Enabled (via client_id)

---

### 4. client_addresses
- id, client_id, type, street_line1, street_line2, city, state, postal_code, country, is_primary
- created_at, updated_at

**Indexes:** client_id, type, is_primary

**RLS:** Enabled (via client_id)

---

## ENUMs Required

```
CREATE TYPE client_status_enum AS ENUM ('active', 'inactive', 'archived', 'lead');
CREATE TYPE client_type_enum AS ENUM ('individual', 'business', 'nonprofit');
```

---

## Triggers

### Search Vector Triggers
- update_client_search_vector() — BEFORE INSERT OR UPDATE
- update_contact_search_vector() — BEFORE INSERT OR UPDATE

---

## API Endpoints

- GET /clients, POST /clients, GET /clients/:id, PATCH /clients/:id, DELETE /clients/:id
- GET /clients/:id/contacts, POST /clients/:id/contacts/link
- GET /contacts, POST /contacts, GET /contacts/:id, PATCH /contacts/:id
- GET /clients/:id/addresses, POST /clients/:id/addresses

---

## Testing Checklist

- [ ] Create client with all types (individual, business, nonprofit)
- [ ] Create client with all statuses (active, inactive, archived, lead)
- [ ] Create contact with firm_id ✅ NEW
- [ ] Verify contact email uniqueness per firm ✅ NEW
- [ ] Verify same email can exist in different firms ✅ NEW
- [ ] Link contact to multiple clients within same firm
- [ ] Verify RLS isolation on contacts ✅ NEW
- [ ] Test full-text search on clients and contacts
- [ ] Test soft delete on clients and contacts

---

**Phase Status:** READY (WITH CRITICAL FIXES)  
**Estimated Time:** 2 weeks

---

**END OF PHASE 2 DOCUMENT**
