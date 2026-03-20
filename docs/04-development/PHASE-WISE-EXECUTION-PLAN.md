# Phase-Wise MVP Execution Plan

**Version:** 1.0 FINAL  
**Purpose:** Complete execution roadmap for Practice Management SaaS  
**Timeline:** 16 weeks (4 months)  
**Team:** 3-5 developers  
**Goal:** Launch revenue-generating MVP with expansion capability

**Source Documents:**
- docs/dev.md
- docs/implementation-plan.md
- docs/FINAL-ARCHITECTURE-FIXES.md
- docs/production-readiness.md
- docs/OPTIMIZED-MVP-PLAN.md
- docs/MVP-FEATURE-LOCK.md
- docs/IMPLEMENTATION-CHECKLIST.md

---

## 📋 Table of Contents

1. System Modules Overview
2. Complete Feature Inventory
3. MVP Feature Selection
4. Deferred Features (Post-MVP)
5. Phase-Wise Development Plan
6. Architecture Compatibility Rules
7. Database Planning
8. API Surface Planning
9. Frontend Scope Planning
10. Risk Analysis
11. Implementation Priority

---

## 1. System Modules Overview

### Module 1: Auth
**Purpose:** User authentication and authorization  
**Key Entities:** Users, Sessions, PasswordResets  
**Dependencies:** None (foundation module)

### Module 2: CRM
**Purpose:** Client and contact management  
**Key Entities:** Firms, Clients, Contacts, ClientContacts  
**Dependencies:** Auth

### Module 3: Documents
**Purpose:** File storage and management  
**Key Entities:** Folders, Documents  
**Dependencies:** Auth, CRM, S3

### Module 4: Tasks
**Purpose:** Task tracking and assignment  
**Key Entities:** Tasks, task_status_enum  
**Dependencies:** Auth, CRM

### Module 5: Billing (Client)
**Purpose:** Invoice generation and payment processing  
**Key Entities:** Invoices, InvoiceLineItems, Payments  
**Dependencies:** Auth, CRM, Stripe

### Module 6: Notifications
**Purpose:** Email sending and event tracking  
**Key Entities:** EmailEvents  
**Dependencies:** Auth, CRM, AWS SES

### Module 7: Portal
**Purpose:** Client-facing interface  
**Key Entities:** ClientUsers  
**Dependencies:** Auth, CRM, Documents, Billing

### Module 8: SaaS Billing
**Purpose:** Subscription management and usage limits  
**Key Entities:** Plans, Subscriptions, SubscriptionUsage  
**Dependencies:** Auth, Stripe

### Module 9: Onboarding
**Purpose:** User onboarding flow  
**Key Entities:** OnboardingProgress  
**Dependencies:** Auth, CRM

### Module 10: Observability
**Purpose:** Monitoring, logging, error tracking  
**Key Entities:** SecurityAuditLogs  
**Dependencies:** All modules

---

## 2. Complete Feature Inventory

### 2.1 Authentication Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| User Registration | Auth | Email + password signup | Low | ✅ |
| User Login | Auth | JWT-based authentication | Low | ✅ |
| Password Reset | Auth | Email-based password recovery | Low | ✅ |
| Session Management | Auth | JWT token management | Low | ✅ |
| 2FA | Auth | Two-factor authentication | Medium | ❌ |
| OAuth | Auth | Google/Microsoft login | Medium | ❌ |
| SSO | Auth | Enterprise single sign-on | High | ❌ |
| Magic Links | Auth | Passwordless login | Medium | ❌ |

### 2.2 CRM Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Firm Management | CRM | Create/update firm profile | Low | ✅ |
| Client CRUD | CRM | Create, read, update, delete clients | Low | ✅ |
| Client Search | CRM | Search clients by name | Low | ✅ |
| Client Soft Delete | CRM | Recoverable deletion | Low | ✅ |
| Contact CRUD | CRM | Manage contacts | Low | ✅ |
| Contact-Client Linking | CRM | Many-to-many relationships | Medium | ✅ |
| Client Tags | CRM | Categorize clients | Low | ❌ |
| Custom Fields | CRM | User-defined client fields | Medium | ❌ |
| Client Groups | CRM | Organize clients into groups | Medium | ❌ |
| Client Import/Export | CRM | Bulk data operations | Medium | ❌ |
| Client Merge | CRM | Combine duplicate clients | High | ❌ |
| Advanced Filters | CRM | Complex search queries | Medium | ❌ |

