# Complete Repository Folder Structure

**Version:** 1.0 FINAL  
**Purpose:** Complete folder structure for MVP development  
**Architecture:** Modular Monolith + Monorepo (Turborepo)  
**Timeline:** 16 weeks (4 months)  
**Team:** 3-5 developers  
**Lifespan:** 12-24 months without major refactoring

**Source Documents:**
- docs/dev.md
- docs/implementation-plan.md
- docs/FINAL-ARCHITECTURE-FIXES.md
- docs/production-readiness.md
- docs/OPTIMIZED-MVP-PLAN.md
- docs/MVP-FEATURE-LOCK.md

---

## 🎯 Complete Repository Tree

```
practice-management-saas/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── test.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.repository.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.types.ts
│   │   │   │   │   ├── auth.validation.ts
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   ├── password.service.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │       ├── auth.service.test.ts
│   │   │   │   │       └── auth.controller.test.ts
│   │   │   │   ├── crm/
│   │   │   │   │   ├── clients/
│   │   │   │   │   │   ├── clients.controller.ts
│   │   │   │   │   │   ├── clients.service.ts
│   │   │   │   │   │   ├── clients.repository.ts
│   │   │   │   │   │   ├── clients.routes.ts
│   │   │   │   │   │   ├── clients.types.ts
│   │   │   │   │   │   ├── clients.validation.ts
│   │   │   │   │   │   └── __tests__/
│   │   │   │   │   │       ├── clients.service.test.ts
│   │   │   │   │   │       └── clients.controller.test.ts
│   │   │   │   │   ├── contacts/
│   │   │   │   │   │   ├── contacts.controller.ts
│   │   │   │   │   │   ├── contacts.service.ts
│   │   │   │   │   │   ├── contacts.repository.ts
│   │   │   │   │   │   ├── contacts.routes.ts
│   │   │   │   │   │   ├── contacts.types.ts
│   │   │   │   │   │   ├── contacts.validation.ts
│   │   │   │   │   │   └── __tests__/
│   │   │   │   │   │       ├── contacts.service.test.ts
│   │   │   │   │   │       └── contacts.controller.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── documents/
│   │   │   │   │   ├── documents.controller.ts
│   │   │   │   │   ├── documents.service.ts
│   │   │   │   │   ├── documents.repository.ts
│   │   │   │   │   ├── documents.routes.ts
│   │   │   │   │   ├── documents.types.ts
│   │   │   │   │   ├── documents.validation.ts
│   │   │   │   │   ├── folders.service.ts
│   │   │   │   │   ├── folders.repository.ts
│   │   │   │   │   ├── upload.middleware.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │       ├── documents.service.test.ts
│   │   │   │   │       └── documents.controller.test.ts
│   │   │   │   ├── tasks/
│   │   │   │   │   ├── tasks.controller.ts
│   │   │   │   │   ├── tasks.service.ts
│   │   │   │   │   ├── tasks.repository.ts
│   │   │   │   │   ├── tasks.routes.ts
│   │   │   │   │   ├── tasks.types.ts
│   │   │   │   │   ├── tasks.validation.ts
│   │   │   │   │   ├── task-statuses.service.ts
│   │   │   │   │   ├── task-statuses.repository.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │       ├── tasks.service.test.ts
│   │   │   │   │       └── tasks.controller.test.ts
│   │   │   │   ├── billing/
│   │   │   │   │   ├── invoices/
│   │   │   │   │   │   ├── invoices.controller.ts
│   │   │   │   │   │   ├── invoices.service.ts
│   │   │   │   │   │   ├── invoices.repository.ts
│   │   │   │   │   │   ├── invoices.routes.ts
│   │   │   │   │   │   ├── invoices.types.ts
│   │   │   │   │   │   ├── invoices.validation.ts
│   │   │   │   │   │   ├── pdf-generator.service.ts
│   │   │   │   │   │   ├── invoice-line-items.repository.ts
│   │   │   │   │   │   └── __tests__/
│   │   │   │   │   │       ├── invoices.service.test.ts
│   │   │   │   │   │       ├── invoices.controller.test.ts
│   │   │   │   │   │       └── pdf-generator.test.ts
│   │   │   │   │   ├── payments/
│   │   │   │   │   │   ├── payments.controller.ts
│   │   │   │   │   │   ├── payments.service.ts
│   │   │   │   │   │   ├── payments.repository.ts
│   │   │   │   │   │   ├── payments.routes.ts
│   │   │   │   │   │   ├── payments.types.ts
│   │   │   │   │   │   ├── stripe.service.ts
│   │   │   │   │   │   ├── webhook.controller.ts
│   │   │   │   │   │   └── __tests__/
│   │   │   │   │   │       ├── payments.service.test.ts
│   │   │   │   │   │       ├── stripe.service.test.ts
│   │   │   │   │   │       └── webhook.controller.test.ts
│   │   │   │   │   ├── subscriptions/
│   │   │   │   │   │   ├── subscriptions.controller.ts
│   │   │   │   │   │   ├── subscriptions.service.ts
│   │   │   │   │   │   ├── subscriptions.repository.ts
│   │   │   │   │   │   ├── subscriptions.routes.ts
│   │   │   │   │   │   ├── subscriptions.types.ts
│   │   │   │   │   │   ├── plans.service.ts
│   │   │   │   │   │   ├── plans.repository.ts
│   │   │   │   │   │   ├── usage.service.ts
│   │   │   │   │   │   └── __tests__/
│   │   │   │   │   │       ├── subscriptions.service.test.ts
│   │   │   │   │   │       └── usage.service.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── email.service.ts
│   │   │   │   │   ├── email.types.ts
│   │   │   │   │   ├── activity-events.service.ts
│   │   │   │   │   ├── activity-events.repository.ts
│   │   │   │   │   ├── reminders.service.ts
│   │   │   │   │   ├── email-events.repository.ts
│   │   │   │   │   ├── notifications.routes.ts
│   │   │   │   │   ├── event-handlers.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │       ├── email.service.test.ts
│   │   │   │   │       └── reminders.service.test.ts
│   │   │   │   ├── portal/
│   │   │   │   │   ├── portal-auth.controller.ts
│   │   │   │   │   ├── portal-auth.service.ts
│   │   │   │   │   ├── portal-documents.controller.ts
│   │   │   │   │   ├── portal-invoices.controller.ts
│   │   │   │   │   ├── portal.routes.ts
│   │   │   │   │   ├── client-users.repository.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │       └── portal-auth.service.test.ts
│   │   │   │   └── onboarding/
│   │   │   │       ├── onboarding.controller.ts
│   │   │   │       ├── onboarding.service.ts
│   │   │   │       ├── onboarding.repository.ts
│   │   │   │       ├── onboarding.routes.ts
│   │   │   │       ├── onboarding.types.ts
│   │   │   │       └── __tests__/
│   │   │   │           └── onboarding.service.test.ts
│   │   │   ├── shared/
│   │   │   │   ├── database/
│   │   │   │   │   ├── connection.ts
│   │   │   │   │   ├── base.repository.ts
│   │   │   │   │   └── transaction.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── authenticate.ts
│   │   │   │   │   ├── tenant-context.ts
│   │   │   │   │   ├── rate-limiter.ts
│   │   │   │   │   ├── tenant-rate-limiter.ts
│   │   │   │   │   ├── error-handler.ts
│   │   │   │   │   ├── validation.ts
│   │   │   │   │   ├── audit-logger.ts
│   │   │   │   │   └── idempotency.ts
│   │   │   │   ├── storage/
│   │   │   │   │   ├── storage.interface.ts
│   │   │   │   │   ├── s3-storage.provider.ts
│   │   │   │   │   ├── local-storage.provider.ts
│   │   │   │   │   └── storage.factory.ts
│   │   │   │   ├── cache/
│   │   │   │   │   ├── cache.service.ts
│   │   │   │   │   └── cache.decorators.ts
│   │   │   │   ├── events/
│   │   │   │   │   └── event-emitter.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── logger.ts
│   │   │   │   │   ├── crypto.ts
│   │   │   │   │   ├── date.ts
│   │   │   │   │   └── errors.ts
│   │   │   │   └── types/
│   │   │   │       ├── express.d.ts
│   │   │   │       └── common.types.ts
│   │   │   ├── workers/
│   │   │   │   ├── email-worker.ts
│   │   │   │   ├── reminders-worker.ts
│   │   │   │   ├── invoices-worker.ts
│   │   │   │   ├── documents-worker.ts
│   │   │   │   └── index.ts
│   │   │   ├── config/
│   │   │   │   ├── env.config.ts
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   ├── queue.config.ts
│   │   │   │   ├── bull-board.config.ts
│   │   │   │   ├── storage.config.ts
│   │   │   │   ├── email.config.ts
│   │   │   │   ├── stripe.config.ts
│   │   │   │   └── sentry.config.ts
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   └── worker.ts
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   │   ├── auth.integration.test.ts
│   │   │   │   ├── clients.integration.test.ts
│   │   │   │   ├── documents.integration.test.ts
│   │   │   │   ├── tasks.integration.test.ts
│   │   │   │   ├── invoices.integration.test.ts
│   │   │   │   ├── payments.integration.test.ts
│   │   │   │   └── portal.integration.test.ts
│   │   │   ├── e2e/
│   │   │   │   ├── auth.e2e.test.ts
│   │   │   │   ├── client-workflow.e2e.test.ts
│   │   │   │   ├── invoice-payment.e2e.test.ts
│   │   │   │   └── portal.e2e.test.ts
│   │   │   ├── fixtures/
│   │   │   │   ├── users.ts
│   │   │   │   ├── clients.ts
│   │   │   │   └── invoices.ts
│   │   │   └── setup.ts
│   │   ├── .env.example
│   │   ├── .env.test
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.js
│   │   └── Dockerfile
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/
│       │   │   │   ├── login/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── register/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── forgot-password/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── layout.tsx
│       │   │   ├── (dashboard)/
│       │   │   │   ├── dashboard/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── clients/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── new/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── documents/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── tasks/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── invoices/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── new/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── settings/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── layout.tsx
│       │   │   ├── (portal)/
│       │   │   │   ├── portal/
│       │   │   │   │   ├── login/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── dashboard/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── documents/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── invoices/
│       │   │   │   │       └── page.tsx
│       │   │   │   └── layout.tsx
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   │   ├── components/
│       │   │   │   │   ├── LoginForm.tsx
│       │   │   │   │   ├── RegisterForm.tsx
│       │   │   │   │   └── ForgotPasswordForm.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   ├── useAuth.ts
│       │   │   │   │   ├── useLogin.ts
│       │   │   │   │   └── useRegister.ts
│       │   │   │   ├── api/
│       │   │   │   │   └── auth-api.ts
│       │   │   │   └── types.ts
│       │   │   ├── clients/
│       │   │   │   ├── components/
│       │   │   │   │   ├── ClientList.tsx
│       │   │   │   │   ├── ClientCard.tsx
│       │   │   │   │   ├── ClientForm.tsx
│       │   │   │   │   └── ClientDetails.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   ├── useClients.ts
│       │   │   │   │   ├── useClient.ts
│       │   │   │   │   ├── useCreateClient.ts
│       │   │   │   │   └── useUpdateClient.ts
│       │   │   │   ├── api/
│       │   │   │   │   └── clients-api.ts
│       │   │   │   └── types.ts
│       │   │   ├── contacts/
│       │   │   │   ├── components/
│       │   │   │   │   ├── ContactList.tsx
│       │   │   │   │   ├── ContactForm.tsx
│       │   │   │   │   └── ContactCard.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   ├── useContacts.ts
│       │   │   │   │   └── useCreateContact.ts
│       │   │   │   ├── api/
│       │   │   │   │   └── contacts-api.ts
│       │   │   │   └── types.ts
│       │   │   ├── documents/
│       │   │   │   ├── components/
│       │   │   │   │   ├── DocumentList.tsx
│       │   │   │   │   ├── DocumentUpload.tsx
│       │   │   │   │   ├── FolderTree.tsx
│       │   │   │   │   └── DocumentCard.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   ├── useDocuments.ts
│       │   │   │   │   ├── useUpload.ts
│       │   │   │   │   └── useFolders.ts
│       │   │   │   ├── api/
│       │   │   │   │   └── documents-api.ts
│       │   │   │   └── types.ts
│       │   │   ├── tasks/
│       │   │   │   ├── components/
│       │   │   │   │   ├── TaskList.tsx
│       │   │   │   │   ├── TaskForm.tsx
│       │   │   │   │   ├── TaskCard.tsx
│       │   │   │   │   └── TaskStatusBadge.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   ├── useTasks.ts
│       │   │   │   │   ├── useCreateTask.ts
│       │   │   │   │   └── useUpdateTask.ts
│       │   │   │   ├── api/
│       │   │   │   │   └── tasks-api.ts
│       │   │   │   └── types.ts
│       │   │   ├── invoices/
│       │   │   │   ├── components/
│       │   │   │   │   ├── InvoiceList.tsx
│       │   │   │   │   ├── InvoiceForm.tsx
│       │   │   │   │   ├── InvoiceDetails.tsx
│       │   │   │   │   ├── InvoicePDF.tsx
│       │   │   │   │   └── LineItemsTable.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   ├── useInvoices.ts
│       │   │   │   │   ├── useCreateInvoice.ts
│       │   │   │   │   └── useSendInvoice.ts
│       │   │   │   ├── api/
│       │   │   │   │   └── invoices-api.ts
│       │   │   │   └── types.ts
│       │   │   ├── payments/
│       │   │   │   ├── components/
│       │   │   │   │   ├── PaymentButton.tsx
│       │   │   │   │   └── PaymentHistory.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   └── usePayment.ts
│       │   │   │   ├── api/
│       │   │   │   │   └── payments-api.ts
│       │   │   │   └── types.ts
│       │   │   ├── portal/
│       │   │   │   ├── components/
│       │   │   │   │   ├── PortalDashboard.tsx
│       │   │   │   │   ├── PortalDocuments.tsx
│       │   │   │   │   └── PortalInvoices.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   └── usePortalAuth.ts
│       │   │   │   ├── api/
│       │   │   │   │   └── portal-api.ts
│       │   │   │   └── types.ts
│       │   │   └── onboarding/
│       │   │       ├── components/
│       │   │       │   ├── OnboardingWizard.tsx
│       │   │       │   ├── StepIndicator.tsx
│       │   │       │   └── OnboardingStep.tsx
│       │   │       ├── hooks/
│       │   │       │   └── useOnboarding.ts
│       │   │       ├── api/
│       │   │       │   └── onboarding-api.ts
│       │   │       └── types.ts
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Input.tsx
│       │   │   │   ├── Select.tsx
│       │   │   │   ├── Modal.tsx
│       │   │   │   ├── Table.tsx
│       │   │   │   ├── Card.tsx
│       │   │   │   ├── Badge.tsx
│       │   │   │   ├── Spinner.tsx
│       │   │   │   └── Toast.tsx
│       │   │   └── layout/
│       │   │       ├── Header.tsx
│       │   │       ├── Sidebar.tsx
│       │   │       ├── Footer.tsx
│       │   │       ├── DashboardLayout.tsx
│       │   │       └── PortalLayout.tsx
│       │   ├── hooks/
│       │   │   ├── useDebounce.ts
│       │   │   ├── useLocalStorage.ts
│       │   │   └── useMediaQuery.ts
│       │   ├── lib/
│       │   │   ├── api.ts
│       │   │   ├── auth.ts
│       │   │   ├── utils.ts
│       │   │   └── constants.ts
│       │   ├── types/
│       │   │   ├── api.ts
│       │   │   └── common.ts
│       │   └── styles/
│       │       └── globals.css
│       ├── public/
│       │   ├── images/
│       │   └── fonts/
│       ├── .env.example
│       ├── .env.local
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       └── tailwind.config.js
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   │   ├── 20240101000001_create_firms/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000002_create_users/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000003_create_client_users/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000004_create_clients/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000005_create_contacts/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000006_create_client_contacts/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000007_create_folders/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000008_create_documents/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000009_create_messages/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000010_create_task_statuses/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000011_create_tasks/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000012_create_invoices/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000013_create_invoice_line_items/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000014_create_payments/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000015_create_activity_events/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000016_create_security_audit_logs/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000017_create_onboarding_progress/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000018_create_plans/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000019_create_subscriptions/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000020_create_subscription_usage/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000021_create_feature_flags/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000022_create_firm_feature_flags/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000023_create_email_events/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000024_create_idempotency_keys/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000025_add_soft_deletes/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20240101000026_add_indexes/
│   │   │   │   │   └── migration.sql
│   │   │   │   └── 20240101000027_enable_rls/
│   │   │   │       └── migration.sql
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared-types/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── clients.ts
│   │   │   │   ├── contacts.ts
│   │   │   │   ├── documents.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   ├── invoices.ts
│   │   │   │   ├── payments.ts
│   │   │   │   └── subscriptions.ts
│   │   │   ├── entities/
│   │   │   │   ├── user.ts
│   │   │   │   ├── client.ts
│   │   │   │   ├── contact.ts
│   │   │   │   ├── document.ts
│   │   │   │   ├── task.ts
│   │   │   │   ├── invoice.ts
│   │   │   │   └── subscription.ts
│   │   │   ├── enums/
│   │   │   │   ├── client-type.ts
│   │   │   │   ├── task-status.ts
│   │   │   │   ├── invoice-status.ts
│   │   │   │   └── subscription-status.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── email-templates/
│   │   ├── src/
│   │   │   ├── templates/
│   │   │   │   ├── welcome.html
│   │   │   │   ├── invoice.html
│   │   │   │   ├── task-reminder.html
│   │   │   │   ├── invoice-reminder.html
│   │   │   │   ├── password-reset.html
│   │   │   │   ├── client-invitation.html
│   │   │   │   └── payment-confirmation.html
│   │   │   ├── builder.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── config/
│       ├── src/
│       │   ├── constants.ts
│       │   ├── plans.ts
│       │   ├── limits.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── infrastructure/
│   ├── terraform/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── terraform.tfvars
│   │   │   ├── staging/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── terraform.tfvars
│   │   │   └── production/
│   │   │       ├── main.tf
│   │   │       ├── variables.tf
│   │   │       └── terraform.tfvars
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   ├── rds/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   ├── elasticache/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   ├── s3/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   ├── ecs/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   └── alb/
│   │   │       ├── main.tf
│   │   │       ├── variables.tf
│   │   │       └── outputs.tf
│   │   └── README.md
│   ├── docker/
│   │   ├── api/
│   │   │   ├── Dockerfile
│   │   │   └── .dockerignore
│   │   ├── worker/
│   │   │   ├── Dockerfile
│   │   │   └── .dockerignore
│   │   └── web/
│   │       ├── Dockerfile
│   │       └── .dockerignore
│   └── scripts/
│       ├── deploy-staging.sh
│       ├── deploy-production.sh
│       ├── rollback.sh
│       └── backup-db.sh
├── scripts/
│   ├── setup-dev.sh
│   ├── seed-data.ts
│   ├── migrate-up.ts
│   ├── migrate-down.ts
│   ├── generate-types.ts
│   └── check-env.ts
├── docs/
│   ├── dev.md
│   ├── implementation-plan.md
│   ├── FINAL-ARCHITECTURE-FIXES.md
│   ├── production-readiness.md
│   ├── OPTIMIZED-MVP-PLAN.md
│   ├── MVP-FEATURE-LOCK.md
│   ├── IMPLEMENTATION-CHECKLIST.md
│   ├── FOLDER-STRUCTURE-FINAL.md
│   ├── api-reference.md
│   ├── deployment-guide.md
│   └── runbook.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
├── turbo.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── README.md
└── LICENSE
```

