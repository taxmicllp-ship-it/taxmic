# Phase 1 — Auth Module Tasks

**Spec:** phase-1-auth  
**Status:** tasks  
**Estimated effort:** 3–4 days (backend) + 1–2 days (frontend)

---

## Backend Tasks

---

### Task 1 — Run `prisma generate`

**Description:** Sync the Prisma client with the existing schema so all models are available for import.

**Command:**
```bash
cd packages/database && npx prisma generate
```

**Acceptance:**
- `@prisma/client` types reflect `firms`, `users`, `roles`, `user_roles`, `firm_settings`, `user_settings`
- No errors on import in `apps/api`

**Dependencies:** None  
**Effort:** 5 min

---

### Task 2 — Create `auth.types.ts`

**File:** `apps/api/src/modules/auth/auth.types.ts`

**Description:** Define all TypeScript interfaces and DTOs used across the auth module.

**Types to define:**
- `RegisterDto`
- `LoginDto`
- `ForgotPasswordDto`
- `ResetPasswordDto`
- `AuthResponse`
- `JwtPayload`
- `ResetTokenPayload`
- `CreateFirmWithOwnerData`

**References:** `design.md` Section 9  
**Dependencies:** Task 1  
**Effort:** 30 min

---

### Task 3 — Create `auth.validation.ts`

**File:** `apps/api/src/modules/auth/auth.validation.ts`

**Description:** Zod validation schemas for all 4 request bodies.

**Schemas to define:**
- `RegisterSchema`
- `LoginSchema` — includes `firmSlug` field for tenant-scoped login
- `ForgotPasswordSchema`
- `ResetPasswordSchema`

**LoginSchema:**
```typescript
const LoginSchema = z.object({
  firmSlug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  password: z.string().min(1),
});
```

**References:** `design.md` Section 7  
**Dependencies:** Task 2  
**Effort:** 30 min

---

### Task 4 — Create `password.service.ts`

**File:** `apps/api/src/modules/auth/password.service.ts`

**Description:** Bcrypt wrapper service.

**Methods:**
- `hash(plain: string): Promise<string>` — bcrypt cost factor 12
- `compare(plain: string, hash: string): Promise<boolean>`

**Rules:**
- No logging of plain passwords
- Export as singleton instance

**References:** `design.md` Section 5  
**Dependencies:** Task 2  
**Effort:** 20 min

---

### Task 5 — Create `jwt.strategy.ts`

**File:** `apps/api/src/modules/auth/jwt.strategy.ts`

**Description:** JWT sign/verify wrapper.

**Methods:**
- `sign(payload: JwtPayload): string` — 7d expiry, uses `config.jwtSecret`
- `verify(token: string): JwtPayload` — throws `AppError` on invalid/expired
- `signResetToken(userId: string): string` — 1h expiry, `type: 'password_reset'`
- `verifyResetToken(token: string): ResetTokenPayload` — throws on invalid/expired

**Rules:**
- Secret from `config.jwtSecret` (already validated in `apps/api/src/config/index.ts`)
- Use `jsonwebtoken` package (already installed)

**References:** `design.md` Section 5  
**Dependencies:** Task 2  
**Effort:** 30 min

---

### Task 6 — Create `auth.repository.ts`

**File:** `apps/api/src/modules/auth/auth.repository.ts`

**Description:** All database access for the auth module. Extends `BaseRepository`.

**Methods:**
- `findUserByEmailAndFirmSlug(email: string, firmSlug: string)` — tenant-scoped login lookup. Joins `users → firms` on `firms.slug`. Returns user with `firm` and `user_roles` (including `role`) included. Returns `null` if no match. Soft-delete safe.

  Prisma query:
  ```typescript
  prisma.users.findFirst({
    where: {
      email,
      deleted_at: null,
      firm: { slug: firmSlug, deleted_at: null }
    },
    include: { firm: true, user_roles: { include: { role: true } } }
  })
  ```

- `findFirmBySlug(slug: string): Promise<firms | null>`
- `findFirmByEmail(email: string): Promise<firms | null>`
- `findOwnerRole(): Promise<roles | null>`
- `createFirmWithOwner(data: CreateFirmWithOwnerData): Promise<{ firm: firms; user: users }>`
  - Must use `prisma.$transaction`
  - Creates: `firms`, `users`, `user_roles`, `firm_settings`, `user_settings`
- `updatePassword(userId: string, passwordHash: string): Promise<void>`
- `updateLastLogin(userId: string): Promise<void>`

**Rules:**
- No business logic
- No password hashing
- Import `prisma` from `@repo/database`

**References:** `design.md` Section 3  
**Dependencies:** Task 1, Task 2  
**Effort:** 1.5 hours

---

### Task 7 — Create `auth.service.ts`