### 2.3 Document Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Folder Creation | Documents | Organize documents | Low | ✅ |
| File Upload | Documents | Upload to S3 (max 50MB) | Medium | ✅ |
| File Download | Documents | Signed URL download | Low | ✅ |
| File Delete | Documents | Remove documents | Low | ✅ |
| MIME Validation | Documents | File type checking | Low | ✅ |
| Storage Limits | Documents | Per-plan limits | Medium | ✅ |
| Virus Scanning | Documents | ClamAV integration | High | ❌ |
| Document Versioning | Documents | Track file versions | High | ❌ |
| Document Preview | Documents | In-browser preview | Medium | ❌ |
| Document Annotations | Documents | Comments/markup | High | ❌ |
| Document Templates | Documents | Reusable templates | Medium | ❌ |
| OCR | Documents | Text extraction | High | ❌ |
| Document Sharing Links | Documents | Public/private links | Medium | ❌ |
| Folder Permissions | Documents | Granular access control | High | ❌ |
| Document Tags | Documents | Categorization | Low | ❌ |
| Bulk Upload | Documents | Multiple file upload | Medium | ❌ |

### 2.4 Task Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Task Creation | Tasks | Create tasks | Low | ✅ |
| Task Assignment | Tasks | Assign to users | Low | ✅ |
| Task Status Update | Tasks | Change status | Low | ✅ |
| Task List/Filter | Tasks | View and filter tasks | Low | ✅ |
| Task Delete | Tasks | Remove tasks | Low | ✅ |
| Task Reminders | Tasks | Email reminders | Medium | ❌ |
| Subtasks | Tasks | Nested tasks | Medium | ❌ |
| Task Dependencies | Tasks | Task relationships | High | ❌ |
| Task Templates | Tasks | Reusable task sets | Medium | ❌ |
| Recurring Tasks | Tasks | Automated task creation | High | ❌ |
| Task Comments | Tasks | Discussion threads | Medium | ❌ |
| Task Attachments | Tasks | File attachments | Low | ❌ |
| Task Time Tracking | Tasks | Log time spent | Medium | ❌ |
| Task Priorities | Tasks | Priority levels | Low | ❌ |
| Kanban Board | Tasks | Visual task board | Medium | ❌ |
| Workflow Pipelines | Tasks | Custom workflows | High | ❌ |


### 2.5 Billing Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Invoice Creation | Billing | Create invoices with line items | Medium | ✅ |
| Invoice PDF Generation | Billing | Generate PDF invoices | Medium | ✅ |
| Invoice Email | Billing | Send invoice via email | Low | ✅ |
| Invoice List/View | Billing | View invoices | Low | ✅ |
| Payment Processing | Billing | Stripe Checkout integration | High | ✅ |
| Payment Webhook | Billing | Handle Stripe webhooks | High | ✅ |
| Payment History | Billing | View payment records | Low | ✅ |
| Recurring Invoices | Billing | Automated invoicing | High | ❌ |
| Invoice Templates | Billing | Customizable templates | Medium | ❌ |
| Tax Calculations | Billing | Automated tax | Medium | ❌ |
| Discounts | Billing | Apply discounts | Low | ❌ |
| Partial Payments | Billing | Split payments | Medium | ❌ |
| Invoice Reminders | Billing | Automated reminders | Medium | ❌ |
| Invoice Disputes | Billing | Dispute handling | High | ❌ |
| Credit Notes | Billing | Issue credits | Medium | ❌ |
| Estimates/Quotes | Billing | Pre-invoice quotes | Medium | ❌ |
| Multiple Payment Gateways | Billing | PayPal, etc. | High | ❌ |
| Payment Plans | Billing | Installment payments | High | ❌ |
| Refunds | Billing | Process refunds | Medium | ❌ |

### 2.6 Portal Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Client Login | Portal | Separate authentication | Medium | ✅ |
| View Documents | Portal | Access assigned documents | Low | ✅ |
| Upload Documents | Portal | Upload to allowed folders | Medium | ✅ |
| View Invoices | Portal | See invoice list | Low | ✅ |
| Pay Invoices | Portal | Stripe payment | High | ✅ |
| View Tasks | Portal | See assigned tasks | Low | ✅ |
| Client Dashboard | Portal | Analytics/overview | Medium | ❌ |
| Client Messaging | Portal | Chat with firm | High | ❌ |
| Client File Sharing | Portal | Share with others | Medium | ❌ |
| Client Notifications | Portal | In-app notifications | Medium | ❌ |
| Client Mobile App | Portal | Native mobile app | High | ❌ |

