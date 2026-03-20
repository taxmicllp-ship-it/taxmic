# Phase 1 Auth — Audit Report

**Date:** 2026-03-16  
**Auditor:** Kiro  
**Status:** PASS with gaps noted

---

## 1. Folder Structure Audit

### Expected (from `FOLDER-STRUCTURE-FINAL.md`) vs Actual

| Path | Expected | Actual | Status |
|------|----------|--------|--------|
| `apps/api/src/modules/auth/auth.controller.ts` | ✅ | ✅ | PASS |
| `apps/api/src/modules/auth/auth.service.ts` | ✅ | ✅ | PASS |
| `apps/api/src/modules/auth/auth.repository.ts` | ✅ | ✅ | PASS |
| `apps/api/src/modules/auth/auth.routes.ts` | ✅ | ✅ | PASS |
| `apps/api/src/modules/auth/auth.types.ts` | ✅ | ✅ | PASS |
| `apps/api/src/modules/auth/auth.validation.ts` | ✅ | ✅ | PASS |
| `apps/api/src/modules/auth/jwt.strategy.ts` | ✅ | ✅ | PASS |
| `apps/api/src/modules/auth/password.service.ts` | ✅ | ✅ | PASS |
| `apps/api/src/modules/auth/__tests__/` | ✅ | ❌ missing | GAP |
| `apps/api/src/shared/middleware/authenticate.ts` | ✅ | ✅ | PASS |
| `apps/api/src/shared/middleware/validation.ts` | ✅ | ✅ | PASS |
| `apps/api/src/shared/middleware/error-handler.ts` | ✅ | ✅ | PASS |
| `apps/api/src/shared/middleware/tenant-context.ts` | ✅ | ❌ missing | GAP |
| `apps/api/src/shared/middleware/rate-limiter.ts` | ✅ | ❌ missing | GAP |
| `apps/api/src/shared/utils/logger.ts` | ✅ | ❌ missing | GAP |
| `apps/api/src/shared/utils/errors.ts` | ✅ | ❌ missing | GAP |
| `apps/api/src/config/index.ts` | ✅ | ❌ missing | GAP |
| `apps/api/src/app.ts` | ✅ | ✅ | PASS |
| `apps/api/src/server.ts` | ✅ | ✅ | PASS |

**Summary:** 11/19 Phase-1-relevant paths present. Missing items are deferred infrastructure (logger, config, rate-limiter, tenant-context) — acceptable for Phase 1 scope per spec constraints.

---

## 2. Dependency Audit

### `apps/api/package.json`

| Package | Required | Present | Version |
|---------|----------|---------|---------|
| `express` | ✅ | ✅ | ^4.18.2 |
| `jsonwebtoken` | ✅ | ✅ | ^9.0.2 |
| `bcrypt` | ✅ | ✅ | ^5.1.1 |
| `zod` | ✅ | ✅ | ^3.23.0 |
| `dotenv` | ✅ | ✅ | ^16.4.0 |
| `@repo/database` | ✅ | ✅ | * |
| `winston` (logger) | required by AUTH-15 | ❌ missing | GAP |
| `express-rate-limit` | required by NFR-01/02 | ❌ missing | GAP |

**TypeScript diagnostics:** 0 errors across all 9 auth source files.

---

## 3. Database Usage Audit

### Prisma Field Names

All field accesses verified against schema:

| Field Used | Prisma Model | Correct |
|-----------|-------------|---------|
| `password_hash` | `users` | ✅ |
| `first_name` / `last_name` | `users` | ✅ |
| `firm_id` | `users` | ✅ |
| `last_login_at` | `users` | ✅ |
| `deleted_at` | `users`, `firms` | ✅ |
| `user_roles` relation | `users` | ✅ |
| `firm` relation | `users` | ✅ |
| `role` relation | `user_roles` | ✅ |

### Transaction Atomicity

