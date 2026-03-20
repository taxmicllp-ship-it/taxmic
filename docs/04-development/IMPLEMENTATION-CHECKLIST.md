# Implementation Checklist

**Version:** 2.0 OPTIMIZED  
**Purpose:** Week-by-week implementation guide  
**Timeline:** 16 weeks (optimized from 19)  
**Team:** 3-5 developers

**⚠️ NOTE:** This is the OPTIMIZED version. See `OPTIMIZED-MVP-PLAN.md` for rationale.

**Key Changes:**
- Removed: Virus scanning, Prometheus, 80% test coverage, onboarding wizard, activity feed
- Simplified: Documents (basic validation only), monitoring (Sentry + logs only)
- Beta users start Week 10 (not Week 18)
- Focus: First $1000, not first 10,000 users

---

## PHASE 1: CORE PLATFORM (Weeks 1-6)

---

## Frontend Implementation Rules

> All UI development must follow the design system governance document.  
> See: `docs/04-development/FRONTEND-DESIGN-SYSTEM-GOVERNANCE.md`

**Non-negotiable rules:**
- All UI must use components from `ui_theme_ref/` — no custom UI elements
- Pages must use `AppLayout → AppHeader → AppSidebar → PageContainer` structure
- Only Taxmic brand colors (`#059669` primary, `#F9FAFB` background, etc.)
- Missing components must be flagged and requested — never worked around
- Example pages from `ui_theme_ref/pages/` are reference only (except 404, login, signup)

---

## Week 1: Foundation

### Repository Setup
- [ ] Initialize monorepo with Turborepo
- [ ] Set up folder structure (apps/, packages/)
- [ ] Configure TypeScript
- [ ] Set up ESLint + Prettier
- [ ] Configure Git hooks (Husky)
- [ ] Set up GitHub repository
- [ ] Configure branch protection rules

### Development Environment
- [ ] Install Docker Desktop
- [ ] Create docker-compose.yml (Postgres + Redis only)
- [ ] Set up PostgreSQL container
- [ ] Set up Redis container
- [ ] Create .env.example
- [ ] Document setup in README

### Database Setup
- [ ] Verify Prisma schema matches deployed DB (`prisma migrate status`)
- [ ] Run `prisma generate` to sync client types
- [ ] Confirm all 36 tables are present in dev database
- [ ] Seed system data (task statuses) if not already seeded

### CI/CD Pipeline (Simplified)
- [ ] Create GitHub Actions workflow
- [ ] Set up automated tests (lint + test only)
- [ ] Configure linting checks
- [ ] Docker image builds (deferred to Week 15)

### Basic Auth
- [ ] User registration endpoint
- [ ] Login endpoint (JWT)
- [ ] Password hashing (bcrypt)
- [ ] JWT middleware
- [ ] Password reset flow

**Deliverable:** Working dev environment + basic auth

---

## Week 2: CRM Foundation

### Clients
- [ ] Verify `clients` table exists in DB (`prisma migrate status`)
- [ ] Clients CRUD endpoints
- [ ] Client search (basic name search only)
- [ ] Soft delete implementation

### Contacts
- [ ] Contacts table migration
- [ ] ClientContacts join table
- [ ] Contacts CRUD endpoints
- [ ] Link/unlink contact to client
- [ ] Many-to-many relationship working

### Testing
- [ ] Unit tests for auth service
- [ ] Unit tests for CRM services
- [ ] Integration tests for critical endpoints

**Deliverable:** Complete CRM functionality

---

## Week 3: Documents (Simplified - NO Virus Scanning)

### S3 Integration
- [ ] Configure AWS S3 bucket
- [ ] Implement S3 upload service
- [ ] Generate pre-signed URLs
- [ ] Implement S3 download service

### Document Management
- [ ] Verify `folders` and `documents` tables exist in DB
- [ ] Upload endpoint (multipart, max 50MB)
- [ ] MIME type validation (PDF, images, Excel, Word only)
- [ ] File size validation (max 50MB)
- [ ] Download endpoint (signed URL)
- [ ] Delete endpoint
- [ ] List documents endpoint

### Storage Limits (Background Only)
- [ ] Storage usage tracking (no UI)
- [ ] Per-plan limits in database
- [ ] Block upload if over limit

### ❌ REMOVED: Virus Scanning
**Reason:** Adds complexity, infrastructure, latency. Use S3 + MIME validation for MVP.

### Testing
- [ ] Unit tests for document service
- [ ] Integration tests for upload/download
- [ ] Test storage limits

