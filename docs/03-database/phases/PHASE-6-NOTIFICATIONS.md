# PHASE 6: NOTIFICATIONS

**Development Week:** 11-12  
**Purpose:** User notifications and email tracking  
**Dependencies:** Phase 1 (Foundation)

---

## Tables Introduced

### 1. notifications
- id, firm_id, user_id, type, title, message, entity_type, entity_id, is_read, read_at, created_at

**Indexes:** firm_id, user_id, is_read, created_at, (user_id, is_read, created_at)

**RLS:** Enabled (firm_id)

---

### 2. email_events
- id, firm_id, message_id, email_to, email_from, subject, template_name, event_type, event_data (JSONB), ip_address, user_agent, created_at

**Indexes:** firm_id, message_id, email_to, event_type, created_at, (firm_id, created_at DESC)

**RLS:** Enabled (firm_id)

---

**Phase Status:** READY  
**Estimated Time:** 2 weeks

---

**END OF PHASE 6 DOCUMENT**
