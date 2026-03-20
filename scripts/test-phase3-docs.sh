#!/usr/bin/env bash
set -e
BASE="http://localhost:3000/api/v1"

echo "=== Setup: Register & Login ==="
REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firmName":"DocTest Firm","firmSlug":"doctest-firm-001","firmEmail":"firm@doctest001.com","firstName":"Doc","lastName":"Tester","email":"doctester001@doctest.com","password":"SecurePass123!"}')
TOKEN=$(echo "$REG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  LOGIN=$(curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"doctester001@doctest.com","password":"SecurePass123!","firmSlug":"doctest-firm-001"}')
  TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
fi
echo "Token acquired: ${TOKEN:0:20}..."

echo ""
echo "=== Setup: Create Client ==="
CLIENT=$(curl -s -X POST "$BASE/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client","email":"client@test.com","status":"active"}')
CLIENT_ID=$(echo "$CLIENT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id'])")
echo "Client ID: $CLIENT_ID"

echo ""
echo "=== Setup: Create Folder ==="
FOLDER=$(curl -s -X POST "$BASE/clients/$CLIENT_ID/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Folder"}')
FOLDER_ID=$(echo "$FOLDER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id'])")
echo "Folder ID: $FOLDER_ID"

echo ""
echo "=== TASK 26: Upload file — expect 201, size_bytes is string ==="
echo "hello pdf content" > /tmp/ph3_upload.pdf
UPLOAD=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/folders/$FOLDER_ID/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/ph3_upload.pdf;type=application/pdf" \
  -F "client_id=$CLIENT_ID")
UPLOAD_BODY=$(echo "$UPLOAD" | head -1)
UPLOAD_CODE=$(echo "$UPLOAD" | grep "HTTP_CODE:" | cut -d: -f2)
DOC_ID=$(echo "$UPLOAD_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id'])")
SIZE_BYTES=$(echo "$UPLOAD_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(type(d['size_bytes']).__name__)")
echo "HTTP $UPLOAD_CODE | DOC_ID: $DOC_ID | size_bytes type: $SIZE_BYTES (expect: str)"
[ "$UPLOAD_CODE" = "201" ] && echo "PASS: 201" || echo "FAIL: expected 201 got $UPLOAD_CODE"
[ "$SIZE_BYTES" = "str" ] && echo "PASS: size_bytes is string" || echo "FAIL: size_bytes is $SIZE_BYTES"

echo ""
echo "=== TASK 27: Download — expect 200 with signed URL (not raw path) ==="
DOWNLOAD=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/documents/$DOC_ID/download" \
  -H "Authorization: Bearer $TOKEN")
DOWNLOAD_BODY=$(echo "$DOWNLOAD" | head -1)
DOWNLOAD_CODE=$(echo "$DOWNLOAD" | grep "HTTP_CODE:" | cut -d: -f2)
DOWNLOAD_URL=$(echo "$DOWNLOAD_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url',''))")
echo "HTTP $DOWNLOAD_CODE | URL: ${DOWNLOAD_URL:0:60}..."
[ "$DOWNLOAD_CODE" = "200" ] && echo "PASS: 200" || echo "FAIL: expected 200 got $DOWNLOAD_CODE"
# Signed URL should contain a token (base64 encoded path), not a raw file path
echo "$DOWNLOAD_URL" | grep -q "serve/" && echo "PASS: URL is token-based (not raw path)" || echo "FAIL: URL looks like raw path"

echo ""
echo "=== TASK 28: MIME validation — upload .exe expect 415 ==="
echo "fake exe" > /tmp/ph3_bad.exe
MIME_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/folders/$FOLDER_ID/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/ph3_bad.exe;type=application/x-msdownload" \
  -F "client_id=$CLIENT_ID")
MIME_CODE=$(echo "$MIME_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
echo "HTTP $MIME_CODE"
[ "$MIME_CODE" = "415" ] && echo "PASS: 415 UNSUPPORTED_MEDIA_TYPE" || echo "FAIL: expected 415 got $MIME_CODE"

echo ""
echo "=== TASK 29: Size limit — upload >50MB expect 413 ==="
dd if=/dev/zero bs=1048576 count=51 2>/dev/null > /tmp/ph3_big.pdf
SIZE_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/folders/$FOLDER_ID/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/ph3_big.pdf;type=application/pdf" \
  -F "client_id=$CLIENT_ID")
SIZE_CODE=$(echo "$SIZE_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
echo "HTTP $SIZE_CODE"
[ "$SIZE_CODE" = "413" ] && echo "PASS: 413 FILE_TOO_LARGE" || echo "FAIL: expected 413 got $SIZE_CODE"

echo ""
echo "=== TASK 30: Soft delete ==="
DEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "DELETE HTTP $DEL_CODE"
[ "$DEL_CODE" = "204" ] && echo "PASS: 204 No Content" || echo "FAIL: expected 204 got $DEL_CODE"

AFTER_DEL=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/documents/$DOC_ID/download" \
  -H "Authorization: Bearer $TOKEN")
AFTER_DEL_CODE=$(echo "$AFTER_DEL" | grep "HTTP_CODE:" | cut -d: -f2)
echo "GET after delete HTTP $AFTER_DEL_CODE"
[ "$AFTER_DEL_CODE" = "404" ] && echo "PASS: 404 after delete" || echo "FAIL: expected 404 got $AFTER_DEL_CODE"

echo ""
echo "=== TASK 31: Tenant isolation ==="
# Register a second firm
REG2=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firmName":"Other Firm","firmSlug":"other-firm-001","firmEmail":"firm@other001.com","firstName":"Other","lastName":"User","email":"otheruser001@other.com","password":"SecurePass123!"}')
TOKEN2=$(echo "$REG2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

# Upload a doc as firm 1 (need a fresh non-deleted doc)
echo "tenant test content" > /tmp/ph3_tenant.pdf
TENANT_UPLOAD=$(curl -s -X POST "$BASE/folders/$FOLDER_ID/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/ph3_tenant.pdf;type=application/pdf" \
  -F "client_id=$CLIENT_ID")
TENANT_DOC_ID=$(echo "$TENANT_UPLOAD" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id'])")
echo "Firm1 doc: $TENANT_DOC_ID"

# Try to download as firm 2 — expect 404
ISOLATION_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/documents/$TENANT_DOC_ID/download" \
  -H "Authorization: Bearer $TOKEN2")
ISOLATION_CODE=$(echo "$ISOLATION_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
echo "Firm2 download attempt HTTP $ISOLATION_CODE"
[ "$ISOLATION_CODE" = "404" ] && echo "PASS: 404 tenant isolation enforced" || echo "FAIL: expected 404 got $ISOLATION_CODE"

echo ""
echo "=== TASK 32: Regression — Phase 1 auth ==="
LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"doctester001@doctest.com","password":"SecurePass123!","firmSlug":"doctest-firm-001"}')
echo "POST /auth/login HTTP $LOGIN_CODE"
[ "$LOGIN_CODE" = "200" ] && echo "PASS: 200" || echo "FAIL: expected 200 got $LOGIN_CODE"

REG_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firmName":"Reg Test","firmSlug":"reg-test-ph3-001","firmEmail":"firm@regtest001.com","firstName":"Reg","lastName":"Test","email":"regtest001@reg.com","password":"SecurePass123!"}')
echo "POST /auth/register HTTP $REG_CODE"
[ "$REG_CODE" = "201" ] && echo "PASS: 201" || echo "FAIL: expected 201 got $REG_CODE"

echo ""
echo "=== TASK 33: Regression — Phase 2 CRM ==="
CLIENTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/clients" \
  -H "Authorization: Bearer $TOKEN")
echo "GET /clients HTTP $CLIENTS_CODE"
[ "$CLIENTS_CODE" = "200" ] && echo "PASS: 200" || echo "FAIL: expected 200 got $CLIENTS_CODE"

CONTACTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/contacts" \
  -H "Authorization: Bearer $TOKEN")
echo "GET /contacts HTTP $CONTACTS_CODE"
[ "$CONTACTS_CODE" = "200" ] && echo "PASS: 200" || echo "FAIL: expected 200 got $CONTACTS_CODE"

echo ""
echo "=== All tasks 26-33 complete ==="
