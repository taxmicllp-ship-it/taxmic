# Phase-Wise MVP Execution Plan (Part 2)

**Continuation of:** docs/PHASE-WISE-EXECUTION-PLAN.md

---

## 8. API Surface Planning

### 8.1 MVP API Endpoints (Required for Launch)

**Total Endpoints:** ~60

#### Auth Endpoints (5)
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password

#### Firm Endpoints (2)
- GET /api/v1/firms/:id
- PATCH /api/v1/firms/:id

#### Client Endpoints (6)
- GET /api/v1/clients
- POST /api/v1/clients
- GET /api/v1/clients/:id
- PATCH /api/v1/clients/:id
- DELETE /api/v1/clients/:id
- GET /api/v1/clients/search?q=:query

#### Contact Endpoints (7)
- GET /api/v1/contacts
- POST /api/v1/contacts
- GET /api/v1/contacts/:id
- PATCH /api/v1/contacts/:id
- DELETE /api/v1/contacts/:id
- POST /api/v1/clients/:id/contacts/link
- DELETE /api/v1/clients/:id/contacts/:contactId

#### Document Endpoints (7)
- POST /api/v1/clients/:id/folders
- GET /api/v1/clients/:id/folders
- POST /api/v1/folders/:id/upload
- GET /api/v1/documents/:id/download
- DELETE /api/v1/documents/:id
- GET /api/v1/clients/:id/documents
- GET /api/v1/documents/:id

#### Task Endpoints (6)
- GET /api/v1/tasks
- POST /api/v1/tasks
- GET /api/v1/tasks/:id
- PATCH /api/v1/tasks/:id
- DELETE /api/v1/tasks/:id
- GET /api/v1/clients/:id/tasks

#### Invoice Endpoints (7)
- GET /api/v1/invoices
- POST /api/v1/invoices
- GET /api/v1/invoices/:id
- PATCH /api/v1/invoices/:id
- POST /api/v1/invoices/:id/send
- POST /api/v1/invoices/:id/pay
- GET /api/v1/clients/:id/invoices

#### Payment Endpoints (3)
- POST /api/v1/payments/stripe/webhook
- GET /api/v1/payments
- GET /api/v1/clients/:id/payments

#### Portal Endpoints (7)
- POST /api/v1/portal/auth/login
- POST /api/v1/portal/auth/register
- GET /api/v1/portal/documents
- POST /api/v1/portal/documents/upload
- GET /api/v1/portal/invoices
- POST /api/v1/portal/invoices/:id/pay
- GET /api/v1/portal/tasks

#### Subscription Endpoints (6)
- GET /api/v1/plans
- POST /api/v1/subscriptions
- GET /api/v1/subscriptions/:id
- PATCH /api/v1/subscriptions/:id
- DELETE /api/v1/subscriptions/:id
- POST /api/v1/subscriptions/webhook

#### System Endpoints (4)
- GET /api/v1/health
- GET /api/v1/usage
- GET /api/v1/me
- PATCH /api/v1/me

---

### 8.2 Post-MVP Endpoints (Future Phases)

**Phase 2 Endpoints (10):**
- GET /api/v1/activity - Activity feed
- GET /api/v1/clients/:id/activity - Client activity
- GET /api/v1/feature-flags - Feature flags
- PATCH /api/v1/feature-flags/:id - Toggle flags
- GET /api/v1/onboarding - Onboarding progress
- PATCH /api/v1/onboarding - Update progress
- GET /api/v1/tags - Client tags
- POST /api/v1/tags - Create tag
- POST /api/v1/clients/:id/tags - Add tag to client
- DELETE /api/v1/clients/:id/tags/:tagId - Remove tag

**Phase 3 Endpoints (8):**
- GET /api/v1/reports - Reports list
- POST /api/v1/reports - Generate report
- GET /api/v1/time-entries - Time tracking
- POST /api/v1/time-entries - Log time
- GET /api/v1/webhooks - Webhook list
- POST /api/v1/webhooks - Create webhook
- GET /api/v1/integrations - Integration list
- POST /api/v1/integrations - Connect integration

**Phase 4 Endpoints (6):**
- POST /api/v1/documents/:id/sign - E-signature
- GET /api/v1/workflows - Workflow list
- POST /api/v1/workflows - Create workflow
- GET /api/v1/custom-fields - Custom fields
- POST /api/v1/custom-fields - Create field
- GET /api/v1/analytics - Analytics data

---

## 9. Frontend Scope Planning

### 9.1 MVP UI Pages (Required for Launch)

