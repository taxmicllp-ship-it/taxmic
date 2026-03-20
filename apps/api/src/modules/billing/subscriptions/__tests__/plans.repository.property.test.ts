import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Feature: plan-sync, Property 9: upsertByStripeProductId idempotency

// Mock prisma at the module level
vi.mock('@repo/database', () => {
  const planStore: Map<string, Record<string, unknown>> = new Map();

  const plans = {
    findFirst: vi.fn(async ({ where }: { where: { stripe_product_id: string } }) => {
      return planStore.get(where.stripe_product_id) ?? null;
    }),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const row = { id: `id-${data.stripe_product_id}`, ...data };
      planStore.set(data.stripe_product_id as string, row);
      return row;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      // Find the entry by id
      for (const [key, row] of planStore.entries()) {
        if ((row as Record<string, unknown>).id === where.id) {
          const updated = { ...row, ...data };
          planStore.set(key, updated);
          return updated;
        }
      }
      throw new Error(`Record not found: ${where.id}`);
    }),
    _store: planStore,
    _reset: () => planStore.clear(),
  };

  return { prisma: { plans } };
});

import { plansRepository } from '../plans.repository';
import { prisma } from '@repo/database';

// Helper to access the internal store for assertions
const getStore = () => (prisma.plans as unknown as { _store: Map<string, unknown> })._store;
const resetStore = () => (prisma.plans as unknown as { _reset: () => void })._reset();

describe('PlansRepository — upsertByStripeProductId', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirements 3.5
   *
   * Property 9: upsertByStripeProductId idempotency
   * For any stripe_product_id, calling upsertByStripeProductId twice with the
   * same ID must result in exactly one row in the plans table (not two).
   * The second call must update the existing row rather than inserting a new one.
   */
  it('Property 9: calling upsert twice with the same stripe_product_id results in exactly one row', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a non-empty stripe_product_id
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        // Generate two sets of plan data for the two upsert calls
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          price_monthly: fc.float({ min: 1, max: 999, noNaN: true }),
          price_annual: fc.float({ min: 1, max: 9999, noNaN: true }),
        }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          price_monthly: fc.float({ min: 1, max: 999, noNaN: true }),
          price_annual: fc.float({ min: 1, max: 9999, noNaN: true }),
        }),
        async (stripeProductId, firstData, secondData) => {
          // Reset store for each property run
          resetStore();
          vi.clearAllMocks();

          // First upsert — should create
          const first = await plansRepository.upsertByStripeProductId(stripeProductId, firstData);
          expect(first).toBeDefined();

          // Second upsert — should update, not create
          const second = await plansRepository.upsertByStripeProductId(stripeProductId, secondData);
          expect(second).toBeDefined();

          // Exactly one row must exist in the store
          const store = getStore();
          expect(store.size).toBe(1);
          expect(store.has(stripeProductId)).toBe(true);

          // create was called exactly once (first upsert), update exactly once (second upsert)
          expect(prisma.plans.create).toHaveBeenCalledTimes(1);
          expect(prisma.plans.update).toHaveBeenCalledTimes(1);

          // The row should reflect the second call's data
          expect(second.name).toBe(secondData.name);
          expect(second.slug).toBe(secondData.slug);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('creates a new row when stripe_product_id does not exist', async () => {
    const result = await plansRepository.upsertByStripeProductId('prod_new', {
      name: 'Starter',
      slug: 'starter',
      price_monthly: 9.99,
      price_annual: 99.99,
    });

    expect(result).toBeDefined();
    expect((result as Record<string, unknown>).stripe_product_id).toBe('prod_new');
    expect(result.name).toBe('Starter');
    expect(prisma.plans.create).toHaveBeenCalledTimes(1);
    expect(prisma.plans.update).not.toHaveBeenCalled();
  });

  it('updates the existing row when stripe_product_id already exists', async () => {
    // Seed the store with an initial row
    await plansRepository.upsertByStripeProductId('prod_existing', {
      name: 'Old Name',
      slug: 'old-slug',
      price_monthly: 5,
      price_annual: 50,
    });

    vi.clearAllMocks();

    const result = await plansRepository.upsertByStripeProductId('prod_existing', {
      name: 'New Name',
      slug: 'new-slug',
      price_monthly: 10,
      price_annual: 100,
    });

    expect(result.name).toBe('New Name');
    expect(result.slug).toBe('new-slug');
    expect(prisma.plans.create).not.toHaveBeenCalled();
    expect(prisma.plans.update).toHaveBeenCalledTimes(1);

    // Still only one row
    expect(getStore().size).toBe(1);
  });
});
