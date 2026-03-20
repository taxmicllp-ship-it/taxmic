import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../require-admin';
import { AppError } from '../../utils/errors';

// Feature: plan-sync, Property 1: Non-admin role rejection

function makeReq(role: string | undefined): Partial<Request> {
  return { user: role !== undefined ? ({ role } as any) : undefined };
}

describe('requireAdmin middleware', () => {
  it('calls next() without error when role is admin', () => {
    const req = makeReq('admin');
    const next = vi.fn();
    requireAdmin(req as Request, {} as Response, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next(AppError 403 FORBIDDEN) when role is undefined', () => {
    const req = makeReq(undefined);
    const next = vi.fn();
    requireAdmin(req as Request, {} as Response, next as NextFunction);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  /**
   * Validates: Requirements 2.2
   *
   * Property 1: Non-admin role rejection
   * For any string value of req.user.role that is not exactly 'admin',
   * requireAdmin must call next() with a 403 AppError (FORBIDDEN)
   * and must never call next() without an error.
   */
  it('Property 1: rejects any role that is not exactly "admin"', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'admin'),
        (role) => {
          const req = makeReq(role);
          const next = vi.fn();
          requireAdmin(req as Request, {} as Response, next as NextFunction);

          expect(next).toHaveBeenCalledTimes(1);
          const err = next.mock.calls[0][0];
          expect(err).toBeInstanceOf(AppError);
          expect((err as AppError).statusCode).toBe(403);
          expect((err as AppError).code).toBe('FORBIDDEN');
        }
      ),
      { numRuns: 200 }
    );
  });
});