**Total Pages:** 25

#### Public Pages (3)
1. Login Page - /login
2. Register Page - /register
3. Forgot Password Page - /forgot-password

#### Dashboard Pages (1)
4. Dashboard - /dashboard

#### Client Pages (3)
5. Clients List - /clients
6. Client Detail - /clients/:id
7. Client Form - /clients/new, /clients/:id/edit

#### Contact Pages (2)
8. Contacts List - /contacts
9. Contact Form - /contacts/new, /contacts/:id/edit

#### Document Pages (2)
10. Documents List - /documents
11. Document Upload - /documents/upload

#### Task Pages (3)
12. Tasks List - /tasks
13. Task Detail - /tasks/:id
14. Task Form - /tasks/new, /tasks/:id/edit

#### Invoice Pages (3)
15. Invoices List - /invoices
16. Invoice Detail - /invoices/:id
17. Invoice Form - /invoices/new, /invoices/:id/edit

#### Payment Pages (2)
18. Payment Success - /payments/success
19. Payment Failure - /payments/failure

#### Portal Pages (5)
20. Portal Login - /portal/login
21. Portal Dashboard - /portal/dashboard
22. Portal Documents - /portal/documents
23. Portal Invoices - /portal/invoices
24. Portal Tasks - /portal/tasks

#### Settings Pages (1)
25. Settings - /settings

---

### 9.2 Post-MVP UI Pages (Future Phases)

**Phase 2 Pages (8):**
- Activity Feed - /activity
- Onboarding Wizard - /onboarding
- Tags Management - /tags
- Advanced Search - /search
- Email Templates - /settings/emails
- Feature Flags - /settings/features
- Storage Dashboard - /settings/storage
- Usage Dashboard - /settings/usage

**Phase 3 Pages (6):**
- Reports - /reports
- Analytics Dashboard - /analytics
- Time Tracking - /time
- Integrations - /integrations
- Webhooks - /webhooks
- API Keys - /settings/api

**Phase 4 Pages (5):**
- Workflows - /workflows
- Custom Fields - /settings/fields
- E-Signature - /signatures
- Advanced Permissions - /settings/permissions
- Audit Trail - /audit

---

## 10. Risk Analysis

### 10.1 High-Risk Areas

#### Risk #1: Client Portal Complexity
**Severity:** HIGH  
**Probability:** HIGH  
**Impact:** 40-50% of development time

**Description:**
- Separate authentication system
- Client isolation critical for security
- Different UI/UX from admin
- Payment integration complexity

**Mitigation:**
- Keep portal minimal (view + pay only)
- Thorough security testing
- Start beta testing at Week 10
- Defer advanced features to post-launch

**Contingency:**
- If delayed, launch without portal
- Use email-based payment links
- Add portal in Phase 2

---

#### Risk #2: Stripe Integration
**Severity:** HIGH  
**Probability:** MEDIUM  
**Impact:** Revenue generation blocked

**Description:**
- Webhook reliability
- Idempotency handling
- Payment failure scenarios
- Subscription management complexity

**Mitigation:**
- Use Stripe Checkout (not custom forms)
- Implement idempotency middleware
- Test webhooks thoroughly with Stripe CLI
- Have fallback for failed payments

**Contingency:**
- Manual payment recording
- Stripe dashboard for refunds
- Email notifications for failures

---

#### Risk #3: Multi-Tenant Isolation
**Severity:** CRITICAL  
**Probability:** MEDIUM  
**Impact:** Security breach, data leakage

**Description:**
- firm_id filtering in all queries
- Row Level Security (RLS) policies
- JWT token scoping
- Client portal isolation

**Mitigation:**
- Implement RLS from day 1
- Tenant context middleware
- Security audit before launch
- Penetration testing

**Contingency:**
- Emergency data isolation audit
- Customer notification plan
- Incident response plan

---

#### Risk #4: Document Storage Security
**Severity:** HIGH  
**Probability:** LOW  
**Impact:** Data breach, compliance issues

**Description:**
- S3 bucket misconfiguration
- Signed URL expiration
- File size limits
- Storage costs

**Mitigation:**
- S3 bucket policies (private by default)
- Short-lived signed URLs (1 hour)
- Enforce file size limits (50MB)
- Monitor storage usage

**Contingency:**
- S3 bucket audit
- Migrate to different provider
- Implement virus scanning

---

#### Risk #5: Performance at Scale
**Severity:** MEDIUM  
**Probability:** MEDIUM  
**Impact:** Poor user experience

