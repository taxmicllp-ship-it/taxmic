-- =============================================================================
-- Migration: phase0_enums (full schema — all 36 tables, 11 enums)
-- Safety: lock_timeout aborts if a table lock cannot be acquired within 5s
--         statement_timeout aborts any single statement exceeding 30s
-- =============================================================================
SET lock_timeout = '5s';
SET statement_timeout = '30s';

-- CreateEnum
CREATE TYPE "client_status_enum" AS ENUM ('active', 'inactive', 'archived', 'lead');

-- CreateEnum
CREATE TYPE "client_type_enum" AS ENUM ('individual', 'business', 'nonprofit');

-- CreateEnum
CREATE TYPE "task_status_enum" AS ENUM ('new', 'in_progress', 'waiting_client', 'review', 'completed');

-- CreateEnum
CREATE TYPE "task_priority_enum" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "invoice_status_enum" AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_method_enum" AS ENUM ('stripe', 'check', 'cash', 'wire', 'other');

-- CreateEnum
CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "subscription_status_enum" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- CreateEnum
CREATE TYPE "document_visibility_enum" AS ENUM ('internal', 'client');

-- CreateEnum
CREATE TYPE "notification_type_enum" AS ENUM ('task_assigned', 'task_completed', 'invoice_sent', 'invoice_paid', 'document_uploaded', 'comment_added', 'user_invited');

-- CreateEnum
CREATE TYPE "email_event_type_enum" AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained');

