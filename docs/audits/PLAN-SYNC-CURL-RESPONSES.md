# Plan Sync — Admin Plans API: Live curl Responses

Base URL: `http://localhost:3000/api/v1`  
Auth: `Authorization: Bearer <JWT>` — JWT must have `role: "admin"`  
Tested: 2026-03-18

---

## Mint an admin token (dev only)

```bash
node -e "
const jwt = require('jsonwebtoken');
console.log(jwt.sign(
  { userId: '<uuid>', firmId: '<uuid>', email: 'admin@test.com', role: 'admin' },
  'dev-secret-change-in-production',
  { expiresIn: '2h' }
));
"
```

---

## GET /api/v1/admin/plans

Returns all plans including inactive, ordered by `sort_order`.

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/plans
```

**HTTP 200**

```json
[
  {
    "id": "d3452753-d222-4587-afde-4120ac83efa5",
    "name": "Test Plan",
    "slug": "test-plan-2",
    "description": "Updated with new price",
    "price_monthly": "59",
    "price_annual": "490",
    "max_clients": null,
    "max_users": null,
    "max_storage_gb": null,
    "features": null,
    "is_active": false,
    "sort_order": 0,
    "stripe_product_id": "prod_UAMo734AYrShm7",
    "stripe_price_id": "price_1TC256KowBPdmLR127Sp7eqX",
    "created_at": "2026-03-17T18:10:53.087Z",
    "updated_at": "2026-03-17T23:41:28.404Z"
  },
  {
    "id": "0a68163b-0f54-455c-a389-30fa8ec0b202",
    "name": "Starter",
    "slug": "starter",
    "description": "For small firms getting started",
    "price_monthly": "29",
    "price_annual": "290",
    "max_clients": 25,
    "max_users": 3,
    "max_storage_gb": 5,
    "features": { "stripe_price_id": "price_starter_placeholder" },
    "is_active": true,
    "sort_order": 1,
    "stripe_product_id": null,
    "stripe_price_id": null,
    "created_at": "2026-03-15T22:36:28.925Z",
    "updated_at": "2026-03-17T20:48:26.531Z"
  },
  {
    "id": "4c493507-da3f-4463-809a-f44127d5a970",
    "name": "Pro",
    "slug": "pro",
    "description": "For growing firms",
    "price_monthly": "79",
    "price_annual": "790",
    "max_clients": 100,
    "max_users": 10,
    "max_storage_gb": 25,
    "features": { "stripe_price_id": "price_pro_placeholder" },
    "is_active": true,
    "sort_order": 2,
    "stripe_product_id": null,
    "stripe_price_id": null,
    "created_at": "2026-03-17T15:18:26.548Z",
    "updated_at": "2026-03-17T15:18:26.548Z"
  },
  {
    "id": "ffd23aef-3a68-4959-aeaa-6631768bb8dc",
    "name": "Enterprise",
    "slug": "enterprise",
    "description": "Unlimited for large firms",
    "price_monthly": "199",
    "price_annual": "1990",
    "max_clients": null,
    "max_users": null,
    "max_storage_gb": null,
    "features": { "stripe_price_id": "price_enterprise_placeholder" },
    "is_active": true,
    "sort_order": 3,
    "stripe_product_id": null,
    "stripe_price_id": null,
    "created_at": "2026-03-15T22:36:28.925Z",
    "updated_at": "2026-03-17T20:48:26.549Z"
  },
  {
    "id": "9362e8b2-13e5-4cea-a431-1ad10f783c74",
    "name": "Growth",
    "slug": "growth",
    "description": "For scaling firms",
    "price_monthly": "69",
    "price_annual": "690",
    "max_clients": 75,
    "max_users": 8,
    "max_storage_gb": 20,
    "features": null,
    "is_active": true,
    "sort_order": 3,
    "stripe_product_id": "prod_UANUsNAdWkXIg6",
    "stripe_price_id": "price_1TC2jTKowBPdmLR1JgBiEfja",
    "created_at": "2026-03-17T18:52:47.447Z",
    "updated_at": "2026-03-17T18:52:47.447Z"
  },
  {
    "id": "2f74a717-5ee0-4b44-a3ee-0d09838e5663",
    "name": "Professional",
    "slug": "professional",
    "description": "Updated description only",
    "price_monthly": "99",
    "price_annual": "990",
    "max_clients": 250,
    "max_users": 10,
    "max_storage_gb": 50,
    "features": null,
    "is_active": false,
    "sort_order": 4,
    "stripe_product_id": null,
    "stripe_price_id": null,
    "created_at": "2026-03-15T22:36:28.925Z",
    "updated_at": "2026-03-18T00:22:47.621Z"
  },
  {
    "id": "5417dd14-4b45-4caf-bfde-49657ec91deb",
    "name": "Test Plan",
    "slug": "test-plan",
    "description": "A test plan",
    "price_monthly": "49",
    "price_annual": "490",
    "max_clients": null,
    "max_users": 5,
    "max_storage_gb": null,
    "features": null,
    "is_active": true,
    "sort_order": 10,
    "stripe_product_id": "prod_UAMnvEqjHlfFB0",
    "stripe_price_id": "price_1TC241KowBPdmLR1ss6JBhjZ",
    "created_at": "2026-03-17T18:09:57.747Z",
    "updated_at": "2026-03-17T18:09:57.747Z"
  }
]
```

---

## POST /api/v1/admin/plans

Creates a Stripe product + price, then inserts the plan row. Returns the created plan with both Stripe IDs populated.

Required fields: `name`, `slug`, `price_monthly`, `price_annual`  
Optional: `description`, `max_users`, `max_clients`, `max_storage_gb`, `sort_order`

```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic",
    "slug": "basic-v2",
    "description": "Entry level",
    "price_monthly": 19,
    "price_annual": 190,
    "max_users": 2,
    "sort_order": 0
  }' \
  http://localhost:3000/api/v1/admin/plans