**Deliverable:** Document management with basic security

---

## Week 4: Tasks

### Task Management
- [ ] Verify `tasks` table and `task_status_enum` exist in DB
- [ ] Seed default statuses (NEW, IN_PROGRESS, WAITING_CLIENT, REVIEW, COMPLETED) if not seeded
- [ ] Tasks CRUD endpoints
- [ ] Status update endpoint
- [ ] Task assignment logic

### Task Queries
- [ ] List tasks by client
- [ ] List tasks by assignee
- [ ] List tasks by status
- [ ] Filter overdue tasks

### Testing
- [ ] Unit tests for task service
- [ ] Integration tests for task endpoints
- [ ] Test status transitions

**Deliverable:** Complete task management

---

## Week 5-6: Admin UI + Testing

### Admin UI (React)
- [ ] Set up React app (Vite + React Router)
- [ ] Authentication pages (login, register)
- [ ] Dashboard layout
- [ ] Client list page
- [ ] Client detail page
- [ ] Document upload page
- [ ] Document list page
- [ ] Task list page
- [ ] Task creation form

### Testing + Polish
- [ ] Integration tests for all Phase 1 features
- [ ] Manual testing of critical flows
- [ ] Fix bugs
- [ ] Performance check (basic)

**Deliverable:** Working admin dashboard

---

## PHASE 2: MONEY FEATURES (Weeks 7-10)

---

## Week 7: Invoicing

### Invoices
- [ ] Invoices table migration
- [ ] InvoiceLineItems table migration
- [ ] Create invoice endpoint
- [ ] Invoice number generation (firm-wide unique)
- [ ] List invoices endpoint
- [ ] View invoice endpoint
- [ ] Update invoice endpoint

### PDF Generation
- [ ] Install PDFKit
- [ ] Create invoice template (simple)
- [ ] Generate PDF service
- [ ] Store PDF in S3
- [ ] PDF download endpoint

### Invoice UI
- [ ] Invoice list page
- [ ] Invoice creation form
- [ ] Invoice detail page
- [ ] PDF preview

### Testing
- [ ] Unit tests for invoice service
- [ ] Integration tests for invoice endpoints
- [ ] Test PDF generation

**Deliverable:** Complete invoicing

---

## Week 8: Stripe Integration

### Stripe Setup
- [ ] Set up Stripe account
- [ ] Install Stripe SDK
- [ ] Configure Stripe keys (test mode)

### Payment Processing
- [ ] Create Checkout session endpoint
- [ ] Payment link generation
- [ ] Webhook endpoint (idempotency)
- [ ] Mark invoice as paid
- [ ] Record payment in database
- [ ] Handle failed payments

### Testing (CRITICAL)
- [ ] Test Stripe Checkout flow
- [ ] Test webhook with Stripe CLI
- [ ] Test idempotency
- [ ] Test payment recording

**Deliverable:** Can accept payments via Stripe

---

## Week 9: Email Notifications (Critical Only)

### Email Service
- [ ] Configure AWS SES
- [ ] Email service implementation
- [ ] Email templates (HTML - simple)

### Email Types (Minimal)
- [ ] Invoice email with payment link
- [ ] Password reset email
- [ ] Welcome email (basic)

### Email Tracking (Basic)
- [ ] EmailEvents table migration
- [ ] Track sent emails
- [ ] SES webhook endpoint (basic)
- [ ] Handle bounces

### ❌ REMOVED: Task reminders, invoice reminders
**Reason:** Defer to post-launch. Focus on core email functionality.

### Testing
- [ ] Unit tests for email service
- [ ] Test email templates
- [ ] Test SES integration

**Deliverable:** Invoice emails working

---

## Week 10: Beta Launch Prep

### Deployment
- [ ] Set up staging environment (AWS)
- [ ] Deploy to staging
- [ ] Configure domain + SSL
- [ ] Set up Sentry (error tracking)
- [ ] Configure Winston logging
- [ ] Health check endpoint

### Testing
- [ ] Manual testing of all critical flows
- [ ] Fix critical bugs
- [ ] Performance check (<500ms p95)

### Beta Users
- [ ] **Recruit 5 beta users**
- [ ] Create onboarding docs (simple)
- [ ] Onboard beta users
- [ ] Collect feedback
- [ ] Create feedback tracking system

### ❌ REMOVED: Onboarding wizard
**Reason:** Use simple docs + welcome email instead. Build wizard post-launch if needed.