---

## 📋 Directory Explanations

### Root Level

**`.github/workflows/`**: CI/CD pipelines for automated testing and deployment.

**`apps/`**: Deployable applications (API server, frontend web app).

**`packages/`**: Shared code libraries used across apps.

**`infrastructure/`**: Infrastructure as Code (Terraform), Docker configs, deployment scripts.

**`scripts/`**: Development and maintenance scripts.

**`docs/`**: All architecture and implementation documentation.

**`docker-compose.yml`**: Local development environment setup.

**`turbo.json`**: Turborepo configuration for monorepo management.

---

### Backend (apps/api/)

**`src/modules/`**: Domain modules following modular monolith architecture.

Each module contains:
- `*.controller.ts`: HTTP request handlers
- `*.service.ts`: Business logic
- `*.repository.ts`: Database access
- `*.routes.ts`: Route definitions
- `*.types.ts`: TypeScript types
- `*.validation.ts`: Request validation schemas
- `__tests__/`: Unit tests

**Modules:**
- `auth/`: Authentication, JWT, password management
- `crm/`: Clients and contacts management
- `documents/`: File upload, S3 storage, folders
- `tasks/`: Task management, status tracking
- `billing/`: Invoices, payments (Stripe), subscriptions, plans
- `notifications/`: Email service, reminders, activity events
- `portal/`: Client portal authentication and features
- `onboarding/`: User onboarding flow