**File:** `apps/api/src/modules/auth/auth.service.ts`

**Description:** Business logic layer. Orchestrates repository + password + JWT services.

**Methods:**
- `register(dto: RegisterDto): Promise<AuthResponse>`
- `login(dto: LoginDto): Promise<AuthResponse>`
- `forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; resetToken?: string }>`
- `resetPassword(dto: ResetPasswordDto): Promise<void>`

**Audit log events to emit via `logger`:**

| Event | When |
|-------|------|
| `AUTH_REGISTER` | Successful registration |
| `AUTH_LOGIN_SUCCESS` | Successful login |
| `AUTH_LOGIN_FAILURE` | Failed login attempt (wrong slug, wrong email, or wrong password — all treated identically to prevent enumeration) |
| `AUTH_PASSWORD_RESET` | Password reset token generated or password updated |

**Rules:**
- Log auth events via `logger` (no sensitive data — no passwords, no tokens in logs)
- Throw `AppError` with correct HTTP codes on failures
- `forgotPassword` must never throw on unknown email — always return 200-compatible response
- `resetToken` included in `forgotPassword` response only when `config.nodeEnv !== 'production'`

**References:** `design.md` Section 4  
**Dependencies:** Task 4, Task 5, Task 6  
**Effort:** 2 hours

---

### Task 8 — Create `auth.controller.ts`

**File:** `apps/api/src/modules/auth/auth.controller.ts`

**Description:** HTTP request handlers. Thin layer — no business logic.

**Methods:**
- `register(req, res)`
- `login(req, res)`
- `forgotPassword(req, res)`
- `resetPassword(req, res)`
- `logout(req, res)`

**Rules:**
- All methods are `async` with try/catch delegating to `next(error)`
- Use `req.body` (already validated by middleware)
- Return correct HTTP status codes per `design.md` Section 2

**References:** `design.md` Section 6  
**Dependencies:** Task 7  
**Effort:** 45 min

---

### Task 9 — Create `auth.routes.ts`

**File:** `apps/api/src/modules/auth/auth.routes.ts`

**Description:** Express router wiring all auth endpoints.

**Routes:**
```
POST /register       → validate(RegisterSchema) → authController.register
POST /login          → validate(LoginSchema)    → authController.login
POST /forgot-password → validate(ForgotPasswordSchema) → authController.forgotPassword
POST /reset-password  → validate(ResetPasswordSchema)  → authController.resetPassword
POST /logout         → authenticate            → authController.logout
```

**Rules:**
- Import `validate` from `shared/middleware/validation.ts`
- Import `authenticate` from `shared/middleware/authenticate.ts`
- No rate limiting in routes — already applied globally in `app.ts`

**References:** `design.md` Section 8  
**Dependencies:** Task 8  
**Effort:** 20 min

---

### Task 10 — Wire auth router into `app.ts`

**File:** `apps/api/src/app.ts`

**Description:** Mount the auth router at `/api/v1/auth`.

**Change:**
```typescript
import authRouter from './modules/auth/auth.routes';
app.use('/api/v1/auth', authRouter);
```

**Rules:**
- Auth routes must be mounted BEFORE the global `authenticate` middleware
- Verify health check still works after change

**Dependencies:** Task 9  
**Effort:** 10 min

---

### Task 11 — Verify with curl

**Description:** Manual smoke test of all 5 endpoints.

**Tests:**
1. `POST /api/v1/auth/register` — expect `201` + JWT
2. `POST /api/v1/auth/login` — expect `200` + JWT
3. `POST /api/v1/auth/login` with wrong password — expect `401`
4. `POST /api/v1/auth/forgot-password` — expect `200` + resetToken
5. `POST /api/v1/auth/reset-password` with valid token — expect `200`
6. `POST /api/v1/auth/logout` with JWT — expect `200`
7. `GET /api/v1/health` without JWT — expect `200` (still public)
8. Any protected route without JWT — expect `401`

**Dependencies:** Task 10  
**Effort:** 30 min

---

## Frontend Tasks

---

### Task 12 — Scaffold `apps/web` (Vite + React Router)

**Description:** Create the `apps/web` package with Vite, React 18, React Router v6, Tailwind CSS, and React Query. Copy Tailwind config and CSS variables from `ui_theme_ref/`.

