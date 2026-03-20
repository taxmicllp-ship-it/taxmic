import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Feature: plan-sync, Property 3: subscriptions.service price lookup uses column

// Shared Stripe mock methods
const mockCustomersCreate = vi.fn();
const mockPaymentMethodsAttach = vi.fn();
const mockCustomersUpdate = vi.fn();
const mockSubscriptionsCreate = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
const mockSubscriptionsUpdate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    customers: { create: mockCustomersCreate, update: mockCustomersUpdate },
    paymentMethods: { attach: mockPaymentMethodsAttach },
    subscriptions: {
      create: mockSubscriptionsCreate,
      retrieve: mockSubscriptionsRetrieve,
      update: mockSubscriptionsUpdate,
    },
    checkout: { sessions: { create: mockCheckoutSessionsCreate } },
  })),
}));

vi.mock('../../../../config', () => ({
  config: { stripeSecretKey: 'sk_test_mock', frontendUrl: 'http://localhost:3000' },
}));

vi.mock('@repo/database', () => ({
  prisma: {
    firms: {
      findUnique: vi.fn().mockResolvedValue({ email: 'firm@example.com', name: 'Test Firm' }),
    },
  },
}));

vi.mock('../plans.repository', () => ({
  plansRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../subscriptions.repository', () => ({
  subscriptionsRepository: {
    findByFirmId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    createEvent: vi.fn(),
  },
}));

import { subscriptionsService } from '../subscriptions.service';
import { plansRepository } from '../plans.repository';
import { subscriptionsRepository } from '../subscriptions.repository';

// ─── Property 3 ──────────────────────────────────────────────────────────────
// Feature: plan-sync, Property 3: subscriptions.service price lookup uses column

/**
 * Validates: Requirements 1.7
 *
 * For any plan record, when subscriptionsService reads stripe_price_id to
 * create or update a subscription, it must read from plan.stripe_price_id
 * (the dedicated column) and not from plan.features. If stripe_price_id is
 * null, the service must throw PLAN_MISCONFIGURED.
 */
