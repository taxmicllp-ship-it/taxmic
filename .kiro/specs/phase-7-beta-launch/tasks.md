# Tasks — Phase 7: Beta Launch Preparation

## Task List

- [x] 1. Verify and finalize the beta seed script
  - [x] 1.1 Review `scripts/seed-beta-firms.ts` against design.md §Seed Script — confirm all 6 records per firm (firms, firm_settings, invoice_sequences, storage_usage, users, user_roles) are created in a single `prisma.$transaction`
  - [x] 1.2 Confirm idempotency guard: `firms.findUnique({ where: { slug } })` skips existing slugs without error
  - [x] 1.3 Confirm pre-flight check: script throws and exits non-zero if `owner` role is absent from `roles` table
  - [x] 1.4 Confirm credential table is printed to stdout on completion with columns: slug, email, password, status
  - [x] 1.5 Confirm `PrismaClient` is disconnected in `.finally` block
  - [x] 1.6 Verify the run command in the script header comment matches: `cd apps/api && npx ts-node ../../scripts/seed-beta-firms.ts`

- [x] 2. Execute static workflow audit
  - [x] 2.1 Verify all 6 modules (auth, crm, documents, tasks, billing, notifications) are imported and mounted in `apps/api/src/app.ts`
  - [x] 2.2 Verify `documents.routes.ts` applies `router.use(authenticate, tenantContext)` and that `documents.service.ts` calls `getStorageProvider()` from `storage.factory.ts`
  - [x] 2.3 Verify `tasks.routes.ts` applies `router.use(authenticate, tenantContext)` and that `CreateTaskDto` / `TaskResponse` carry `client_id`
  - [x] 2.4 Verify `invoices.routes.ts` applies `router.use(authenticate, tenantContext)` and that `CreateInvoiceDto` requires `client_id`
  - [x] 2.5 Verify `payments.routes.ts` registers `POST /payments/webhook` with `express.raw()` and NO `authenticate` or `tenantContext` middleware
  - [x] 2.6 Verify `webhook.controller.ts` handles `checkout.session.completed` and calls both `paymentsRepository.updateByStripePaymentIntentId` and `invoicesRepository.updateStatus`
  - [x] 2.7 Verify `webhook.controller.ts` calls `notificationsService.createNotification` inside a try/catch after invoice status update
  - [x] 2.8 Verify `notifications/index.ts` exports the router as default and `notificationsService` as a named export, and that `app.ts` mounts the router

- [x] 3. Execute environment variable audit
  - [x] 3.1 Compare `apps/api/.env` against `.env.example` and `apps/api/src/config/index.ts` — produce the classification table from design.md §Environment Variable Audit
  - [x] 3.2 Confirm `JWT_SECRET` value is `"dev-secret-change-in-production"` and flag as pre-production blocker
  - [x] 3.3 Confirm `STORAGE_PROVIDER` is absent from `.env` and that config defaults it to `local`
  - [x] 3.4 Confirm `FRONTEND_URL` and `API_URL` are absent from `.env` and not validated by config schema — note as missing-notable
  - [x] 3.5 Confirm `REDIS_URL`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` are in `.env.example` but not referenced in config schema — note as unused

- [x] 4. Create deployment checklist document
  - [x] 4.1 Create `docs/BETA-DEPLOYMENT-CHECKLIST.md` with a pre-deployment section: confirm migrations applied, replace `JWT_SECRET`, set `NODE_ENV=production`, switch Stripe keys to live
  - [x] 4.2 Add database section: `prisma migrate deploy`, verify `roles` table seeded, run seed script if beta firms absent
  - [x] 4.3 Add application startup section: install dependencies, build API and web app, start server
  - [x] 4.4 Add post-deployment verification section: health endpoint responds, login works for one beta credential, Stripe webhook endpoint reachable
  - [x] 4.5 Add known limitations section: email non-functional until `SES_FROM_EMAIL` set, storage is local disk, error tracking inactive until `SENTRY_DSN` set
  - [x] 4.6 Add production-only section: replace all weak secrets, configure `SES_FROM_EMAIL`, switch `STORAGE_PROVIDER` to `s3` with AWS credentials

- [x] 5. Create beta launch readiness report
  - [x] 5.1 Create `docs/audits/PHASE-7-BETA-LAUNCH-READINESS.md` with a summary section: audit date, phases covered (1–6), overall go/no-go recommendation
  - [x] 5.2 Add static audit results section — record PASS/FAIL for each of the 7 checklist items from Task 2; classify any failures as Critical_Bug
  - [x] 5.3 Add environment variable audit table with columns: Variable, Status, Classification, Notes — sourced from Task 3 findings
  - [x] 5.4 Add bug register with columns: ID, Description, Severity, Module, Status — populate with any issues found in Tasks 2–3
  - [x] 5.5 Set go/no-go recommendation to GO if no Critical_Bugs are open; set to NO-GO if any Critical_Bug has status Open
  - [x] 5.6 Add known limitations section listing all Non_Critical_Bugs and missing-acceptable env vars not resolved before beta
  - [x] 5.7 Add beta user onboarding section with the 5 beta firm credentials (email and firm slug only — no plaintext passwords) and login URL `http://localhost:3001/login`
