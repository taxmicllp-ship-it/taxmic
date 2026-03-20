# MVP FEATURE LOCK 🔒

**Version:** 1.0 FINAL  
**Status:** LOCKED - No changes allowed during development  
**Purpose:** Prevent scope creep and ensure 4.5 month delivery

---

## 🚨 CRITICAL RULE

**THIS DOCUMENT IS LOCKED.**

Any feature not listed here is **FORBIDDEN** during MVP development.

If a feature is not explicitly listed as "✅ BUILD THIS", it is **DEFERRED**.

No exceptions. No "quick additions". No "while we're at it".

---

## ✅ CORE FEATURES (MUST BUILD)

### 1. Authentication & Authorization

**Build:**
- User registration (email + password)
- Login with JWT tokens
- Password reset via email
- Logout
- Session management

**Scope:**
- Email/password only
- JWT with 7-day expiry
- Simple password reset flow

**Explicitly Excluded:**
- ❌ OAuth (Google, Microsoft)
- ❌ SSO
- ❌ Magic links
- ❌ Biometric auth
- ❌ 2FA (optional post-MVP)

**Acceptance Criteria:**
- [ ] User can register with email/password
- [ ] User can login and receive JWT
- [ ] User can reset password via email
- [ ] JWT expires after 7 days
- [ ] Passwords hashed with bcrypt

---

### 2. Firm Management

**Build:**
- Create firm during registration
- View firm details
- Update firm name/settings

**Scope:**
- One firm per owner
- Basic firm profile only

**Explicitly Excluded:**
- ❌ Multi-firm support
- ❌ Firm branding/logos
- ❌ Custom domains
- ❌ White-labeling
- ❌ Firm templates

**Acceptance Criteria:**
- [ ] Firm created automatically on registration
- [ ] Owner can view firm details
- [ ] Owner can update firm name

---

### 3. Client Management (CRM)

**Build:**
- Create client (name, type, status)
- List clients (with search)
- View client details
- Update client
- Delete client (soft delete)
- Client types: Individual, Company

**Scope:**
- Basic CRUD only
- Simple search by name
- Status: Active, Inactive

**Explicitly Excluded:**
- ❌ Client tags
- ❌ Custom fields
- ❌ Client groups
- ❌ Client import/export
- ❌ Client merge
- ❌ Advanced filters
- ❌ Client notes (use messages)

**Acceptance Criteria:**
- [ ] Can create client with name, type, status
- [ ] Can list all clients for firm
- [ ] Can search clients by name
- [ ] Can update client details
- [ ] Can soft delete client

---

### 4. Contact Management

**Build:**
- Create contact (name, email, phone)
- Link contact to multiple clients
- Unlink contact from client
- Update contact details
- View contacts per client

**Scope:**
- Many-to-many relationship
- Basic contact info only

**Explicitly Excluded:**
- ❌ Contact roles/permissions
- ❌ Contact history
- ❌ Contact merge
- ❌ Contact import
- ❌ Multiple phone numbers
- ❌ Addresses

**Acceptance Criteria:**
- [ ] Can create independent contact
- [ ] Can link contact to multiple clients
- [ ] Can view all contacts for a client
- [ ] Can update contact details
- [ ] Can unlink contact from client

---

### 5. Document Management

**Build:**
- Create folders per client
- Upload documents to folders
- Download documents (signed URLs)
- Delete documents
- View document list
- File size limit: 50MB
- Virus scanning (ClamAV)

**Scope:**
- S3 storage
- Pre-signed URLs
- Basic folder structure
- Allowed types: PDF, images, Excel, Word

**Explicitly Excluded:**
- ❌ Document versioning
- ❌ Document preview
- ❌ Document annotations
- ❌ Document templates
- ❌ OCR
- ❌ Document sharing links
- ❌ Folder permissions (beyond allow_client_upload)
- ❌ Document tags
- ❌ Bulk upload

**Acceptance Criteria:**
- [ ] Can create folders for client
- [ ] Can upload file (max 50MB)
- [ ] File scanned for viruses
- [ ] Can download via signed URL
- [ ] Can delete document
- [ ] Storage limits enforced per plan

---

### 6. Task Management

**Build:**
- Create task (title, description, due date, assignee)
- List tasks (by client, by assignee, by status)
- Update task status
- Update task details
- Delete task
- Task statuses: NEW, IN_PROGRESS, WAITING_CLIENT, REVIEW, COMPLETED

**Scope:**
- Simple status model
- Assign to one user
- Due date tracking

**Explicitly Excluded:**
- ❌ Subtasks
- ❌ Task dependencies
- ❌ Task templates
- ❌ Recurring tasks
- ❌ Task comments
- ❌ Task attachments (use documents)
- ❌ Task time tracking
- ❌ Task priorities
- ❌ Kanban board UI
- ❌ Workflow pipelines