describe('SubscriptionsService — Property 3: price lookup uses column', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (subscriptionsRepository.findByFirmId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (subscriptionsRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'sub-1' });
    (subscriptionsRepository.createEvent as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  // ── 3a: createSubscription reads plan.stripe_price_id ──────────────────────
  it('Property 3a: createSubscription uses plan.stripe_price_id column (not features)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          stripe_price_id: fc
            .string({ minLength: 5, maxLength: 30 })
            .filter((s) => s.trim().length > 0)
            .map((s) => `price_${s}`),
          // features intentionally does NOT contain stripe_price_id
          features: fc.constant(null),
          is_active: fc.constant(true),
        }),
        async (plan) => {
          vi.clearAllMocks();
          (subscriptionsRepository.findByFirmId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
          (subscriptionsRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'sub-1' });
          (subscriptionsRepository.createEvent as ReturnType<typeof vi.fn>).mockResolvedValue({});
          (plansRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(plan);

          const stripeSubItem = {
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          };
          mockCustomersCreate.mockResolvedValueOnce({ id: 'cus_mock' });
          mockPaymentMethodsAttach.mockResolvedValueOnce({});
          mockCustomersUpdate.mockResolvedValueOnce({});
          mockSubscriptionsCreate.mockResolvedValueOnce({
            id: 'sub_mock',
            status: 'active',
            items: { data: [stripeSubItem] },
          });

          await subscriptionsService.createSubscription('firm-1', {
            planId: plan.id,
            paymentMethodId: 'pm_mock',
          });

          // The Stripe subscription must have been called with the column value
          expect(mockSubscriptionsCreate).toHaveBeenCalledWith(
            expect.objectContaining({
              items: [{ price: plan.stripe_price_id }],
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3b: createSubscription throws PLAN_MISCONFIGURED when stripe_price_id is null ──
  it('Property 3b: createSubscription throws PLAN_MISCONFIGURED when plan.stripe_price_id is null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          stripe_price_id: fc.constant(null),
          features: fc.constant(null),
          is_active: fc.constant(true),
        }),
        async (plan) => {
          vi.clearAllMocks();
          (subscriptionsRepository.findByFirmId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
          (plansRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(plan);

          await expect(
            subscriptionsService.createSubscription('firm-1', {
              planId: plan.id,
              paymentMethodId: 'pm_mock',
            })
          ).rejects.toMatchObject({ code: 'PLAN_MISCONFIGURED' });

          // Stripe must never be called
          expect(mockSubscriptionsCreate).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3c: createCheckoutSession reads plan.stripe_price_id ───────────────────
  it('Property 3c: createCheckoutSession uses plan.stripe_price_id column (not features)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          stripe_price_id: fc
            .string({ minLength: 5, maxLength: 30 })
            .filter((s) => s.trim().length > 0)
            .map((s) => `price_${s}`),
          features: fc.constant(null),
          is_active: fc.constant(true),
        }),
        async (plan) => {
          vi.clearAllMocks();
          (plansRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(plan);
          mockCheckoutSessionsCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/mock', id: 'cs_mock' });

          await subscriptionsService.createCheckoutSession('firm-1', plan.id);

          expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
            expect.objectContaining({
              line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3d: createCheckoutSession throws PLAN_MISCONFIGURED when stripe_price_id is null ──
  it('Property 3d: createCheckoutSession throws PLAN_MISCONFIGURED when plan.stripe_price_id is null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          stripe_price_id: fc.constant(null),
          features: fc.constant(null),
          is_active: fc.constant(true),
        }),
        async (plan) => {
          vi.clearAllMocks();
          (plansRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(plan);

          await expect(
            subscriptionsService.createCheckoutSession('firm-1', plan.id)
          ).rejects.toMatchObject({ code: 'PLAN_MISCONFIGURED' });

          expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3e: updateSubscription reads plan.stripe_price_id ─────────────────────
  it('Property 3e: updateSubscription uses plan.stripe_price_id column (not features)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          stripe_price_id: fc
            .string({ minLength: 5, maxLength: 30 })
            .filter((s) => s.trim().length > 0)
            .map((s) => `price_${s}`),
          features: fc.constant(null),
          is_active: fc.constant(true),
        }),
        async (plan) => {
          vi.clearAllMocks();

          const existingSub = {
            id: 'sub-existing',
            firm_id: 'firm-1',
            stripe_subscription_id: 'sub_stripe_existing',
            plan_id: 'old-plan-id',
          };
          (subscriptionsRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingSub);
          (plansRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(plan);
          (subscriptionsRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue({ ...existingSub, plan_id: plan.id });
          (subscriptionsRepository.createEvent as ReturnType<typeof vi.fn>).mockResolvedValue({});

          mockSubscriptionsRetrieve.mockResolvedValueOnce({
            items: { data: [{ id: 'si_mock' }] },
          });
          mockSubscriptionsUpdate.mockResolvedValueOnce({});

          await subscriptionsService.updateSubscription('firm-1', 'sub-existing', { planId: plan.id });

          expect(mockSubscriptionsUpdate).toHaveBeenCalledWith(
            existingSub.stripe_subscription_id,
            expect.objectContaining({
              items: [expect.objectContaining({ price: plan.stripe_price_id })],
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── 3f: updateSubscription throws PLAN_MISCONFIGURED when stripe_price_id is null ──
  it('Property 3f: updateSubscription throws PLAN_MISCONFIGURED when plan.stripe_price_id is null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          stripe_price_id: fc.constant(null),
          features: fc.constant(null),
          is_active: fc.constant(true),
        }),
        async (plan) => {
          vi.clearAllMocks();

          const existingSub = {
            id: 'sub-existing',
            firm_id: 'firm-1',
            stripe_subscription_id: 'sub_stripe_existing',
            plan_id: 'old-plan-id',
          };
          (subscriptionsRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingSub);
          (plansRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(plan);

          await expect(
            subscriptionsService.updateSubscription('firm-1', 'sub-existing', { planId: plan.id })
          ).rejects.toMatchObject({ code: 'PLAN_MISCONFIGURED' });

          expect(mockSubscriptionsUpdate).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