**`src/shared/`**: Shared utilities and middleware.
- `database/`: Prisma connection, base repository
- `middleware/`: Auth, rate limiting, error handling, audit logging
- `storage/`: Storage abstraction (S3, local)
- `cache/`: Redis caching service
- `events/`: Domain event emitter
- `utils/`: Logger, crypto, date utilities

**`src/workers/`**: Background job workers.
- `email-worker.ts`: Email sending
- `reminders-worker.ts`: Task/invoice reminders
- `invoices-worker.ts`: PDF generation
- `documents-worker.ts`: Document processing

**`src/config/`**: Configuration files.
- Environment variables
- Database, Redis, Queue configs
- Bull Board (queue dashboard)
- Storage, Email, Stripe, Sentry configs

**`tests/`**: Test suites.
- `unit/`: Unit tests (co-located with modules)
- `integration/`: API integration tests
- `e2e/`: End-to-end workflow tests

---

### Frontend (apps/web/)

**`src/app/`**: Next.js App Router structure.
- `(auth)/`: Authentication pages
- `(dashboard)/`: Main dashboard pages
- `(portal)/`: Client portal pages

**`src/features/`**: Feature-based organization.

Each feature contains:
- `components/`: Feature-specific React components
- `hooks/`: Custom React hooks
- `api/`: API client functions
- `types.ts`: TypeScript types

