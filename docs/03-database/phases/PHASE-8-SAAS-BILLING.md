# PHASE 8: SAAS BILLING

**Development Week:** 15-16  
**Purpose:** Subscription management and SaaS billing  
**Dependencies:** Phase 1 (Foundation)

---

## Tables Introduced

### 1. plans
- id, name, slug, description, price_monthly, price_annual, max_clients, max_users, max_storage_gb, features (JSONB), is_active, sort_order
- created_at, updated_at

**Indexes:** UNIQUE (slug), is_active, sort_order

**RLS:** Not applicable (system table)

---

### 2. subscriptions
- id, firm_id (UNIQUE), plan_id, status, stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, cancel_at_period_end, canceled_at, trial_start, trial_end
- created_at, updated_at

**Indexes:** UNIQUE (firm_id), plan_id, status, stripe_subscription_id, current_period_end

**RLS:** Not applicable (system table, but firm-specific)

---

### 3. subscription_events
- id, subscription_id, event_type, from_status, to_status, metadata (JSONB), created_at

**Indexes:** subscription_id, event_type, created_at

**RLS:** Not applicable (system table)

---

## Seed Data

```
INSERT INTO plans (name, slug, price_monthly, price_annual, max_clients, max_users, max_storage_gb) VALUES
  ('Starter', 'starter', 29.00, 290.00, 50, 5, 10),
  ('Professional', 'professional', 99.00, 990.00, 200, 15, 50),
  ('Enterprise', 'enterprise', 299.00, 2990.00, 999999, 999999, 500);
```

---

**Phase Status:** READY  
**Estimated Time:** 2 weeks

---

**END OF PHASE 8 DOCUMENT**
