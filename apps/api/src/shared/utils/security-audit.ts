import { PrismaClient } from '@repo/database';
import { logger } from './logger';

const prisma = new PrismaClient();

export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'register'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'password_changed';

interface LogSecurityEventOptions {
  eventType: SecurityEventType;
  firmId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logSecurityEvent(opts: LogSecurityEventOptions): Promise<void> {
  try {
    await prisma.security_audit_logs.create({
      data: {
        event_type: opts.eventType,
        firm_id: opts.firmId ?? null,
        user_id: opts.userId ?? null,
        ip_address: opts.ipAddress ?? null,
        user_agent: opts.userAgent ?? null,
        metadata: opts.metadata ? (opts.metadata as any) : undefined,
      },
    });
  } catch (err) {
    // Non-blocking — log but never throw
    logger.error('Failed to write security audit log', { err, eventType: opts.eventType });
  }
}
