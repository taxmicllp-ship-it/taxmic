# PHASE 1: FOUNDATION

**Development Week:** 1-2  
**Purpose:** Core authentication, authorization, and tenant management  
**Status:** REQUIRED BEFORE ALL OTHER PHASES

---

## Overview

Phase 1 establishes the foundation of the system:
- Tenant management (firms)
- User authentication
- Role-based access control (RBAC)
- Permission system

**Dependencies:** None (first phase)

**Blocks:** All other phases depend on this

---

## Tables Introduced

### 1. firms
**Purpose:** Tenant registry

**Columns:**
- id (UUID, PK)
- name (VARCHAR 255)
- slug (VARCHAR 100, UNIQUE)
- email (VARCHAR 255)
- phone (VARCHAR 50)
- address (TEXT)
- website (VARCHAR 255)
- logo_url (VARCHAR 500)
- timezone (VARCHAR 50)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP, nullable)

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (slug)
- INDEX (email)
- INDEX (deleted_at) WHERE deleted_at IS NULL

**Relationships:**
- firms → users (one to many)
- firms → subscriptions (one to one)

---

### 2. users
**Purpose:** Firm staff members

**Columns:**
- id (UUID, PK)
- firm_id (UUID, FK → firms.id)
- email (VARCHAR 255)
- password_hash (VARCHAR 255)
- first_name (VARCHAR 100)
- last_name (VARCHAR 100)
- phone (VARCHAR 50)
- avatar_url (VARCHAR 500)
- is_active (BOOLEAN, default true)
- email_verified (BOOLEAN, default false)
- last_login_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP, nullable)

**Indexes:**
- PRIMARY KEY (id)
- INDEX (firm_id)
- UNIQUE (firm_id, email) WHERE deleted_at IS NULL
- INDEX (email)
- INDEX (deleted_at) WHERE deleted_at IS NULL

**Foreign Keys:**
- firm_id → firms.id (CASCADE)

**Relationships:**
- users → firm (many to one)
- users → user_roles (one to many)

**RLS:** Enabled (firm_id isolation)

---

### 3. roles
**Purpose:** System role definitions

**Columns:**
- id (UUID, PK)
- name (VARCHAR 50, UNIQUE)
- description (TEXT)
- is_system (BOOLEAN, default false)
- created_at (TIMESTAMP)

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (name)

**Relationships:**
- roles → role_permissions (one to many)
- roles → user_roles (one to many)

**System Roles:**
- owner — Full access
- admin — Manage users and settings
- staff — Manage clients, documents, tasks, invoices
- contractor — Limited access to assigned tasks
- viewer — Read-only access

---

### 4. permissions
**Purpose:** Granular permission definitions

**Columns:**
- id (UUID, PK)
- name (VARCHAR 100, UNIQUE)
- resource (VARCHAR 50)
- action (VARCHAR 50)
- description (TEXT)
- created_at (TIMESTAMP)

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (name)
- INDEX (resource)
- INDEX (action)

**Relationships:**
- permissions → role_permissions (one to many)

**Permission Format:** {resource}.{action}

**Examples:**
- clients.create
- clients.read
- clients.update
- clients.delete
- documents.create
- documents.read
- documents.delete
- tasks.create
- tasks.update
- invoices.create
- invoices.send
- billing.manage
- users.create
- settings.update

---

### 5. role_permissions
**Purpose:** Maps roles to permissions (many-to-many)

**Columns:**
- id (UUID, PK)
- role_id (UUID, FK → roles.id)
- permission_id (UUID, FK → permissions.id)
- created_at (TIMESTAMP)

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (role_id, permission_id)
- INDEX (role_id)
- INDEX (permission_id)

**Foreign Keys:**
- role_id → roles.id (CASCADE)
- permission_id → permissions.id (CASCADE)

**Relationships:**
- role_permissions → role (many to one)
- role_permissions → permission (many to one)

---

### 6. user_roles
**Purpose:** Assigns roles to users within a firm

**Columns:**
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- role_id (UUID, FK → roles.id)
- firm_id (UUID, FK → firms.id)
- created_at (TIMESTAMP)

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (user_id, role_id, firm_id)
- INDEX (user_id)
- INDEX (firm_id)
- INDEX (role_id)

**Foreign Keys:**
- user_id → users.id (CASCADE)
- role_id → roles.id (CASCADE)
- firm_id → firms.id (CASCADE)

