# Phase 1 — Auth Module Design

**Spec:** phase-1-auth  
**Status:** design  
**References:**
- `docs/02-architecture/FOLDER-STRUCTURE-FINAL.md` — exact file names
- `packages/database/prisma/auth.prisma` — Prisma models
- `apps/api/src/shared/middleware/authenticate.ts` — existing middleware
- `apps/api/src/shared/middleware/tenant-context.ts` — existing middleware
- `apps/api/src/config/index.ts` — env config

---

## 1. Module Location

```
apps/api/src/modules/auth/
├── auth.controller.ts
├── auth.service.ts
├── auth.repository.ts
├── auth.routes.ts
├── auth.types.ts
├── auth.validation.ts
├── jwt.strategy.ts
├── password.service.ts
└── __tests__/
    ├── auth.service.test.ts
    └── auth.controller.test.ts
```

Frontend:
```
apps/web/src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── ForgotPasswordForm.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useLogin.ts
│   └── useRegister.ts
├── api/
│   └── auth-api.ts
└── types.ts
```

Auth pages (Vite + React Router — no App Router):
```
apps/web/src/pages/auth/
├── login.tsx
├── register.tsx
└── forgot-password.tsx
```

---

## 2. API Design

### POST /api/v1/auth/register

**Request:**
```json
{
  "firmName": "Acme Accounting",
  "firmSlug": "acme-accounting",
  "firmEmail": "contact@acme.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@acme.com",
  "password": "SecurePass123!"
}
```

**Response 201:**
```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "jane@acme.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "firmId": "uuid",
    "firmName": "Acme Accounting"
  }
}
```

**Errors:**
- `409` — firm slug already taken
- `409` — email already registered
- `422` — validation failure

---

### POST /api/v1/auth/login

**Request:**
```json
{
  "firmSlug": "acme-accounting",
  "email": "jane@acme.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "jane@acme.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "firmId": "uuid"
  }
}
```

**Errors:**
- `401` — invalid credentials (generic message, no user enumeration)
- `422` — validation failure

---

### POST /api/v1/auth/forgot-password

**Request:**
```json
{ "email": "jane@acme.com" }
```

**Response 200** (always, regardless of email existence):
```json
{
  "message": "If that email exists, a reset link has been sent.",
  "resetToken": "<signed-jwt>"
}
```

> ⚠️ `resetToken` is returned in the response body **in development mode only** (`NODE_ENV !== 'production'`). In production this field is omitted — Phase 6 (Notifications) will deliver it via email. The service must check `config.nodeEnv` before including it in the response.

---

### POST /api/v1/auth/reset-password

**Request:**
```json
{
  "token": "<reset-jwt>",
  "password": "NewSecurePass456!"
}
```

**Response 200:**
```json
{ "message": "Password updated successfully." }
```

**Errors:**
- `400` — token expired or invalid
- `422` — validation failure

---

### POST /api/v1/auth/logout

**Request:** Bearer token in `Authorization` header  
**Response 200:**
```json
{ "message": "Logged out successfully." }
```

> Stateless logout — client discards the token. No server-side session invalidation in Phase 1.

---

## 3. Repository Layer — `auth.repository.ts`

Handles all database access. No business logic.

```typescript
class AuthRepository extends BaseRepository {
  // Tenant-scoped login lookup — joins users → firms on slug to prevent cross-tenant auth
  findUserByEmailAndFirmSlug(email: string, firmSlug: string): Promise<(users & { firm: firms; user_roles: user_roles[] }) | null>
  findFirmBySlug(slug: string): Promise<firms | null>
  findFirmByEmail(email: string): Promise<firms | null>
  findOwnerRole(): Promise<roles | null>
  createFirmWithOwner(data: CreateFirmWithOwnerData): Promise<{ firm: firms; user: users }>
  updatePassword(userId: string, passwordHash: string): Promise<void>
  updateLastLogin(userId: string): Promise<void>
}
```

