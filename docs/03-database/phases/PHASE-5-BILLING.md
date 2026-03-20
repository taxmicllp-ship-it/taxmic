# PHASE 5: BILLING

**Development Week:** 9-10  
**Purpose:** Client invoicing and payments  
**Dependencies:** Phase 1 (Foundation), Phase 2 (CRM)

---

## Tables Introduced

### 1. invoice_sequences ⚠️ CRITICAL FIX APPLIED
- firm_id (PK), last_number, created_at, updated_at

**Purpose:** Atomic invoice number generation per firm

**Function:**
```
get_next_invoice_number(firm_id UUID) RETURNS INTEGER
```

**CRITICAL FIX:**
- Prevents race conditions in concurrent invoice creation
- Atomic sequence generation
- No number collisions

---

### 2. invoices
- id, firm_id, client_id, number
- status (invoice_status_enum) ✅ ENUM
- issue_date, due_date, subtotal_amount, tax_amount, total_amount, paid_amount, notes, pdf_url, sent_at, paid_at
- created_at, updated_at, deleted_at

**Indexes:** UNIQUE (firm_id, number) WHERE deleted_at IS NULL, firm_id, client_id, status, due_date, created_at, (firm_id, status, due_date)

**RLS:** Enabled (firm_id)

---

### 3. invoice_items
- id, invoice_id, description, quantity, unit_price, amount, sort_order
- created_at, updated_at

**Indexes:** invoice_id, sort_order

**RLS:** Enabled (via invoice_id)

---

### 4. payments
- id, firm_id, invoice_id, amount
- method (payment_method_enum) ✅ ENUM
- status (payment_status_enum) ✅ ENUM
- stripe_payment_intent_id, stripe_charge_id, reference_number, notes, paid_at
- created_at, updated_at

**Indexes:** firm_id, invoice_id, status, stripe_payment_intent_id, paid_at, created_at

**RLS:** Enabled (firm_id)

---

## ENUMs Required

```
CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method_enum AS ENUM ('stripe', 'check', 'cash', 'wire', 'other');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
```

---

## Functions Required

```
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_firm_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  INSERT INTO invoice_sequences (firm_id, last_number)
  VALUES (p_firm_id, 1)
  ON CONFLICT (firm_id) DO UPDATE
  SET last_number = invoice_sequences.last_number + 1,
      updated_at = NOW()
  RETURNING last_number INTO v_next_number;
  
  RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

- update_invoice_status() — AFTER INSERT OR UPDATE on payments

---

## Testing Checklist

- [ ] Create invoice_sequences for firm
- [ ] Generate invoice number using get_next_invoice_number()
- [ ] Create 100 concurrent invoices, verify no collisions ✅ CRITICAL TEST
- [ ] Create invoice with all statuses (draft, sent, paid, overdue, cancelled)
- [ ] Create payment with all methods (stripe, check, cash, wire, other)
- [ ] Create payment with all statuses (pending, completed, failed, refunded)
- [ ] Verify invoice status updates automatically when payment received
- [ ] Test partial payments
- [ ] Test invoice PDF generation

---

**Phase Status:** READY (WITH CRITICAL FIXES)  
**Estimated Time:** 2 weeks

---

**END OF PHASE 5 DOCUMENT**