**Relationships:**
- user_roles → user (many to one)
- user_roles → role (many to one)
- user_roles → firm (many to one)

**RLS:** Enabled (firm_id isolation)

---

## Seed Data Required

### Roles
```
INSERT INTO roles (name, description, is_system) VALUES
  ('owner', 'Firm owner - full access', true),
  ('admin', 'Administrator - manage users and settings', true),
  ('staff', 'Staff member - manage clients and tasks', true),
  ('contractor', 'External contractor - limited access', true),
  ('viewer', 'Read-only access', true);
```

### Permissions
```
INSERT INTO permissions (name, resource, action, description) VALUES
  ('clients.create', 'clients', 'create', 'Create new clients'),
  ('clients.read', 'clients', 'read', 'View clients'),
  ('clients.update', 'clients', 'update', 'Edit clients'),
  ('clients.delete', 'clients', 'delete', 'Delete clients'),
  ('documents.create', 'documents', 'create', 'Upload documents'),
  ('documents.read', 'documents', 'read', 'View documents'),
  ('documents.delete', 'documents', 'delete', 'Delete documents'),
  ('tasks.create', 'tasks', 'create', 'Create tasks'),
  ('tasks.read', 'tasks', 'read', 'View tasks'),
  ('tasks.update', 'tasks', 'update', 'Update tasks'),
  ('tasks.delete', 'tasks', 'delete', 'Delete tasks'),
  ('invoices.create', 'invoices', 'create', 'Create invoices'),
  ('invoices.read', 'invoices', 'read', 'View invoices'),
  ('invoices.update', 'invoices', 'update', 'Edit invoices'),
  ('invoices.delete', 'invoices', 'delete', 'Delete invoices'),
  ('invoices.send', 'invoices', 'send', 'Send invoices'),
  ('billing.read', 'billing', 'read', 'View billing'),
  ('billing.manage', 'billing', 'manage', 'Manage subscriptions'),
  ('users.create', 'users', 'create', 'Invite users'),
  ('users.read', 'users', 'read', 'View users'),
  ('users.update', 'users', 'update', 'Edit users'),
  ('users.delete', 'users', 'delete', 'Remove users'),
  ('settings.read', 'settings', 'read', 'View settings'),
  ('settings.update', 'settings', 'update', 'Update settings');
```

### Role-Permission Mappings
```
-- Owner: Full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'owner';

-- Admin: All except billing
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'admin' AND p.name NOT LIKE 'billing.%';

-- Staff: CRUD on clients, documents, tasks, invoices (no delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'staff' AND p.action IN ('create', 'read', 'update', 'send');

-- Contractor: Read-only + assigned tasks
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'contractor' AND (p.action = 'read' OR p.name = 'tasks.update');

-- Viewer: Read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'viewer' AND p.action = 'read';
```

---

## RLS Policies

### firms
- No RLS (system table)

### users
```
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON users
  USING (firm_id = current_setting('app.current_firm_id')::uuid);
```

### user_roles
```
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON user_roles
  USING (firm_id = current_setting('app.current_firm_id')::uuid);
```

---

## Triggers

### updated_at Trigger
```
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_firms_updated_at
  BEFORE UPDATE ON firms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Testing Checklist

- [ ] Create firm
- [ ] Create user with owner role
- [ ] Login as user
- [ ] Verify JWT token generation
- [ ] Verify RLS isolation (cannot see other firms' users)
- [ ] Test role-based permissions
- [ ] Test password hashing
- [ ] Test email uniqueness per firm
- [ ] Test soft delete on users
- [ ] Test cascade delete (firm → users)

---

## API Endpoints Required

**Auth:**
- POST /auth/register (create firm + owner user)
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh-token
- GET /auth/me

**Users:**
- GET /users (list firm users)
- POST /users (invite user)
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id (soft delete)

**Roles:**
- GET /roles (list available roles)
- GET /users/:id/roles
- POST /users/:id/roles (assign role)
- DELETE /users/:id/roles/:roleId (remove role)

---

## Success Criteria

- ✅ Firm registration working
- ✅ User authentication working
- ✅ JWT tokens generated correctly
- ✅ RLS enforcing tenant isolation
- ✅ RBAC permissions working
- ✅ Password hashing secure
- ✅ Email verification flow (optional for MVP)

---

**Phase Status:** READY FOR IMPLEMENTATION  
**Estimated Time:** 2 weeks  
**Team Size:** 2-3 developers

---

**END OF PHASE 1 DOCUMENT**
