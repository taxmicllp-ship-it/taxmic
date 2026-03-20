// Unit tests for AdminPlansPage — stripe_price_id and design system
// Requirements: 3.1, 3.5, 3.6, 3.7, 3.9

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import AdminPlansPage from '../pages/billing/admin-plans';

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

const mockListAllPlans = billingApi.listAllPlans as ReturnType<typeof vi.fn>;
const mockCreatePlan = billingApi.createPlan as ReturnType<typeof vi.fn>;

const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  name: 'Starter',
  slug: 'starter',
  description: null,
  price_monthly: '29.00',
  price_annual: '290.00',
  max_users: null,
  max_clients: null,
  max_storage_gb: null,
  features: null,
  stripe_product_id: null,
  stripe_price_id: 'price_abc123',
  is_active: true,
  sort_order: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

/** Helper: open the create form and return the form element */
async function openCreateForm() {
  await waitFor(() => expect(mockListAllPlans).toHaveBeenCalled());
  fireEvent.click(screen.getByText('Create Plan'));
  return document.querySelector('form') as HTMLFormElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListAllPlans.mockResolvedValue([]);
  mockCreatePlan.mockResolvedValue(makePlan());
});

afterEach(() => {
  cleanup();
});

/**
 * Req 3.1 — Form includes a stripe_price_id InputField
 * The InputField for stripe_price_id has placeholder "price_1ABC..."
 */
describe('Req 3.1 — stripe_price_id field is present in the form', () => {
  it('renders a Stripe Price ID input when the create form is shown', async () => {
    render(<AdminPlansPage />);
    const form = await openCreateForm();

    // The stripe_price_id InputField has a unique placeholder
    const input = within(form).getByPlaceholderText('price_1ABC...');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });
});

/**
 * Req 3.6 — All form fields use InputField (design system class h-11)
 */
describe('Req 3.6 — Form fields use InputField design system component', () => {
  it('all inputs in the form have the h-11 class from InputField', async () => {
    render(<AdminPlansPage />);
    const form = await openCreateForm();

    const inputs = form.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);

    inputs.forEach((input) => {
      expect(input.className).toContain('h-11');
    });
  });
});

/**
 * Req 3.7 — Table uses design system components (renders semantic table elements)
 */
describe('Req 3.7 — Table uses design system Table components', () => {
  it('renders semantic table elements from the Table design system component', async () => {
    mockListAllPlans.mockResolvedValue([makePlan()]);

    render(<AdminPlansPage />);

    // Wait for the plan row to appear (data loads async)
    await waitFor(() => {
      expect(screen.getByText('Starter')).toBeInTheDocument();
    });

    expect(document.querySelector('table')).toBeInTheDocument();
    expect(document.querySelector('thead')).toBeInTheDocument();
    expect(document.querySelector('tbody')).toBeInTheDocument();
    expect(document.querySelector('tr')).toBeInTheDocument();
    expect(document.querySelector('td')).toBeInTheDocument();
  });
});

/**
 * Req 3.5 — stripe_price_id field is empty when plan.stripe_price_id is null
 */
describe('Req 3.5 — stripe_price_id field is empty when plan value is null', () => {
  it('shows empty string in stripe_price_id input when plan.stripe_price_id is null', async () => {
    const plan = makePlan({ stripe_price_id: null });
    mockListAllPlans.mockResolvedValue([plan]);

    render(<AdminPlansPage />);

    // Wait for plan to load
    await waitFor(() => {
      expect(screen.getByText('Starter')).toBeInTheDocument();
    });

    // Click Edit — the edit button is identified by the plan name row
    fireEvent.click(screen.getByText('Edit'));

    const form = document.querySelector('form') as HTMLFormElement;
    const stripeInput = within(form).getByPlaceholderText('price_1ABC...') as HTMLInputElement;
    expect(stripeInput.value).toBe('');
  });
});

/**
 * Req 3.9 — Payload omits stripe_price_id when field is empty
 */
describe('Req 3.9 — createPlan payload omits stripe_price_id when field is empty', () => {
  it('calls createPlan without stripe_price_id when the field is left blank', async () => {
    render(<AdminPlansPage />);
    const form = await openCreateForm();

    // Fill required fields by querying inputs in order within the form
    // Name input (first text input)
    const nameInput = within(form).getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'Test Plan' } });

    // Slug input (second text input)
    const slugInput = within(form).getAllByRole('textbox')[1];
    fireEvent.change(slugInput, { target: { value: 'test-plan' } });

    // Number inputs: price_monthly and price_annual
    const numberInputs = form.querySelectorAll('input[type="number"]');
    fireEvent.change(numberInputs[0], { target: { value: '10' } });
    fireEvent.change(numberInputs[1], { target: { value: '100' } });

    // Leave stripe_price_id empty (default)
    const stripeInput = within(form).getByPlaceholderText('price_1ABC...') as HTMLInputElement;
    expect(stripeInput.value).toBe('');

    fireEvent.click(within(form).getByText('Create'));

    await waitFor(() => expect(mockCreatePlan).toHaveBeenCalled());

    const payload = mockCreatePlan.mock.calls[0][0];
    // stripe_price_id should be undefined (omitted) when field is empty
    expect(payload.stripe_price_id).toBeUndefined();
  });
});