### 2.7 Notification Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Welcome Email | Notifications | New user email | Low | ✅ |
| Invoice Email | Notifications | Invoice delivery | Low | ✅ |
| Password Reset Email | Notifications | Password recovery | Low | ✅ |
| Email Tracking | Notifications | Track delivery/opens | Medium | ✅ |
| Task Assignment Email | Notifications | Notify assignee | Low | ❌ |
| Task Reminder Email | Notifications | Due date reminders | Medium | ❌ |
| Invoice Reminder Email | Notifications | Overdue reminders | Medium | ❌ |
| Custom Email Templates | Notifications | User-defined templates | Medium | ❌ |
| Email Scheduling | Notifications | Delayed sending | Medium | ❌ |
| Bulk Emails | Notifications | Mass communication | High | ❌ |
| Email Campaigns | Notifications | Marketing emails | High | ❌ |
| SMS Notifications | Notifications | Text messages | Medium | ❌ |
| Push Notifications | Notifications | Mobile/browser push | High | ❌ |
| In-App Notifications | Notifications | UI notifications | Medium | ❌ |

### 2.8 SaaS Billing Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Plan Management | SaaS Billing | Define subscription plans | Low | ✅ |
| Subscription Creation | SaaS Billing | Create subscriptions | Medium | ✅ |
| Stripe Subscription | SaaS Billing | Stripe integration | High | ✅ |
| Usage Limits | SaaS Billing | Enforce plan limits | Medium | ✅ |
| Subscription Webhooks | SaaS Billing | Handle Stripe events | High | ✅ |
| Usage Tracking | SaaS Billing | Monitor usage | Medium | ✅ |
| Plan Upgrades/Downgrades | SaaS Billing | Change plans | High | ❌ |
| Proration | SaaS Billing | Prorated billing | High | ❌ |
| Trial Periods | SaaS Billing | Free trials | Medium | ❌ |
| Coupons/Discounts | SaaS Billing | Promotional codes | Medium | ❌ |
| Usage-Based Billing | SaaS Billing | Pay-per-use | High | ❌ |
| Multi-Currency | SaaS Billing | International pricing | High | ❌ |

### 2.9 Onboarding Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Onboarding Progress | Onboarding | Track completion | Low | ❌ |
| Onboarding Wizard | Onboarding | Guided setup | Medium | ❌ |
| Sample Data | Onboarding | Demo content | Low | ❌ |
| Video Tutorials | Onboarding | Help videos | Medium | ❌ |
| Interactive Demos | Onboarding | Product tours | High | ❌ |
| Onboarding Analytics | Onboarding | Track completion rates | Medium | ❌ |

### 2.10 Observability Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Structured Logging | Observability | Winston logs | Low | ✅ |
| Error Tracking | Observability | Sentry integration | Low | ✅ |
| Health Check | Observability | System health endpoint | Low | ✅ |
| Security Audit Logs | Observability | Track security events | Medium | ✅ |
| Request Metrics | Observability | Basic metrics | Low | ✅ |
| Prometheus Metrics | Observability | Advanced metrics | Medium | ❌ |
| Performance Monitoring | Observability | APM | High | ❌ |
| Custom Dashboards | Observability | Grafana dashboards | High | ❌ |
| Alerting | Observability | Automated alerts | Medium | ❌ |

### 2.11 Advanced Features

| Feature | Module | Description | Complexity | MVP |
|---------|--------|-------------|------------|-----|
| Activity Feed | Multiple | Event timeline | Medium | ❌ |
| Feature Flags | Multiple | Toggle features | Medium | ❌ |
| API Access | Multiple | Public API | High | ❌ |
| Webhooks | Multiple | Event notifications | High | ❌ |
| Integrations | Multiple | Third-party apps | High | ❌ |
| Advanced Reporting | Multiple | Custom reports | High | ❌ |
| Analytics Dashboard | Multiple | Business intelligence | High | ❌ |
| Time Tracking | Multiple | Billable hours | Medium | ❌ |
| E-Signature | Multiple | DocuSign integration | High | ❌ |
| Workflow Automation | Multiple | Custom workflows | High | ❌ |
| White-Labeling | Multiple | Custom branding | High | ❌ |
| Multi-Firm Support | Multiple | Manage multiple firms | High | ❌ |
| Role-Based Permissions | Multiple | Granular access control | High | ❌ |
| Audit Trail | Multiple | Complete history | Medium | ❌ |
| Data Export | Multiple | Bulk export | Medium | ❌ |
| Mobile Apps | Multiple | iOS/Android apps | High | ❌ |

---

## 3. MVP Feature Selection