**Features:**
- `auth/`: Login, register, password reset
- `clients/`: Client management
- `contacts/`: Contact management
- `documents/`: Document upload/download
- `tasks/`: Task management
- `invoices/`: Invoice creation and viewing
- `payments/`: Payment processing
- `portal/`: Client portal features
- `onboarding/`: Onboarding wizard

**`src/components/`**: Shared UI components.
- `ui/`: Base components (Button, Input, Modal, etc.)
- `layout/`: Layout components (Header, Sidebar, etc.)

**`src/hooks/`**: Shared custom hooks.

**`src/lib/`**: Utilities and helpers.
- `api.ts`: API client (axios/fetch wrapper)
- `auth.ts`: Auth utilities
- `utils.ts`: General utilities

---

### Packages

**`packages/database/`**: Prisma schema and migrations.
- `prisma/schema.prisma`: Database schema
- `prisma/migrations/`: Migration files (27 migrations)
- `prisma/seed.ts`: Seed data

**`packages/shared-types/`**: Shared TypeScript types.
- `api/`: API DTOs
- `entities/`: Database entity types
- `enums/`: Shared enums

**`packages/email-templates/`**: HTML email templates.
- 7 templates (welcome, invoice, reminders, etc.)
- Template builder utility

**`packages/config/`**: Shared configuration.
- Constants, plans, limits

