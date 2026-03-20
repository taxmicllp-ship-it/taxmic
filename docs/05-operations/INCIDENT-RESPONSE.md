# Incident Response Plan

**Version:** 1.0  
**Last Updated:** 2026-03-20

---

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 — Critical | Data breach, complete outage, payment processing down | 15 minutes |
| P1 — High | Auth broken, portal inaccessible, invoices not sending | 1 hour |
| P2 — Medium | Feature degraded, slow performance, email failures | 4 hours |
| P3 — Low | UI bug, minor feature issue | Next business day |

---

## P0 — Data Isolation Breach

**Symptoms:** Tenant A can see Tenant B's data.

**Immediate actions:**
1. Take API offline: `pm2 stop api` or scale to 0 in cloud console
2. Notify all affected customers within 1 hour
3. Run isolation audit:
   ```sql
   -- Check for cross-tenant data exposure
   SELECT firm_id, COUNT(*) FROM clients GROUP BY firm_id ORDER BY COUNT(*) DESC;
   ```
4. Review `audit_logs` table for suspicious cross-tenant queries
5. Apply RLS migration if not yet applied:
   ```bash
   psql $DATABASE_URL -f packages/database/prisma/migrations/20260320200000_row_level_security/migration.sql
   ```
6. Restore service only after isolation is confirmed
7. File incident report within 24 hours

**Customer notification template:**
> We identified a security issue affecting data isolation. We have taken immediate action to resolve it. Your data is [affected/not affected]. We will provide a full report within 48 hours.

---

## P0 — Payment Processing Down

**Symptoms:** Stripe checkout sessions failing, webhooks not processing.

**Immediate actions:**
1. Check Stripe status: https://status.stripe.com
2. Check `webhook_events` table for failed events:
   ```sql
   SELECT * FROM webhook_events WHERE status = 'failed' ORDER BY received_at DESC LIMIT 20;
   ```
3. Use manual mark-paid fallback:
   ```bash
   curl -X PATCH https://api.yourdomain.com/api/v1/invoices/:id/mark-paid \
     -H "Authorization: Bearer <admin_token>"
   ```
4. Replay failed webhooks from Stripe Dashboard → Developers → Webhooks
5. If Stripe is down: communicate to customers via email, offer manual payment recording

---

## P1 — Authentication Broken

**Symptoms:** Users cannot log in, JWT errors.

**Immediate actions:**
1. Check `JWT_SECRET` env var is set and unchanged
2. Check API logs: `pm2 logs api --lines 100`
3. Verify DB connection: `GET /api/v1/health`
4. If JWT_SECRET was rotated: all existing tokens are invalid — users must re-login
5. Roll back JWT_SECRET change if unintentional

---

## P1 — Portal Inaccessible

**Symptoms:** Portal login fails, portal users get 401.

**Immediate actions:**
1. Verify `authenticatePortal` middleware is checking `payload.type === 'portal'`
2. Check portal JWT is being issued with `type: 'portal'` in payload
3. Check `portal_client_users` table for the affected user
4. Reset portal user password if needed via admin API

---

## P2 — Email Delivery Failures

**Symptoms:** Invoices not being emailed, notifications not sending.

**Immediate actions:**
1. Check Resend dashboard for bounce/failure rates
2. Query email events:
   ```sql
   SELECT event_type, COUNT(*) FROM email_events
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY event_type;
   ```
3. Check `RESEND_API_KEY` is valid
4. If Resend is down: emails will be logged as stubs — no data loss, retry when restored
5. Manually trigger invoice email via `POST /api/v1/invoices/:id/send`

---

## P2 — Document Upload/Download Failing

**Symptoms:** File uploads return 500, download URLs broken.

**Immediate actions:**
1. Check `STORAGE_PROVIDER` env var (`local` or `s3`)
2. If `s3`: verify `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` are set
3. Check S3 bucket permissions — bucket must allow `PutObject`, `GetObject`, `DeleteObject` for the API role
4. If local storage: check `apps/api/uploads/` directory exists and is writable
5. Check storage usage limits: `GET /api/v1/usage`

---

## Post-Incident Process

1. Write incident report within 48 hours
2. Document: timeline, root cause, impact, resolution, prevention
3. Update this runbook with new findings
4. Add regression test if applicable
5. Review with team within 1 week

---

## Contacts

| Role | Responsibility |
|------|---------------|
| On-call engineer | First responder for all P0/P1 |
| Project lead | Customer communication for P0 |
| Database admin | RLS and data isolation issues |

---

## Monitoring Checklist

Run these checks daily in production:

```bash
# API health
curl https://api.yourdomain.com/api/v1/health

# Failed webhooks in last 24h
psql $DATABASE_URL -c "SELECT COUNT(*) FROM webhook_events WHERE status='failed' AND received_at > NOW() - INTERVAL '24 hours';"

# Failed emails in last 24h
psql $DATABASE_URL -c "SELECT COUNT(*) FROM email_events WHERE event_type='failed' AND created_at > NOW() - INTERVAL '24 hours';"

# Sentry error rate
# Check: https://sentry.io/organizations/<org>/issues/
```
