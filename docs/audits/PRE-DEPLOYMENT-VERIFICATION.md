# Pre-Deployment Verification Checklist

**Date:** 2026-03-19  
**Status:** REQUIRED BEFORE PRODUCTION DEPLOY  
**Critical Fix Applied:** Invoice delete payment validation

---

## 🔥 CRITICAL: Payment Flow Verification

### Test Scenario 1: Draft Invoice Delete (Happy Path)
```bash
# 1. Create draft invoice
POST /api/v1/invoices
Authorization: Bearer {token}
{
  "client_id": "{client_id}",
  "issue_date": "2026-03-19",
  "items": [
    { "description": "Test", "quantity": "1", "unit_price": "100" }
  ]
}
# Expected: 201, returns invoice with status='draft'

# 2. Delete draft invoice
DELETE /api/v1/invoices/{invoice_id}
Authorization: Bearer {token}
# Expected: 204 No Content ✅
```

### Test Scenario 2: Sent Invoice Delete (Should Fail)
```bash
# 1. Create and send invoice
POST /api/v1/invoices
# ... (same as above)

POST /api/v1/invoices/{invoice_id}/send
Authorization: Bearer {token}
# Expected: 200, invoice status='sent'

# 2. Try to delete sent invoice
DELETE /api/v1/invoices/{invoice_id}
Authorization: Bearer {token}
# Expected: 422 "Only draft invoices can be deleted" ✅
```

### Test Scenario 3: Invoice with Payment (Should Fail)
```bash
# 1. Create and send invoice
POST /api/v1/invoices
# ... (creates draft)

POST /api/v1/invoices/{invoice_id}/send
# Invoice now 'sent'

# 2. Create Stripe checkout (creates payment record)
POST /api/v1/payments/checkout-session
Authorization: Bearer {token}
{
  "invoice_id": "{invoice_id}",
  "success_url": "http://localhost:3000/success",
  "cancel_url": "http://localhost:3000/cancel"
}
# Expected: 200, payment record created with status='pending'

# 3. Try to delete invoice (even if manually set back to draft)
DELETE /api/v1/invoices/{invoice_id}
Authorization: Bearer {token}
# Expected: 422 "Cannot delete invoice with payment records" ✅
```

### Test Scenario 4: Full Payment Lifecycle
```bash
# 1. Create invoice → Send → Create checkout → Complete payment
# 2. Verify invoice status = 'paid'
# 3. Try to delete
# Expected: 422 "Only draft invoices can be deleted" ✅
# 4. Verify payment record still exists
# Expected: Payment record intact, no orphans ✅
```

---

## 🟠 IMPORTANT: Webhook Configuration

### Stripe Dashboard Verification
- [ ] Login to Stripe Dashboard
- [ ] Navigate to Developers → Webhooks
- [ ] Verify endpoint URL: `https://{your-domain}/api/v1/payments/webhook`
- [ ] Verify events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Verify signing secret matches `STRIPE_WEBHOOK_SECRET` in env

### Stripe Subscription Webhook
- [ ] Verify endpoint URL: `https://{your-domain}/api/v1/subscriptions/webhook`
- [ ] Verify events: `customer.subscription.*`, `invoice.*`

### Local Testing with Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:4000/api/v1/payments/webhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

## 🟡 RECOMMENDED: End-to-End Flow Test

### Complete Invoice → Payment Flow
1. **Create Client**
   ```bash
   POST /api/v1/clients
   { "name": "Test Client", "email": "test@example.com" }
   ```

2. **Create Draft Invoice**
   ```bash
   POST /api/v1/invoices
   { "client_id": "{client_id}", "items": [...] }
   ```

3. **Send Invoice**
   ```bash
   POST /api/v1/invoices/{invoice_id}/send
   # Verify: Email sent, status='sent', PDF generated
   ```

4. **Create Stripe Checkout**
   ```bash
   POST /api/v1/payments/checkout-session
   { "invoice_id": "{invoice_id}", ... }
   # Verify: Payment record created, Stripe session URL returned
   ```

5. **Complete Payment** (via Stripe test card or CLI)
   ```bash
   # Use Stripe test card: 4242 4242 4242 4242
   # OR: stripe trigger payment_intent.succeeded
   ```

6. **Verify Webhook Processing**
   ```bash
   GET /api/v1/invoices/{invoice_id}
   # Expected: status='paid', paid_at set, paid_amount matches total
   ```

7. **Verify Payment Record**
   ```bash
   GET /api/v1/clients/{client_id}/payments
   # Expected: Payment record with status='completed'
   ```

8. **Try to Delete Paid Invoice**
   ```bash
   DELETE /api/v1/invoices/{invoice_id}
   # Expected: 422 "Only draft invoices can be deleted" ✅
   ```

---

## 🟢 OPTIONAL: Sentry Error Tracking

### Trigger Test Errors
```bash
# 1. Invalid date format (dashboard)
GET /api/v1/dashboard/summary?start_date=invalid
# Expected: 400, error logged to Sentry ✅

# 2. Invalid invoice delete
DELETE /api/v1/invoices/{sent_invoice_id}
# Expected: 422, logged to Sentry ✅

# 3. Check Sentry dashboard
# Verify: Both errors appear with full context
```

---

## 📋 Environment Variables Checklist

### Backend (`apps/api/.env`)
- [ ] `SENTRY_DSN` set
- [ ] `RESEND_API_KEY` set
- [ ] `EMAIL_FROM` set
- [ ] `STRIPE_SECRET_KEY` set (production key)
- [ ] `STRIPE_WEBHOOK_SECRET` set (from Stripe dashboard)
- [ ] `STORAGE_PROVIDER=s3` (production)
- [ ] `AWS_*` credentials set (if using S3)
- [ ] `FRONTEND_URL` set to production domain

### Frontend (`apps/web/.env.local`)
- [ ] `VITE_SENTRY_DSN` set
- [ ] `VITE_API_URL` set to production API

### Resend Configuration
- [ ] Domain `buzzlens24.com` DNS verified
- [ ] SPF, DKIM, DMARC records configured
- [ ] Test email sent successfully

---

## ✅ Final Verification

Before marking as complete:

- [ ] All 4 invoice delete scenarios tested
- [ ] Full payment lifecycle tested end-to-end
- [ ] Stripe webhooks verified (both payment and subscription)
- [ ] Sentry error tracking verified
- [ ] No orphaned payment records in database
- [ ] All environment variables configured
- [ ] Email delivery working
- [ ] Frontend cache invalidation verified (delete invoice → list refreshes)
- [ ] Webhook idempotency tested (replay same event → no duplicate processing)
- [ ] Payment relation loading verified (all code paths include payments)

---

## 🚨 Known Limitations (Documented)

1. **Logout:** Stateless JWT (no server-side revocation)
2. **Email Changes:** Not supported in `PATCH /me` (requires verification flow)
3. **Response Shape:** `/me` includes `role` field not in login response (non-breaking)
4. **Hard Delete:** All deletes are soft (manual cleanup required)

---

**Checklist Created:** 2026-03-19  
**Critical Fix:** Invoice delete payment validation  
**Status:** READY FOR VERIFICATION TESTING