---

### Infrastructure

**`infrastructure/terraform/`**: Infrastructure as Code.
- `environments/`: Dev, staging, production configs
- `modules/`: Reusable Terraform modules (VPC, RDS, ElastiCache, S3, ECS, ALB)

**`infrastructure/docker/`**: Dockerfiles for each app.

**`infrastructure/scripts/`**: Deployment and maintenance scripts.

---

## 🔒 Architecture Rules

### Module Communication Rules

1. **Controllers** only call their own service
2. **Services** can call other services
3. **Repositories** only access database
4. **No circular dependencies** between modules
5. **No direct repository access** from other modules

### File Organization Rules

1. **One responsibility per file**
2. **Co-locate tests** with source files
3. **Feature-based organization** in frontend
4. **Module-based organization** in backend
5. **Shared code** only in `shared/` or `packages/`

### Naming Conventions

1. **Files**: kebab-case (e.g., `clients.service.ts`)
2. **Classes**: PascalCase (e.g., `ClientsService`)
3. **Functions**: camelCase (e.g., `createClient`)
4. **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
5. **Types/Interfaces**: PascalCase (e.g., `CreateClientDto`)

### Import Rules

1. **Absolute imports** for packages (`@repo/database`)
2. **Relative imports** within same module
3. **No parent directory imports** beyond module boundary
4. **Barrel exports** (`index.ts`) for public APIs

