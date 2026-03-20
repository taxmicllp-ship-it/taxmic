# PHASE 7: CLIENT PORTAL

**Development Week:** 13-14  
**Purpose:** Client portal authentication and sessions  
**Dependencies:** Phase 2 (CRM)

---

## Tables Introduced

### 1. client_users ⚠️ CRITICAL FIX APPLIED
- id, client_id, email, password_hash, first_name, last_name, is_active, email_verified, last_login_at
- created_at, updated_at, deleted_at

**Indexes:**
- UNIQUE (client_id, email) WHERE deleted_at IS NULL ✅ CHANGED FROM GLOBAL
- client_id, email, deleted_at

**RLS:** Enabled (via client_id)

**CRITICAL FIX:**
- Changed email uniqueness from global to per-client
- Allows same email for different clients
- Real-world scenario: john@gmail.com can be portal user for Client A and Client B

---

### 2. portal_sessions
- id, client_user_id, token, ip_address, user_agent, expires_at, created_at

**Indexes:** client_user_id, token, expires_at

**RLS:** Enabled (via client_user_id)

---

## Testing Checklist

- [ ] Create portal user for Client A with email john@gmail.com
- [ ] Create portal user for Client B with email john@gmail.com ✅ CRITICAL TEST
- [ ] Verify both portal users exist independently
- [ ] Verify login works for both
- [ ] Create portal session
- [ ] Verify session expiration
- [ ] Test password hashing
- [ ] Test email verification flow

---

**Phase Status:** READY (WITH CRITICAL FIXES)  
**Estimated Time:** 2 weeks

---

**END OF PHASE 7 DOCUMENT**
