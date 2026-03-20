import { Request, Response, NextFunction } from 'express';
import { prisma } from '@repo/database';
import { logger } from '../utils/logger';

/**
 * Sets req.tenantId from the authenticated user's firmId.
 * Also sets the PostgreSQL session variable `app.current_firm_id` so that
 * Row Level Security policies can enforce tenant isolation at the DB level.
 *
 * NOTE: SET LOCAL only applies within a transaction. For RLS to work on
 * every query, we use prisma.$executeRawUnsafe which runs outside a
 * transaction — this sets it for the connection's current session.
 * In production with a connection pool (PgBouncer), use transaction mode
 * and SET LOCAL inside each transaction instead.
 */
export function tenantContext(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.firmId) {
    return next();
  }

  req.tenantId = req.user.firmId;

  // Set PostgreSQL session variable for RLS policies.
  // Fire-and-forget — if this fails, application-level filtering still protects data.
  prisma.$executeRawUnsafe(
    `SET app.current_firm_id = '${req.user.firmId.replace(/'/g, "''")}'`
  ).catch((err) => {
    logger.warn({ event: 'TENANT_CONTEXT_SET_FAILED', firmId: req.user!.firmId, error: err });
  });

  next();
}
