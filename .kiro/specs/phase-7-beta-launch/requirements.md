# Requirements Document

## Introduction

Phase 7 is the beta launch readiness phase for Taxmic, a multi-tenant practice management SaaS for accounting firms. Phases 1–6 have delivered Auth, CRM, Documents, Tasks, Billing (Invoices + Payments), and Notifications. Phase 7 does not introduce new features or modify the database schema. Its purpose is to verify that the existing system is correctly wired end-to-end, document the environment configuration state, seed 5 beta firms into the database, and produce a readiness report that classifies any outstanding bugs before beta users are onboarded.

## Glossary

- **Seed_Script**: `scripts/seed-beta-firms.ts` — a Prisma-direct TypeScript script that creates beta firms and owner users in the database.
- **Beta_Firm**: A firm record created by the Seed_Script for use by a recruited beta user during the beta period.
- **Workflow_Chain**: The end-to-end data flow: Client → Document → Task → Invoice → Payment, spanning the CRM, Documents, Tasks, and Billing modules.
- **Static_Audit**: A code-level inspection (no runtime execution required) that verifies module wiring, route registration, service dependencies, and data linkage across the Workflow_Chain.
- **Env_Audit**: A review of `apps/api/.env` against `.env.example` and `apps/api/src/config/index.ts` that classifies each variable as present, missing-critical, missing-acceptable, or weak.
- **Readiness_Report**: `docs/audits/PHASE-7-BETA-LAUNCH-READINESS.md` — the consolidated output document that records the results of the Static_Audit, Env_Audit, and any bugs found during manual testing.
- **Deployment_Checklist**: A step-by-step document covering the actions required to deploy the application to a staging or production environment.
- **Critical_Bug**: A defect that prevents a beta user from completing any step of the Workflow_Chain.
- **Non_Critical_Bug**: A defect that degrades experience but does not block the Workflow_Chain.
- **JWT_Secret**: The value of `JWT_SECRET` in `apps/api/.env`, currently set to the weak default `"dev-secret-change-in-production"`.
- **Storage_Provider**: The file storage backend, currently `local` (disk-based), configured via `STORAGE_PROVIDER` in `apps/api/src/config/index.ts`.
- **Email_Provider**: AWS SES, configured via `SES_FROM_EMAIL`. Currently absent from `apps/api/.env`.

---

## Requirements

### Requirement 1: Beta Firm Seeding

**User Story:** As a Taxmic operator, I want 5 beta firms with owner users created in the database, so that recruited beta users can log in and begin testing immediately.

#### Acceptance Criteria

1. WHEN the Seed_Script is executed against a database where migrations have been applied, THE Seed_Script SHALL create exactly 5 firm records, each with a unique slug, a corresponding `firm_settings` record, an `invoice_sequences` record, and a `storage_usage` record.
2. WHEN the Seed_Script is executed, THE Seed_Script SHALL create one owner user per Beta_Firm with `is_active = true`, `email_verified = true`, and a bcrypt-hashed password with a cost factor of 12.
3. WHEN the Seed_Script is executed and a Beta_Firm with the target slug already exists, THE Seed_Script SHALL skip that firm without error and report its status as `skipped`.
4. WHEN the Seed_Script completes, THE Seed_Script SHALL print a credential table containing the firm slug, email, plaintext password, and status for each Beta_Firm.
5. IF the `owner` role does not exist in the `roles` table when the Seed_Script is executed, THEN THE Seed_Script SHALL exit with a non-zero status code and a descriptive error message.
6. IF any database transaction fails during firm creation, THEN THE Seed_Script SHALL roll back that firm's transaction and report the failure without affecting other Beta_Firms.
7. THE Seed_Script SHALL be executable from the repository root using the command documented in its header comment without requiring modifications to `apps/api/.env`.

---

### Requirement 2: Static Architecture Audit

**User Story:** As a Taxmic developer, I want a static audit of the full Workflow_Chain, so that I can confirm all modules are correctly wired before beta users encounter runtime failures.

#### Acceptance Criteria

1. THE Static_Audit SHALL verify that the CRM module exposes client records that are referenceable by `firm_id` and `client_id` in the Documents, Tasks, and Billing modules.
2. THE Static_Audit SHALL verify that the Documents module routes are registered in `apps/api/src/app.ts` and that the `documents.service.ts` resolves its storage dependency via `storage.factory.ts`.
3. THE Static_Audit SHALL verify that the Tasks module routes are registered in `apps/api/src/app.ts` and that `tasks.service.ts` accepts a `client_id` foreign key linking tasks to CRM clients.
4. THE Static_Audit SHALL verify that the Billing module routes for invoices and payments are registered in `apps/api/src/app.ts` and that `invoices.service.ts` accepts a `client_id` foreign key.
5. THE Static_Audit SHALL verify that the Stripe webhook route is registered and that `webhook.controller.ts` updates invoice and payment status on receipt of `payment_intent.succeeded` events.
6. THE Static_Audit SHALL verify that the Notifications module is registered and that `email-events.service.ts` records outbound email attempts regardless of whether `SES_FROM_EMAIL` is configured.
7. WHEN the Static_Audit identifies a broken link in the Workflow_Chain, THE Readiness_Report SHALL classify it as a Critical_Bug with a description of the missing wiring.
8. WHEN the Static_Audit finds all Workflow_Chain links intact, THE Readiness_Report SHALL record a PASS status for each verified link.