### 3.1 Core MVP Features (MUST BUILD)

**Total Features:** 35  
**Timeline:** 16 weeks  
**Goal:** Revenue generation + client collaboration

#### Authentication (5 features)
1. ✅ User Registration - Email + password signup
2. ✅ User Login - JWT authentication
3. ✅ Password Reset - Email-based recovery
4. ✅ Session Management - JWT tokens
5. ✅ Logout - Session termination

**Reason:** Foundation for all other features. Security critical.

#### CRM (6 features)
1. ✅ Firm Management - Basic profile
2. ✅ Client CRUD - Create, read, update, delete
3. ✅ Client Search - Find by name
4. ✅ Client Soft Delete - Recoverable deletion
5. ✅ Contact CRUD - Manage contacts
6. ✅ Contact-Client Linking - Many-to-many relationships

**Reason:** Core business entity management. Required for all workflows.

#### Documents (6 features)
1. ✅ Folder Creation - Organize files
2. ✅ File Upload - S3 storage (max 50MB)
3. ✅ File Download - Signed URLs
4. ✅ File Delete - Remove files
5. ✅ MIME Validation - Security check
6. ✅ Storage Limits - Per-plan enforcement

**Reason:** Primary value proposition - document exchange with clients.

#### Tasks (5 features)
1. ✅ Task Creation - Create tasks
2. ✅ Task Assignment - Assign to users
3. ✅ Task Status Update - Track progress
4. ✅ Task List/Filter - View tasks
5. ✅ Task Delete - Remove tasks

**Reason:** Workflow management. Helps firms track work.

#### Billing (7 features)
1. ✅ Invoice Creation - Generate invoices
2. ✅ Invoice PDF Generation - Create PDFs
3. ✅ Invoice Email - Send to clients
4. ✅ Invoice List/View - View invoices
5. ✅ Payment Processing - Stripe Checkout
6. ✅ Payment Webhook - Handle payments
7. ✅ Payment History - View payments

**Reason:** Revenue generation. Critical for business model.

#### Portal (6 features)
1. ✅ Client Login - Separate authentication
2. ✅ View Documents - Access files
3. ✅ Upload Documents - Submit files
4. ✅ View Invoices - See invoices
5. ✅ Pay Invoices - Make payments
6. ✅ View Tasks - See assigned tasks

**Reason:** Client collaboration. Differentiator from competitors.

#### Notifications (4 features)
1. ✅ Welcome Email - Onboarding
2. ✅ Invoice Email - Delivery
3. ✅ Password Reset Email - Recovery
4. ✅ Email Tracking - Monitor delivery

**Reason:** Communication. Essential for user experience.

#### SaaS Billing (6 features)
1. ✅ Plan Management - Define plans
2. ✅ Subscription Creation - Create subscriptions
3. ✅ Stripe Subscription - Integration
4. ✅ Usage Limits - Enforce limits
5. ✅ Subscription Webhooks - Handle events
6. ✅ Usage Tracking - Monitor usage

**Reason:** Business model. Required for revenue.

#### Observability (5 features)
1. ✅ Structured Logging - Winston
2. ✅ Error Tracking - Sentry
3. ✅ Health Check - System status
4. ✅ Security Audit Logs - Track events
5. ✅ Request Metrics - Basic metrics

**Reason:** Production readiness. Required for operations.

---

## 4. Deferred Features (Post-MVP)

### Phase 2 - Post Launch (Month 5-6)
**Goal:** Enhance user experience and automation

**Features (15):**
- Task Reminders - Email notifications for due tasks
- Invoice Reminders - Automated overdue notices
- Activity Feed - Event timeline
- Task Assignment Emails - Notify assignees
- Advanced Search - Complex queries
- Onboarding Wizard - Guided setup
- Client Tags - Categorization
- Document Tags - Organization
- Task Priorities - Priority levels
- Welcome Emails - Enhanced onboarding
- Email Scheduling - Delayed sending
- Storage Usage Dashboard - UI for usage
- Feature Flags - Toggle features
- Trial Periods - Free trials
- Plan Upgrades/Downgrades - Change plans

**Estimated Effort:** 6-8 weeks  
**Dependencies:** MVP must be live with paying customers

---

### Phase 3 - Growth Phase (Month 7-9)
**Goal:** Scale and advanced features

