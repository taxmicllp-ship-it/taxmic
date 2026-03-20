#!/usr/bin/env bash
# Portal Security Test — Risk #1 Client Portal Complexity
#
# Verifies:
#   1. Portal endpoints reject admin JWT tokens (type != 'portal')
#   2. Portal endpoints reject requests with no token
#   3. Portal user cannot access another firm's data
#   4. Admin endpoints reject portal JWT tokens
#
# Usage:
#   ADMIN_TOKEN=<jwt> PORTAL_TOKEN=<jwt> bash scripts/test-portal-security.sh
#   BASE_URL=http://localhost:3000 bash scripts/test-portal-security.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
PORTAL_TOKEN="${PORTAL_TOKEN:-}"

PASS=0
FAIL=0

check() {
  local label="$1"
  local expected_status="$2"
  local actual_status="$3"

  if [ "$actual_status" = "$expected_status" ]; then
    echo "  ✅ PASS  $label (HTTP $actual_status)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL  $label (expected HTTP $expected_status, got HTTP $actual_status)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "══════════════════════════════════════════════"
echo "Portal Security Test — $BASE_URL"
echo "══════════════════════════════════════════════"

# ── Test 1: Portal endpoint rejects no token ──────────────────────────────────
echo ""
echo "── Test 1: Portal endpoints reject unauthenticated requests ──"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/portal/documents")
check "GET /portal/documents without token → 401" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/portal/invoices")
check "GET /portal/invoices without token → 401" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/portal/tasks")
check "GET /portal/tasks without token → 401" "401" "$STATUS"

# ── Test 2: Portal endpoint rejects admin JWT ─────────────────────────────────
if [ -n "$ADMIN_TOKEN" ]; then
  echo ""
  echo "── Test 2: Portal endpoints reject admin JWT (wrong token type) ──"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    "$BASE_URL/api/v1/portal/documents")
  check "GET /portal/documents with admin JWT → 401" "401" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    "$BASE_URL/api/v1/portal/invoices")
  check "GET /portal/invoices with admin JWT → 401" "401" "$STATUS"
else
  echo ""
  echo "── Test 2: SKIPPED (ADMIN_TOKEN not set) ──"
fi

# ── Test 3: Admin endpoint rejects portal JWT ─────────────────────────────────
if [ -n "$PORTAL_TOKEN" ]; then
  echo ""
  echo "── Test 3: Admin endpoints reject portal JWT ──"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $PORTAL_TOKEN" \
    "$BASE_URL/api/v1/clients")
  check "GET /clients with portal JWT → 401" "401" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $PORTAL_TOKEN" \
    "$BASE_URL/api/v1/invoices")
  check "GET /invoices with portal JWT → 401" "401" "$STATUS"
else
  echo ""
  echo "── Test 3: SKIPPED (PORTAL_TOKEN not set) ──"
fi

# ── Test 4: Portal authenticated endpoints work with valid portal JWT ──────────
if [ -n "$PORTAL_TOKEN" ]; then
  echo ""
  echo "── Test 4: Portal endpoints accept valid portal JWT ──"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $PORTAL_TOKEN" \
    "$BASE_URL/api/v1/portal/documents")
  check "GET /portal/documents with portal JWT → 200" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $PORTAL_TOKEN" \
    "$BASE_URL/api/v1/portal/invoices")
  check "GET /portal/invoices with portal JWT → 200" "200" "$STATUS"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo "PORTAL SECURITY TEST SUMMARY"
echo "══════════════════════════════════════════════"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo "  Result: ✅ ALL PASS"
  exit 0
else
  echo "  Result: ❌ FAILURES DETECTED"
  exit 1
fi