-- CreateTable
CREATE TABLE "firms" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "address" TEXT,
    "website" VARCHAR(255),
    "logo_url" VARCHAR(500),
    "timezone" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "firms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firm_settings" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "date_format" VARCHAR(20) NOT NULL DEFAULT 'MM/DD/YYYY',
    "invoice_prefix" VARCHAR(10),
    "invoice_terms" TEXT,
    "invoice_footer" TEXT,
    "logo_url" VARCHAR(500),
    "primary_color" VARCHAR(7),
    "email_from_name" VARCHAR(255),
    "email_reply_to" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firm_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "timezone" VARCHAR(50),
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "desktop_notifications" BOOLEAN NOT NULL DEFAULT true,
    "theme" VARCHAR(20) NOT NULL DEFAULT 'light',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "type" "client_type_enum",
    "status" "client_status_enum" NOT NULL DEFAULT 'active',
    "tax_id" VARCHAR(50),
    "website" VARCHAR(255),
    "notes" TEXT,
    "search_vector" tsvector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "title" VARCHAR(100),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "search_vector" tsvector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_addresses" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "street_line1" VARCHAR(255),
    "street_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "client_id" UUID,
    "parent_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "client_id" UUID,
    "folder_id" UUID,
    "filename" VARCHAR(500) NOT NULL,
    "file_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100),
    "size_bytes" BIGINT NOT NULL,
    "description" TEXT,
    "uploaded_by" UUID,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "search_vector" tsvector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "file_key" VARCHAR(500) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_current" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_permissions" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "visibility" "document_visibility_enum" NOT NULL DEFAULT 'internal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "client_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "task_status_enum" NOT NULL DEFAULT 'new',
    "priority" "task_priority_enum" NOT NULL DEFAULT 'medium',
    "due_date" DATE,
    "completed_at" TIMESTAMP(3),
    "created_by" UUID,
    "search_vector" tsvector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignments" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assigned_by" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "user_id" UUID,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_sequences" (
    "firm_id" UUID NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "invoice_status_enum" NOT NULL DEFAULT 'draft',
    "issue_date" DATE NOT NULL,
    "due_date" DATE,
    "subtotal_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "pdf_url" VARCHAR(500),
    "sent_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "payment_method_enum" NOT NULL,
    "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
    "stripe_payment_intent_id" VARCHAR(255),
    "stripe_charge_id" VARCHAR(255),
    "reference_number" VARCHAR(255),
    "notes" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "notification_type_enum" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" UUID NOT NULL,
    "firm_id" UUID,
    "message_id" VARCHAR(255) NOT NULL,
    "email_to" VARCHAR(255) NOT NULL,
    "email_from" VARCHAR(255) NOT NULL,
    "subject" TEXT,
    "template_name" VARCHAR(100),
    "event_type" "email_event_type_enum" NOT NULL,
    "event_data" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_users" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "client_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_sessions" (
    "id" UUID NOT NULL,
    "client_user_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "price_annual" DECIMAL(10,2) NOT NULL,
    "max_clients" INTEGER,
    "max_users" INTEGER,
    "max_storage_gb" INTEGER,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "subscription_status_enum" NOT NULL DEFAULT 'trialing',
    "stripe_subscription_id" VARCHAR(255),
    "stripe_customer_id" VARCHAR(255),
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMP(3),
    "trial_start" TIMESTAMP(3),
    "trial_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_events" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "from_status" VARCHAR(50),
    "to_status" VARCHAR(50),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "client_id" UUID,
    "actor_user_id" UUID,
    "actor_client_user_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "event_id" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "enabled_globally" BOOLEAN NOT NULL DEFAULT false,
    "rollout_percentage" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firm_feature_flags" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "feature_flag_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "enabled_at" TIMESTAMP(3),
    "enabled_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firm_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_usage" (
    "id" UUID NOT NULL,
    "firm_id" UUID NOT NULL,
    "total_bytes" BIGINT NOT NULL DEFAULT 0,
    "document_count" INTEGER NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failed_jobs" (
    "id" UUID NOT NULL,
    "queue" VARCHAR(100) NOT NULL,
    "job_id" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "resolution_notes" TEXT,

    CONSTRAINT "failed_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "firms_slug_key" ON "firms"("slug");

-- CreateIndex
CREATE INDEX "firms_email_idx" ON "firms"("email");

-- CreateIndex
CREATE INDEX "firms_deleted_at_idx" ON "firms"("deleted_at");

-- CreateIndex
CREATE INDEX "users_firm_id_idx" ON "users"("firm_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_firm_id_email_key" ON "users"("firm_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_firm_id_idx" ON "user_roles"("firm_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_firm_id_key" ON "user_roles"("user_id", "role_id", "firm_id");

-- CreateIndex
CREATE UNIQUE INDEX "firm_settings_firm_id_key" ON "firm_settings"("firm_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "clients_firm_id_idx" ON "clients"("firm_id");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_type_idx" ON "clients"("type");

-- CreateIndex
CREATE INDEX "clients_deleted_at_idx" ON "clients"("deleted_at");

-- CreateIndex
CREATE INDEX "contacts_firm_id_idx" ON "contacts"("firm_id");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_deleted_at_idx" ON "contacts"("deleted_at");

-- CreateIndex
CREATE INDEX "client_contacts_firm_id_idx" ON "client_contacts"("firm_id");

-- CreateIndex
CREATE INDEX "client_contacts_client_id_idx" ON "client_contacts"("client_id");

-- CreateIndex
CREATE INDEX "client_contacts_contact_id_idx" ON "client_contacts"("contact_id");

-- CreateIndex
CREATE INDEX "client_contacts_is_primary_idx" ON "client_contacts"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "client_contacts_firm_id_client_id_contact_id_key" ON "client_contacts"("firm_id", "client_id", "contact_id");

-- CreateIndex
CREATE INDEX "client_addresses_firm_id_idx" ON "client_addresses"("firm_id");

-- CreateIndex
CREATE INDEX "client_addresses_client_id_idx" ON "client_addresses"("client_id");

-- CreateIndex
CREATE INDEX "client_addresses_type_idx" ON "client_addresses"("type");

-- CreateIndex
CREATE INDEX "client_addresses_is_primary_idx" ON "client_addresses"("is_primary");

-- CreateIndex
CREATE INDEX "folders_firm_id_idx" ON "folders"("firm_id");

-- CreateIndex
CREATE INDEX "folders_client_id_idx" ON "folders"("client_id");

-- CreateIndex
CREATE INDEX "folders_parent_id_idx" ON "folders"("parent_id");

-- CreateIndex
CREATE INDEX "folders_deleted_at_idx" ON "folders"("deleted_at");

-- CreateIndex
CREATE INDEX "documents_firm_id_idx" ON "documents"("firm_id");

-- CreateIndex
CREATE INDEX "documents_client_id_idx" ON "documents"("client_id");

-- CreateIndex
CREATE INDEX "documents_folder_id_idx" ON "documents"("folder_id");

-- CreateIndex
CREATE INDEX "documents_uploaded_by_idx" ON "documents"("uploaded_by");

-- CreateIndex
CREATE INDEX "documents_created_at_idx" ON "documents"("created_at");

-- CreateIndex
CREATE INDEX "documents_deleted_at_idx" ON "documents"("deleted_at");

-- CreateIndex
CREATE INDEX "documents_firm_id_client_id_idx" ON "documents"("firm_id", "client_id");

-- CreateIndex
CREATE INDEX "document_versions_document_id_idx" ON "document_versions"("document_id");

-- CreateIndex
CREATE INDEX "document_versions_uploaded_by_idx" ON "document_versions"("uploaded_by");

-- CreateIndex
CREATE INDEX "document_versions_is_current_idx" ON "document_versions"("is_current");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_document_id_version_number_key" ON "document_versions"("document_id", "version_number");

-- CreateIndex
CREATE INDEX "document_permissions_document_id_idx" ON "document_permissions"("document_id");

-- CreateIndex
CREATE INDEX "document_permissions_visibility_idx" ON "document_permissions"("visibility");

-- CreateIndex
CREATE INDEX "tasks_firm_id_idx" ON "tasks"("firm_id");

-- CreateIndex
CREATE INDEX "tasks_client_id_idx" ON "tasks"("client_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "tasks_created_by_idx" ON "tasks"("created_by");

-- CreateIndex
CREATE INDEX "tasks_deleted_at_idx" ON "tasks"("deleted_at");

-- CreateIndex
CREATE INDEX "tasks_firm_id_status_due_date_idx" ON "tasks"("firm_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "task_assignments_task_id_idx" ON "task_assignments"("task_id");

-- CreateIndex
CREATE INDEX "task_assignments_user_id_idx" ON "task_assignments"("user_id");

-- CreateIndex
CREATE INDEX "task_assignments_assigned_by_idx" ON "task_assignments"("assigned_by");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignments_task_id_user_id_key" ON "task_assignments"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "task_comments_task_id_idx" ON "task_comments"("task_id");

-- CreateIndex
CREATE INDEX "task_comments_user_id_idx" ON "task_comments"("user_id");

-- CreateIndex
CREATE INDEX "task_comments_created_at_idx" ON "task_comments"("created_at");

-- CreateIndex
CREATE INDEX "task_comments_deleted_at_idx" ON "task_comments"("deleted_at");

-- CreateIndex
CREATE INDEX "invoices_firm_id_idx" ON "invoices"("firm_id");

-- CreateIndex
CREATE INDEX "invoices_client_id_idx" ON "invoices"("client_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");

-- CreateIndex
CREATE INDEX "invoices_deleted_at_idx" ON "invoices"("deleted_at");

-- CreateIndex
CREATE INDEX "invoices_firm_id_status_due_date_idx" ON "invoices"("firm_id", "status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_firm_id_number_key" ON "invoices"("firm_id", "number");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_items_sort_order_idx" ON "invoice_items"("sort_order");

-- CreateIndex
CREATE INDEX "payments_firm_id_idx" ON "payments"("firm_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_stripe_payment_intent_id_idx" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "payments_paid_at_idx" ON "payments"("paid_at");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");

-- CreateIndex
CREATE INDEX "notifications_firm_id_idx" ON "notifications"("firm_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "email_events_firm_id_idx" ON "email_events"("firm_id");

-- CreateIndex
CREATE INDEX "email_events_message_id_idx" ON "email_events"("message_id");

-- CreateIndex
CREATE INDEX "email_events_email_to_idx" ON "email_events"("email_to");

-- CreateIndex
CREATE INDEX "email_events_event_type_idx" ON "email_events"("event_type");

-- CreateIndex
CREATE INDEX "email_events_created_at_idx" ON "email_events"("created_at");

-- CreateIndex
CREATE INDEX "email_events_firm_id_created_at_idx" ON "email_events"("firm_id", "created_at");

-- CreateIndex
CREATE INDEX "client_users_client_id_idx" ON "client_users"("client_id");

-- CreateIndex
CREATE INDEX "client_users_email_idx" ON "client_users"("email");

-- CreateIndex
CREATE INDEX "client_users_deleted_at_idx" ON "client_users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_client_id_email_key" ON "client_users"("client_id", "email");

-- CreateIndex
CREATE INDEX "portal_sessions_client_user_id_idx" ON "portal_sessions"("client_user_id");

-- CreateIndex
CREATE INDEX "portal_sessions_token_idx" ON "portal_sessions"("token");

-- CreateIndex
CREATE INDEX "portal_sessions_expires_at_idx" ON "portal_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE INDEX "plans_is_active_idx" ON "plans"("is_active");

-- CreateIndex
CREATE INDEX "plans_sort_order_idx" ON "plans"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_firm_id_key" ON "subscriptions"("firm_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE INDEX "subscription_events_subscription_id_idx" ON "subscription_events"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_events_event_type_idx" ON "subscription_events"("event_type");

-- CreateIndex
CREATE INDEX "subscription_events_created_at_idx" ON "subscription_events"("created_at");

-- CreateIndex
CREATE INDEX "activity_events_firm_id_idx" ON "activity_events"("firm_id");

-- CreateIndex
CREATE INDEX "activity_events_client_id_idx" ON "activity_events"("client_id");

-- CreateIndex
CREATE INDEX "activity_events_actor_user_id_idx" ON "activity_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "activity_events_actor_client_user_id_idx" ON "activity_events"("actor_client_user_id");

-- CreateIndex
CREATE INDEX "activity_events_event_type_idx" ON "activity_events"("event_type");

-- CreateIndex
CREATE INDEX "activity_events_entity_type_idx" ON "activity_events"("entity_type");

-- CreateIndex
CREATE INDEX "activity_events_created_at_idx" ON "activity_events"("created_at");

-- CreateIndex
CREATE INDEX "activity_events_firm_id_created_at_idx" ON "activity_events"("firm_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_events_client_id_created_at_idx" ON "activity_events"("client_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_event_id_key" ON "webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "webhook_events_type_idx" ON "webhook_events"("type");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "webhook_events_received_at_idx" ON "webhook_events"("received_at");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");

-- CreateIndex
CREATE INDEX "firm_feature_flags_firm_id_idx" ON "firm_feature_flags"("firm_id");

-- CreateIndex
CREATE INDEX "firm_feature_flags_feature_flag_id_idx" ON "firm_feature_flags"("feature_flag_id");

-- CreateIndex
CREATE UNIQUE INDEX "firm_feature_flags_firm_id_feature_flag_id_key" ON "firm_feature_flags"("firm_id", "feature_flag_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_usage_firm_id_key" ON "storage_usage"("firm_id");

-- CreateIndex
CREATE INDEX "failed_jobs_queue_idx" ON "failed_jobs"("queue");

-- CreateIndex
CREATE INDEX "failed_jobs_failed_at_idx" ON "failed_jobs"("failed_at");

-- CreateIndex
CREATE INDEX "failed_jobs_resolved_at_idx" ON "failed_jobs"("resolved_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_settings" ADD CONSTRAINT "firm_settings_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_addresses" ADD CONSTRAINT "client_addresses_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_addresses" ADD CONSTRAINT "client_addresses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_sequences" ADD CONSTRAINT "invoice_sequences_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_client_user_id_fkey" FOREIGN KEY ("actor_client_user_id") REFERENCES "client_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_feature_flags" ADD CONSTRAINT "firm_feature_flags_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_feature_flags" ADD CONSTRAINT "firm_feature_flags_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "feature_flags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_feature_flags" ADD CONSTRAINT "firm_feature_flags_enabled_by_fkey" FOREIGN KEY ("enabled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_usage" ADD CONSTRAINT "storage_usage_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failed_jobs" ADD CONSTRAINT "failed_jobs_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- CUSTOM SQL — Prisma cannot express these. Must be applied manually.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Partial unique indexes (soft-delete aware)
--    Prisma @@unique cannot express WHERE clauses.
-- ---------------------------------------------------------------------------

-- Drop the non-partial unique indexes Prisma created, replace with partial ones
DROP INDEX IF EXISTS "users_firm_id_email_key";
CREATE UNIQUE INDEX "users_firm_id_email_key"
  ON "users"("firm_id", "email")
  WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS "invoices_firm_id_number_key";
CREATE UNIQUE INDEX "invoices_firm_id_number_key"
  ON "invoices"("firm_id", "number")
  WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS "client_users_client_id_email_key";
CREATE UNIQUE INDEX "client_users_client_id_email_key"
  ON "client_users"("client_id", "email")
  WHERE deleted_at IS NULL;

-- contacts: partial unique on nullable email column
CREATE UNIQUE INDEX "contacts_firm_id_email_unique"
  ON "contacts"("firm_id", "email")
  WHERE email IS NOT NULL AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. GIN indexes for full-text search (tsvector columns)
--    Plain CREATE INDEX here (tables are empty at migration time, no lock risk).
--    In production on live tables with data, use CREATE INDEX CONCURRENTLY
--    as a standalone statement outside a transaction.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "clients_search_idx"
  ON "clients" USING GIN("search_vector");

CREATE INDEX IF NOT EXISTS "contacts_search_idx"
  ON "contacts" USING GIN("search_vector");

CREATE INDEX IF NOT EXISTS "documents_search_idx"
  ON "documents" USING GIN("search_vector");

CREATE INDEX IF NOT EXISTS "tasks_search_idx"
  ON "tasks" USING GIN("search_vector");

-- ---------------------------------------------------------------------------
-- 3. Partial index: current document version
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "document_versions_current_idx"
  ON "document_versions"("document_id")
  WHERE is_current = true;

-- ---------------------------------------------------------------------------
-- 4. Partial index: unresolved failed jobs
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "failed_jobs_unresolved_idx"
  ON "failed_jobs"("failed_at")
  WHERE resolved_at IS NULL;

-- ---------------------------------------------------------------------------
-- 5. CHECK constraints
-- ---------------------------------------------------------------------------

-- invoice_items: positive values
ALTER TABLE "invoice_items"
  ADD CONSTRAINT "invoice_items_quantity_positive" CHECK (quantity > 0),
  ADD CONSTRAINT "invoice_items_unit_price_nonneg"  CHECK (unit_price >= 0),
  ADD CONSTRAINT "invoice_items_amount_nonneg"      CHECK (amount >= 0);

-- invoices: amount integrity
ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_total_amount_nonneg" CHECK (total_amount >= 0),
  ADD CONSTRAINT "invoices_paid_amount_nonneg"  CHECK (paid_amount >= 0),
  ADD CONSTRAINT "invoices_paid_lte_total"      CHECK (paid_amount <= total_amount);

-- activity_events: XOR actor constraint
-- Exactly one of actor_user_id or actor_client_user_id must be set
ALTER TABLE "activity_events"
  ADD CONSTRAINT "activity_events_actor_xor" CHECK (
    (actor_user_id IS NOT NULL AND actor_client_user_id IS NULL)
    OR
    (actor_user_id IS NULL AND actor_client_user_id IS NOT NULL)
  );

-- feature_flags: rollout percentage range
ALTER TABLE "feature_flags"
  ADD CONSTRAINT "feature_flags_rollout_range" CHECK (
    rollout_percentage >= 0 AND rollout_percentage <= 100
  );

-- ---------------------------------------------------------------------------
-- 6. Atomic invoice number generation function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_next_invoice_number(p_firm_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO invoice_sequences (firm_id, last_number, created_at, updated_at)
    VALUES (p_firm_id, 1, now(), now())
    ON CONFLICT (firm_id) DO UPDATE
      SET last_number = invoice_sequences.last_number + 1,
          updated_at  = now()
    RETURNING last_number INTO v_next;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 7. updated_at auto-update trigger (applied to all mutable tables)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table that has updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'firms','users','firm_settings','user_settings',
    'clients','contacts','client_addresses',
    'folders','documents','document_permissions',
    'tasks','task_comments',
    'invoices','invoice_items','invoice_sequences','payments',
    'client_users',
    'plans','subscriptions',
    'feature_flags','storage_usage'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER set_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Storage usage trigger (auto-update on document insert/delete)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO storage_usage (firm_id, total_bytes, document_count, last_calculated_at, created_at, updated_at)
      VALUES (NEW.firm_id, NEW.size_bytes, 1, now(), now(), now())
      ON CONFLICT (firm_id) DO UPDATE
        SET total_bytes        = storage_usage.total_bytes + NEW.size_bytes,
            document_count     = storage_usage.document_count + 1,
            last_calculated_at = now(),
            updated_at         = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE storage_usage
      SET total_bytes        = GREATEST(0, total_bytes - OLD.size_bytes),
          document_count     = GREATEST(0, document_count - 1),
          last_calculated_at = now(),
          updated_at         = now()
      WHERE firm_id = OLD.firm_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "documents_storage_usage_update"
  AFTER INSERT OR DELETE ON "documents"
  FOR EACH ROW EXECUTE FUNCTION update_storage_usage();

-- ---------------------------------------------------------------------------
-- 9. Full-text search triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_clients_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.email, '') || ' ' ||
    coalesce(NEW.notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "clients_search_vector_update"
  BEFORE INSERT OR UPDATE ON "clients"
  FOR EACH ROW EXECUTE FUNCTION update_clients_search_vector();

CREATE OR REPLACE FUNCTION update_contacts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.email, '') || ' ' ||
    coalesce(NEW.notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "contacts_search_vector_update"
  BEFORE INSERT OR UPDATE ON "contacts"
  FOR EACH ROW EXECUTE FUNCTION update_contacts_search_vector();

CREATE OR REPLACE FUNCTION update_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.filename, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "documents_search_vector_update"
  BEFORE INSERT OR UPDATE ON "documents"
  FOR EACH ROW EXECUTE FUNCTION update_documents_search_vector();

CREATE OR REPLACE FUNCTION update_tasks_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "tasks_search_vector_update"
  BEFORE INSERT OR UPDATE ON "tasks"
  FOR EACH ROW EXECUTE FUNCTION update_tasks_search_vector();

-- ---------------------------------------------------------------------------
-- 10. Row Level Security
-- ---------------------------------------------------------------------------

-- Enable RLS on all tenant-owned tables
ALTER TABLE "users"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "firm_settings"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_settings"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contacts"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_contacts"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_addresses"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "folders"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_versions"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_assignments"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_comments"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_sequences"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_items"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_events"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_events"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "firm_feature_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storage_usage"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_users"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "portal_sessions"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions"      ENABLE ROW LEVEL SECURITY;

-- RLS policies: firm isolation via app.current_firm_id session variable
-- Direct firm_id tables
CREATE POLICY "firms_isolation"           ON "users"              USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "user_roles_isolation"      ON "user_roles"         USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "firm_settings_isolation"   ON "firm_settings"      USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "clients_isolation"         ON "clients"            USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "contacts_isolation"        ON "contacts"           USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "client_contacts_isolation" ON "client_contacts"    USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "client_addresses_isolation" ON "client_addresses"  USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "folders_isolation"         ON "folders"            USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "documents_isolation"       ON "documents"          USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "tasks_isolation"           ON "tasks"              USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "invoice_seq_isolation"     ON "invoice_sequences"  USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "invoices_isolation"        ON "invoices"           USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "payments_isolation"        ON "payments"           USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "notifications_isolation"   ON "notifications"      USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "activity_events_isolation" ON "activity_events"    USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "firm_flags_isolation"      ON "firm_feature_flags" USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "storage_usage_isolation"   ON "storage_usage"      USING (firm_id = current_setting('app.current_firm_id', true)::uuid);
CREATE POLICY "subscriptions_isolation"   ON "subscriptions"      USING (firm_id = current_setting('app.current_firm_id', true)::uuid);

-- Indirect tables: isolated via join to parent
CREATE POLICY "user_settings_isolation"   ON "user_settings"
  USING (user_id IN (SELECT id FROM users WHERE firm_id = current_setting('app.current_firm_id', true)::uuid));

CREATE POLICY "document_versions_isolation" ON "document_versions"
  USING (document_id IN (SELECT id FROM documents WHERE firm_id = current_setting('app.current_firm_id', true)::uuid));

CREATE POLICY "document_permissions_isolation" ON "document_permissions"
  USING (document_id IN (SELECT id FROM documents WHERE firm_id = current_setting('app.current_firm_id', true)::uuid));

CREATE POLICY "task_assignments_isolation" ON "task_assignments"
  USING (task_id IN (SELECT id FROM tasks WHERE firm_id = current_setting('app.current_firm_id', true)::uuid));

CREATE POLICY "task_comments_isolation"   ON "task_comments"
  USING (task_id IN (SELECT id FROM tasks WHERE firm_id = current_setting('app.current_firm_id', true)::uuid));

CREATE POLICY "invoice_items_isolation"   ON "invoice_items"
  USING (invoice_id IN (SELECT id FROM invoices WHERE firm_id = current_setting('app.current_firm_id', true)::uuid));

CREATE POLICY "email_events_isolation"    ON "email_events"
  USING (firm_id IS NULL OR firm_id = current_setting('app.current_firm_id', true)::uuid);

-- Portal: isolated via client → firm
CREATE POLICY "client_users_isolation"    ON "client_users"
  USING (client_id IN (SELECT id FROM clients WHERE firm_id = current_setting('app.current_firm_id', true)::uuid));

CREATE POLICY "portal_sessions_isolation" ON "portal_sessions"
  USING (client_user_id IN (
    SELECT cu.id FROM client_users cu
    JOIN clients c ON c.id = cu.client_id
    WHERE c.firm_id = current_setting('app.current_firm_id', true)::uuid
  ));

-- ---------------------------------------------------------------------------
-- 11. Seed data: system roles, permissions, and subscription plans
-- ---------------------------------------------------------------------------

INSERT INTO "roles" (id, name, description, is_system, created_at) VALUES
  (gen_random_uuid(), 'owner',      'Firm owner — full access',           true, now()),
  (gen_random_uuid(), 'admin',      'Firm admin — manage users',          true, now()),
  (gen_random_uuid(), 'member',     'Standard staff member',              true, now()),
  (gen_random_uuid(), 'contractor', 'Limited access to assigned tasks',   true, now()),
  (gen_random_uuid(), 'viewer',     'Read-only access',                   true, now())
ON CONFLICT (name) DO NOTHING;

INSERT INTO "permissions" (id, name, resource, action, created_at) VALUES
  (gen_random_uuid(), 'clients:read',     'clients',   'read',   now()),
  (gen_random_uuid(), 'clients:write',    'clients',   'write',  now()),
  (gen_random_uuid(), 'clients:delete',   'clients',   'delete', now()),
  (gen_random_uuid(), 'documents:read',   'documents', 'read',   now()),
  (gen_random_uuid(), 'documents:write',  'documents', 'write',  now()),
  (gen_random_uuid(), 'documents:delete', 'documents', 'delete', now()),
  (gen_random_uuid(), 'tasks:read',       'tasks',     'read',   now()),
  (gen_random_uuid(), 'tasks:write',      'tasks',     'write',  now()),
  (gen_random_uuid(), 'tasks:delete',     'tasks',     'delete', now()),
  (gen_random_uuid(), 'invoices:read',    'invoices',  'read',   now()),
  (gen_random_uuid(), 'invoices:write',   'invoices',  'write',  now()),
  (gen_random_uuid(), 'invoices:send',    'invoices',  'send',   now()),
  (gen_random_uuid(), 'users:read',       'users',     'read',   now()),
  (gen_random_uuid(), 'users:write',      'users',     'write',  now()),
  (gen_random_uuid(), 'billing:manage',   'billing',   'manage', now())
ON CONFLICT (name) DO NOTHING;

INSERT INTO "plans" (id, name, slug, description, price_monthly, price_annual, max_clients, max_users, max_storage_gb, is_active, sort_order, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Starter',      'starter',      'For solo practitioners',  29.00,   290.00,  50,   3,    10,   true, 1, now(), now()),
  (gen_random_uuid(), 'Professional', 'professional', 'For growing firms',       99.00,   990.00,  250,  10,   50,   true, 2, now(), now()),
  (gen_random_uuid(), 'Enterprise',   'enterprise',   'For large practices',     299.00, 2990.00,  NULL, NULL, NULL, true, 3, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- End of migration
-- =============================================================================