**Features (12):**
- Virus Scanning - ClamAV integration
- Advanced Reporting - Custom reports
- Analytics Dashboard - Business intelligence
- Custom Fields - User-defined fields
- Bulk Operations - Mass actions
- Document Versioning - Track versions
- Task Templates - Reusable tasks
- Recurring Invoices - Automated billing
- Multi-Currency - International support
- API Access - Public API
- Webhooks - Event notifications
- Prometheus Metrics - Advanced monitoring

**Estimated Effort:** 10-12 weeks  
**Dependencies:** Phase 2 complete, 50+ customers

---

### Phase 4 - Advanced Platform (Month 10-12)
**Goal:** Enterprise features and integrations

**Features (10):**
- E-Signature - DocuSign integration
- Time Tracking - Billable hours
- Workflow Automation - Custom workflows
- Integrations - QuickBooks, Xero
- White-Labeling - Custom branding
- Mobile Apps - iOS/Android
- Advanced Permissions - Role-based access
- Document Preview - In-browser viewing
- OCR - Text extraction
- Workflow Pipelines - Custom stages

**Estimated Effort:** 12-16 weeks  
**Dependencies:** Phase 3 complete, 100+ customers

---

### Phase 5 - Enterprise (Year 2)
**Goal:** Enterprise-grade platform

**Features (8):**
- SSO - Enterprise authentication
- Multi-Firm Support - Manage multiple firms
- Advanced Integrations - Custom connectors
- AI Automation - Smart workflows
- Marketplace - Third-party apps
- Advanced Security - SOC 2 compliance
- Data Residency - Regional hosting
- Custom Workflows - Visual builder

**Estimated Effort:** 20+ weeks  
**Dependencies:** Phase 4 complete, enterprise customers

---


## 5. Phase-Wise Development Plan

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Working authentication and development environment

**Frontend Implementation Rules:**
> All frontend pages in this and every subsequent phase must be built using the `ui_theme_ref/` design system.  
> See: `docs/04-development/FRONTEND-DESIGN-SYSTEM-GOVERNANCE.md`
> - Use `AppLayout`, `AppHeader`, `AppSidebar`, `PageContainer` for all pages
> - Use `components/ui/button`, `components/form`, `components/ui/table` etc.
> - Do not write raw HTML UI or copy example pages from the theme

**Modules:** Auth  
**Features:**
- User registration
- User login
- Password reset
- JWT middleware
- Session management

**Database Tables (existing — no new tables):**
- firms
- users
- roles
- permissions
- user_roles
- role_permissions
- firm_settings
- user_settings

> ⚠️ No new tables. Password reset tokens are stored in-memory/Redis or handled via signed JWT. No `password_resets` table exists in the schema.

**API Endpoints:**
- POST /auth/register
- POST /auth/login
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /auth/logout

**Frontend Pages:**
- Login
- Register
- Forgot Password

**Deliverable:** Developers can login and access dashboard

**Success Criteria:**
- [ ] Can register new user
- [ ] Can login with JWT
- [ ] Can reset password
- [ ] JWT expires after 7 days
- [ ] All tests passing

---

### Phase 2: CRM (Weeks 3-4)
**Goal:** Client and contact management working

**Modules:** CRM  
**Features:**
- Firm management
- Client CRUD
- Client search
- Client soft delete
- Contact CRUD
- Contact-client linking

**Database Tables:**
- clients
- contacts
- client_contacts

**API Endpoints:**
- GET /firms/:id
- PATCH /firms/:id
- GET /clients
- POST /clients
- GET /clients/:id
- PATCH /clients/:id
- DELETE /clients/:id
- GET /contacts
- POST /contacts
- GET /contacts/:id
- PATCH /contacts/:id
- DELETE /contacts/:id
- POST /clients/:id/contacts/link
- DELETE /clients/:id/contacts/:contactId

**Frontend Pages:**
- Dashboard
- Clients List
- Client Detail
- Client Form
- Contacts List
- Contact Form

**Deliverable:** Can manage clients and contacts

**Success Criteria:**
- [ ] Can create/edit/delete clients
- [ ] Can search clients by name
- [ ] Can create/edit/delete contacts
- [ ] Can link contacts to multiple clients
- [ ] Soft delete working

---

### Phase 3: Documents (Weeks 5-6)
**Goal:** Document upload and download working

**Modules:** Documents  
**Features:**
- Folder creation
- File upload (S3)
- File download (signed URLs)
- File delete
- MIME validation
- Storage limits

**Database Tables:**
- folders
- documents

**API Endpoints:**
- POST /clients/:id/folders
- GET /clients/:id/folders
- POST /folders/:id/upload
- GET /documents/:id/download
- DELETE /documents/:id
- GET /clients/:id/documents

