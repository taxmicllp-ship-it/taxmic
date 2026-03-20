# Optimized MVP Plan (16 Weeks)

**Version:** 2.0 OPTIMIZED  
**Purpose:** Launch faster with tighter scope  
**Timeline:** 16 weeks (4 months)  
**Team:** 3-5 developers

---

## 🎯 Core Philosophy

**Build for first $1000, not first 10,000 users.**

Launch in 16 weeks with minimal viable features. Add complexity after revenue.

---

## 🚨 What We REMOVED from Original Plan

### Removed from MVP (Add Post-Launch)
- ❌ Virus scanning (ClamAV) → Use S3 + MIME validation only
- ❌ Prometheus metrics → Use Sentry + basic logs only
- ❌ 80% test coverage → Focus on critical paths only (auth, payments, portal access)
- ❌ Onboarding wizard → Simple welcome email + docs
- ❌ Activity feed → Defer to Phase 2
- ❌ Feature flags → Add when needed
- ❌ Advanced observability → Basic health checks only
- ❌ Storage usage dashboard → Track in background, no UI

### Simplified Features
- ✅ Documents: Upload/download only (no virus scan, basic validation)
- ✅ Testing: Critical paths only (auth, payments, billing, portal)
- ✅ Monitoring: Sentry + Winston logs + health endpoint
- ✅ Client Portal: Minimal (view docs, view invoices, pay only)

---

## 📅 16-Week Phased Roadmap

---

## Phase 1: Core Platform (Weeks 1-6)

### Week 1: Foundation
- [ ] Monorepo setup (Turborepo)
- [ ] Docker Compose (Postgres + Redis)
- [ ] Prisma setup + initial migrations
- [ ] CI/CD (GitHub Actions - lint + test only)
- [ ] Basic auth (register, login, JWT)

**Deliverable:** Dev environment + basic auth working

---

### Week 2: CRM Foundation
- [ ] Clients CRUD
- [ ] Contacts CRUD
- [ ] ClientContacts many-to-many
- [ ] Soft deletes
- [ ] Basic search

**Deliverable:** Can manage clients and contacts

---

### Week 3: Documents (Simplified)
- [ ] S3 integration
- [ ] Upload endpoint (multipart, max 50MB)
- [ ] Download endpoint (signed URLs)
- [ ] Folders table
- [ ] MIME type validation only (NO virus scanning)
- [ ] List documents

**Deliverable:** Can upload/download documents securely

---

### Week 4: Tasks
- [ ] Tasks table + TaskStatuses
- [ ] Tasks CRUD
- [ ] Assign to user
- [ ] Filter by status/client/assignee
- [ ] Mark complete

**Deliverable:** Task management working

---

### Week 5-6: Testing + Polish Phase 1
- [ ] Unit tests for critical services (auth, CRM)
- [ ] Integration tests for API endpoints
- [ ] Fix bugs
- [ ] Basic admin UI (React)
- [ ] Client list page
- [ ] Document upload page
- [ ] Task list page

**Deliverable:** Working admin dashboard

---

## Phase 2: Money Features (Weeks 7-10)

### Week 7: Invoices
- [ ] Invoices table + InvoiceLineItems
- [ ] Create invoice endpoint
- [ ] Invoice number generation (firm-wide)
- [ ] List/view invoices
- [ ] PDF generation (PDFKit)
- [ ] Store PDF in S3

**Deliverable:** Can create and view invoices

---

### Week 8: Stripe Integration
- [ ] Stripe account setup
- [ ] Create Checkout session
- [ ] Payment link in invoice
- [ ] Webhook endpoint
- [ ] Mark invoice as paid
- [ ] Record payment

**Deliverable:** Can accept payments

---

### Week 9: Email Notifications (Critical Only)
- [ ] AWS SES setup
- [ ] Email service
- [ ] Invoice email template
- [ ] Send invoice email
- [ ] Track email events (basic)
- [ ] Password reset email

**Deliverable:** Invoice emails working

---

### Week 10: Beta Launch Prep
- [ ] Deploy to staging
- [ ] Manual testing of critical flows
- [ ] Fix critical bugs
- [ ] **Recruit 5 beta users**
- [ ] Onboard beta users
- [ ] Collect feedback

**Deliverable:** First beta users using the system

---

## Phase 3: Client Portal (Weeks 11-13)

**⚠️ HIGH RISK: This will consume 40-50% of remaining time**

### Week 11: Portal Auth
- [ ] ClientUsers table
- [ ] Client registration endpoint
- [ ] Client login (separate JWT)
- [ ] Client invitation flow
- [ ] Portal UI shell (React)

**Deliverable:** Clients can login

---

### Week 12: Portal Features (Minimal)
- [ ] View documents (read-only)
- [ ] Upload documents (to allowed folders only)
- [ ] View invoices (read-only)
- [ ] Pay invoice (redirect to Stripe)

**Deliverable:** Minimal working portal

---

### Week 13: Portal Testing + Polish
- [ ] Test client isolation (CRITICAL)
- [ ] Test portal flows
- [ ] Fix portal bugs
- [ ] Portal UI polish
- [ ] Beta users test portal

**Deliverable:** Portal ready for production

---

## Phase 4: SaaS Billing (Weeks 14-15)