**Deliverable:** First beta users using the system

---

## PHASE 3: CLIENT PORTAL (Weeks 11-13)

**⚠️ HIGH RISK: This will consume 40-50% of remaining time**

---

## Week 11: Portal Authentication

### Portal Auth
- [ ] ClientUsers table migration
- [ ] Client registration endpoint
- [ ] Client login endpoint (separate JWT)
- [ ] Client JWT middleware
- [ ] Client invitation flow
- [ ] Client password reset

### Portal UI Shell
- [ ] Portal React app (or separate routes)
- [ ] Portal login page
- [ ] Portal dashboard layout
- [ ] Portal navigation

### Security (CRITICAL)
- [ ] Test client isolation
- [ ] Test JWT scoping
- [ ] Test RLS policies
- [ ] Security audit for portal

**Deliverable:** Clients can login securely

---

## Week 12: Portal Features (Minimal)

### Portal Features
- [ ] View documents endpoint (client-scoped)
- [ ] Upload documents endpoint (allowed folders only)
- [ ] View invoices endpoint (client-scoped)
- [ ] Pay invoice endpoint (redirect to Stripe)

### Portal UI
- [ ] Documents page (view + upload)
- [ ] Invoices page (view + pay)
- [ ] Payment success page
- [ ] Payment failure page

### ❌ REMOVED: Task view, activity feed, messaging
**Reason:** Keep portal minimal. Add features post-launch based on feedback.

### Testing (CRITICAL)
- [ ] Test client isolation thoroughly
- [ ] Test document access controls
- [ ] Test invoice access controls
- [ ] Test payment flow

**Deliverable:** Minimal working portal

---

## Week 13: Portal Testing + Polish

### Testing
- [ ] Integration tests for portal endpoints
- [ ] E2E tests for portal flows
- [ ] Security testing (client isolation)
- [ ] Performance testing

### Bug Fixes
- [ ] Fix all critical portal bugs
- [ ] Fix all high-priority bugs
- [ ] Address medium-priority bugs

### Beta Testing
- [ ] Beta users test portal
- [ ] Collect portal feedback
- [ ] Iterate based on feedback

### UI Polish
- [ ] Portal UI improvements
- [ ] Mobile responsiveness (basic)
- [ ] Error handling

**Deliverable:** Portal ready for production

---

## PHASE 4: SAAS BILLING (Weeks 14-15)

---

## Week 14: Subscription Management

### SaaS Billing
- [ ] Plans table migration
- [ ] Subscriptions table migration
- [ ] Seed plans (Starter $15, Pro $29, Enterprise $49)
- [ ] Create subscription endpoint
- [ ] Stripe subscription integration
- [ ] Subscription webhook handler
- [ ] Cancel subscription endpoint

### Subscription UI
- [ ] Plans page
- [ ] Subscription creation flow
- [ ] Subscription management page
- [ ] Billing history page

### Testing
- [ ] Unit tests for subscription service
- [ ] Integration tests for billing
- [ ] Test Stripe subscription webhooks

**Deliverable:** Can create subscriptions

---

## Week 15: Usage Limits + Production Prep

### Usage Limits
- [ ] Usage tracking queries
- [ ] Limits enforcement middleware
- [ ] Block actions if over limit
- [ ] Usage display in UI (basic)

### Production Deployment
- [ ] Set up production environment (AWS)
- [ ] Configure production database (RDS)
- [ ] Configure production Redis (ElastiCache)
- [ ] Configure production S3
- [ ] Set up backups (automated)
- [ ] Configure monitoring (Sentry + CloudWatch)
- [ ] Set up alerts (critical errors only)

### ❌ REMOVED: Prometheus, advanced metrics
**Reason:** Use Sentry + CloudWatch logs for MVP. Add Prometheus post-launch if needed.

### Security
- [ ] Security audit
- [ ] Enable RLS policies
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] Security headers (Helmet)

### Documentation
- [ ] API documentation (basic)
- [ ] Deployment guide
- [ ] User guide (simple)

**Deliverable:** Production environment ready

---

## PHASE 5: LAUNCH (Week 16)

---

## Week 16: Final Polish + Launch

### Pre-Launch Checklist
- [ ] All features tested
- [ ] All critical bugs fixed
- [ ] Security audit passed
- [ ] Performance acceptable (<500ms p95)
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Health check endpoint working
- [ ] Terms of service
- [ ] Privacy policy
- [ ] Support email set up

