// Feature: plan-sync, Property 7: GET /admin/plans returns all plans including inactive
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import express from 'express';
import * as http from 'node:http';

// Mock authenticate and requireAdmin to call next() immediately
vi.mock('../../../../shared/middleware/authenticate', () => ({
  authenticate: vi.fn((_req: any, _res: any, next: any) => next()),
}));

vi.mock('../../../../shared/middleware/require-admin', () => ({
  requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
}));

// Mock plansService
vi.mock('../plans.service', () => ({
  plansService: {
    listAllPlans: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deactivatePlan: vi.fn(),
  },
}));

import { plansService } from '../plans.service';
import plansRouter from '../plans.routes';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(plansRouter);
  return app;
}

function httpGet(server: http.Server, path: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as { port: number };
    const req = http.request({ host: '127.0.0.1', port: addr.port, path, method: 'GET' }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 0, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode ?? 0, body: raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ─── Property 7 ──────────────────────────────────────────────────────────────
// Feature: plan-sync, Property 7: GET /admin/plans returns all plans including inactive

describe('GET /admin/plans — Property 7: returns all plans including inactive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirements 5.3
   *
   * For any set of plans in the database (mix of active and inactive),
   * GET /admin/plans must return all of them. The response must not filter
   * out inactive plans.
   */
  it('Property 7: response array length equals total plan count regardless of is_active', async () => {
    const app = buildApp();
    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
      await fc.assert(
        fc.asyncProperty(
          // Generate an array of plans with mixed active/inactive status
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              slug: fc.string({ minLength: 1, maxLength: 50 }),
              price_monthly: fc.float({ min: 1, max: 9999, noNaN: true }),
              price_annual: fc.float({ min: 1, max: 9999, noNaN: true }),
              is_active: fc.boolean(),
              stripe_product_id: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: null }),
              stripe_price_id: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: null }),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (plans) => {
            vi.clearAllMocks();
            (plansService.listAllPlans as ReturnType<typeof vi.fn>).mockResolvedValueOnce(plans);

            const { status, body } = await httpGet(server, '/admin/plans');

            expect(status).toBe(200);
            expect(Array.isArray(body)).toBe(true);
            // All plans returned — active and inactive alike
            expect((body as unknown[]).length).toBe(plans.length);
          }
        ),
        { numRuns: 100 }
      );
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
  });
});
