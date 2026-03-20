# Phase 1 Auth — Hardening Report

**Date:** 2026-03-16  
**Based on:** PHASE-1-AUDIT-REPORT.md  
**Status:** ALL GAPS RESOLVED

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/api/src/shared/utils/logger.ts` | Winston structured JSON logger |
| `apps/api/src/shared/middleware/rate-limiter.ts` | Per-route rate limiters (login, register, forgot-password, reset-password) |
| `apps/api/src/shared/middleware/tenant-context.ts` | Attaches `req.tenantId` from JWT payload |
| `apps/api/src/shared/types/express.d.ts` | Express Request type augmentation (`user`, `tenantId`) |

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/modules/auth/auth.service.ts` | Replaced `console.log` with `logger`; removed direct `prisma` import; `forgotPassword` now calls `authRepository.findUserByEmail` |
| `apps/api/src/modules/auth/auth.repository.ts` | Added `findUserByEmail` method |
| `apps/api/src/modules/auth/auth.routes.ts` | Added rate limiters per route; added `tenantContext` to logout route |
| `apps/api/src/shared/middleware/authenticate.ts` | Removed `(req as any).user`; uses typed `req.user` and sets `req.tenantId` |

## Dependencies Added

| Package | Version | Reason |
|---------|---------|--------|
| `express-rate-limit` | ^7.x | NFR-01/02 — rate limiting |
| `winston` | ^3.x | AUTH-15 — structured logging |

---

## Fix Verification

### Fix 1 — Rate Limiting
- `POST /auth/login` — 10 req / 15 min per IP
- `POST /auth/register` — 5 req / 15 min per IP
- `POST /auth/forgot-password` — 5 req / 15 min per IP
- `POST /auth/reset-password` — 5 req / 15 min per IP
- Applied per-route, not globally — health check and other routes unaffected

### Fix 2 — Winston Logger
Confirmed JSON output in server logs:
```json
{"level":"info","message":{"event":"AUTH_LOGIN_SUCCESS","userId":"...","firmId":"...","email":"..."},"timestamp":"2026-03-16T15:37:14.261Z"}
```
Events emitted: `AUTH_REGISTER`, `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILURE`, `AUTH_PASSWORD_RESET`  
No passwords or tokens in any log line.

### Fix 3 — Tenant Context Middleware
`tenant-context.ts` reads `req.user.firmId` (set by `authenticate`) and attaches it as `req.tenantId`.  
Applied after `authenticate` on the logout route. All future protected routes can use `req.tenantId` directly.

### Fix 4 — Prisma Call Removed from Service
`auth.service.ts` no longer imports `prisma` directly.  
`forgotPassword` now calls `authRepository.findUserByEmail(dto.email)`.  
Architecture rule enforced: Controller → Service → Repository → Prisma.

### Fix 5 — Express Request Type Safety
`apps/api/src/shared/types/express.d.ts` augments `Express.Request`:
```typescript
user?: JwtPayload
tenantId?: string
```
`(req as any).user` removed from `authenticate.ts`. Zero TypeScript errors across all auth files.

---

## Endpoint Verification (post-hardening)

| Endpoint | Expected | Result |
|----------|----------|--------|
| `POST /auth/register` (new firm) | 201 + JWT | ✅ 201 |
| `POST /auth/register` (duplicate slug) | 409 FIRM_SLUG_EXISTS | ✅ 409 |
| `POST /auth/login` (valid) | 200 + JWT | ✅ 200 |
| `POST /auth/forgot-password` | 200 + resetToken | ✅ 200 |
| `POST /auth/reset-password` (valid token) | 200 | ✅ 200 |
| `POST /auth/login` (new password after reset) | 200 + JWT | ✅ 200 |
| `POST /auth/logout` (with JWT) | 200 | ✅ 200 |
| `POST /auth/logout` (no JWT) | 401 UNAUTHORIZED | ✅ 401 |
| `GET /api/v1/health` | 200 | ✅ 200 |

All 9 endpoints return identical responses to pre-hardening. No regressions.

---

## Security Improvements

| Before | After |
|--------|-------|
| No rate limiting — brute force possible | Rate limited per route per IP |
| `console.log` — unstructured, no levels | Winston JSON — level, timestamp, metadata |
| `(req as any).user` — type unsafe | Typed `req.user: JwtPayload` via declaration merging |
| `prisma` called in service layer | All DB access through repository only |
| No `tenantId` on request | `req.tenantId` available to all downstream handlers |

---

## Remaining Items (out of Phase 1 scope)

| Item | Phase |
|------|-------|
| `apps/api/src/config/index.ts` — Zod-validated env config | Phase 2 |
| `__tests__/` — unit tests for auth module | Phase 2 |
| `findFirmByEmail` in repository — unused, remove when needed | Cleanup |