### Week 14: Subscription Management
- [ ] Plans table (Starter, Pro, Enterprise)
- [ ] Subscriptions table
- [ ] Seed plans
- [ ] Create subscription endpoint
- [ ] Stripe subscription integration
- [ ] Subscription webhook

**Deliverable:** Can create subscriptions

---

### Week 15: Usage Limits
- [ ] Usage tracking queries
- [ ] Limits enforcement middleware
- [ ] Block actions if over limit
- [ ] Basic usage display in UI

**Deliverable:** Usage limits enforced

---

## Phase 5: Launch (Week 16)

### Week 16: Final Polish + Launch
- [ ] Security audit
- [ ] Performance check (<500ms p95)
- [ ] Deploy to production
- [ ] Configure monitoring (Sentry + logs)
- [ ] Set up backups
- [ ] Health check endpoint
- [ ] Terms of service
- [ ] Privacy policy
- [ ] Support email
- [ ] Launch to beta users
- [ ] Monitor for 48 hours

**Deliverable:** LIVE IN PRODUCTION

---

## 🧪 Testing Strategy (Realistic)

### Critical Path Tests Only
- ✅ Auth (register, login, password reset)
- ✅ Payments (Stripe checkout, webhook)
- ✅ Portal access (client isolation)
- ✅ Billing (subscription creation, limits)

### Target Coverage
- Critical services: 70%+
- Other services: 40%+
- Overall: 50%+ (NOT 80%)

### Manual Testing
- All critical flows tested manually before launch
- Beta users provide real-world testing

---

## 📊 Removed Features (Add Post-Launch)

### Post-Launch Month 1
- Task reminders (email worker)
- Invoice reminders (email worker)
- Activity feed
- Onboarding wizard

### Post-Launch Month 2
- Virus scanning (ClamAV)
- Storage usage dashboard
- Feature flags
- Advanced metrics (Prometheus)

### Post-Launch Month 3
- Task assignment emails
- Welcome emails
- Advanced search
- Bulk operations

---

## 🚨 Critical Risks

### Risk #1: Client Portal Complexity
**Mitigation:**
- Keep portal minimal (view + pay only)
- No messaging, no advanced features
- Defer portal enhancements to post-launch

### Risk #2: Stripe Integration
**Mitigation:**
- Use Stripe Checkout (not custom forms)
- Test webhooks thoroughly
- Have fallback for failed payments

### Risk #3: Beta User Feedback
**Mitigation:**
- Start beta at Week 10 (not Week 18)
- Iterate based on feedback
- Be ready to pivot features

---

## 💰 Revenue Focus

### First $1000 Comes From:
1. **Invoicing + Payments** (Week 7-8)
2. **Client Portal** (Week 11-13)
3. **SaaS Subscriptions** (Week 14-15)

**Everything else is supporting infrastructure.**

---

## 📈 Success Metrics

### Week 10 (Beta Launch)
- [ ] 5 beta users onboarded
- [ ] Can create clients
- [ ] Can upload documents
- [ ] Can create invoices
- [ ] Can accept payments

### Week 16 (Production Launch)
- [ ] 10 paying customers
- [ ] $500 MRR
- [ ] <5 critical bugs
- [ ] <500ms API response time
- [ ] 99% uptime

---

## 🎯 Definition of Done (Simplified)

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

## 🚀 Launch Checklist (Simplified)

### Pre-Launch
- [ ] Auth working
- [ ] Payments working
- [ ] Portal working
- [ ] Client isolation tested
- [ ] Sentry configured
- [ ] Backups configured
- [ ] Health check endpoint
- [ ] Terms + Privacy policy

### Launch Day
- [ ] Deploy to production
- [ ] Verify critical flows
- [ ] Monitor errors (Sentry)
- [ ] Be ready for issues

### Post-Launch
- [ ] Monitor for 48 hours
- [ ] Fix critical issues immediately
- [ ] Collect user feedback
- [ ] Plan iteration 1

---

## 📊 Comparison: Original vs Optimized

| Aspect | Original Plan | Optimized Plan |
|--------|---------------|----------------|
| Timeline | 19 weeks | 16 weeks |
| Features | 17 | 12 core |
| Test Coverage | 80% | 50% critical |
| Beta Start | Week 18 | Week 10 |
| Virus Scanning | Yes | No |
| Prometheus | Yes | No |
| Onboarding Wizard | Yes | No |
| Activity Feed | Yes | Deferred |
| Feature Flags | Yes | Deferred |

**Time Saved:** 3 weeks  
**Complexity Reduced:** 30%  
**Focus Increased:** 100%

---

## 🧠 Key Principles

1. **Launch faster beats launch perfect**
2. **Revenue features first, polish later**
3. **Beta users at Week 10, not Week 18**
4. **Test critical paths, not everything**
5. **Remove complexity, add after revenue**

---

## 🎯 The Real Goal

**Not:** Build the most complete system  
**But:** Get first paying customer ASAP

**Target:** 10 paying customers by Week 16

---

**START DATE:** ___________  
**BETA LAUNCH:** ___________ (Week 10)  
**PRODUCTION LAUNCH:** ___________ (Week 16)

---

**SHIP IN 16 WEEKS. ITERATE AFTER REVENUE.**