`createFirmWithOwner` uses `prisma.$transaction` and creates all 5 records atomically:
- `firms` ✅
- `users` ✅
- `user_roles` ✅
- `firm_settings` ✅
- `user_settings` ✅

---

## 4. Multi-Tenancy Verification

`findUserByEmailAndFirmSlug` joins `users → firms` on `firms.slug` with `deleted_at` guards on both tables. A user from Firm A cannot authenticate against Firm B even with identical credentials.

**Cross-tenant test result:** `POST /auth/login` with correct email+password but wrong `firmSlug` → `401 INVALID_CREDENTIALS` ✅

JWT payload contains `firmId` — all downstream requests carry tenant context.

---

## 5. Auth Logic Audit

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| bcrypt cost factor | 12 | `$2b$12$` prefix confirmed in DB | ✅ PASS |
| JWT expiry | 7d | `expiresIn: '7d'` | ✅ PASS |
| JWT payload fields | userId, firmId, email, role | All 4 present | ✅ PASS |
| Reset token expiry | 1h | `expiresIn: '1h'` | ✅ PASS |
| Reset token type claim | `password_reset` | Validated in `verifyResetToken` | ✅ PASS |
| No user enumeration | Same 401 for all failures | Confirmed — wrong slug, wrong email, wrong password all return `INVALID_CREDENTIALS` | ✅ PASS |
| `last_login_at` updated | On successful login | `updateLastLogin` called in service | ✅ PASS |
| `forgotPassword` always 200 | Even for unknown email | Returns 200 regardless | ✅ PASS |
| `resetToken` dev-only | `NODE_ENV !== 'production'` | Guarded correctly | ✅ PASS |

---

## 6. curl Smoke Test Results

| Test | Expected | Result |
|------|----------|--------|
| `POST /auth/register` (new firm) | 201 + JWT | ✅ 201 |
| `POST /auth/register` (duplicate slug) | 409 FIRM_SLUG_EXISTS | ✅ 409 |
| `POST /auth/login` (valid) | 200 + JWT | ✅ 200 |
| `POST /auth/login` (wrong password) | 401 INVALID_CREDENTIALS | ✅ 401 |
| `POST /auth/login` (wrong firmSlug) | 401 INVALID_CREDENTIALS | ✅ 401 |
| `POST /auth/forgot-password` | 200 + resetToken (dev) | ✅ 200 |
| `POST /auth/reset-password` (valid token) | 200 | ✅ 200 |
| `POST /auth/login` (new password after reset) | 200 + JWT | ✅ 200 |
| `POST /auth/logout` (with JWT) | 200 | ✅ 200 |
| `POST /auth/logout` (no JWT) | 401 UNAUTHORIZED | ✅ 401 |
| `GET /api/v1/health` | 200 | ✅ 200 |

**All 11 smoke tests pass.**

---

## 7. Token Authorization Test

`POST /auth/logout` without `Authorization` header → `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}` ✅

`authenticate` middleware correctly rejects missing and malformed tokens.

---

## 8. Database State Verification

```
firms:         2 rows (acme-accounting, audit-test-firm)
users:         2 rows — both with firm_id set, last_login_at populated
user_roles:    2 rows — both assigned 'owner' role
firm_settings: 2 rows — one per firm
user_settings: 2 rows — one per user
password_hash: prefix $2b$12$ — bcrypt cost 12 confirmed
```

All acceptance criteria for DB state pass.

---

## 9. Error Handling Audit

| Scenario | HTTP | Code | Verified |
|----------|------|------|---------|
| Firm slug taken | 409 | `FIRM_SLUG_EXISTS` | ✅ |
| Invalid credentials | 401 | `INVALID_CREDENTIALS` | ✅ |
| Token expired/invalid | 400 | `TOKEN_EXPIRED` / `TOKEN_INVALID` | ✅ (code path) |
| Validation failure | 422 | `VALIDATION_ERROR` | ✅ (code path) |
| Unauthenticated | 401 | `UNAUTHORIZED` | ✅ |
| Unhandled errors | 500 | `INTERNAL_ERROR` | ✅ (error-handler fallback) |