**Acceptance Criteria:**
- [ ] Can create task with title, description, due date, assignee
- [ ] Can list tasks filtered by client/assignee/status
- [ ] Can update task status
- [ ] Can mark task as completed
- [ ] Can delete task

---

### 7. Invoicing

**Build:**
- Create invoice (line items, amounts, due date)
- Generate PDF
- Send invoice via email
- View invoice list
- View invoice details
- Invoice statuses: Draft, Issued, Paid

**Scope:**
- Simple line items
- Auto-generated invoice numbers
- PDF generation (PDFKit)
- Email delivery

**Explicitly Excluded:**
- ❌ Recurring invoices
- ❌ Invoice templates
- ❌ Tax calculations (manual entry only)
- ❌ Discounts
- ❌ Partial payments
- ❌ Invoice reminders (use general reminders)
- ❌ Invoice disputes
- ❌ Credit notes
- ❌ Estimates/quotes

**Acceptance Criteria:**
- [ ] Can create invoice with line items
- [ ] Invoice number auto-generated
- [ ] PDF generated and stored
- [ ] Can email invoice to client
- [ ] Can view invoice list
- [ ] Invoice marked as paid after payment

---

### 8. Payment Processing

**Build:**
- Stripe Checkout integration
- Payment link in invoice email
- Webhook to mark invoice as paid
- View payment history

**Scope:**
- Stripe only
- Credit card + ACH
- One-time payments only

**Explicitly Excluded:**
- ❌ Multiple payment gateways
- ❌ Recurring payments
- ❌ Payment plans
- ❌ Refunds (manual via Stripe dashboard)
- ❌ Payment disputes
- ❌ Saved payment methods

**Acceptance Criteria:**
- [ ] Client can click payment link
- [ ] Redirected to Stripe Checkout
- [ ] Payment processed via Stripe
- [ ] Webhook marks invoice as paid
- [ ] Payment recorded in database

---

### 9. Client Portal

**Build:**
- Client login (email + password)
- View assigned documents
- Upload documents to allowed folders
- View invoices
- Pay invoices
- View tasks assigned to client

**Scope:**
- Separate authentication for clients
- Read-only for most data
- Upload to specific folders only

**Explicitly Excluded:**
- ❌ Client dashboard/analytics
- ❌ Client messaging (use email)
- ❌ Client file sharing
- ❌ Client notifications (use email)
- ❌ Client mobile app

**Acceptance Criteria:**
- [ ] Client can login with credentials
- [ ] Client can view their documents
- [ ] Client can upload to allowed folders
- [ ] Client can view invoices
- [ ] Client can pay invoices via Stripe
- [ ] Client can view tasks assigned to them

---

### 10. Email Notifications

**Build:**
- Welcome email on registration
- Invoice email with payment link
- Task assignment email
- Task due reminder (daily check)
- Invoice overdue reminder (daily check)
- Password reset email

**Scope:**
- AWS SES
- Simple HTML templates
- Email tracking (sent, delivered, bounced)

**Explicitly Excluded:**
- ❌ Custom email templates
- ❌ Email scheduling
- ❌ Bulk emails
- ❌ Email campaigns
- ❌ SMS notifications
- ❌ Push notifications
- ❌ In-app notifications

**Acceptance Criteria:**
- [ ] Welcome email sent on registration
- [ ] Invoice email sent with payment link
- [ ] Task assignment email sent
- [ ] Daily worker checks for overdue tasks/invoices
- [ ] Reminder emails sent
- [ ] Email events tracked

---

### 11. Onboarding Flow

**Build:**
- Step 1: Create first client
- Step 2: Invite client to portal
- Step 3: Create document request
- Step 4: Create first task
- Progress tracking

**Scope:**
- 4-step guided flow
- Skippable
- Progress saved

**Explicitly Excluded:**
- ❌ Video tutorials
- ❌ Interactive demos
- ❌ Sample data
- ❌ Onboarding analytics

**Acceptance Criteria:**
- [ ] New user sees onboarding on first login
- [ ] Can complete 4 steps in order
- [ ] Can skip onboarding
- [ ] Progress saved between sessions
- [ ] Redirected to dashboard after completion

---

### 12. Activity Feed

**Build:**
- Log key events (client created, document uploaded, task completed, invoice paid)
- View activity per client
- View firm-wide activity

**Scope:**
- Simple event log
- Read-only
- Last 100 events

**Explicitly Excluded:**
- ❌ Activity filters
- ❌ Activity export
- ❌ Activity search
- ❌ Real-time updates

**Acceptance Criteria:**
- [ ] Events logged for key actions
- [ ] Can view activity for specific client
- [ ] Can view firm-wide activity
- [ ] Shows last 100 events

---