---

## 🚫 Anti-Patterns to Avoid

### 1. Business Logic in Controllers

**Bad:**
```typescript
async createClient(req: Request, res: Response) {
  const client = await prisma.client.create({ data: req.body });
  await prisma.activityEvent.create({ /* ... */ });
  await emailService.send({ /* ... */ });
  res.json(client);
}
```

**Good:**
```typescript
async createClient(req: Request, res: Response) {
  const client = await this.service.createClient(req.user.firmId, req.body);
  res.json(client);
}
```

### 2. Direct Database Access from Controllers

**Bad:**
```typescript
const clients = await prisma.client.findMany();
```

**Good:**
```typescript
const clients = await this.repository.findAll();
```

### 3. Cross-Module Repository Access

**Bad:**
```typescript
// In tasks.service.ts
const client = await clientsRepository.findById(clientId);
```

**Good:**
```typescript
// In tasks.service.ts
const client = await this.clientsService.getClientById(clientId);
```

### 4. Giant Utils Folder

**Bad:**
```
utils/
├── everything.ts (2000 lines)
```

**Good:**
```
utils/
├── logger.ts
├── crypto.ts
├── date.ts
└── errors.ts
```

### 5. Mixing Domain Logic

**Bad:**
```typescript
// In clients.service.ts
await this.invoicesRepository.create(/* ... */);
```

