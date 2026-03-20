// Feature: plan-sync, Property 13: Admin plans page displays all plans from API response
// Feature: plan-sync, Property 14: Edit form pre-fills with current plan values
// Feature: plan-sync, Property 15: API error surfaces to user

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, act } from '@testing-library/react';
import * as fc from 'fast-check';
import AdminPlansPage from '../pages/billing/admin-plans';

// Mock billingApi
vi.mock('../features/billing/api/billing-api', () => ({
  billingApi: {
    listAllPlans: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deactivatePlan: vi.fn(),
  },
}));

import { billingApi } from '../features/billing/api/billing-api';
import type { Plan } from '../features/billing/types';

const mockedBillingApi = (billingApi as unknown) as {
  listAllPlans: ReturnType<typeof vi.fn>;
  createPlan: ReturnType<typeof vi.fn>;
  updatePlan: ReturnType<typeof vi.fn>;
  deactivatePlan: ReturnType<typeof vi.fn>;
};

// Arbitrary for a Plan object
const planArb = fc.record<Plan>({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 40 }),
  slug: fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
  description: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
  price_monthly: fc.float({ min: 1, max: 999, noNaN: true }).map((n) => n.toFixed(2)),
  price_annual: fc.float({ min: 1, max: 9999, noNaN: true }).map((n) => n.toFixed(2)),
  max_users: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
  max_clients: fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
  max_storage_gb: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: null }),
  features: fc.constant(null),
  stripe_product_id: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
  stripe_price_id: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
  is_active: fc.boolean(),
  sort_order: fc.integer({ min: 0, max: 100 }),
  created_at: fc.constant('2024-01-01T00:00:00.000Z'),
  updated_at: fc.constant('2024-01-01T00:00:00.000Z'),
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

/**
 * Property 13: Admin plans page displays all plans from API response
 * Validates: Requirements 9.2
 */
describe('Property 13: Admin plans page displays all plans from API response', () => {
  it('renders exactly as many plan-row elements as plans returned by the API', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(planArb, { minLength: 0, maxLength: 10 }),
        async (plans) => {
          vi.clearAllMocks();
          mockedBillingApi.listAllPlans.mockResolvedValueOnce(plans);

          const container = document.createElement('div');
          document.body.appendChild(container);

          const { unmount } = render(<AdminPlansPage />, { container });

          // Flush all pending microtasks/state updates from useEffect + fetchPlans
          await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
          });

          const rows = container.querySelectorAll('[data-testid="plan-row"]');
          expect(rows).toHaveLength(plans.length);

          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 100 },
    );
  }, 30_000);
});

/**
 * Property 14: Edit form pre-fills with current plan values
 * Validates: Requirements 9.5
 */
describe('Property 14: Edit form pre-fills with current plan values', () => {
  it('pre-fills form inputs with the selected plan values after clicking Edit', async () => {
    await fc.assert(
      fc.asyncProperty(planArb, async (plan) => {
        vi.clearAllMocks();
        mockedBillingApi.listAllPlans.mockResolvedValueOnce([plan]);

        const container = document.createElement('div');
        document.body.appendChild(container);

        const { unmount } = render(<AdminPlansPage />, { container });

        // Flush all pending microtasks/state updates from useEffect + fetchPlans
        await act(async () => {
          await new Promise((r) => setTimeout(r, 0));
        });

        const editBtn = container.querySelector(`[data-testid="edit-btn-${plan.id}"]`) as HTMLButtonElement;
        expect(editBtn).not.toBeNull();
        fireEvent.click(editBtn);

        expect((container.querySelector('[data-testid="field-name"]') as HTMLInputElement).value).toBe(plan.name);
        expect((container.querySelector('[data-testid="field-slug"]') as HTMLInputElement).value).toBe(plan.slug);
        expect((container.querySelector('[data-testid="field-price_monthly"]') as HTMLInputElement).value).toBe(plan.price_monthly);
        expect((container.querySelector('[data-testid="field-price_annual"]') as HTMLInputElement).value).toBe(plan.price_annual);

        unmount();
        document.body.removeChild(container);
      }),
      { numRuns: 100 },
    );
  }, 30_000);
});

/**
 * Property 15: API error surfaces to user
 * Validates: Requirements 9.8
 */
describe('Property 15: API error surfaces to user', () => {
  it('shows error-message element when listAllPlans rejects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 80 }),
        async (errorMsg) => {
          vi.clearAllMocks();
          mockedBillingApi.listAllPlans.mockRejectedValueOnce(new Error(errorMsg));

          const container = document.createElement('div');
          document.body.appendChild(container);

          const { unmount } = render(<AdminPlansPage />, { container });

          // Flush the rejected promise so the component transitions out of loading
          await act(async () => {
            await Promise.resolve();
          });

          await waitFor(() => {
            const el = container.querySelector('[data-testid="error-message"]');
            expect(el).not.toBeNull();
          });

          const errorEl = container.querySelector('[data-testid="error-message"]') as HTMLElement;
          expect(errorEl.textContent).toBe(errorMsg);

          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 100 },
    );
  }, 30_000);
});