---

### Requirement 3: Environment Variable Audit

**User Story:** As a Taxmic operator, I want a complete classification of all environment variables, so that I know exactly what is configured, what is missing but acceptable for beta, and what must be fixed before production.

#### Acceptance Criteria

1. THE Env_Audit SHALL classify `DATABASE_URL` as present and required.
2. THE Env_Audit SHALL classify `JWT_SECRET` as present but weak, and SHALL flag it as a pre-production blocker because its current value is `"dev-secret-change-in-production"`.
3. THE Env_Audit SHALL classify `NODE_ENV`, `PORT`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` as present and acceptable for beta.
4. THE Env_Audit SHALL classify `STORAGE_PROVIDER` as missing from `apps/api/.env` but acceptable for beta because `apps/api/src/config/index.ts` defaults it to `local`.
5. THE Env_Audit SHALL classify `SES_FROM_EMAIL` as missing and SHALL flag it as a known limitation for beta, noting that email sending will silently fail or use a mock transport.
6. THE Env_Audit SHALL classify `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET` as missing and acceptable for beta because the Storage_Provider is `local`.
7. THE Env_Audit SHALL classify `SENTRY_DSN` as missing and acceptable for beta because error tracking is not required for the initial beta period.
8. THE Env_Audit SHALL classify `FRONTEND_URL` and `API_URL` as missing and note that they are not validated by `apps/api/src/config/index.ts` but may be required by CORS or redirect logic.
9. THE Env_Audit SHALL classify `REDIS_URL`, `JWT_REFRESH_SECRET`, and `JWT_REFRESH_EXPIRES_IN` as present in `.env.example` but not referenced in `apps/api/src/config/index.ts`, and SHALL note them as unused by the current config schema.
10. WHEN the Env_Audit is complete, THE Readiness_Report SHALL include a table with columns: Variable, Status, Classification, and Notes.

---

### Requirement 4: Deployment Checklist

**User Story:** As a Taxmic operator, I want a deployment checklist, so that I can follow a repeatable process when deploying to staging or production without missing critical steps.

#### Acceptance Criteria

1. THE Deployment_Checklist SHALL include a pre-deployment section that covers: confirming all migrations are applied, confirming `JWT_SECRET` is replaced with a strong secret, confirming `NODE_ENV` is set to `production`, and confirming Stripe keys are switched from test to live.
2. THE Deployment_Checklist SHALL include a database section that covers: running `prisma migrate deploy`, verifying the `roles` table is seeded, and running the Seed_Script if beta firms are not yet present.
3. THE Deployment_Checklist SHALL include an application startup section that covers: installing dependencies, building the API and web app, and starting the server.
4. THE Deployment_Checklist SHALL include a post-deployment verification section that covers: confirming the health endpoint responds, confirming login works for at least one Beta_Firm credential, and confirming the Stripe webhook endpoint is reachable.
5. THE Deployment_Checklist SHALL include a known limitations section that documents: email sending is non-functional until `SES_FROM_EMAIL` is configured, file storage is local disk (not S3), and error tracking is inactive until `SENTRY_DSN` is configured.
6. WHERE the deployment target is production, THE Deployment_Checklist SHALL additionally require: replacing all weak secrets, configuring `SES_FROM_EMAIL`, and switching `STORAGE_PROVIDER` to `s3` with valid AWS credentials.

---

### Requirement 5: Beta Launch Readiness Report

**User Story:** As a Taxmic operator, I want a consolidated readiness report, so that I have a single document that captures the beta launch status, all known issues, and a go/no-go recommendation.

#### Acceptance Criteria

1. THE Readiness_Report SHALL be written to `docs/audits/PHASE-7-BETA-LAUNCH-READINESS.md`.
2. THE Readiness_Report SHALL include a summary section with: the date of the audit, the phases covered (1–6), and an overall go/no-go recommendation for beta launch.
3. THE Readiness_Report SHALL include the results of the Static_Audit as defined in Requirement 2.
4. THE Readiness_Report SHALL include the results of the Env_Audit as defined in Requirement 3.
5. THE Readiness_Report SHALL include a bug register with columns: ID, Description, Severity (Critical / Non_Critical), Module, and Status (Open / Fixed).
6. WHEN a Critical_Bug is recorded in the bug register with status Open, THE Readiness_Report SHALL set the go/no-go recommendation to NO-GO.
7. WHEN all Critical_Bugs in the bug register have status Fixed and no new Critical_Bugs are identified, THE Readiness_Report SHALL set the go/no-go recommendation to GO.
8. THE Readiness_Report SHALL include a known limitations section that lists all Non_Critical_Bugs and missing-acceptable environment variables that will not be resolved before beta launch.
9. THE Readiness_Report SHALL include a beta user onboarding section that lists the 5 Beta_Firm credentials (email and firm slug only — no plaintext passwords in the report) and the login URL.