```

**HTTP 201**

```json
{
  "id": "5f150000-4731-4e93-aef9-48e1566e0dce",
  "name": "Basic",
  "slug": "basic-v2",
  "description": "Entry level",
  "price_monthly": "19",
  "price_annual": "190",
  "max_clients": null,
  "max_users": 2,
  "max_storage_gb": null,
  "features": null,
  "is_active": true,
  "sort_order": 0,
  "stripe_product_id": "prod_UANWrb66OSK1su",
  "stripe_price_id": "price_1TC2lQKowBPdmLR109Dn7g8E",
  "created_at": "2026-03-17T18:54:48.887Z",
  "updated_at": "2026-03-17T18:54:48.887Z"
}
```

---

## PATCH /api/v1/admin/plans/:id — metadata only (no price change)

When `price_monthly` and `price_annual` are unchanged, no Stripe API call is made.

```bash
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "description": "Updated desc", "sort_order": 1 }' \
  http://localhost:3000/api/v1/admin/plans/5f150000-4731-4e93-aef9-48e1566e0dce
```

**HTTP 200**

```json
{
  "id": "5f150000-4731-4e93-aef9-48e1566e0dce",
  "name": "Basic",
  "slug": "basic-v2",
  "description": "Updated desc",
  "price_monthly": "19",
  "price_annual": "190",
  "max_clients": null,
  "max_users": 2,
  "max_storage_gb": null,
  "features": null,
  "is_active": true,
  "sort_order": 1,
  "stripe_product_id": "prod_UANWrb66OSK1su",
  "stripe_price_id": "price_1TC2lQKowBPdmLR109Dn7g8E",
  "created_at": "2026-03-17T18:54:48.887Z",
  "updated_at": "2026-03-18T00:24:49.076Z"
}
```

---

## PATCH /api/v1/admin/plans/:id — price change

When `price_monthly` changes, a new Stripe price is created and the old one is archived. `stripe_price_id` is updated to the new price ID.

```bash
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "price_monthly": 25 }' \
  http://localhost:3000/api/v1/admin/plans/5f150000-4731-4e93-aef9-48e1566e0dce
```

**HTTP 200**

```json
{
  "id": "5f150000-4731-4e93-aef9-48e1566e0dce",
  "name": "Basic",
  "slug": "basic-v2",
  "description": "Updated desc",
  "price_monthly": "25",
  "price_annual": "190",
  "max_clients": null,
  "max_users": 2,
  "max_storage_gb": null,
  "features": null,
  "is_active": true,
  "sort_order": 1,
  "stripe_product_id": "prod_UANWrb66OSK1su",
  "stripe_price_id": "price_1TC2luKowBPdmLR18z34aOrT",
  "created_at": "2026-03-17T18:54:48.887Z",
  "updated_at": "2026-03-18T00:25:18.741Z"
}
```

Note: `stripe_price_id` changed from `price_1TC2lQKowBPdmLR109Dn7g8E` to `price_1TC2luKowBPdmLR18z34aOrT` — old price archived in Stripe.

---

## DELETE /api/v1/admin/plans/:id

Soft-deactivates the plan (`is_active → false`) and archives the Stripe price. Does not delete the DB row.

```bash
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/admin/plans/5f150000-4731-4e93-aef9-48e1566e0dce
```

**HTTP 200**

```json
{
  "id": "5f150000-4731-4e93-aef9-48e1566e0dce",
  "name": "Basic",
  "slug": "basic-v2",
  "description": "Updated desc",
  "price_monthly": "25",
  "price_annual": "190",
  "max_clients": null,
  "max_users": 2,
  "max_storage_gb": null,
  "features": null,
  "is_active": false,
  "sort_order": 1,
  "stripe_product_id": "prod_UANWrb66OSK1su",
  "stripe_price_id": "price_1TC2luKowBPdmLR18z34aOrT",
  "created_at": "2026-03-17T18:54:48.887Z",
  "updated_at": "2026-03-18T00:25:19.269Z"
}
```

---

## Error responses

### 401 — No token

```bash
curl -s http://localhost:3000/api/v1/admin/plans
```

**HTTP 401**

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

### 403 — Non-admin role

```bash
curl -s -H "Authorization: Bearer $MEMBER_TOKEN" \
  http://localhost:3000/api/v1/admin/plans
```

**HTTP 403**

```json
{
  "error": "Forbidden",
  "code": "FORBIDDEN"
}
```

---

### 422 — Missing required fields (POST)

```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Bad" }' \
  http://localhost:3000/api/v1/admin/plans
```

**HTTP 422**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "slug", "message": "Required" },
    { "field": "price_monthly", "message": "Required" },
    { "field": "price_annual", "message": "Required" }
  ]
}
```

---

### 422 — Invalid field value (PATCH)

```bash
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "price_monthly": -5 }' \
  http://localhost:3000/api/v1/admin/plans/:id
```

**HTTP 422**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "price_monthly", "message": "Number must be greater than 0" }
  ]
}
```

---

## Route summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/plans` | admin JWT | List all plans (including inactive) |
| POST | `/api/v1/admin/plans` | admin JWT | Create plan + Stripe product/price |
| PATCH | `/api/v1/admin/plans/:id` | admin JWT | Update plan; creates new Stripe price if price changed |
| DELETE | `/api/v1/admin/plans/:id` | admin JWT | Soft-deactivate; archives Stripe price |