**Good:**
```typescript
// In clients.service.ts
await this.invoicesService.createInvoice(/* ... */);
```

---

## ✅ Validation Checklist

Before starting development, verify:

- [ ] All 6 modules exist (Auth, CRM, Documents, Tasks, Billing, Notifications)
- [ ] All 4 workers exist (Email, Reminders, Invoices, Documents)
- [ ] All 27 database migrations defined
- [ ] All 8 critical fixes included (Queue dashboard, Idempotency, Rate limiting, Soft deletes, Storage abstraction, Domain events, Cache, Audit middleware)
- [ ] All production requirements included (Feature flags, Security audit logs, Email tracking, SaaS billing, Observability)
- [ ] Frontend features match backend modules
- [ ] Test structure covers unit, integration, E2E
- [ ] CI/CD workflows defined
- [ ] Infrastructure as Code ready
- [ ] Documentation complete

---

## 🎯 Development Workflow

### 1. Setup

```bash
# Clone repo
git clone <repo-url>
cd practice-management-saas

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Start Docker services
docker-compose up -d

# Run migrations
npm run migrate

# Seed data
npm run seed

# Start dev servers
npm run dev
```

### 2. Adding a New Feature

```bash
# 1. Create migration
npm run migrate:create add_feature_table

# 2. Update Prisma schema
# Edit packages/database/prisma/schema.prisma

# 3. Generate Prisma client
npm run generate

# 4. Create module files
# apps/api/src/modules/feature/
#   - feature.controller.ts
#   - feature.service.ts
#   - feature.repository.ts
#   - feature.routes.ts
#   - feature.types.ts
#   - feature.validation.ts

# 5. Add tests
# apps/api/src/modules/feature/__tests__/

# 6. Create frontend feature
# apps/web/src/features/feature/

# 7. Run tests
npm run test

# 8. Commit
git add .
git commit -m "feat: add feature"
git push
```

### 3. Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test

# Coverage
npm run test:coverage
```

### 4. Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Rollback
npm run rollback
```

---

## 📊 File Count Summary

- **Total Directories**: 150+
- **Backend Files**: 200+
- **Frontend Files**: 150+
- **Database Migrations**: 27
- **Test Files**: 50+
- **Config Files**: 30+
- **Documentation Files**: 10+

**Total Estimated Files**: 450+

---

## 🚀 Ready for Development

This structure is:
- ✅ Complete for MVP
- ✅ Scalable for 12-24 months
- ✅ Follows best practices
- ✅ Supports 3-5 developers
- ✅ Production-ready
- ✅ Testable
- ✅ Maintainable

**Start coding. Ship in 16 weeks.**