// Feature: ui-critical-fixes, Property 9: stripe_price_id included as top-level field when non-empty

/**
 * Property 9: stripe_price_id included as top-level field when non-empty
 * Validates: Requirements 3.3
 */
describe('Property 9: stripe_price_id included as top-level field when non-empty', () => {
  it('submits stripe_price_id as a top-level field, not nested inside features', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (priceId) => {
          vi.clearAllMocks();
          mockedBillingApi.listAllPlans.mockResolvedValue([]);
          mockedBillingApi.createPlan.mockResolvedValue({
            id: 'plan-1',
            name: 'Test Plan',
            slug: 'test-plan',
            description: null,
            price_monthly: '10.00',
            price_annual: '100.00',
            max_users: null,
            max_clients: null,
            max_storage_gb: null,
            features: null,
            stripe_product_id: null,
            stripe_price_id: priceId,
            is_active: true,
            sort_order: 0,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          });

          render(<AdminPlansPage />);

          // Wait for initial load to complete
          await waitFor(() => {
            expect(mockedBillingApi.listAllPlans).toHaveBeenCalled();
          });

          // Click "Create Plan"
          fireEvent.click(screen.getByText('Create Plan'));

          const form = document.querySelector('form') as HTMLFormElement;

          // Fill required fields using role/position — same pattern as unit tests
          const textboxes = Array.from(form.querySelectorAll('input[type="text"], input:not([type])'));
          // name is first textbox, slug is second
          fireEvent.change(textboxes[0], { target: { value: 'Test Plan' } });
          fireEvent.change(textboxes[1], { target: { value: 'test-plan' } });

          // price_monthly and price_annual are the first two number inputs
          const numberInputs = form.querySelectorAll('input[type="number"]');
          fireEvent.change(numberInputs[0], { target: { value: '10' } });
          fireEvent.change(numberInputs[1], { target: { value: '100' } });

          // Fill stripe_price_id via its unique placeholder
          const stripeInput = form.querySelector('input[placeholder="price_1ABC..."]') as HTMLInputElement;
          fireEvent.change(stripeInput, { target: { value: priceId } });

          // Submit the form
          fireEvent.click(screen.getByText('Create'));

          await waitFor(() => {
            expect(mockedBillingApi.createPlan).toHaveBeenCalled();
          });

          const callArg = mockedBillingApi.createPlan.mock.calls[0][0];

          // stripe_price_id must be a top-level field equal to the generated value
          expect(callArg.stripe_price_id).toBe(priceId);

          // stripe_price_id must NOT be nested inside features
          expect(callArg.features?.stripe_price_id).toBeUndefined();

          cleanup();
        },
      ),
      { numRuns: 50 },
    );
  }, 30_000);
});

// Feature: ui-critical-fixes, Property 10: stripe_price_id round-trip — save then reload

/**
 * Property 10: stripe_price_id round-trip — save then reload
 * Validates: Requirements 3.4, 3.8
 */
describe('Property 10: stripe_price_id round-trip — save then reload', () => {
  it('pre-populates stripe_price_id input from plan.stripe_price_id when editing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (priceId) => {
          vi.clearAllMocks();

          const plan: Plan = {
            id: 'plan-round-trip',
            name: 'Round Trip Plan',
            slug: 'round-trip-plan',
            description: null,
            price_monthly: '20.00',
            price_annual: '200.00',
            max_users: null,
            max_clients: null,
            max_storage_gb: null,
            features: null,
            stripe_product_id: null,
            stripe_price_id: priceId,
            is_active: true,
            sort_order: 0,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          };

          mockedBillingApi.listAllPlans.mockResolvedValue([plan]);

          render(<AdminPlansPage />);

          // Wait for plan to load — identified by the plan name text
          await waitFor(() => {
            expect(screen.getByText('Round Trip Plan')).toBeInTheDocument();
          });

          // Click Edit
          fireEvent.click(screen.getByTestId(`edit-btn-${plan.id}`));

          // stripe_price_id input should be pre-populated from plan.stripe_price_id
          const form = document.querySelector('form') as HTMLFormElement;
          const stripeInput = form.querySelector('input[placeholder="price_1ABC..."]') as HTMLInputElement;
          expect(stripeInput.value).toBe(priceId);

          cleanup();
        },
      ),
      { numRuns: 50 },
    );
  }, 30_000);
});
