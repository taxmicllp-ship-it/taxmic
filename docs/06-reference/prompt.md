You are a senior software architect, SaaS infrastructure engineer, and technical documentation expert.

Your task is to create a complete Technical Specification Document (TSD) for building a SaaS MVP platform similar to a lightweight version of TaxDome designed for solo bookkeepers and small accounting firms.

The system is a cloud-based practice management platform with the following core capabilities:

- Light CRM (clients & contacts)
- Client portal for document exchange
- Document upload & request system
- Task tracking and reminders
- Client messaging/chat
- Basic invoicing
- Online payments
- Automated reminders
- Basic e-signature
- Optional time tracking

The goal is to design the minimum sellable SaaS system that can realistically launch in 4–6 months.

The output must be a complete engineering blueprint.

Do NOT produce a product description.  
Produce technical architecture and engineering specifications.

The document must include the following sections in detail.

---

# 1. System Overview

Explain:

- Purpose of the platform
- Target users
- Core product goals
- High-level system capabilities
- MVP scope vs excluded features

---

# 2. System Architecture

Design the complete SaaS architecture.

Include:

- Monolith vs microservices decision
- Service layers
- Backend architecture
- Frontend architecture
- API architecture
- Event systems
- Background workers
- Storage services

Provide architecture diagrams if possible.

---

# 3. Technology Stack

Define recommended stack for production SaaS:

Backend:
- Framework (e.g., Laravel / FastAPI / Node / Go)
- API framework
- Authentication system

Frontend:
- React / Next.js / Vue
- State management
- UI framework

Infrastructure:
- Cloud provider (AWS / GCP)
- Containerization (Docker)
- CI/CD

Database:
- PostgreSQL
- Redis
- Object storage

Explain WHY each technology is chosen.

---

# 4. Database Architecture

Design the full relational schema.

Include tables such as:

Users
Clients
Contacts
ClientTags
Folders
Documents
Messages
Tasks
Invoices
Payments
TimeEntries
Notifications
AuditLogs

For each table specify:

- columns
- types
- relationships
- indexes
- constraints

Also explain:

- multi-tenant architecture
- data isolation strategy

---

# 5. API Design

Define REST API endpoints.

Examples:

Auth
POST /auth/login
POST /auth/register

Clients
GET /clients
POST /clients
GET /clients/{id}

Documents
POST /documents/upload
GET /documents/{id}

Tasks
POST /tasks
PATCH /tasks/{id}

Invoices
POST /invoices
GET /invoices/{id}

Payments
POST /payments/checkout

Messages
POST /messages
GET /messages/{client_id}

Include:

- request format
- response format
- authentication method
- rate limiting strategy

---

# 6. Client Portal Architecture

Describe how the portal works:

- client authentication
- document upload flow
- invoice payment flow
- messaging flow
- task completion flow

Explain security isolation between client and firm data.

---

# 7. File Storage System

Design the document storage architecture.

Include:

- object storage (S3 compatible)
- folder structure
- signed URLs
- upload validation
- virus scanning
- file size limits

---

# 8. Messaging System

Design secure messaging:

- message storage
- attachment handling
- notifications
- websocket vs polling

---

# 9. Task & Reminder Engine

Define how tasks work:

- task creation
- due date logic
- reminder scheduler
- cron jobs
- background workers

---

# 10. Billing & Payment System

Explain invoicing architecture:

- invoice generation
- line items
- invoice PDF creation
- payment integration (Stripe)

Explain:

- payment webhook handling
- payment reconciliation
- failed payment handling

---

# 11. Authentication & Security

Define security model:

- authentication (JWT / sessions)
- password hashing
- RBAC roles
- client vs staff permissions
- audit logs

Include:

- encryption
- rate limiting
- API security
- file access protection

---

# 12. SaaS Multi-Tenant Design

Explain:

- tenant isolation
- organization structure
- database strategy
- scaling implications

---

# 13. Infrastructure & DevOps

Define production deployment architecture.

Include:

- containerization
- orchestration
- CI/CD pipeline
- monitoring
- logging

Example stack:

Docker
Kubernetes / ECS
Cloudflare
Postgres managed DB
S3 object storage
Redis queue

---

# 14. Performance & Scalability

Explain:

- caching strategy
- horizontal scaling
- DB indexing
- queue processing

Design system capable of handling:

10,000 firms  
100,000 clients  
millions of documents

---

# 15. Security & Compliance

Define:

- data encryption
- secure file access
- audit logging
- GDPR considerations
- financial data protection

---

# 16. Development Roadmap

Break implementation into phases:

Phase 1:
Core backend

Phase 2:
Client portal

Phase 3:
Billing

Phase 4:
Automation & reminders

Estimate timeline for:

1 developer
small team (4 devs)

---

# 17. Cost Estimation

Estimate infrastructure cost at:

100 users  
1000 users  
10,000 users

Include:

- compute
- storage
- bandwidth
- email
- payments

---

# 18. Risks & Technical Challenges

Explain potential problems:

- document storage scaling
- payment reliability
- security risks
- multi-tenant data leakage
- notification delivery

Provide mitigation strategies.

---

The final output must be structured like a production-grade technical architecture document suitable for engineering implementation.