import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Shared Stripe mock methods — defined outside so all instances share them
const mockProductsCreate = vi.fn();
const mockPricesCreate = vi.fn();
const mockPricesUpdate = vi.fn();

// Mock stripe module — every `new Stripe(...)` returns the same mock object
vi.mock('stripe', () => {
  return {
    default: vi.fn(() => ({
      products: { create: mockProductsCreate },
      prices: { create: mockPricesCreate, update: mockPricesUpdate },
    })),
  };
});

// Mock config so Stripe is always "configured"
vi.mock('../../../../config', () => ({
  config: { stripeSecretKey: 'sk_test_mock' },
}));

// Mock plansRepository
vi.mock('../plans.repository', () => ({
  plansRepository: {
    findAll_admin: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  },
}));

import { plansService } from '../plans.service';
import { plansRepository } from '../plans.repository';

// ─── Property 4 ──────────────────────────────────────────────────────────────
// Feature: plan-sync, Property 4: createPlan atomicity — no partial state on Stripe error

describe('PlansService — Property 4: createPlan atomicity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirements 4.4
   *
   * For any createPlan call where Stripe returns an error (at either
   * products.create or prices.create), no new row must be inserted into the
   * plans table. The database must remain unchanged.
   */
  it('Property 4: no DB write when stripe.products.create throws', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          price_monthly: fc.float({ min: 1, max: 9999, noNaN: true }),
          price_annual: fc.float({ min: 1, max: 9999, noNaN: true }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        }),
        async (dto) => {
          vi.clearAllMocks();
          mockProductsCreate.mockRejectedValueOnce(new Error('Stripe products.create error'));

          await expect(plansService.createPlan(dto)).rejects.toThrow();

          // DB create must never have been called
          expect(plansRepository.create).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4: no DB write when stripe.prices.create throws', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          price_monthly: fc.float({ min: 1, max: 9999, noNaN: true }),
          price_annual: fc.float({ min: 1, max: 9999, noNaN: true }),
        }),
        async (dto) => {
          vi.clearAllMocks();
          mockProductsCreate.mockResolvedValueOnce({ id: 'prod_mock' });
          mockPricesCreate.mockRejectedValueOnce(new Error('Stripe prices.create error'));

          await expect(plansService.createPlan(dto)).rejects.toThrow();

          // DB create must never have been called
          expect(plansRepository.create).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 5 ──────────────────────────────────────────────────────────────
// Feature: plan-sync, Property 5: createPlan round-trip — Stripe IDs persisted

describe('PlansService — Property 5: createPlan round-trip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirements 4.1, 4.2, 4.3
   *
   * For any valid CreatePlanDto, after plansService.createPlan() succeeds, the
   * returned plan row must have stripe_product_id equal to the ID returned by
   * stripe.products.create() and stripe_price_id equal to the ID returned by
   * stripe.prices.create().
   */
  it('Property 5: returned plan has stripe_product_id and stripe_price_id matching Stripe responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          price_monthly: fc.float({ min: 1, max: 9999, noNaN: true }),
          price_annual: fc.float({ min: 1, max: 9999, noNaN: true }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        }),
        // Generate distinct Stripe IDs
        fc.string({ minLength: 5, maxLength: 30 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 5, maxLength: 30 }).filter((s) => s.trim().length > 0),
        async (dto, mockProductId, mockPriceId) => {
          vi.clearAllMocks();

          mockProductsCreate.mockResolvedValueOnce({ id: mockProductId });
          mockPricesCreate.mockResolvedValueOnce({ id: mockPriceId });

          const expectedPlan = {
            ...dto,
            stripe_product_id: mockProductId,
            stripe_price_id: mockPriceId,
            id: 'plan-uuid',
            is_active: true,
          };
          (plansRepository.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(expectedPlan);

          const result = await plansService.createPlan(dto);

          // Stripe IDs must match what Stripe returned
          expect(result.stripe_product_id).toBe(mockProductId);
          expect(result.stripe_price_id).toBe(mockPriceId);

          // Repository must have been called with the correct IDs
          expect(plansRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
              stripe_product_id: mockProductId,
              stripe_price_id: mockPriceId,
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 6 ──────────────────────────────────────────────────────────────
// Feature: plan-sync, Property 6: deactivatePlan sets is_active false and archives Stripe price

describe('PlansService — Property 6: deactivatePlan side effects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirements 3.3, 4.8
   *
   * For any active plan, after plansService.deactivatePlan(id) completes, the
   * plan row must have is_active = false and stripe.prices.update must have been
   * called with { active: false } on the plan's stripe_price_id.
   */
  it('Property 6: deactivatePlan sets is_active=false and calls stripe.prices.update with { active: false }', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an active plan with a stripe_price_id
        fc.record({
          id: fc.uuid(),
          stripe_price_id: fc
            .string({ minLength: 5, maxLength: 30 })
            .filter((s) => s.trim().length > 0)
            .map((s) => `price_${s}`),
          stripe_product_id: fc
            .string({ minLength: 5, maxLength: 30 })
            .filter((s) => s.trim().length > 0)
            .map((s) => `prod_${s}`),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          price_monthly: fc.float({ min: 1, max: 9999, noNaN: true }),
          price_annual: fc.float({ min: 1, max: 9999, noNaN: true }),
          is_active: fc.constant(true),
        }),
        async (activePlan) => {
          vi.clearAllMocks();

          mockPricesUpdate.mockResolvedValueOnce({ id: activePlan.stripe_price_id, active: false });

          const deactivatedPlan = { ...activePlan, is_active: false };
          (plansRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(activePlan);
          (plansRepository.deactivate as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deactivatedPlan);

          const result = await plansService.deactivatePlan(activePlan.id);

          // Returned plan must have is_active = false
          expect(result.is_active).toBe(false);

          // stripe.prices.update must have been called with { active: false }
          expect(mockPricesUpdate).toHaveBeenCalledWith(
            activePlan.stripe_price_id,
            { active: false }
          );

          // plansRepository.deactivate must have been called with the plan id
          expect(plansRepository.deactivate).toHaveBeenCalledWith(activePlan.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