**Frontend Pages:**
- Documents List
- Document Upload
- Folder Tree

**Deliverable:** Can upload and download documents

**Success Criteria:**
- [ ] Can create folders
- [ ] Can upload files (max 50MB)
- [ ] Can download via signed URL
- [ ] MIME validation working
- [ ] Storage limits enforced

---

### Phase 4: Tasks (Week 7)
**Goal:** Task management working

**Modules:** Tasks  
**Features:**
- Task creation
- Task assignment
- Task status update
- Task list/filter
- Task delete

**Database Tables:**
- task_statuses
- tasks

**API Endpoints:**
- GET /tasks
- POST /tasks
- GET /tasks/:id
- PATCH /tasks/:id
- DELETE /tasks/:id
- GET /clients/:id/tasks

**Frontend Pages:**
- Tasks List
- Task Form
- Task Detail

**Deliverable:** Can manage tasks

**Success Criteria:**
- [ ] Can create/edit/delete tasks
- [ ] Can assign tasks to users
- [ ] Can update task status
- [ ] Can filter by client/assignee/status

---

### Phase 5: Invoicing (Weeks 8-9)
**Goal:** Invoice creation and payment working

**Modules:** Billing  
**Features:**
- Invoice creation
- Invoice PDF generation
- Invoice email
- Invoice list/view
- Payment processing (Stripe)
- Payment webhook
- Payment history

**Database Tables:**
- invoices
- invoice_line_items
- payments

**API Endpoints:**
- GET /invoices
- POST /invoices
- GET /invoices/:id
- PATCH /invoices/:id
- POST /invoices/:id/send
- POST /invoices/:id/pay
- POST /payments/stripe/webhook
- GET /clients/:id/invoices
- GET /clients/:id/payments

**Frontend Pages:**
- Invoices List
- Invoice Form
- Invoice Detail
- Payment Success
- Payment Failure

**Deliverable:** Can create invoices and accept payments

**Success Criteria:**
- [ ] Can create invoice with line items
- [ ] PDF generated automatically
- [ ] Can email invoice to client
- [ ] Stripe Checkout working
- [ ] Webhook marks invoice as paid
- [ ] Payment recorded in database

---

### Phase 6: Email Notifications (Week 10)
**Goal:** Email delivery working

**Modules:** Notifications  
**Features:**
- Welcome email
- Invoice email
- Password reset email
- Email tracking

**Database Tables:**
- email_events

**API Endpoints:**
- POST /emails/send (internal)
- POST /emails/webhook (SES)

**Email Templates:**
- welcome.html
- invoice.html
- password-reset.html

**Deliverable:** Emails sending successfully

**Success Criteria:**
- [ ] Welcome email sent on registration
- [ ] Invoice email sent with payment link
- [ ] Password reset email working
- [ ] Email events tracked (sent, delivered, bounced)

---

### Phase 7: Beta Launch (Week 11)
**Goal:** First beta users using the system

**Activities:**
- Deploy to staging
- Manual testing
- Fix critical bugs
- Recruit 5 beta users
- Onboard beta users
- Collect feedback

**Deliverable:** Beta users actively using system

**Success Criteria:**
- [ ] 5 beta users onboarded
- [ ] Can complete full workflow (client → document → invoice → payment)
- [ ] <5 critical bugs
- [ ] <500ms API response time
- [ ] Positive feedback from beta users

---

### Phase 8: Client Portal (Weeks 12-14)
**Goal:** Clients can login and interact

**Modules:** Portal  
**Features:**
- Client login
- View documents
- Upload documents
- View invoices
- Pay invoices
- View tasks

**Database Tables:**
- client_users

**API Endpoints:**
- POST /portal/auth/login
- POST /portal/auth/register
- GET /portal/documents
- POST /portal/documents/upload
- GET /portal/invoices
- POST /portal/invoices/:id/pay
- GET /portal/tasks

**Frontend Pages:**
- Portal Login
- Portal Dashboard
- Portal Documents
- Portal Invoices
- Portal Tasks

**Deliverable:** Clients can login and pay invoices

**Success Criteria:**
- [ ] Client can login with credentials
- [ ] Client can view their documents
- [ ] Client can upload to allowed folders
- [ ] Client can view invoices
- [ ] Client can pay via Stripe
- [ ] Client isolation working (CRITICAL)

---

### Phase 9: SaaS Billing (Weeks 15-16)
**Goal:** Subscription management working

**Modules:** SaaS Billing  
**Features:**
- Plan management
- Subscription creation
- Stripe subscription
- Usage limits
- Subscription webhooks
- Usage tracking