`findUserByEmailAndFirmSlug` query logic:
```sql
SELECT u.*, f.*, ur.*
FROM users u
JOIN firms f ON f.id = u.firm_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = ?
  AND f.slug = ?
  AND u.deleted_at IS NULL
  AND f.deleted_at IS NULL
```

Prisma equivalent:
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

> This is the only method that changed from the original design. All other repository methods are unchanged. `findUserByEmail(email)` is removed — replaced entirely by the tenant-scoped version.

- `createFirmWithOwner` runs inside a `prisma.$transaction` — creates `firms`, `users`, `user_roles`, `firm_settings`, `user_settings` atomically
- All methods use `prisma` from `@repo/database`
- No raw SQL

---

## 4. Service Layer — `auth.service.ts`

Handles business logic. Calls repository and password/JWT services.

```typescript
class AuthService {
  register(dto: RegisterDto): Promise<AuthResponse>
  login(dto: LoginDto): Promise<AuthResponse>
  forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResponse>
  resetPassword(dto: ResetPasswordDto): Promise<void>
}
```

**register flow:**
1. Check firm slug uniqueness via `authRepository.findFirmBySlug`
2. Hash password via `passwordService.hash`
3. Call `authRepository.createFirmWithOwner` (transaction)
4. Sign JWT via `jwtStrategy.sign`
5. Log `AUTH_REGISTER` event
6. Return token + user

**login flow:**
1. Call `authRepository.findUserByEmailAndFirmSlug(email, firmSlug)` — returns user + firm + roles
2. If not found, log `AUTH_LOGIN_FAILURE` event, throw `401 INVALID_CREDENTIALS` (no user enumeration — same error whether firm slug is wrong or password is wrong)
3. Compare password via `passwordService.compare`
4. If mismatch, log `AUTH_LOGIN_FAILURE` event, throw `401 INVALID_CREDENTIALS`
5. Update `last_login_at`
6. Log `AUTH_LOGIN_SUCCESS` event
7. Sign JWT (payload includes `userId`, `firmId`, `email`, `role` from returned data)
8. Return token + user

**forgotPassword flow:**
1. Look up user by email (silently ignore if not found)
2. If found, sign a short-lived reset JWT (`{ userId, type: 'password_reset' }`, 1h)
3. Log `AUTH_PASSWORD_RESET` event (only if user found)
4. Return reset token

**resetPassword flow:**
1. Verify reset JWT via `jwtStrategy.verifyResetToken`
2. Validate `type === 'password_reset'` claim
3. Hash new password
4. Call `authRepository.updatePassword`
5. Log `AUTH_PASSWORD_RESET` event

---

## 5. Supporting Services

### `password.service.ts`
```typescript
class PasswordService {
  hash(plain: string): Promise<string>       // bcrypt, cost 12
  compare(plain: string, hash: string): Promise<boolean>
}
```

### `jwt.strategy.ts`
```typescript
class JwtStrategy {
  sign(payload: JwtPayload): string                    // 7d expiry
  verify(token: string): JwtPayload                    // throws on invalid
  signResetToken(userId: string): string               // 1h expiry
  verifyResetToken(token: string): ResetTokenPayload   // throws on invalid/expired
}
```

**JWT Payload:**
```typescript
interface JwtPayload {
  userId: string;
  firmId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
```

---

## 6. Controller Layer — `auth.controller.ts`

Thin HTTP layer. Validates request → calls service → returns response.

```typescript
class AuthController {
  register(req: Request, res: Response): Promise<void>
  login(req: Request, res: Response): Promise<void>
  forgotPassword(req: Request, res: Response): Promise<void>
  resetPassword(req: Request, res: Response): Promise<void>
  logout(req: Request, res: Response): Promise<void>
}
```

- Uses `validate` middleware (already exists at `shared/middleware/validation.ts`) for body validation
- Calls `authService` methods
- Returns structured JSON responses
- No business logic in controller

---

## 7. Validation Schemas — `auth.validation.ts`

Zod schemas for each endpoint:

```typescript
const RegisterSchema = z.object({
  firmName: z.string().min(2).max(255),
  firmSlug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  firmEmail: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const LoginSchema = z.object({
  firmSlug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  password: z.string().min(1),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
```

