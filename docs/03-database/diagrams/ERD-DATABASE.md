# Entity Relationship Diagram

**Source:** `packages/database/prisma/schema.prisma`
**Generated:** 2026-03-15
**Models:** 36 | **ENUMs:** 11
**Status:** Reflects final validated schema

---

## Domain Map

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1 — AUTH          PHASE 2 — CRM        PHASE 3 — DOCUMENTS  │
│  firms                   clients               folders              │
│  users                   contacts              documents            │
│  roles                   client_contacts       document_versions    │
│  permissions             client_addresses      document_permissions │
│  role_permissions                                                   │
│  user_roles                                                         │
├─────────────────────────────────────────────────────────────────────┤
│  PHASE 4 — TASKS         PHASE 5 — BILLING     PHASE 6 — NOTIFS    │
│  tasks                   invoice_sequences     notifications        │
│  task_assignments        invoices              email_events         │
│  task_comments           invoice_items                              │
│                          payments                                   │
├─────────────────────────────────────────────────────────────────────┤
│  PHASE 7 — PORTAL        PHASE 8 — SAAS        SETTINGS            │
│  client_users            plans                 firm_settings        │
│  portal_sessions         subscriptions         user_settings        │
│                          subscription_events                        │
├─────────────────────────────────────────────────────────────────────┤
│  PHASE 9 — SYSTEM & OBSERVABILITY                                   │
│  activity_events   webhook_events   feature_flags                   │
│  firm_feature_flags   storage_usage   failed_jobs                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ENUMs

```
client_status_enum       → active | inactive | archived | lead
client_type_enum         → individual | business | nonprofit
task_status_enum         → new | in_progress | waiting_client | review | completed
task_priority_enum       → low | medium | high | urgent
invoice_status_enum      → draft | sent | paid | overdue | cancelled
payment_method_enum      → stripe | check | cash | wire | other
payment_status_enum      → pending | completed | failed | refunded
subscription_status_enum → trialing | active | past_due | canceled | unpaid
document_visibility_enum → internal | client
notification_type_enum   → task_assigned | task_completed | invoice_sent |
                           invoice_paid | document_uploaded | comment_added |
                           user_invited
email_event_type_enum    → sent | delivered | opened | clicked | bounced | complained
```

---

## Phase 1 — Authentication & Authorization

```
┌──────────────────────────────────────────────────────────────────┐
│ firms                                                            │
│──────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                         │
│     name            VARCHAR(255)  NOT NULL                       │
│     slug            VARCHAR(100)  UNIQUE NOT NULL                │
│     email           VARCHAR(255)  NOT NULL                       │
│     phone           VARCHAR(20)                                  │
│     address         TEXT                                         │
│     website         VARCHAR(255)                                 │
│     logo_url        VARCHAR(500)                                 │
│     timezone        VARCHAR(50)                                  │
│     created_at      TIMESTAMP    DEFAULT now()                   │
│     updated_at      TIMESTAMP    @updatedAt                      │
│     deleted_at      TIMESTAMP    (soft delete)                   │
└──────────────────────────────────────────────────────────────────┘
         │ 1
         │ has many
         ▼ N
┌──────────────────────────────────────────────────────────────────┐
│ users                                                            │
│──────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                         │
│ FK  firm_id         UUID → firms.id  CASCADE                     │
│     email           VARCHAR(255)  NOT NULL                       │
│     password_hash   VARCHAR(255)  NOT NULL                       │
│     first_name      VARCHAR(100)  NOT NULL                       │
│     last_name       VARCHAR(100)  NOT NULL                       │
│     phone           VARCHAR(20)                                  │
│     avatar_url      VARCHAR(500)                                 │
│     is_active       BOOLEAN      DEFAULT true                    │
│     email_verified  BOOLEAN      DEFAULT false                   │
│     last_login_at   TIMESTAMP                                    │
│     created_at      TIMESTAMP    DEFAULT now()                   │
│     updated_at      TIMESTAMP    @updatedAt                      │
│     deleted_at      TIMESTAMP    (soft delete)                   │
│                                                                  │
│ UNIQUE (firm_id, email)                                          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐     ┌──────────────────────────────┐
│ roles                    │     │ permissions                  │
│──────────────────────────│     │──────────────────────────────│
│ PK id         UUID       │     │ PK id          UUID          │
│    name       VARCHAR(50)│     │    name        VARCHAR(100)  │
│    description TEXT      │     │    resource    VARCHAR(50)   │
│    is_system  BOOLEAN    │     │    action      VARCHAR(50)   │
│    created_at TIMESTAMP  │     │    description TEXT          │
│               UNIQUE(name)│    │    created_at  TIMESTAMP     │
└──────────┬───────────────┘     └──────────────┬───────────────┘
           │ N                                  │ N
           └──────────────┬─────────────────────┘
                          ▼
              ┌───────────────────────────┐
              │ role_permissions          │
              │───────────────────────────│
              │ PK id            UUID     │
              │ FK role_id       UUID → roles.id       CASCADE  │
              │ FK permission_id UUID → permissions.id RESTRICT │
              │    created_at    TIMESTAMP              │
              │ UNIQUE (role_id, permission_id)         │
              └───────────────────────────┘

┌──────────────────────────────────────────────────┐
│ user_roles                                       │
│──────────────────────────────────────────────────│
│ PK id       UUID                                 │
│ FK user_id  UUID → users.id  CASCADE             │
│ FK role_id  UUID → roles.id  CASCADE             │
│ FK firm_id  UUID → firms.id  CASCADE             │
│    created_at TIMESTAMP                          │
│ UNIQUE (user_id, role_id, firm_id)               │
└──────────────────────────────────────────────────┘
```