**Database Tables:**
- plans
- subscriptions
- subscription_usage

**API Endpoints:**
- GET /plans
- POST /subscriptions
- GET /subscriptions/:id
- PATCH /subscriptions/:id
- DELETE /subscriptions/:id
- POST /subscriptions/webhook
- GET /usage

**Frontend Pages:**
- Plans Page
- Subscription Management
- Billing History
- Usage Dashboard (basic)

**Deliverable:** Can create subscriptions and enforce limits

**Success Criteria:**
- [ ] Plans seeded (Starter, Pro, Enterprise)
- [ ] Can create Stripe subscription
- [ ] Usage limits enforced
- [ ] Webhooks handle subscription changes
- [ ] Can track usage per firm

---

### Phase 10: Production Launch (Week 16)
**Goal:** Live in production with paying customers

**Activities:**
- Security audit
- Performance testing
- Deploy to production
- Configure monitoring
- Set up backups
- Launch to beta users
- Monitor for 48 hours

**Deliverable:** LIVE IN PRODUCTION

**Success Criteria:**
- [ ] All features tested
- [ ] Security audit passed
- [ ] <500ms p95 response time
- [ ] Monitoring configured (Sentry + logs)
- [ ] Backups configured
- [ ] 10 paying customers
- [ ] $500 MRR
- [ ] <5 critical bugs
- [ ] 99% uptime

---

## 6. Architecture Compatibility Rules

### Rule 1: Module Isolation
**Principle:** Modules must be loosely coupled

**Implementation:**
- Each module has its own folder
- Modules communicate through service layer only
- No direct repository access across modules
- No circular dependencies

**Future Compatibility:**
- Modules can be extracted to microservices
- API contracts remain stable
- Database can be split per module

**Example:**
```typescript
// ✅ GOOD: Service-to-service communication
class InvoicesService {
  constructor(
    private invoicesRepo: InvoicesRepository,
    private clientsService: ClientsService  // Service layer
  ) {}
}

// ❌ BAD: Direct repository access
class InvoicesService {
  constructor(
    private invoicesRepo: InvoicesRepository,
    private clientsRepo: ClientsRepository  // Direct access
  ) {}
}
```

---

### Rule 2: Database Migrations Must Be Backward Compatible
**Principle:** New migrations cannot break existing code

**Implementation:**
- Add columns with defaults or nullable
- Never drop columns (mark as deprecated)
- Use database views for schema changes
- Version API responses

**Future Compatibility:**
- Can add features without breaking MVP
- Can run multiple versions simultaneously
- Zero-downtime deployments

**Example:**
```sql
-- ✅ GOOD: Add column with default
ALTER TABLE clients ADD COLUMN tags JSONB DEFAULT '[]';

-- ❌ BAD: Drop column
ALTER TABLE clients DROP COLUMN status;

-- ✅ GOOD: Deprecate instead
ALTER TABLE clients ADD COLUMN status_new VARCHAR(50);
-- Migrate data, then drop old column in future release
```

---

### Rule 3: API Versioning
**Principle:** API changes must not break existing clients

**Implementation:**
- Version API endpoints (/v1/, /v2/)
- Maintain old versions for 6 months
- Use content negotiation for breaking changes
- Document deprecation timeline

**Future Compatibility:**
- Can add new features without breaking mobile apps
- Can refactor backend without frontend changes
- Can support multiple client versions

**Example:**
```typescript
// ✅ GOOD: Versioned endpoints
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// ✅ GOOD: Additive changes in same version
interface Client {
  id: string;
  name: string;
  tags?: string[];  // Optional new field
}
```

---

### Rule 4: Event-Driven Extensions
**Principle:** New features can hook into existing events

**Implementation:**
- Emit domain events for key actions
- Use event bus for cross-module communication
- Events are append-only (never modify)
- Event handlers are idempotent

**Future Compatibility:**
- Can add features without modifying existing code
- Can add integrations via event listeners
- Can build analytics without touching core

**Example:**
```typescript
// Existing code emits events
await domainEvents.emit(DomainEvent.INVOICE_CREATED, {
  invoiceId: invoice.id,
  clientId: invoice.clientId
});

// Future feature listens to events
domainEvents.on(DomainEvent.INVOICE_CREATED, async (data) => {
  // New feature: Send to accounting system
  await quickbooksService.syncInvoice(data.invoiceId);
});
```

---

### Rule 5: Feature Flags for Gradual Rollout
**Principle:** New features can be toggled without deployment

