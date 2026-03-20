#!/usr/bin/env bash
BASE="http://localhost:3000/api/v1"

echo "=== 1. Register ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firmName":"Acme Accounting","firmSlug":"acme-accounting","firmEmail":"firm@acme.com","firstName":"Jane","lastName":"Doe","email":"jane@acme.com","password":"SecurePass123!"}'

echo ""
echo "=== 2. Login (valid) ==="
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@acme.com","password":"SecurePass123!","firmSlug":"acme-accounting"}')
echo "$LOGIN"
TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "=== 3. Login (wrong password) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@acme.com","password":"WrongPass999","firmSlug":"acme-accounting"}'

echo ""
echo "=== 4. Forgot password ==="
FORGOT=$(curl -s -X POST "$BASE/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@acme.com"}')
echo "$FORGOT"
RESET_TOKEN=$(echo "$FORGOT" | grep -o '"resetToken":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "=== 5. Reset password ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"password\":\"NewSecurePass456\"}"

echo ""
echo "=== 6. Login with new password ==="
LOGIN2=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@acme.com","password":"NewSecurePass456","firmSlug":"acme-accounting"}')
echo "$LOGIN2"
TOKEN2=$(echo "$LOGIN2" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "=== 7. Logout (with JWT) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/auth/logout" \
  -H "Authorization: Bearer $TOKEN2"

echo ""
echo "=== 8. Logout (no JWT - expect 401) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/auth/logout"

echo ""
echo "=== 9. Duplicate register (expect 409) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firmName":"Acme Accounting","firmSlug":"acme-accounting","firmEmail":"firm@acme.com","firstName":"Jane","lastName":"Doe","email":"jane@acme.com","password":"SecurePass123!"}'

echo ""
echo "=== Done ==="