## 🔧 PRODUCTION REQUIREMENTS (MUST BUILD)

### 13. Feature Flags

**Build:**
- Feature flags table
- Firm-specific overrides
- Service to check flags
- Default flags seeded

**Acceptance Criteria:**
- [ ] Feature flags table created
- [ ] Can enable/disable per firm
- [ ] Service checks flags before features
- [ ] Default flags seeded

---

### 14. Security Audit Logs

**Build:**
- Log all security events
- Track IP + user agent
- Login success/failure
- Password changes
- Document downloads
- Data exports

**Acceptance Criteria:**
- [ ] Security events logged
- [ ] IP and user agent captured
- [ ] Can query logs by user/firm/event
- [ ] Logs retained for 90 days

---

### 15. Storage Management

**Build:**
- Per-plan storage limits
- Virus scanning on upload
- Storage usage tracking
- Block upload if limit exceeded

**Acceptance Criteria:**
- [ ] Storage limits enforced
- [ ] Files scanned for viruses
- [ ] Usage tracked per firm
- [ ] Upload blocked if over limit

---

### 16. SaaS Billing

**Build:**
- Plans table (Starter, Professional, Enterprise)
- Subscriptions table
- Stripe subscription integration
- Usage limits enforcement
- Subscription webhooks

**Acceptance Criteria:**
- [ ] Plans defined with limits
- [ ] Can create subscription
- [ ] Stripe subscription created
- [ ] Usage limits enforced
- [ ] Webhooks handle subscription changes

---

### 17. Observability

**Build:**
- Structured logging (Winston)
- Error tracking (Sentry)
- Basic metrics (request count, duration)

**Acceptance Criteria:**
- [ ] All logs structured JSON
- [ ] Errors sent to Sentry
- [ ] Request metrics collected
- [ ] Health check endpoint

---

## ❌ EXPLICITLY DEFERRED (DO NOT BUILD)

### Post-MVP Phase 1 (Month 6-7)
- E-signature integration
- Time tracking
- Advanced reporting
- Client tags
- Custom fields

### Post-MVP Phase 2 (Month 8-9)
- Workflow pipelines
- Task templates
- Recurring invoices
- Multi-currency
- API access

### Post-MVP Phase 3 (Month 10-12)
- Real-time chat
- Mobile apps
- White-labeling
- Advanced integrations (QuickBooks, Xero)
- Bulk operations

---

## 📊 MVP METRICS

**Features:** 17 (12 core + 5 production)  
**Database Tables:** 25  
**API Endpoints:** ~60  
**Timeline:** 19 weeks (4.5 months)  
**Team:** 3-5 developers

---

## 🎯 DEFINITION OF DONE

An MVP feature is "done" when:

1. ✅ Code written and reviewed
2. ✅ Unit tests passing (>80% coverage)
3. ✅ Integration tests passing
4. ✅ Manual testing completed
5. ✅ Documentation updated
6. ✅ Deployed to staging
7. ✅ Product owner approved

---

## 🚫 SCOPE CREEP PREVENTION

**If someone says:**
- "Can we just add..."
- "While we're at it..."
- "This will only take a day..."
- "The competitor has this..."
- "Users will expect this..."

**The answer is:**
**"Add it to the post-MVP backlog."**

No exceptions.

---

## 📝 CHANGE REQUEST PROCESS

If a feature MUST be added:

1. Document why it's critical for MVP
2. Identify what to remove to maintain timeline
3. Get approval from all stakeholders
4. Update this document
5. Communicate to entire team

**Changes require:**
- Written justification
- Timeline impact analysis
- Unanimous approval

---

## ✅ SIGN-OFF

By signing below, all stakeholders agree:
- This is the complete MVP scope
- No features will be added during development
- Timeline is 19 weeks
- Any changes follow the change request process

**Founder:** _________________ Date: _______  
**Tech Lead:** _________________ Date: _______  
**Product Manager:** _________________ Date: _______

---

## 🎯 SUCCESS CRITERIA

MVP is successful if:

1. ✅ All 17 features completed
2. ✅ All acceptance criteria met
3. ✅ Deployed to production
4. ✅ 10 beta customers onboarded
5. ✅ No critical bugs
6. ✅ Delivered in 19 weeks

---

**Document Version:** 1.0 FINAL  
**Status:** LOCKED  
**Last Updated:** Feature Lock Applied  
**Next Review:** After MVP Launch

---

## 🔒 LOCK CONFIRMATION

This document is now **LOCKED**.

Any deviation from this scope requires formal change request.

**Start Date:** [To be filled]  
**Target Launch:** [Start Date + 19 weeks]  
**No Scope Changes Allowed Until:** [Target Launch]

---

**BUILD EXACTLY THIS. NOTHING MORE. NOTHING LESS.**
