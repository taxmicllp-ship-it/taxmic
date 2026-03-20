import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Feature: plan-sync, Property 10: Webhook product.created maps all metadata fields correctly
// Feature: plan-sync, Property 11: Webhook price.created updates price fields
// Feature: plan-sync, Property 12: Webhook price.updated with active=false deactivates plan

vi.mock('../plans.repository', () => ({
  plansRepository: {
    upsertByStripeProductId: vi.fn(),
    findByStripeProductId: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../subscriptions.repository', () => ({
  subscriptionsRepository: {
    updateByStripeSubscriptionId: vi.fn(),
    createEvent: vi.fn(),
  },
}));

vi.mock('@repo/database', () => ({
  prisma: {
    subscriptions: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock('../../../../config', () => ({
  config: { stripeSecretKey: 'sk_test_mock', stripeWebhookSecret: 'whsec_mock' },
}));

vi.mock('../../../../shared/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { handleSubscriptionEvent } from '../stripe-subscriptions-webhook.controller';
import { plansRepository } from '../plans.repository';

const mockUpsertByStripeProductId = plansRepository.upsertByStripeProductId as ReturnType<typeof vi.fn>;
const mockFindByStripeProductId = plansRepository.findByStripeProductId as ReturnType<typeof vi.fn>;
const mockUpdate = plansRepository.update as ReturnType<typeof vi.fn>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Arbitrary for optional metadata string values — may be absent, NaN-producing, or a valid integer string */
const metaValueArb = fc.oneof(
  fc.constant(undefined),
  fc.constant(''),
  fc.constant('abc'),
  fc.constant('NaN'),
  fc.integer({ min: 0, max: 9999 }).map(String),
);

function expectedParseMeta(val: string | undefined): number | null {
  if (val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// ─── Property 10 ─────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 6.1, 6.5, 6.6
 *
 * For any product.created webhook payload, the upserted plan row must have:
 * - name from product.name
 * - description from product.description
 * - slug from metadata.slug (fallback to product.id)
 * - integer columns parsed via Number() with null for absent/NaN
 */
describe('Webhook — Property 10: product.created maps all metadata fields correctly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsertByStripeProductId.mockResolvedValue({});
  });

  it('Property 10: upserted plan fields match expected mapping with null for NaN/absent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `prod_${s}`),
          name: fc.string({ minLength: 1, maxLength: 80 }),
          description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
          metadata: fc.record({
            slug: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            max_users: metaValueArb,
            max_clients: metaValueArb,
            max_storage_gb: metaValueArb,
            sort_order: metaValueArb,
          }),
        }),
        async (product) => {
          vi.clearAllMocks();
          mockUpsertByStripeProductId.mockResolvedValue({});

          const event = {
            type: 'product.created',
            data: { object: product },
          };

          await handleSubscriptionEvent(event);

          expect(mockUpsertByStripeProductId).toHaveBeenCalledTimes(1);
          const [calledProductId, calledData] = mockUpsertByStripeProductId.mock.calls[0];

          // stripe_product_id key
          expect(calledProductId).toBe(product.id);

          // name and description
          expect(calledData.name).toBe(product.name);
          expect(calledData.description).toBe(product.description ?? null);

          // slug: use metadata.slug if present, else fallback to product.id
          const expectedSlug = product.metadata?.slug ?? product.id;
          expect(calledData.slug).toBe(expectedSlug);

          // numeric metadata fields
          expect(calledData.max_users).toBe(expectedParseMeta(product.metadata?.max_users));
          expect(calledData.max_clients).toBe(expectedParseMeta(product.metadata?.max_clients));
          expect(calledData.max_storage_gb).toBe(expectedParseMeta(product.metadata?.max_storage_gb));
          expect(calledData.sort_order).toBe(expectedParseMeta(product.metadata?.sort_order));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10 (product.updated): same mapping applies for product.updated events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `prod_${s}`),
          name: fc.string({ minLength: 1, maxLength: 80 }),
          description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
          metadata: fc.record({
            slug: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            max_users: metaValueArb,
            max_clients: metaValueArb,
            max_storage_gb: metaValueArb,
            sort_order: metaValueArb,
          }),
        }),
        async (product) => {
          vi.clearAllMocks();
          mockUpsertByStripeProductId.mockResolvedValue({});

          const event = {
            type: 'product.updated',
            data: { object: product },
          };

          await handleSubscriptionEvent(event);

          expect(mockUpsertByStripeProductId).toHaveBeenCalledTimes(1);
          const [calledProductId, calledData] = mockUpsertByStripeProductId.mock.calls[0];

          expect(calledProductId).toBe(product.id);
          expect(calledData.name).toBe(product.name);
          expect(calledData.slug).toBe(product.metadata?.slug ?? product.id);
          expect(calledData.max_users).toBe(expectedParseMeta(product.metadata?.max_users));
          expect(calledData.max_clients).toBe(expectedParseMeta(product.metadata?.max_clients));
          expect(calledData.max_storage_gb).toBe(expectedParseMeta(product.metadata?.max_storage_gb));
          expect(calledData.sort_order).toBe(expectedParseMeta(product.metadata?.sort_order));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 11 ─────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 6.3
 *
 * For any price.created webhook payload where price.product matches an existing
 * plan's stripe_product_id, the plan row must be updated with
 * stripe_price_id = price.id and price_monthly = price.unit_amount / 100.
 */
describe('Webhook — Property 11: price.created updates price fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Property 11: stripe_price_id and price_monthly updated correctly when plan found', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          planId: fc.uuid(),
          stripeProductId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `prod_${s}`),
          priceId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `price_${s}`),
          // unit_amount in cents, positive integer
          unitAmount: fc.integer({ min: 1, max: 1_000_000 }),
        }),
        async ({ planId, stripeProductId, priceId, unitAmount }) => {
          vi.clearAllMocks();

          const existingPlan = { id: planId, stripe_product_id: stripeProductId };
          mockFindByStripeProductId.mockResolvedValue(existingPlan);
          mockUpdate.mockResolvedValue({});

          const event = {
            type: 'price.created',
            data: {
              object: {
                id: priceId,
                product: stripeProductId,
                unit_amount: unitAmount,
                active: true,
              },
            },
          };

          await handleSubscriptionEvent(event);

          expect(mockFindByStripeProductId).toHaveBeenCalledWith(stripeProductId);
          expect(mockUpdate).toHaveBeenCalledWith(planId, {
            stripe_price_id: priceId,
            price_monthly: unitAmount / 100,
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11: no update called when plan not found for price.created', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          priceId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `price_${s}`),
          stripeProductId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `prod_${s}`),
          unitAmount: fc.integer({ min: 1, max: 1_000_000 }),
        }),
        async ({ priceId, stripeProductId, unitAmount }) => {
          vi.clearAllMocks();
          mockFindByStripeProductId.mockResolvedValue(null);

          const event = {
            type: 'price.created',
            data: {
              object: {
                id: priceId,
                product: stripeProductId,
                unit_amount: unitAmount,
                active: true,
              },
            },
          };

          await handleSubscriptionEvent(event);

          expect(mockUpdate).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 12 ─────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 6.4
 *
 * For any price.updated webhook payload where price.active is false and
 * price.product matches an existing plan, the plan row must have is_active
 * set to false.
 */
describe('Webhook — Property 12: price.updated with active=false deactivates plan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Property 12: is_active set to false when price.active is false and plan found', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          planId: fc.uuid(),
          stripeProductId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `prod_${s}`),
          priceId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `price_${s}`),
        }),
        async ({ planId, stripeProductId, priceId }) => {
          vi.clearAllMocks();

          const existingPlan = { id: planId, stripe_product_id: stripeProductId };
          mockFindByStripeProductId.mockResolvedValue(existingPlan);
          mockUpdate.mockResolvedValue({});

          const event = {
            type: 'price.updated',
            data: {
              object: {
                id: priceId,
                product: stripeProductId,
                active: false,
              },
            },
          };

          await handleSubscriptionEvent(event);

          expect(mockFindByStripeProductId).toHaveBeenCalledWith(stripeProductId);
          expect(mockUpdate).toHaveBeenCalledWith(planId, { is_active: false });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: no update called when price.active is true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          planId: fc.uuid(),
          stripeProductId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `prod_${s}`),
          priceId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `price_${s}`),
        }),
        async ({ planId, stripeProductId, priceId }) => {
          vi.clearAllMocks();

          const existingPlan = { id: planId, stripe_product_id: stripeProductId };
          mockFindByStripeProductId.mockResolvedValue(existingPlan);

          const event = {
            type: 'price.updated',
            data: {
              object: {
                id: priceId,
                product: stripeProductId,
                active: true,
              },
            },
          };

          await handleSubscriptionEvent(event);

          expect(mockUpdate).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: no update called when plan not found for price.updated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          priceId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `price_${s}`),
          stripeProductId: fc.string({ minLength: 5, maxLength: 30 }).map((s) => `prod_${s}`),
        }),
        async ({ priceId, stripeProductId }) => {
          vi.clearAllMocks();
          mockFindByStripeProductId.mockResolvedValue(null);

          const event = {
            type: 'price.updated',
            data: {
              object: {
                id: priceId,
                product: stripeProductId,
                active: false,
              },
            },
          };

          await handleSubscriptionEvent(event);

          expect(mockUpdate).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