All errors follow `{ error: string, code: string }` format consistently.

---

## 10. Security Check

| Check | Status | Notes |
|-------|--------|-------|
| No passwords in logs | ✅ | Only userId/email/firmId logged |
| No tokens in logs | ✅ | Reset token not logged |
| bcrypt constant-time compare | ✅ | `bcrypt.compare` used |
| JWT secret from env | ✅ | `process.env.JWT_SECRET` |
| No user enumeration | ✅ | Same error for all login failures |
| Soft-delete guards | ✅ | `deleted_at: null` on all queries |
| Rate limiting | ❌ MISSING | NFR-01/02 not implemented |
| `any` types in auth module | ⚠️ | `(req as any).user` in `authenticate.ts` — needs `express.d.ts` type augmentation |

---

## 11. Code Quality / Layering Check

| Rule | Status |
|------|--------|
| Controllers have no business logic | ✅ — thin try/catch wrappers only |
| Services have no HTTP concerns | ✅ |
| Repositories have no business logic | ✅ |
| No direct `prisma` calls from service | ⚠️ — `auth.service.ts` calls `prisma.users.findFirst` directly in `forgotPassword` instead of going through repository |
| No circular imports | ✅ |
| Consistent error type (`AppError`) | ✅ |
| Zod validation on all endpoints | ✅ |

---

## 12. Dead Code Check

| File | Dead Code |
|------|-----------|
| `auth.repository.ts` | `findFirmByEmail` — defined but never called in service |
| `auth.controller.ts` | None |
| `auth.service.ts` | None |
| `jwt.strategy.ts` | None |

---

## 13. Final Summary

### PASS ✅
- All 5 auth endpoints functional and returning correct status codes
- Multi-tenancy enforced at query level
- bcrypt cost 12, JWT 7d/1h expiry, correct payload
- Atomic firm+user creation with all 5 related records
- Structured error responses throughout
- Zero TypeScript errors

### GAPS (deferred to later phases)
| Gap | Requirement | Priority |
|-----|-------------|----------|
| Rate limiting missing | NFR-01, NFR-02 | HIGH — add `express-rate-limit` before production |
| Winston logger missing | AUTH-15 | MEDIUM — `console.log` used instead; replace before production |
| `tenant-context` middleware missing | AUTH-12 | MEDIUM — `req.user` set in `authenticate` but no dedicated middleware |
| `(req as any).user` in authenticate.ts | NFR-06 | LOW — add `apps/api/src/shared/types/express.d.ts` |
| `prisma` called directly in `forgotPassword` | layering | LOW — move to `authRepository.findUserByEmail` |
| `findFirmByEmail` unused | dead code | LOW — remove or use |
| `__tests__/` directory missing | spec | MEDIUM — unit tests not written |
| `apps/api/src/config/index.ts` missing | spec | MEDIUM — JWT secret inline fallback is a risk |

### Acceptance Criteria Status
- [x] `POST /auth/register` returns 201 with JWT
- [x] `POST /auth/register` returns 409 on duplicate slug
- [x] `POST /auth/login` returns 200 with JWT
- [x] `POST /auth/login` returns 401 on invalid credentials
- [x] Cross-tenant login blocked
- [x] `POST /auth/forgot-password` always returns 200
- [x] `POST /auth/reset-password` returns 200 on valid token
- [x] `POST /auth/logout` returns 200
- [x] Protected route without JWT returns 401
- [x] `firm_settings` and `user_settings` created on registration
- [x] `user_roles` row with owner role created on registration
- [ ] Rate limiting (NFR-01/02) — not implemented
- [ ] Winston structured logging (AUTH-15) — using console.log
