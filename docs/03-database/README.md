# DATABASE DOCUMENTATION

**System:** Practice Management SaaS  
**Database:** PostgreSQL 15+  
**Total Tables:** 33  
**Status:** PRODUCTION READY

---

## Documentation Structure

```
docs/database/
├── README.md (this file)
├── DATABASE-ARCHITECTURE-MASTER.md (complete specification)
├── phases/
│   ├── PHASE-1-FOUNDATION.md
│   ├── PHASE-2-CRM.md
│   ├── PHASE-3-DOCUMENTS.md
│   ├── PHASE-4-TASKS.md
│   ├── PHASE-5-BILLING.md
│   ├── PHASE-6-NOTIFICATIONS.md
│   ├── PHASE-7-PORTAL.md
│   ├── PHASE-8-SAAS-BILLING.md
│   └── PHASE-9-OBSERVABILITY.md
└── diagrams/
    └── ERD-DATABASE.md
```

---

## Quick Start

### 1. Read Master Document First
Start with `DATABASE-ARCHITECTURE-MASTER.md` for complete database specification.

### 2. Review Phase Documents
Read phase documents in order (1-9) for implementation sequence.

### 3. Study ER Diagram
Review `diagrams/ERD-DATABASE.md` for visual relationship understanding.

---

## Document Purpose

### DATABASE-ARCHITECTURE-MASTER.md
**Purpose:** Single source of truth for database architecture

**Contains:**
- Database design principles
- Naming conventions
- Multi-tenant architecture
- Complete table definitions (all 33 tables)
- Relationship integrity rules
- Index strategy
- Database views
- Constraints and keys
- Data lifecycle rules
- Row Level Security (RLS) policies
- Triggers and functions
- Validation checklist

**Use For:**
- Understanding complete database design
- Creating Prisma schema
- Writing migrations
- Database reviews
- Architecture decisions

---

### Phase Documents (PHASE-1 through PHASE-9)
**Purpose:** Implementation sequence and dependencies

**Each Phase Contains:**
- Tables introduced in that phase
- Column definitions
- Indexes
- Foreign keys
- RLS policies
- Triggers
- Seed data requirements
- API endpoints needed
- Testing checklist
- Success criteria

**Use For:**
- Development planning
- Sprint planning
- Migration sequencing
- Feature implementation
- Testing strategy

---

### ERD-DATABASE.md
**Purpose:** Visual entity relationship diagram

**Contains:**
- Complete ER diagram (textual)
- Detailed relationships by domain
- Cascade delete rules
- Multi-tenant isolation map
- Join tables
- Self-referencing tables
- Mutual exclusivity constraints
- Unique constraints
- Index strategy summary
- Data flow examples

**Use For:**
- Understanding relationships
- Visualizing data model
- Onboarding new developers
- Architecture presentations
- Database optimization

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Tables:** firms, users, roles, permissions, role_permissions, user_roles  
**Purpose:** Authentication, authorization, tenant management  
**Dependencies:** None

### Phase 2: CRM (Week 3-4)
**Tables:** clients, contacts, client_contacts, client_addresses  
**Purpose:** Client and contact management  
**Dependencies:** Phase 1

### Phase 3: Documents (Week 5-6)
**Tables:** folders, documents, document_versions, document_permissions  
**Purpose:** Document management and storage  
**Dependencies:** Phase 1, Phase 2

### Phase 4: Tasks (Week 7-8)
**Tables:** tasks, task_assignments, task_comments  
**Purpose:** Task management  
**Dependencies:** Phase 1, Phase 2

### Phase 5: Billing (Week 9-10)
**Tables:** invoices, invoice_items, payments  
**Purpose:** Client invoicing and payments  
**Dependencies:** Phase 1, Phase 2

### Phase 6: Notifications (Week 11-12)
**Tables:** notifications, email_events  
**Purpose:** User notifications and email tracking  
**Dependencies:** Phase 1

### Phase 7: Portal (Week 13-14)
**Tables:** client_users, portal_sessions  
**Purpose:** Client portal authentication  
**Dependencies:** Phase 2

### Phase 8: SaaS Billing (Week 15-16)
**Tables:** plans, subscriptions, subscription_events  
**Purpose:** Subscription management  
**Dependencies:** Phase 1

### Phase 9: Observability (Week 17-18)
**Tables:** activity_events, webhook_events, feature_flags, firm_feature_flags, storage_usage, failed_jobs  
**Purpose:** System monitoring and tracking  
**Dependencies:** Phase 1

---

## Key Concepts

### Multi-Tenant Architecture
- Each firm = 1 tenant
- All tenant data isolated by `firm_id`
- PostgreSQL RLS enforces isolation
- Shared database, logical separation

