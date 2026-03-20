# Phase 1 — Auth Module Requirements

**Spec:** phase-1-auth  
**Status:** requirements  
**Module:** `apps/api/src/modules/auth/`  
**Frontend:** `apps/web/src/features/auth/`  
**References:**
- `docs/04-development/PHASE-WISE-EXECUTION-PLAN.md` — Phase 1 section
- `docs/02-architecture/FOLDER-STRUCTURE-FINAL.md`
- `packages/database/prisma/auth.prisma`

---

## 1. Business Goals

- Enable accounting firms to self-register on the platform
- Allow firm users to authenticate securely
- Protect all non-public API routes with JWT authentication
- Provide password recovery without requiring a new database table
- Establish the multi-tenant foundation (`firm_id`) that all future modules depend on

---

## 2. Scope Constraints

### In Scope
- Firm + user registration (single flow)
- Email + password login
- JWT access token issuance and validation
- Password reset via signed token (no new DB table)
- Logout (client-side token invalidation)
- JWT middleware applied to all protected routes
- Tenant context middleware (`firm_id` set per request)

### Out of Scope (deferred)
- OAuth / Google / SSO login
- Two-factor authentication (2FA)
- Magic link login
- Refresh token rotation
- Session table / Redis session store
- Email delivery (wired up in Phase 6 — Notifications)

---

## 3. User Stories

### Registration
- As a firm owner, I can register my firm with a name, slug, and email so that I get a tenant account
- As a firm owner, I receive a JWT on successful registration so that I can immediately access the dashboard
- As a system, I reject duplicate firm slugs and duplicate user emails within a firm

### Login
- As a user, I can log in with my `firmSlug`, email, and password so that I receive a JWT scoped to my firm
- As a system, I reject invalid credentials with a generic error (no user enumeration — same error for wrong slug, wrong email, or wrong password)
- As a system, I update `last_login_at` on successful login
- As a system, I prevent a user from Firm A authenticating against Firm B even if both firms have the same email address

### Password Reset
- As a user, I can request a password reset link for my email
- As a user, I can submit a new password using a valid reset token
- As a system, I reject expired or already-used reset tokens
- As a system, I do not reveal whether an email exists (always return 200 on forgot-password)

### Logout
- As a user, I can log out so that my token is no longer accepted
- As a system, logout is stateless — the client discards the token (no server-side session)

### Protected Routes
- As a system, all routes under `/api/v1/` (except auth endpoints) require a valid JWT
- As a system, the `firm_id` from the JWT is set as tenant context on every authenticated request

---

## 4. Functional Requirements

| ID | Requirement |
|----|-------------|
| AUTH-01 | `POST /auth/register` creates a `firms` record and a `users` record in a single transaction |
| AUTH-02 | Registration assigns the `owner` role to the first user via `user_roles` |
| AUTH-03 | Passwords are hashed with bcrypt (cost factor 12) before storage |
| AUTH-04 | `POST /auth/login` validates credentials scoped to the specified `firmSlug` and returns a signed JWT |
| AUTH-05 | JWT payload contains `userId`, `firmId`, `email`, `role` |
| AUTH-06 | JWT expires in 7 days (`expiresIn: '7d'`) |
| AUTH-07 | `POST /auth/forgot-password` generates a signed reset token (JWT, 1h expiry) |
| AUTH-08 | Reset token is returned in the API response (email delivery is Phase 6) |
| AUTH-09 | `POST /auth/reset-password` validates the reset token and updates `password_hash` |
| AUTH-10 | `POST /auth/logout` returns 200 — token invalidation is client-side |
| AUTH-11 | `authenticate` middleware validates JWT on every protected route |
| AUTH-12 | `tenant-context` middleware sets `req.user.firmId` for downstream use |
| AUTH-13 | All endpoints validate request body with Zod schemas |
| AUTH-14 | All errors return structured JSON: `{ error: string, code: string }` |
| AUTH-15 | Auth events are logged via Winston logger with these exact event names: `AUTH_REGISTER`, `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILURE`, `AUTH_PASSWORD_RESET` |
| AUTH-16 | `resetToken` is included in `forgot-password` response only when `NODE_ENV !== 'production'` |

---

## 5. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Login endpoint is rate-limited (max 10 requests / 15 min per IP) |
| NFR-02 | Registration endpoint is rate-limited (max 5 requests / 15 min per IP) |
| NFR-03 | Password comparison uses `bcrypt.compare` (constant-time, no timing attacks) |
| NFR-04 | JWT secret loaded from `config.jwtSecret` (Zod-validated env var) |
| NFR-05 | No sensitive data (password_hash, JWT secret) appears in logs |
| NFR-06 | All TypeScript — no `any` types in auth module |

---

## 6. Database Tables Used

> No new tables. No migrations. Use existing schema only.

| Table | Usage |
|-------|-------|
| `firms` | Created on registration; `firm_id` is the tenant key |
| `users` | Created on registration; stores `password_hash` |
| `roles` | Queried to find the `owner` role for assignment |
| `user_roles` | Row inserted to assign `owner` role to registering user |
| `firm_settings` | Created with defaults on registration |
| `user_settings` | Created with defaults on registration |

---

## 7. Acceptance Criteria

- [ ] `POST /auth/register` returns `201` with JWT and user object
- [ ] `POST /auth/register` returns `409` if firm slug already exists
- [ ] `POST /auth/register` returns `409` if email already exists in firm
- [ ] `POST /auth/login` returns `200` with JWT on valid `firmSlug` + email + password
- [ ] `POST /auth/login` returns `401` on invalid credentials (wrong slug, wrong email, or wrong password — same error for all)
- [ ] `POST /auth/login` returns `401` when correct email+password are used but wrong `firmSlug` (cross-tenant attempt blocked)
- [ ] `POST /auth/forgot-password` always returns `200` regardless of email existence
- [ ] `POST /auth/reset-password` returns `200` on valid token + new password
- [ ] `POST /auth/reset-password` returns `400` on expired or invalid token
- [ ] `POST /auth/logout` returns `200`
- [ ] Any protected route without JWT returns `401`
- [ ] Any protected route with expired JWT returns `401`
- [ ] JWT contains correct `userId`, `firmId`, `email` claims
- [ ] `firm_settings` and `user_settings` rows created on registration
- [ ] `user_roles` row created with `owner` role on registration