---

## 8. Routes — `auth.routes.ts`

```typescript
const router = Router();

// Public routes (no auth middleware)
router.post('/register', validate(RegisterSchema), authController.register);
router.post('/login', validate(LoginSchema), authController.login);
router.post('/forgot-password', validate(ForgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(ResetPasswordSchema), authController.resetPassword);

// Authenticated route
router.post('/logout', authenticate, authController.logout);

export default router;
```

Mounted in `app.ts` at: `app.use('/api/v1/auth', authRouter)`

---

## 9. Types — `auth.types.ts`

```typescript
interface RegisterDto { firmName, firmSlug, firmEmail, firstName, lastName, email, password }
interface LoginDto { firmSlug: string; email: string; password: string }
interface ForgotPasswordDto { email }
interface ResetPasswordDto { token, password }

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    firmId: string;
    firmName: string;
  };
}

interface CreateFirmWithOwnerData {
  firm: { name, slug, email }
  user: { firstName, lastName, email, passwordHash }
  ownerRoleId: string;
}
```

---

## 10. Middleware Integration

Both middleware files already exist from Phase 0:

| File | Status | Usage |
|------|--------|-------|
| `shared/middleware/authenticate.ts` | ✅ exists | Applied to all protected routes |
| `shared/middleware/tenant-context.ts` | ✅ exists | Applied after authenticate |
| `shared/middleware/validation.ts` | ✅ exists | Applied per-route with Zod schema |
| `shared/middleware/rate-limiter.ts` | ✅ exists | Applied globally in `app.ts` |

Auth routes are **public** — `authenticate` is NOT applied to the auth router, except `POST /logout`.

---

## 11. Frontend Pages

> All pages use components from `ui_theme_ref/` only. No custom UI.

### Login Page — `apps/web/src/pages/auth/login.tsx`
- Uses: `AuthPageLayout` (from theme), `SignInForm` (adapted from theme)
- Calls: `POST /api/v1/auth/login`
- On success: stores JWT in `localStorage`, redirects to `/dashboard`

### Register Page — `apps/web/src/pages/auth/register.tsx`
- Uses: `AuthPageLayout`, form inputs from `ui_theme_ref/src/components/form/`
- Calls: `POST /api/v1/auth/register`
- On success: stores JWT, redirects to `/dashboard`

### Forgot Password Page — `apps/web/src/pages/auth/forgot-password.tsx`
- Uses: `AuthPageLayout`, `Input`, `Button`, `Label` from theme
- Calls: `POST /api/v1/auth/forgot-password`
- On success: shows confirmation message

### Theme Components Used

| Component | Source in `ui_theme_ref/` |
|-----------|--------------------------|
| `AuthPageLayout` | `src/pages/AuthPages/AuthPageLayout.tsx` |
| `SignInForm` | `src/components/auth/SignInForm.tsx` (adapted) |
| `SignUpForm` | `src/components/auth/SignUpForm.tsx` (adapted) |
| `Input` | `src/components/form/input/InputField.tsx` |
| `Label` | `src/components/form/Label.tsx` |
| `Button` | `src/components/ui/button/Button.tsx` |
| `Alert` | `src/components/ui/alert/` |

> ⚠️ `ForgotPasswordForm` does not exist in the theme. It will be composed using `Input`, `Label`, `Button`, and `Alert` — all of which exist. No missing component blocker.

---

## 12. Error Response Format

All errors follow the existing `error-handler.ts` format:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

| Scenario | HTTP | Code |
|----------|------|------|
| Firm slug taken | 409 | `FIRM_SLUG_EXISTS` |
| Email already registered | 409 | `EMAIL_EXISTS` |
| Invalid credentials | 401 | `INVALID_CREDENTIALS` |
| Token expired | 400 | `TOKEN_EXPIRED` |
| Token invalid | 400 | `TOKEN_INVALID` |
| Validation failure | 422 | `VALIDATION_ERROR` |
| Unauthenticated | 401 | `UNAUTHORIZED` |