**Description:**
- Database query performance
- API response times
- File upload/download speed
- Concurrent users

**Mitigation:**
- Database indexes on all foreign keys
- Query optimization
- CDN for static assets
- Load testing before launch

**Contingency:**
- Add caching layer (Redis)
- Database read replicas
- Horizontal scaling

---

### 10.2 Medium-Risk Areas

#### Risk #6: Email Deliverability
**Severity:** MEDIUM  
**Probability:** MEDIUM  
**Impact:** Communication breakdown

**Mitigation:**
- Use AWS SES (high deliverability)
- Implement SPF/DKIM/DMARC
- Monitor bounce rates
- Track email events

---

#### Risk #7: Beta User Feedback
**Severity:** MEDIUM  
**Probability:** HIGH  
**Impact:** Feature pivots, timeline delays

**Mitigation:**
- Start beta at Week 10 (not Week 18)
- Limit beta to 5 users initially
- Set expectations for MVP
- Prioritize feedback ruthlessly

---

#### Risk #8: Scope Creep
**Severity:** MEDIUM  
**Probability:** HIGH  
**Impact:** Timeline delays, feature bloat

**Mitigation:**
- Lock MVP scope (MVP-FEATURE-LOCK.md)
- Change request process
- Weekly scope reviews
- Defer all non-critical features

---

### 10.3 Low-Risk Areas

#### Risk #9: Infrastructure Costs
**Severity:** LOW  
**Probability:** LOW  
**Impact:** Budget overrun

**Mitigation:**
- Start with minimal infrastructure
- Monitor costs weekly
- Set billing alerts
- Optimize after launch

---

#### Risk #10: Third-Party Dependencies
**Severity:** LOW  
**Probability:** LOW  
**Impact:** Service outages

**Mitigation:**
- Use reliable providers (AWS, Stripe)
- Implement retry logic
- Monitor service status
- Have fallback plans

---

## 11. Implementation Priority

### Priority 1: Foundation (Weeks 1-2)
**Why First:** Everything depends on auth

**Tasks:**
1. Setup development environment
2. Configure database (Prisma)
3. Implement authentication
4. Setup CI/CD (basic)
5. Deploy to staging

**Blockers:** None  
**Dependencies:** None  
**Team:** All developers

---

### Priority 2: CRM (Weeks 3-4)
**Why Second:** Core business entities

**Tasks:**
1. Implement clients CRUD
2. Implement contacts CRUD
3. Implement many-to-many linking
4. Build admin UI (clients/contacts)
5. Write tests

**Blockers:** Auth must be complete  
**Dependencies:** Auth  
**Team:** 2 backend, 2 frontend

---

### Priority 3: Documents (Weeks 5-6)
**Why Third:** Primary value proposition

**Tasks:**
1. Setup S3 integration
2. Implement upload/download
3. Implement folders
4. Build document UI
5. Test storage limits

**Blockers:** CRM must be complete  
**Dependencies:** Auth, CRM, S3  
**Team:** 2 backend, 2 frontend

---

### Priority 4: Tasks (Week 7)
**Why Fourth:** Workflow management

**Tasks:**
1. Implement tasks CRUD
2. Implement status management
3. Build task UI
4. Write tests

**Blockers:** CRM must be complete  
**Dependencies:** Auth, CRM  
**Team:** 1 backend, 1 frontend

---

### Priority 5: Invoicing (Weeks 8-9)
**Why Fifth:** Revenue generation

**Tasks:**
1. Implement invoices CRUD
2. Implement PDF generation
3. Integrate Stripe
4. Implement webhooks
5. Build invoice UI
6. Test payment flow

**Blockers:** CRM must be complete  
**Dependencies:** Auth, CRM, Stripe  
**Team:** 2 backend, 2 frontend

---

### Priority 6: Email (Week 10)
**Why Sixth:** Communication

**Tasks:**
1. Setup AWS SES
2. Implement email service
3. Create email templates
4. Implement email tracking
5. Test email delivery

**Blockers:** Invoicing must be complete  
**Dependencies:** Auth, Invoicing, SES  
**Team:** 1 backend

---

### Priority 7: Beta Launch (Week 11)
**Why Seventh:** Validation

**Tasks:**
1. Deploy to staging
2. Manual testing
3. Fix critical bugs
4. Recruit beta users
5. Onboard beta users
6. Collect feedback

**Blockers:** All core features complete  
**Dependencies:** All previous priorities  
**Team:** All developers

---

### Priority 8: Portal (Weeks 12-14)
**Why Eighth:** Client collaboration

