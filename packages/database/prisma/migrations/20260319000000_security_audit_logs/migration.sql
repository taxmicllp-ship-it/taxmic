-- CreateTable: security_audit_logs
CREATE TABLE "security_audit_logs" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "firm_id"    UUID,
    "user_id"    UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "metadata"   JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "security_audit_logs" ADD CONSTRAINT "security_audit_logs_firm_id_fkey"
    FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_audit_logs" ADD CONSTRAINT "security_audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "security_audit_logs_firm_id_idx" ON "security_audit_logs"("firm_id");
CREATE INDEX "security_audit_logs_user_id_idx" ON "security_audit_logs"("user_id");
CREATE INDEX "security_audit_logs_event_type_idx" ON "security_audit_logs"("event_type");
CREATE INDEX "security_audit_logs_created_at_idx" ON "security_audit_logs"("created_at");