### Final Testing
- [ ] Manual testing of all critical flows
- [ ] Beta users final testing
- [ ] Load testing (basic)
- [ ] Security testing

### Launch Day
- [ ] Deploy to production
- [ ] Verify all services running
- [ ] Test critical flows in production
- [ ] Monitor error rates (Sentry)
- [ ] Monitor performance
- [ ] Be ready for issues

### Post-Launch (48 hours)
- [ ] Monitor continuously
- [ ] Fix critical issues immediately
- [ ] Collect user feedback
- [ ] Plan iteration 1

### Success Metrics
- [ ] 10 paying customers
- [ ] $500 MRR
- [ ] <5 critical bugs
- [ ] <500ms API response time
- [ ] 99% uptime

**Deliverable:** LIVE IN PRODUCTION

---

## POST-LAUNCH ROADMAP

### Month 1 After Launch
- [ ] Task reminders (email worker)
- [ ] Invoice reminders (email worker)
- [ ] Activity feed
- [ ] Task assignment emails
- [ ] Advanced search

### Month 2 After Launch
- [ ] Virus scanning (ClamAV)
- [ ] Storage usage dashboard
- [ ] Feature flags system
- [ ] Onboarding wizard
- [ ] Bulk operations

### Month 3 After Launch
- [ ] Advanced metrics (Prometheus)
- [ ] Advanced reporting
- [ ] Client tags
- [ ] Custom fields
- [ ] E-signature integration

---

## Testing Strategy (Realistic)

### Critical Path Tests (MUST HAVE)
- ✅ Auth (register, login, password reset)
- ✅ Payments (Stripe checkout, webhook, idempotency)
- ✅ Portal access (client isolation, RLS)
- ✅ Billing (subscription creation, limits enforcement)
- ✅ Document access (client isolation)
- ✅ Invoice access (client isolation)

### Target Coverage (Realistic)
- Critical services (auth, payments, billing): 70%+
- Other services (CRM, documents, tasks): 40%+
- Overall: 50%+ (NOT 80%)

### Manual Testing
- All critical flows tested manually before launch
- Beta users provide real-world testing from Week 10

**⚠️ NOTE:** 80% test coverage is unrealistic for MVP with 3-5 devs. Focus on critical paths.

---

## Daily Standup Template

**What did you complete yesterday?**
- [ ] Feature/task completed

**What will you work on today?**
- [ ] Feature/task to work on

**Any blockers?**
- [ ] Blocker description

---

## Weekly Review Template

**Completed this week:**
- [ ] List completed features

**Planned for next week:**
- [ ] List planned features

**Risks/Issues:**
- [ ] Any risks or issues

**Metrics:**
- Lines of code written: ___
- Tests written: ___
- Bugs fixed: ___
- Test coverage: ___%

---

## Definition of Done (Simplified)

A feature is "done" when:
- [ ] Code written and reviewed
- [ ] Critical path tested (unit + integration)
- [ ] Manual testing completed
- [ ] Deployed to staging
- [ ] Product owner approved

**NO REQUIREMENT FOR:**
- ❌ 80% test coverage
- ❌ Full documentation
- ❌ Performance optimization (unless blocking)

---

## Risk Management

**High Risk Items:**
- **Client Portal complexity** (40-50% of dev time)
- Stripe integration complexity
- Client isolation security
- Performance at scale

**Mitigation:**
- Keep portal minimal (view + pay only)
- Use Stripe Checkout (not custom forms)
- Thorough security testing
- Beta users at Week 10 for early feedback

---

## Comparison: Original vs Optimized

| Aspect | Original Plan | Optimized Plan |
|--------|---------------|----------------|
| Timeline | 19 weeks | 16 weeks |
| Features | 17 | 12 core |
| Test Coverage | 80% | 50% critical |
| Beta Start | Week 18 | Week 10 |
| Virus Scanning | Yes | No (post-launch) |
| Prometheus | Yes | No (post-launch) |
| Onboarding Wizard | Yes | No (post-launch) |
| Activity Feed | Yes | Deferred |
| Feature Flags | Yes | Deferred |
| Task Reminders | Week 15 | Post-launch |

**Time Saved:** 3 weeks  
**Complexity Reduced:** 30%  
**Focus Increased:** 100%

---

**START DATE:** ___________  
**BETA LAUNCH:** ___________ (Week 10)  
**PRODUCTION LAUNCH:** ___________ (Week 16)

---

**SHIP IN 16 WEEKS. ITERATE AFTER REVENUE.**