**Implementation:**
- Check feature flags before executing code
- Flags can be per-firm or global
- Flags stored in database
- Flags can be changed via admin UI

**Future Compatibility:**
- Can test features with subset of users
- Can roll back features without deployment
- Can A/B test new features

**Example:**
```typescript
// Check flag before executing
if (await featureFlags.isEnabled(firmId, 'enable_e_signature')) {
  await eSignatureService.sendForSignature(documentId);
}
```

---

### Rule 6: Storage Abstraction
**Principle:** Storage provider can be swapped without code changes

**Implementation:**
- Use storage interface
- Factory pattern for provider selection
- Configuration-driven provider choice
- All providers implement same interface

**Future Compatibility:**
- Can migrate from S3 to Cloudflare R2
- Can support multiple providers
- Can add new providers without refactoring

**Example:**
```typescript
// Interface remains stable
interface StorageProvider {
  upload(key: string, buffer: Buffer): Promise<string>;
  download(key: string): Promise<Buffer>;
}

// Provider selected via config
const storage = StorageFactory.create(process.env.STORAGE_PROVIDER);
```

---

### Rule 7: Soft Deletes
**Principle:** Data is never permanently deleted

**Implementation:**
- Add deleted_at column to all tables
- Filter deleted records in queries
- Provide restore functionality
- Hard delete only after retention period

**Future Compatibility:**
- Can add audit trail features
- Can implement data recovery
- Can comply with data retention policies

---

### Rule 8: Multi-Tenancy Isolation
**Principle:** Tenant data must be completely isolated

**Implementation:**
- firm_id on all tenant tables
- Row Level Security (RLS) policies
- Tenant context middleware
- No cross-tenant queries

**Future Compatibility:**
- Can move tenants to separate databases
- Can implement tenant-specific features
- Can scale per-tenant

---

## 7. Database Planning

### 7.1 MVP Tables (Required for Launch)

**Total Tables:** 20

1. **firms** - Tenant organizations
2. **users** - Staff users
3. **clients** - Client accounts
4. **contacts** - Contact persons
5. **client_contacts** - Many-to-many join
6. **folders** - Document folders
7. **documents** - File metadata
8. **task_statuses** - Task status reference
9. **tasks** - Task tracking
10. **invoices** - Invoice records
11. **invoice_line_items** - Invoice details
12. **payments** - Payment records
13. **client_users** - Portal authentication
14. **email_events** - Email tracking
15. **plans** - Subscription plans
16. **subscriptions** - Firm subscriptions
17. **subscription_usage** - Usage tracking
18. **security_audit_logs** - Security events
19. **idempotency_keys** - Webhook deduplication
20. **sessions** - Optional session storage

---

### 7.2 Post-MVP Tables (Future Phases)

**Phase 2 Tables (7):**
21. **activity_events** - Activity feed
22. **feature_flags** - Feature toggles
23. **firm_feature_flags** - Per-firm flags
24. **onboarding_progress** - Onboarding tracking
25. **client_tags** - Client categorization
26. **document_tags** - Document categorization
27. **task_templates** - Reusable tasks

**Phase 3 Tables (5):**
28. **time_entries** - Time tracking
29. **document_versions** - Version history
30. **recurring_invoices** - Automated invoicing
31. **webhooks** - Outgoing webhooks
32. **api_keys** - API authentication

**Phase 4 Tables (4):**
33. **e_signatures** - Signature tracking
34. **workflow_pipelines** - Custom workflows
35. **integrations** - Third-party connections
36. **custom_fields** - User-defined fields

---

### 7.3 Schema Evolution Strategy

**Adding New Tables:**
- Create migration with new table
- Add foreign keys to existing tables
- Update Prisma schema
- Generate new types
- No impact on existing code

**Adding New Columns:**
- Add column with DEFAULT or NULL
- Update Prisma schema
- Update types
- Existing queries continue working

**Modifying Columns:**
- Add new column with new name
- Migrate data in background
- Update code to use new column
- Deprecate old column
- Drop old column in future release

**Example Migration Path:**
```sql
-- Step 1: Add new column
ALTER TABLE clients ADD COLUMN status_v2 VARCHAR(50) DEFAULT 'active';

-- Step 2: Migrate data
UPDATE clients SET status_v2 = status WHERE status_v2 IS NULL;

-- Step 3: Update code to use status_v2

-- Step 4: Drop old column (6 months later)
ALTER TABLE clients DROP COLUMN status;
ALTER TABLE clients RENAME COLUMN status_v2 TO status;
```

---