**Tasks:**
1. Implement portal auth
2. Implement portal features
3. Build portal UI
4. Test client isolation
5. Beta test portal

**Blockers:** Beta feedback incorporated  
**Dependencies:** Auth, CRM, Documents, Invoicing  
**Team:** 2 backend, 2 frontend

---

### Priority 9: SaaS Billing (Weeks 15-16)
**Why Ninth:** Business model

**Tasks:**
1. Implement plans/subscriptions
2. Integrate Stripe subscriptions
3. Implement usage limits
4. Build billing UI
5. Test subscription flow

**Blockers:** Portal must be complete  
**Dependencies:** Auth, Stripe  
**Team:** 2 backend, 1 frontend

---

### Priority 10: Production Launch (Week 16)
**Why Last:** Final validation

**Tasks:**
1. Security audit
2. Performance testing
3. Deploy to production
4. Configure monitoring
5. Launch to customers
6. Monitor for 48 hours

**Blockers:** All features complete  
**Dependencies:** All previous priorities  
**Team:** All developers

---

## 12. Success Metrics

### Week 10 (Beta Launch)
- [ ] 5 beta users onboarded
- [ ] 20+ clients created
- [ ] 50+ documents uploaded
- [ ] 10+ invoices created
- [ ] 5+ payments processed
- [ ] <500ms API response time
- [ ] <10 bugs reported

### Week 16 (Production Launch)
- [ ] 10 paying customers
- [ ] $500 MRR
- [ ] 100+ clients in system
- [ ] 500+ documents uploaded
- [ ] 50+ invoices created
- [ ] 25+ payments processed
- [ ] <5 critical bugs
- [ ] <500ms p95 response time
- [ ] 99% uptime
- [ ] Positive customer feedback

### Month 3 (Post-Launch)
- [ ] 25 paying customers
- [ ] $1,250 MRR
- [ ] 500+ clients in system
- [ ] 2,000+ documents uploaded
- [ ] 200+ invoices created
- [ ] 100+ payments processed
- [ ] Product-market fit validated
- [ ] Churn rate <5%

### Month 6 (Growth)
- [ ] 50 paying customers
- [ ] $2,500 MRR
- [ ] 1,000+ clients in system
- [ ] 5,000+ documents uploaded
- [ ] 500+ invoices created
- [ ] 250+ payments processed
- [ ] Phase 2 features launched
- [ ] Positive unit economics

---

## 13. Final Checklist

### Before Starting Development
- [ ] All source documents reviewed
- [ ] Team aligned on MVP scope
- [ ] Development environment setup
- [ ] AWS accounts created
- [ ] Stripe account created
- [ ] GitHub repository created
- [ ] Project management tool setup
- [ ] Communication channels established

### Before Beta Launch (Week 10)
- [ ] All Phase 1-6 features complete
- [ ] All critical tests passing
- [ ] Security audit complete
- [ ] Staging environment stable
- [ ] Beta user recruitment complete
- [ ] Onboarding docs ready
- [ ] Feedback tracking system ready

### Before Production Launch (Week 16)
- [ ] All Phase 1-9 features complete
- [ ] All critical bugs fixed
- [ ] Security audit passed
- [ ] Performance testing passed
- [ ] Production environment ready
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Terms of service ready
- [ ] Privacy policy ready
- [ ] Support email ready
- [ ] Payment processing tested
- [ ] Customer onboarding ready

---

## 14. Conclusion

This phase-wise execution plan provides:

✅ **Complete feature inventory** - All features documented  
✅ **Clear MVP scope** - 35 features for launch  
✅ **Deferred features** - Organized into 5 phases  
✅ **Development phases** - 10 phases over 16 weeks  
✅ **Architecture rules** - Ensure future compatibility  
✅ **Database planning** - 20 MVP tables, 16 future tables  
✅ **API planning** - 60 MVP endpoints, 24 future endpoints  
✅ **Frontend planning** - 25 MVP pages, 19 future pages  
✅ **Risk analysis** - 10 risks identified with mitigation  
✅ **Implementation priority** - Clear execution order  

**This plan is ready for immediate execution.**

**Timeline:** 16 weeks  
**Team:** 3-5 developers  
**Goal:** Launch revenue-generating MVP  
**Success:** First paying customer by Week 16  

**Start development. Ship in 16 weeks. Iterate after revenue.**

---

**Document Version:** 1.0 FINAL  
**Status:** APPROVED FOR EXECUTION  
**Last Updated:** Phase-Wise Plan Complete  
**Next Review:** After MVP Launch