### Row Level Security (RLS)
- Enabled on all tenant-owned tables
- Database enforces `firm_id` isolation automatically
- Application sets tenant context via session variable
- Cannot be bypassed (even with raw SQL)

### Soft Deletes
- 11 tables support soft delete
- Records marked deleted (deleted_at = NOW())
- Not physically removed
- Can be restored

### Audit Trail
- Immutable tables: document_versions, activity_events, webhook_events, subscription_events, email_events
- All tables have created_at
- Mutable tables have updated_at
- Activity events track user actions

### Full-Text Search
- 4 tables: clients, contacts, documents, tasks
- PostgreSQL tsvector with GIN indexes
- Weighted search (name > email > phone)
- Automatically updated via triggers

---

## Database Statistics

**Total Tables:** 33

**By Category:**
- Authentication & Authorization: 6
- CRM: 4
- Documents: 4
- Tasks: 3
- Billing: 3
- SaaS Billing: 3
- Client Portal: 2
- Notifications: 2
- System & Observability: 6

**Tenant-Owned Tables:** 25  
**System Tables:** 8  
**Tables with Soft Delete:** 11  
**Immutable Tables:** 7  
**Tables with RLS:** 25  
**Tables with Search:** 4

**Total Relationships:**
- One-to-Many: 40+
- Many-to-Many: 4
- One-to-One: 2
- Self-Referencing: 1

**Total Indexes:** 100+ (estimated)

---

## Critical Rules

### Naming Conventions
- All names use snake_case
- Tables: plural (clients, users, documents)
- Columns: descriptive (firm_id, created_at, updated_at)
- Foreign keys: {table}_id pattern
- Indexes: idx_{table}_{column} pattern

### Standard Fields
**All tables:**
- id (UUID, primary key)
- created_at (timestamp)
- updated_at (timestamp, if mutable)

**Tenant-owned tables:**
- firm_id (UUID, foreign key to firms)

**Soft-deletable tables:**
- deleted_at (timestamp, nullable)

### Foreign Key Cascade Rules
- DELETE CASCADE: Child deleted with parent
- DELETE SET NULL: Preserve child, nullify reference
- DELETE RESTRICT: Prevent deletion if references exist

### Data Types
- IDs: UUID
- Text: VARCHAR(255) or TEXT
- Numbers: INTEGER, BIGINT, DECIMAL(10, 2)
- Dates: TIMESTAMP, DATE
- Flags: BOOLEAN
- Structured: JSONB

---

## Implementation Workflow

### 1. Review Documentation
- Read DATABASE-ARCHITECTURE-MASTER.md
- Review phase documents
- Study ER diagram

### 2. Create Prisma Schema
- Define models based on table definitions
- Add relationships
- Add indexes
- Add constraints

### 3. Generate Migrations
- Create migrations in phase order
- Test each migration
- Verify constraints
- Check indexes

### 4. Implement RLS
- Enable RLS on tenant tables
- Create policies
- Test isolation
- Verify bypass mechanism

### 5. Create Triggers
- Search vector triggers
- Storage usage trigger
- Updated_at trigger
- Activity logging trigger

### 6. Seed Data
- System roles
- Permissions
- Role-permission mappings
- Subscription plans
- Feature flags

### 7. Test
- Unit tests for models
- Integration tests for relationships
- RLS isolation tests
- Cascade delete tests
- Constraint tests

---

## Validation Checklist

Before implementation:
- [ ] All 33 tables reviewed
- [ ] All relationships understood
- [ ] All indexes documented
- [ ] All constraints defined
- [ ] RLS strategy clear
- [ ] Cascade rules appropriate
- [ ] Naming conventions followed
- [ ] Phase dependencies understood

During implementation:
- [ ] Migrations created in order
- [ ] RLS policies implemented
- [ ] Triggers created
- [ ] Seed data loaded
- [ ] Indexes created
- [ ] Constraints tested

After implementation:
- [ ] All tests passing
- [ ] RLS isolation verified
- [ ] Performance acceptable
- [ ] Backup strategy configured
- [ ] Documentation updated

---

## Support

For questions or clarifications:
1. Check DATABASE-ARCHITECTURE-MASTER.md first
2. Review relevant phase document
3. Study ER diagram for relationships
4. Consult MASTER-SYSTEM-BLUEPRINT.md for system context

---

## Document Status

**Status:** ✅ COMPLETE  
**Version:** 1.0 FINAL  
**Last Updated:** 2026-03-15  
**Ready for Implementation:** YES

---

**END OF DATABASE DOCUMENTATION README**
