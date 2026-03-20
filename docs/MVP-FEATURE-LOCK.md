# MVP Feature Lock

**Status:** LOCKED  
**Locked Date:** 2026-03-20  
**Reference:** PHASE-WISE-EXECUTION-PLAN-PART2.md — Sections 8, 9

---

## Scope Lock

The MVP scope is frozen. No new features may be added to the MVP without a formal change request reviewed by the project lead.

---

## Locked MVP Features (35 total)

### Phase 1 — Auth
- User registration
- User login / logout
- JWT authentication
- Password reset (forgot + reset)
- Firm profile management

### Phase 2 — CRM
- Client CRUD
- Contact CRUD
- Client-contact linking
- Client search

### Phase 3 — Documents
- Folder management
- Document upload (50MB limit)
- Document download (signed URLs)
- Document delete

### Phase 4 — Tasks
- Task CRUD
- Task status management
- Task assignment
- Client-linked tasks

### Phase 5 — Invoicing & Payments
- Invoice CRUD
- Invoice PDF generation
- Invoice send (email)
- Stripe Checkout payment
- Payment webhook handling
- Manual mark-paid fallback

### Phase 6 — Notifications
- In-app notifications
- Email notifications (Resend)
- Email delivery/bounce tracking

### Phase 7 — Beta Launch
- Staging deployment
- Beta user onboarding (max 5 users)

### Phase 8 — Client Portal
- Portal authentication (separate JWT)
- Portal document view/download
- Portal invoice view/pay
- Portal task view

### Phase 9 — SaaS Billing
- Subscription plans (Starter/Pro/Enterprise)
- Stripe subscription checkout
- Usage limits enforcement
- Billing history

### Phase 10 — Production Launch
- Security hardening
- Performance validation
- Production deployment

---

## Deferred Features (Post-MVP)

All features listed in Sections 8.2 and 9.2 of PHASE-WISE-EXECUTION-PLAN-PART2.md are deferred.

Key deferred items:
- Activity feed
- Onboarding wizard
- Tags management
- Advanced search
- Reports / Analytics
- Time tracking
- Integrations / Webhooks
- E-signature
- Custom fields
- Workflows

---

## Change Request Process

1. Raise a GitHub issue tagged `scope-change`
2. Project lead reviews within 48 hours
3. If approved: update this document and PHASE-WISE-EXECUTION-PLAN-PART2.md
4. If rejected: defer to post-MVP backlog

---

**This document is the authoritative scope reference. Any feature not listed above is OUT OF SCOPE for MVP.**