---

## Phase 2 — CRM

```
┌──────────────────────────────────────────────────────────────────┐
│ clients                                                          │
│──────────────────────────────────────────────────────────────────│
│ PK  id            UUID                                           │
│ FK  firm_id       UUID → firms.id  CASCADE                       │
│     name          VARCHAR(255)  NOT NULL                         │
│     email         VARCHAR(255)                                   │
│     phone         VARCHAR(20)                                    │
│     type          client_type_enum                               │
│     status        client_status_enum  DEFAULT active             │
│     tax_id        VARCHAR(50)                                    │
│     website       VARCHAR(255)                                   │
│     notes         TEXT                                           │
│     search_vector TSVECTOR     (GIN index, trigger-maintained)   │
│     created_at    TIMESTAMP    DEFAULT now()                     │
│     updated_at    TIMESTAMP    @updatedAt                        │
│     deleted_at    TIMESTAMP    (soft delete)                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ contacts                                                         │
│──────────────────────────────────────────────────────────────────│
│ PK  id            UUID                                           │
│ FK  firm_id       UUID → firms.id  CASCADE                       │
│     name          VARCHAR(255)  NOT NULL                         │
│     email         VARCHAR(255)                                   │
│     phone         VARCHAR(20)                                    │
│     title         VARCHAR(100)                                   │
│     is_primary    BOOLEAN      DEFAULT false                     │
│     notes         TEXT                                           │
│     search_vector TSVECTOR     (GIN index, trigger-maintained)   │
│     created_at    TIMESTAMP    DEFAULT now()                     │
│     updated_at    TIMESTAMP    @updatedAt                        │
│     deleted_at    TIMESTAMP    (soft delete)                     │
│                                                                  │
│ PARTIAL UNIQUE INDEX (firm_id, email)                            │
│   WHERE email IS NOT NULL AND deleted_at IS NULL                 │
└──────────────────────────────────────────────────────────────────┘

clients ◄──────────────────────────────────► contacts
         many-to-many via client_contacts

┌──────────────────────────────────────────────────────────────────┐
│ client_contacts  (join table)                                    │
│──────────────────────────────────────────────────────────────────│
│ PK  id         UUID                                              │
│ FK  firm_id    UUID → firms.id    CASCADE                        │
│ FK  client_id  UUID → clients.id  CASCADE                        │
│ FK  contact_id UUID → contacts.id CASCADE                        │
│     is_primary BOOLEAN  DEFAULT false                            │
│     created_at TIMESTAMP                                         │
│ UNIQUE (firm_id, client_id, contact_id)                          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ client_addresses                                                 │
│──────────────────────────────────────────────────────────────────│
│ PK  id           UUID                                            │
│ FK  firm_id      UUID → firms.id    CASCADE                      │
│ FK  client_id    UUID → clients.id  CASCADE                      │
│     type         VARCHAR(50)  (billing|shipping|office|home)     │
│     street_line1 VARCHAR(255)                                    │
│     street_line2 VARCHAR(255)                                    │
│     city         VARCHAR(100)                                    │
│     state        VARCHAR(100)                                    │
│     postal_code  VARCHAR(20)                                     │
│     country      VARCHAR(100)                                    │
│     is_primary   BOOLEAN  DEFAULT false                          │
│     created_at   TIMESTAMP                                       │
│     updated_at   TIMESTAMP  @updatedAt                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 3 — Documents

```
┌──────────────────────────────────────────────────────────────────┐
│ folders                                                          │
│──────────────────────────────────────────────────────────────────│
│ PK  id          UUID                                             │
│ FK  firm_id     UUID → firms.id    CASCADE                       │
│ FK  client_id   UUID → clients.id  CASCADE  (NULL = firm-level)  │
│ FK  parent_id   UUID → folders.id  CASCADE  (NULL = root)        │
│     name        VARCHAR(255)  NOT NULL                           │
│     description TEXT                                             │
│     created_at  TIMESTAMP                                        │
│     updated_at  TIMESTAMP  @updatedAt                            │
│     deleted_at  TIMESTAMP  (soft delete)                         │
│                                                                  │
│ Self-referencing: parent_id → folders.id (nested folders)        │
└──────────────────────────────────────────────────────────────────┘
         │ 1
         │ contains
         ▼ N