**Files to create:**
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/tailwind.config.js`
- `apps/web/index.html`
- `apps/web/src/main.tsx` — React Router `<BrowserRouter>` root
- `apps/web/src/App.tsx` — route definitions (`/login`, `/register`, `/forgot-password`, `/dashboard`)
- `apps/web/src/styles/globals.css`
- `apps/web/src/lib/api.ts` — axios instance with base URL + JWT interceptor
- `apps/web/src/lib/auth.ts` — localStorage token helpers
- `apps/web/src/lib/constants.ts`
- `apps/web/src/pages/auth/` — directory (pages created in Tasks 15–17)

**Rules:**
- Tailwind config must match `ui_theme_ref/tailwind.config.js` (brand colors, fonts)
- Do NOT copy pages from `ui_theme_ref/`

**Dependencies:** None  
**Effort:** 1 hour

---

### Task 13 — Create auth API client

**File:** `apps/web/src/features/auth/api/auth-api.ts`

**Description:** Typed API functions for all auth endpoints.

**Functions:**
- `register(data: RegisterDto): Promise<AuthResponse>`
- `login(data: LoginDto): Promise<AuthResponse>`
- `forgotPassword(data: { email: string }): Promise<{ message: string; resetToken?: string }>`
- `resetPassword(data: { token: string; password: string }): Promise<void>`
- `logout(): Promise<void>`

**Dependencies:** Task 12  
**Effort:** 30 min

---

### Task 14 — Create auth hooks

**Files:**
- `apps/web/src/features/auth/hooks/useLogin.ts`
- `apps/web/src/features/auth/hooks/useRegister.ts`
- `apps/web/src/features/auth/hooks/useAuth.ts`

**Description:** React Query mutations wrapping the auth API.

**Rules:**
- `useLogin` — `useMutation`, on success store token + redirect to `/dashboard`
- `useRegister` — `useMutation`, on success store token + redirect to `/dashboard`
- `useAuth` — reads token from localStorage, exposes `user`, `isAuthenticated`, `logout`

**Dependencies:** Task 13  
**Effort:** 45 min

---

### Task 15 — Create Login page

**File:** `apps/web/src/pages/auth/login.tsx`

**Description:** Login page using theme components.

**Components used from `ui_theme_ref/`:**
- `AuthPageLayout` — `src/pages/AuthPages/AuthPageLayout.tsx`
- `SignInForm` — `src/components/auth/SignInForm.tsx` (adapted — wire to `useLogin`)
- `Input` — `src/components/form/input/InputField.tsx`
- `Label` — `src/components/form/Label.tsx`
- `Button` — `src/components/ui/button/Button.tsx`

**Rules:**
- Do NOT copy `SignInForm` verbatim — adapt it to call `useLogin`
- Add `firmSlug` field above the email field (text input, same style as email)
- Remove Google/X OAuth buttons (not in scope)
- Show error `Alert` on failed login
- Route registered in React Router as `/login`

**Dependencies:** Task 14  
**Effort:** 1 hour

---

### Task 16 — Create Register page

**File:** `apps/web/src/pages/auth/register.tsx`

**Description:** Registration page using theme components.

**Components used from `ui_theme_ref/`:**
- `AuthPageLayout`
- `SignUpForm` — `src/components/auth/SignUpForm.tsx` (adapted — wire to `useRegister`)
- `Input`, `Label`, `Button`

**Rules:**
- Adapt `SignUpForm` to include firm name, firm slug, firm email fields
- Show error `Alert` on failure
- Route registered in React Router as `/register`

**Dependencies:** Task 14  
**Effort:** 1 hour

---

### Task 17 — Create Forgot Password page

**File:** `apps/web/src/pages/auth/forgot-password.tsx`

**Description:** Forgot password page composed from existing theme primitives.

**Components used from `ui_theme_ref/`:**
- `AuthPageLayout`
- `Input` — email field
- `Label`
- `Button`
- `Alert` — success/error message

> No `ForgotPasswordForm` component exists in the theme. This page is composed directly from primitives — no missing component blocker.

**Rules:**
- Route registered in React Router as `/forgot-password`

**Dependencies:** Task 14  
**Effort:** 45 min

---

## Task Summary

| # | Task | Layer | Effort |
|---|------|-------|--------|
| 1 | prisma generate | infra | 5 min |
| 2 | auth.types.ts | backend | 30 min |
| 3 | auth.validation.ts | backend | 30 min |
| 4 | password.service.ts | backend | 20 min |
| 5 | jwt.strategy.ts | backend | 30 min |
| 6 | auth.repository.ts | backend | 1.5 hr |
| 7 | auth.service.ts | backend | 2 hr |
| 8 | auth.controller.ts | backend | 45 min |
| 9 | auth.routes.ts | backend | 20 min |
| 10 | Wire into app.ts | backend | 10 min |
| 11 | Smoke test with curl | backend | 30 min |
| 12 | Scaffold apps/web | frontend | 1 hr |
| 13 | auth-api.ts | frontend | 30 min |
| 14 | Auth hooks | frontend | 45 min |
| 15 | Login page | frontend | 1 hr |
| 16 | Register page | frontend | 1 hr |
| 17 | Forgot password page | frontend | 45 min |

**Total estimated:** ~12 hours
