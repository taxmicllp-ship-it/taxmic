// Feature: plan-sync, Property 8: Invalid request body returns 422

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createPlanSchema } from '../subscriptions.validation';

/**
 * Validates: Requirements 5.6, 5.7, 5.8
 *
 * Property 8: Invalid request body returns 422
 * For any request body that fails createPlanSchema or updatePlanSchema validation
 * (missing required fields, wrong types, non-positive numbers), the Zod parse must fail.
 */

// Arbitraries for valid price values (positive numbers)
const validPrice = fc.double({ min: 0.01, max: 9999, noNaN: true, noDefaultInfinity: true });
const validName  = fc.string({ minLength: 1 });
const validSlug  = fc.string({ minLength: 1 });

describe('Property 8: Invalid request body returns 422 (Zod parse fails)', () => {
  it('fails when name is missing', () => {
    fc.assert(
      fc.property(
        fc.record({ slug: validSlug, price_monthly: validPrice, price_annual: validPrice }),
        (body) => {
          expect(createPlanSchema.safeParse(body).success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fails when slug is missing', () => {
    fc.assert(
      fc.property(
        fc.record({ name: validName, price_monthly: validPrice, price_annual: validPrice }),
        (body) => {
          expect(createPlanSchema.safeParse(body).success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fails when price_monthly is missing', () => {
    fc.assert(
      fc.property(
        fc.record({ name: validName, slug: validSlug, price_annual: validPrice }),
        (body) => {
          expect(createPlanSchema.safeParse(body).success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fails when price_annual is missing', () => {
    fc.assert(
      fc.property(
        fc.record({ name: validName, slug: validSlug, price_monthly: validPrice }),
        (body) => {
          expect(createPlanSchema.safeParse(body).success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fails when name is empty string', () => {
    fc.assert(
      fc.property(
        fc.record({ slug: validSlug, price_monthly: validPrice, price_annual: validPrice }),
        (body) => {
          expect(createPlanSchema.safeParse({ ...body, name: '' }).success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fails when slug is empty string', () => {
    fc.assert(
      fc.property(
        fc.record({ name: validName, price_monthly: validPrice, price_annual: validPrice }),
        (body) => {
          expect(createPlanSchema.safeParse({ ...body, slug: '' }).success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fails when price_monthly is zero or negative', () => {
    fc.assert(
      fc.property(
        fc.record({ name: validName, slug: validSlug, price_annual: validPrice }),
        fc.oneof(
          fc.constant(0),
          fc.double({ min: -9999, max: -Number.EPSILON, noNaN: true, noDefaultInfinity: true })
        ),
        (body, badPrice) => {
          expect(createPlanSchema.safeParse({ ...body, price_monthly: badPrice }).success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fails when price_annual is zero or negative', () => {
    fc.assert(
      fc.property(
        fc.record({ name: validName, slug: validSlug, price_monthly: validPrice }),
        fc.oneof(
          fc.constant(0),
          fc.double({ min: -9999, max: -Number.EPSILON, noNaN: true, noDefaultInfinity: true })
        ),
        (body, badPrice) => {
          expect(createPlanSchema.safeParse({ ...body, price_annual: badPrice }).success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fails when name or slug is a non-string type', () => {
    const nonString = fc.oneof(
      fc.integer(),
      fc.boolean(),
      fc.constant(null),
      fc.constant([])
    );
    fc.assert(
      fc.property(nonString, nonString, validPrice, validPrice, (name, slug, pm, pa) => {
        expect(
          createPlanSchema.safeParse({ name, slug, price_monthly: pm, price_annual: pa }).success
        ).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('fails when price fields are non-numeric types', () => {
    const nonNumber = fc.oneof(
      fc.string(),
      fc.boolean(),
      fc.constant(null),
      fc.constant([])
    );
    fc.assert(
      fc.property(nonNumber, (badPrice) => {
        expect(
          createPlanSchema.safeParse({
            name: 'Test Plan',
            slug: 'test-plan',
            price_monthly: badPrice,
            price_annual: badPrice,
          }).success
        ).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('fails when max_users is non-positive or non-integer', () => {
    const badMaxUsers = fc.oneof(
      fc.constant(0),
      fc.integer({ min: -1000, max: -1 }),
      // non-integer: generate integer then add a fractional part
      fc.integer({ min: 1, max: 100 }).map((n) => n + 0.5)
    );
    fc.assert(
      fc.property(badMaxUsers, (bad) => {
        expect(
          createPlanSchema.safeParse({
            name: 'Test Plan',
            slug: 'test-plan',
            price_monthly: 10,
            price_annual: 100,
            max_users: bad,
          }).success
        ).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('passes with a fully valid body', () => {
    fc.assert(
      fc.property(
        fc.record({ name: validName, slug: validSlug, price_monthly: validPrice, price_annual: validPrice }),
        (body) => {
          expect(createPlanSchema.safeParse(body).success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