┌──────────────────────────────────────────────────────────────────┐
│ documents                                                        │
│──────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                         │
│ FK  firm_id         UUID → firms.id    CASCADE                   │
│ FK  client_id       UUID → clients.id  CASCADE  (NULL = firm)    │
│ FK  folder_id       UUID → folders.id  SET NULL  (NULL = root)   │
│ FK  uploaded_by     UUID → users.id    SET NULL                  │
│     filename        VARCHAR(500)  NOT NULL                       │
│     file_key        VARCHAR(500)  NOT NULL  (S3 key)             │
│     mime_type       VARCHAR(100)                                 │
│     size_bytes      BIGINT       NOT NULL                        │
│     description     TEXT                                         │
│     current_version INT          DEFAULT 1                       │
│     search_vector   TSVECTOR     (GIN index, trigger-maintained) │
│     created_at      TIMESTAMP                                    │
│     updated_at      TIMESTAMP    @updatedAt                      │
│     deleted_at      TIMESTAMP    (soft delete)                   │
│                                                                  │
│ COMPOSITE INDEX (firm_id, client_id)                             │
└──────────────────────────────────────────────────────────────────┘
         │ 1                              │ 1
         │ has many versions              │ has one permission
         ▼ N                              ▼ 1
┌──────────────────────────┐   ┌──────────────────────────────────┐
│ document_versions        │   │ document_permissions             │
│──────────────────────────│   │──────────────────────────────────│
│ PK id           UUID     │   │ PK id          UUID              │
│ FK document_id  UUID     │   │ FK document_id UUID              │
│      → documents.id      │   │      → documents.id  CASCADE     │
│      CASCADE             │   │    visibility  document_         │
│ FK uploaded_by  UUID     │   │                visibility_enum   │
│      → users.id SET NULL │   │                DEFAULT internal  │
│    version_number INT    │   │    created_at  TIMESTAMP         │
│    file_key   VARCHAR(500│   │    updated_at  TIMESTAMP         │
│    size_bytes BIGINT     │   └──────────────────────────────────┘
│    uploaded_at TIMESTAMP │
│    is_current  BOOLEAN   │
│ UNIQUE (document_id,     │
│         version_number)  │
└──────────────────────────┘
```

---

## Phase 4 — Tasks

```
┌──────────────────────────────────────────────────────────────────┐
│ tasks                                                            │
│──────────────────────────────────────────────────────────────────│
│ PK  id            UUID                                           │
│ FK  firm_id       UUID → firms.id    CASCADE                     │
│ FK  client_id     UUID → clients.id  CASCADE  (NULL = internal)  │
│ FK  created_by    UUID → users.id    SET NULL                    │
│     title         VARCHAR(255)  NOT NULL                         │
│     description   TEXT                                           │
│     status        task_status_enum    DEFAULT new                │
│     priority      task_priority_enum  DEFAULT medium             │
│     due_date      DATE                                           │
│     completed_at  TIMESTAMP                                      │
│     search_vector TSVECTOR  (GIN index, trigger-maintained)      │
│     created_at    TIMESTAMP                                       │
│     updated_at    TIMESTAMP  @updatedAt                          │
│     deleted_at    TIMESTAMP  (soft delete)                       │
│                                                                  │
│ COMPOSITE INDEX (firm_id, status, due_date)                      │
└──────────────────────────────────────────────────────────────────┘
         │ 1                              │ 1
         │ has many assignments           │ has many comments
         ▼ N                              ▼ N
┌──────────────────────────┐   ┌──────────────────────────────────┐
│ task_assignments         │   │ task_comments                    │
│──────────────────────────│   │──────────────────────────────────│
│ PK id          UUID      │   │ PK id         UUID               │
│ FK task_id     UUID      │   │ FK task_id    UUID               │
│      → tasks.id CASCADE  │   │      → tasks.id  CASCADE         │
│ FK user_id     UUID      │   │ FK user_id    UUID               │
│      → users.id          │   │      → users.id  SET NULL        │
│ FK assigned_by UUID      │   │    comment    TEXT  NOT NULL      │
│      → users.id SET NULL │   │    created_at TIMESTAMP          │
│    assigned_at TIMESTAMP │   │    updated_at TIMESTAMP          │
│    created_at  TIMESTAMP │   │    deleted_at TIMESTAMP          │
│ UNIQUE (task_id, user_id)│   └──────────────────────────────────┘
└──────────────────────────┘
```

---

## Phase 5 — Billing

```
┌──────────────────────────────────────────────────────────────────┐
│ invoice_sequences                                                │
│──────────────────────────────────────────────────────────────────│
│ PK/FK firm_id     UUID → firms.id  CASCADE  (1:1 with firms)     │
│       last_number INT   DEFAULT 0                                │
│       created_at  TIMESTAMP                                      │
│       updated_at  TIMESTAMP  @updatedAt                          │
│                                                                  │
│ Used by get_next_invoice_number() for atomic number generation   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ invoices                                                         │
│──────────────────────────────────────────────────────────────────│
│ PK  id               UUID                                        │
│ FK  firm_id          UUID → firms.id    CASCADE                  │
│ FK  client_id        UUID → clients.id  CASCADE                  │
│     number           INT   NOT NULL  (per-firm sequential)       │
│     status           invoice_status_enum  DEFAULT draft          │
│     issue_date       DATE  NOT NULL                              │
│     due_date         DATE                                        │
│     subtotal_amount  DECIMAL(10,2)  DEFAULT 0                    │
│     tax_amount       DECIMAL(10,2)  DEFAULT 0                    │
│     total_amount     DECIMAL(10,2)  DEFAULT 0                    │
│     paid_amount      DECIMAL(10,2)  DEFAULT 0                    │
│     notes            TEXT                                        │
│     pdf_url          VARCHAR(500)                                │
│     sent_at          TIMESTAMP                                   │
│     paid_at          TIMESTAMP                                   │
│     created_at       TIMESTAMP                                   │
│     updated_at       TIMESTAMP  @updatedAt                       │
│     deleted_at       TIMESTAMP  (soft delete)                    │
│                                                                  │
│ UNIQUE (firm_id, number)                                         │
│ COMPOSITE INDEX (firm_id, status, due_date)                      │
└──────────────────────────────────────────────────────────────────┘
         │ 1                              │ 1
         │ has many items                 │ has many payments
         ▼ N                              ▼ N
┌──────────────────────────┐   ┌──────────────────────────────────┐
│ invoice_items            │   │ payments                         │
│──────────────────────────│   │──────────────────────────────────│
│ PK id          UUID      │   │ PK id               UUID         │
│ FK invoice_id  UUID      │   │ FK firm_id          UUID         │
│      → invoices.id       │   │      → firms.id                  │
│      CASCADE             │   │ FK invoice_id       UUID         │
│    description TEXT      │   │      → invoices.id               │
│    quantity  DECIMAL(10,2│   │    amount           DECIMAL(10,2)│
│    unit_price DECIMAL(10,│   │    method           payment_     │
│    amount    DECIMAL(10,2│   │                     method_enum  │
│    sort_order INT        │   │    status           payment_     │
│    created_at TIMESTAMP  │   │                     status_enum  │
│    updated_at TIMESTAMP  │   │    stripe_payment_  VARCHAR(255) │
│                          │   │      intent_id                   │
│ CHECK: quantity > 0      │   │    stripe_charge_id VARCHAR(255) │
│ CHECK: unit_price >= 0   │   │    reference_number VARCHAR(255) │
│ CHECK: amount >= 0       │   │    notes            TEXT         │
└──────────────────────────┘   │    paid_at          TIMESTAMP    │
                               │    created_at       TIMESTAMP    │
                               │    updated_at       TIMESTAMP    │
                               └──────────────────────────────────┘
```

---

## Phase 6 — Notifications

```
┌──────────────────────────────────────────────────────────────────┐
│ notifications                                                    │
│──────────────────────────────────────────────────────────────────│
│ PK  id          UUID                                             │
│ FK  firm_id     UUID → firms.id  CASCADE                         │
│ FK  user_id     UUID → users.id  CASCADE                         │
│     type        notification_type_enum  NOT NULL                 │
│     title       VARCHAR(255)  NOT NULL                           │
│     message     TEXT          NOT NULL                           │
│     entity_type VARCHAR(50)   (task|invoice|document|payment)    │
│     entity_id   UUID                                             │
│     is_read     BOOLEAN  DEFAULT false                           │
│     read_at     TIMESTAMP                                        │
│     created_at  TIMESTAMP                                        │
│                                                                  │
│ COMPOSITE INDEX (user_id, is_read, created_at)                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ email_events                                                     │
│──────────────────────────────────────────────────────────────────│
│ PK  id            UUID                                           │
│ FK  firm_id       UUID → firms.id  (nullable, SET NULL)          │
│     message_id    VARCHAR(255)  NOT NULL  (SES message ID)       │
│     email_to      VARCHAR(255)  NOT NULL                         │
│     email_from    VARCHAR(255)  NOT NULL                         │
│     subject       TEXT                                           │
│     template_name VARCHAR(100)                                   │
│     event_type    email_event_type_enum  NOT NULL                │
│     event_data    JSON                                           │
│     ip_address    VARCHAR(45)                                    │
│     user_agent    TEXT                                           │
│     created_at    TIMESTAMP                                      │
│                                                                  │
│ COMPOSITE INDEX (firm_id, created_at)                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 7 — Client Portal

```
┌──────────────────────────────────────────────────────────────────┐
│ client_users                                                     │
│──────────────────────────────────────────────────────────────────│
│ PK  id             UUID                                          │
│ FK  client_id      UUID → clients.id  CASCADE                    │
│     email          VARCHAR(255)  NOT NULL                        │
│     password_hash  VARCHAR(255)  NOT NULL                        │
│     first_name     VARCHAR(100)  NOT NULL                        │
│     last_name      VARCHAR(100)  NOT NULL                        │
│     is_active      BOOLEAN  DEFAULT true                         │
│     email_verified BOOLEAN  DEFAULT false                        │
│     last_login_at  TIMESTAMP                                     │
│     created_at     TIMESTAMP                                     │
│     updated_at     TIMESTAMP  @updatedAt                         │
│     deleted_at     TIMESTAMP  (soft delete)                      │
│                                                                  │
│ UNIQUE (client_id, email)  ← scoped per client, not global       │
└──────────────────────────────────────────────────────────────────┘
         │ 1
         │ has many sessions
         ▼ N
┌──────────────────────────────────────────────────────────────────┐
│ portal_sessions                                                  │
│──────────────────────────────────────────────────────────────────│
│ PK  id             UUID                                          │
│ FK  client_user_id UUID → client_users.id  CASCADE               │
│     token          VARCHAR(255)  NOT NULL  (hashed)              │
│     ip_address     VARCHAR(45)                                   │
│     user_agent     TEXT                                          │
│     expires_at     TIMESTAMP  NOT NULL                           │
│     created_at     TIMESTAMP                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 8 — SaaS Billing

```
┌──────────────────────────────────────────────────────────────────┐
│ plans                                                            │
│──────────────────────────────────────────────────────────────────│
│ PK  id             UUID                                          │
│     name           VARCHAR(100)  NOT NULL                        │
│     slug           VARCHAR(50)   UNIQUE NOT NULL                 │
│     description    TEXT                                          │
│     price_monthly  DECIMAL(10,2) NOT NULL                        │
│     price_annual   DECIMAL(10,2) NOT NULL                        │
│     max_clients    INT  (NULL = unlimited)                       │
│     max_users      INT  (NULL = unlimited)                       │
│     max_storage_gb INT  (NULL = unlimited)                       │
│     features       JSON                                          │
│     is_active      BOOLEAN  DEFAULT true                         │
│     sort_order     INT      DEFAULT 0                            │
│     created_at     TIMESTAMP                                     │
│     updated_at     TIMESTAMP  @updatedAt                         │
│                                                                  │
│ Seed: Starter $29 | Professional $99 | Enterprise $299           │
└──────────────────────────────────────────────────────────────────┘
         │ 1
         │ has many subscriptions
         ▼ N
┌──────────────────────────────────────────────────────────────────┐
│ subscriptions                                                    │
│──────────────────────────────────────────────────────────────────│
│ PK  id                     UUID                                  │
│ FK  firm_id                UUID → firms.id   CASCADE  UNIQUE     │
│ FK  plan_id                UUID → plans.id   RESTRICT            │
│     status                 subscription_status_enum              │
│     stripe_subscription_id VARCHAR(255)                          │
│     stripe_customer_id     VARCHAR(255)                          │
│     current_period_start   TIMESTAMP                             │
│     current_period_end     TIMESTAMP                             │
│     cancel_at_period_end   BOOLEAN  DEFAULT false                │
│     canceled_at            TIMESTAMP                             │
│     trial_start            TIMESTAMP                             │
│     trial_end              TIMESTAMP                             │
│     created_at             TIMESTAMP                             │
│     updated_at             TIMESTAMP  @updatedAt                 │
│                                                                  │
│ UNIQUE (firm_id)  ← one subscription per firm                    │
└──────────────────────────────────────────────────────────────────┘
         │ 1
         │ has many events (audit log)
         ▼ N
┌──────────────────────────────────────────────────────────────────┐
│ subscription_events                                              │
│──────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                         │
│ FK  subscription_id UUID → subscriptions.id  CASCADE             │
│     event_type      VARCHAR(100)  NOT NULL                       │
│     from_status     VARCHAR(50)                                  │
│     to_status       VARCHAR(50)                                  │
│     metadata        JSON                                         │
│     created_at      TIMESTAMP  (immutable audit log)             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Settings

```
┌──────────────────────────────────────────────────────────────────┐
│ firm_settings                          (1:1 with firms)          │
│──────────────────────────────────────────────────────────────────│
│ PK  id               UUID                                        │
│ FK  firm_id          UUID → firms.id  CASCADE  UNIQUE            │
│     timezone         VARCHAR(50)   DEFAULT 'America/New_York'    │
│     currency         VARCHAR(3)    DEFAULT 'USD'                 │
│     date_format      VARCHAR(20)   DEFAULT 'MM/DD/YYYY'          │
│     invoice_prefix   VARCHAR(10)   (e.g. 'INV-')                 │
│     invoice_terms    TEXT                                        │
│     invoice_footer   TEXT                                        │
│     logo_url         VARCHAR(500)                                │
│     primary_color    VARCHAR(7)    (hex e.g. '#3B82F6')          │
│     email_from_name  VARCHAR(255)                                │
│     email_reply_to   VARCHAR(255)                                │
│     created_at       TIMESTAMP                                   │
│     updated_at       TIMESTAMP  @updatedAt                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ user_settings                          (1:1 with users)          │
│──────────────────────────────────────────────────────────────────│
│ PK  id                    UUID                                   │
│ FK  user_id               UUID → users.id  CASCADE  UNIQUE       │
│     timezone              VARCHAR(50)  (overrides firm default)  │
│     language              VARCHAR(10)  DEFAULT 'en'              │
│     email_notifications   BOOLEAN  DEFAULT true                  │
│     desktop_notifications BOOLEAN  DEFAULT true                  │
│     theme                 VARCHAR(20)  DEFAULT 'light'           │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP  @updatedAt                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 9 — System & Observability

```
┌──────────────────────────────────────────────────────────────────┐
│ activity_events                        (immutable audit log)     │
│──────────────────────────────────────────────────────────────────│
│ PK  id                   UUID                                    │
│ FK  firm_id              UUID → firms.id        CASCADE          │
│ FK  client_id            UUID → clients.id      CASCADE (opt)    │
│ FK  actor_user_id        UUID → users.id        SET NULL (opt)   │
│ FK  actor_client_user_id UUID → client_users.id SET NULL (opt)   │
│     event_type           VARCHAR(100)  NOT NULL                  │
│     entity_type          VARCHAR(50)   (client|document|task...) │
│     entity_id            UUID                                    │
│     description          TEXT  NOT NULL                          │
│     metadata             JSON                                    │
│     created_at           TIMESTAMP                               │
│                                                                  │
│ CHECK: actor_user_id XOR actor_client_user_id (one must be set)  │
│   (actor_user_id IS NOT NULL AND actor_client_user_id IS NULL)   │
│   OR (actor_user_id IS NULL AND actor_client_user_id IS NOT NULL)│
│ COMPOSITE INDEX (firm_id, created_at)                            │
│ COMPOSITE INDEX (client_id, created_at)                          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ webhook_events                         (idempotency table)       │
│──────────────────────────────────────────────────────────────────│
│ PK  id           UUID                                            │
│     event_id     VARCHAR(255)  UNIQUE  (Stripe event ID)         │
│     type         VARCHAR(100)  NOT NULL                          │
│     status       VARCHAR(50)   DEFAULT 'pending'                 │
│                  (pending|processing|processed|failed)           │
│     payload      JSON                                            │
│     error        TEXT                                            │
│     received_at  TIMESTAMP                                       │
│     processed_at TIMESTAMP                                       │
│     created_at   TIMESTAMP                                       │
│                                                                  │
│ UNIQUE (event_id) ← prevents duplicate Stripe webhook processing │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐     ┌──────────────────────────────┐
│ feature_flags            │     │ firm_feature_flags           │
│──────────────────────────│     │──────────────────────────────│
│ PK id           UUID     │     │ PK id              UUID      │
│    name         VARCHAR  │     │ FK firm_id         UUID      │
│                 UNIQUE   │     │      → firms.id    CASCADE   │
│    description  TEXT     │     │ FK feature_flag_id UUID      │
│    enabled_     BOOLEAN  │     │      → feature_   CASCADE   │
│      globally   DEFAULT  │     │        flags.id              │
│                 false    │     │ FK enabled_by      UUID      │
│    rollout_%    INT 0-100│     │      → users.id    SET NULL  │
│    created_at   TIMESTAMP│     │    enabled         BOOLEAN   │
│    updated_at   TIMESTAMP│     │    enabled_at      TIMESTAMP │
└──────────┬───────────────┘     │    created_at      TIMESTAMP │
           │ 1                   │ UNIQUE (firm_id,             │
           │ overridden by       │         feature_flag_id)     │
           └────────────────────►└──────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ storage_usage                          (1:1 with firms)          │
│──────────────────────────────────────────────────────────────────│
│ PK  id                 UUID                                      │
│ FK  firm_id            UUID → firms.id  CASCADE  UNIQUE          │
│     total_bytes        BIGINT  DEFAULT 0                         │
│     document_count     INT     DEFAULT 0                         │
│     last_calculated_at TIMESTAMP                                 │
│     created_at         TIMESTAMP                                 │
│     updated_at         TIMESTAMP  @updatedAt                     │
│                                                                  │
│ Updated automatically via trigger on documents INSERT/DELETE     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ failed_jobs                            (dead letter queue)       │
│──────────────────────────────────────────────────────────────────│
│ PK  id               UUID                                        │
│ FK  resolved_by      UUID → users.id  SET NULL                   │
│     queue            VARCHAR(100)  (emails|webhooks|pdfs|...)    │
│     job_id           VARCHAR(255)                                │
│     payload          JSON  NOT NULL                              │
│     error            TEXT  NOT NULL                              │
│     attempts         INT   NOT NULL                              │
│     failed_at        TIMESTAMP                                   │
│     resolved_at      TIMESTAMP  (NULL = unresolved)              │
│     resolution_notes TEXT                                        │
│                                                                  │
│ PARTIAL INDEX (resolved_at) WHERE resolved_at IS NULL            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Complete Relationship Map

```
firms (tenant root)
│
├── 1:N  users
│         ├── 1:N  user_roles ──────────────► roles ──► role_permissions ──► permissions
│         ├── 1:1  user_settings
│         ├── 1:N  task_assignments (as assignee)
│         ├── 1:N  task_assignments (as assigner)
│         ├── 1:N  task_comments
│         ├── 1:N  documents (as uploader)
│         ├── 1:N  document_versions (as uploader)
│         ├── 1:N  notifications
│         ├── 1:N  activity_events (as actor_user)
│         └── 1:N  firm_feature_flags (as enabler)
│
├── 1:N  clients
│         ├── M:N  contacts (via client_contacts)
│         ├── 1:N  client_addresses
│         ├── 1:N  folders
│         ├── 1:N  documents
│         ├── 1:N  tasks
│         ├── 1:N  invoices
│         ├── 1:N  client_users
│         │         ├── 1:N  portal_sessions
│         │         └── 1:N  activity_events (as actor_client_user)
│         └── 1:N  activity_events
│
├── 1:N  contacts ──────────────────────────► client_contacts
│
├── 1:N  folders (self-referencing via parent_id)
│         └── 1:N  documents
│                   ├── 1:N  document_versions
│                   └── 1:1  document_permissions
│
├── 1:N  tasks
│         ├── 1:N  task_assignments
│         └── 1:N  task_comments
│
├── 1:N  invoices
│         ├── 1:N  invoice_items
│         └── 1:N  payments
│
├── 1:1  invoice_sequences  (atomic number generation)
├── 1:1  subscriptions ─────────────────────► plans
│         └── 1:N  subscription_events
│
├── 1:1  firm_settings
├── 1:1  storage_usage
├── 1:N  notifications
├── 1:N  email_events
├── 1:N  activity_events
└── 1:N  firm_feature_flags ──────────────► feature_flags

System tables (no firm_id):
  webhook_events    (Stripe idempotency)
  failed_jobs       (dead letter queue)
  feature_flags     (global flag definitions)
  plans             (subscription plan catalog)
  roles             (RBAC role definitions)
  permissions       (RBAC permission definitions)
```

---

## Cascade Rules Summary

| Relationship | On Delete |
|---|---|
| firms → users | CASCADE |
| firms → clients | CASCADE |
| firms → contacts | CASCADE |
| firms → folders | CASCADE |
| firms → documents | CASCADE |
| firms → tasks | CASCADE |
| firms → invoices | CASCADE |
| firms → payments | CASCADE |
| firms → notifications | CASCADE |
| firms → email_events | CASCADE |
| firms → activity_events | CASCADE |
| firms → storage_usage | CASCADE |
| firms → subscriptions | CASCADE |
| firms → invoice_sequences | CASCADE |
| firms → firm_settings | CASCADE |
| firms → user_roles | CASCADE |
| firms → firm_feature_flags | CASCADE |
| firms → client_contacts | CASCADE |
| firms → client_addresses | CASCADE |
| clients → client_contacts | CASCADE |
| clients → client_addresses | CASCADE |
| clients → folders | CASCADE |
| clients → documents | CASCADE |
| clients → tasks | CASCADE |
| clients → invoices | CASCADE |
| clients → client_users | CASCADE |
| client_users → portal_sessions | CASCADE |
| documents → document_versions | CASCADE |
| documents → document_permissions | CASCADE |
| tasks → task_assignments | CASCADE |
| tasks → task_comments | CASCADE |
| invoices → invoice_items | CASCADE |
| subscriptions → subscription_events | CASCADE |
| users → user_settings | CASCADE |
| users (uploaded_by) → documents | SET NULL |
| users (uploaded_by) → document_versions | SET NULL |
| users (created_by) → tasks | SET NULL |
| users (assigned_by) → task_assignments | SET NULL |
| users (user_id) → task_comments | SET NULL |
| users (resolved_by) → failed_jobs | SET NULL |
| folders → documents.folder_id | SET NULL |
| plans → subscriptions | RESTRICT |
| permissions → role_permissions | RESTRICT |

---

## Index Summary

| Table | Index Type | Columns |
|---|---|---|
| firms | UNIQUE | slug |
| users | UNIQUE | (firm_id, email) |
| contacts | PARTIAL UNIQUE | (firm_id, email) WHERE email IS NOT NULL AND deleted_at IS NULL |
| client_contacts | UNIQUE | (client_id, contact_id) |
| client_users | UNIQUE | (client_id, email) |
| invoices | UNIQUE | (firm_id, number) |
| role_permissions | UNIQUE | (role_id, permission_id) |
| user_roles | UNIQUE | (user_id, role_id, firm_id) |
| document_versions | UNIQUE | (document_id, version_number) |
| subscriptions | UNIQUE | firm_id |
| storage_usage | UNIQUE | firm_id |
| firm_settings | UNIQUE | firm_id |
| user_settings | UNIQUE | user_id |
| firm_feature_flags | UNIQUE | (firm_id, feature_flag_id) |
| webhook_events | UNIQUE | event_id |
| feature_flags | UNIQUE | name |
| plans | UNIQUE | slug |
| documents | COMPOSITE | (firm_id, client_id) |
| tasks | COMPOSITE | (firm_id, status, due_date) |
| invoices | COMPOSITE | (firm_id, status, due_date) |
| activity_events | COMPOSITE | (firm_id, created_at) |
| activity_events | COMPOSITE | (client_id, created_at) |
| notifications | COMPOSITE | (user_id, is_read, created_at) |
| clients | GIN | search_vector |
| contacts | GIN | search_vector |
| documents | GIN | search_vector |
| tasks | GIN | search_vector |
| failed_jobs | PARTIAL | resolved_at WHERE resolved_at IS NULL |

---

## Multi-Tenant RLS Coverage

```
Tables with direct firm_id (RLS via firm_id):
  users, clients, contacts, folders, documents, tasks,
  invoices, payments, notifications, email_events,
  activity_events, storage_usage, user_roles,
  firm_feature_flags, invoice_sequences, firm_settings,
  client_contacts, client_addresses

Tables with indirect RLS (via parent relationship):
  document_versions    → documents → firm_id
  document_permissions → documents → firm_id
  task_assignments     → tasks → firm_id
  task_comments        → tasks → firm_id
  invoice_items        → invoices → firm_id
  client_users         → clients → firm_id
  portal_sessions      → client_users → clients → firm_id
  user_settings        → users → firm_id

System tables (no RLS — shared across all tenants):
  firms, roles, permissions, role_permissions,
  plans, subscriptions, subscription_events,
  feature_flags, webhook_events, failed_jobs
```

---

**ERD Status:** ✅ Reflects final `schema.prisma` — 36 models, 11 ENUMs
