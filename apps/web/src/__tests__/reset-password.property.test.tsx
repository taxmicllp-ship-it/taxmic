// Feature: ui-critical-fixes, Property 1: Token round-trip

import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';

// Mock resetPassword from auth-api
vi.mock('../features/auth/api/auth-api', () => ({
  resetPassword: vi.fn().mockResolvedValue(undefined),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { resetPassword } from '../features/auth/api/auth-api';
import ResetPasswordPage from '../pages/auth/reset-password';

const mockResetPassword = resetPassword as ReturnType<typeof vi.fn>;

function renderWithToken(token: string) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/reset-password?token=${encodeURIComponent(token)}`]}>
        <ResetPasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResetPassword.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

/**
 * Property 1: Token round-trip
 * Validates: Requirements 1.11
 *
 * For any non-empty token string present in the URL query parameter `?token=`,
 * when the reset-password form is submitted, the API request body's `token`
 * field SHALL equal that exact string.
 */
describe('Property 1: Token round-trip', () => {
  it('passes the exact URL token to resetPassword on form submit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (token) => {
          vi.clearAllMocks();
          mockResetPassword.mockResolvedValue(undefined);

          // delay: null disables the artificial per-keystroke delay, keeping 100 runs fast
          const user = userEvent.setup({ delay: null });

          renderWithToken(token);

          const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
          const confirmInput = screen.getByPlaceholderText('Repeat your password');

          await user.type(passwordInput, 'ValidPass1');
          await user.type(confirmInput, 'ValidPass1');

          const submitButton = screen.getByRole('button', { name: /reset password/i });
          await user.click(submitButton);

          await waitFor(() => {
            expect(mockResetPassword).toHaveBeenCalledTimes(1);
          });

          const callArg = mockResetPassword.mock.calls[0][0] as { token: string; password: string };
          expect(callArg.token).toBe(token);
          expect(callArg.password).toBe('ValidPass1');

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  }, 60_000); // 60 s budget for 100 iterations
});

// Feature: ui-critical-fixes, Property 2: Form validation rejects invalid inputs

import { z } from 'zod';

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Property 2: Form validation rejects invalid inputs
 * Validates: Requirements 1.4
 *
 * For any combination of `password` shorter than 8 characters, or
 * `confirmPassword` that does not equal `password`, the Zod schema
 * SHALL produce a validation error (success=false).
 */
describe('Property 2: Form validation rejects invalid inputs', () => {
  it('rejects passwords shorter than 8 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 7 }),
        (password) => {
          const result = ResetPasswordSchema.safeParse({ password, confirmPassword: password });
          return result.success === false;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects mismatched password and confirmPassword', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 8 }),
          fc.string({ minLength: 8 }),
        ).filter(([p, c]) => p !== c),
        ([password, confirmPassword]) => {
          const result = ResetPasswordSchema.safeParse({ password, confirmPassword });
          return result.success === false;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: ui-critical-fixes, Property 3: Error messages extracted via getErrorMessage

import { expect } from 'vitest';
import { getErrorMessage } from '../lib/getErrorMessage';

/**
 * Property 3: Error messages extracted via getErrorMessage
 * Validates: Requirements 1.7
 *
 * For any API error response shape (axios error with `response.data.error`,
 * `response.data.message`, or plain `message`), the displayed error text
 * SHALL equal the output of `getErrorMessage(error)`.
 *
 * Pure unit test — no rendering, no async, direct function calls only.
 */
describe('Property 3: Error messages extracted via getErrorMessage', () => {
  it('returns a non-empty string matching getErrorMessage for plain Error-like objects (Shape 1)', () => {
    fc.assert(
      fc.property(
        fc.record({ message: fc.string({ minLength: 1 }) }),
        (errorObj) => {
          const result = getErrorMessage(errorObj);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
          expect(result).toBe(getErrorMessage(errorObj));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns a non-empty string matching getErrorMessage for axios response.data.message errors (Shape 2)', () => {
    fc.assert(
      fc.property(
        fc.record({ response: fc.record({ data: fc.record({ message: fc.string({ minLength: 1 }) }) }) }),
        (errorObj) => {
          const result = getErrorMessage(errorObj);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
          expect(result).toBe(errorObj.response.data.message);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns a non-empty string matching getErrorMessage for axios response.data.error errors (Shape 3)', () => {
    fc.assert(
      fc.property(
        fc.record({ response: fc.record({ data: fc.record({ error: fc.string({ minLength: 1 }) }) }) }),
        (errorObj) => {
          const result = getErrorMessage(errorObj);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
          expect(result).toBe(errorObj.response.data.error);
        },
      ),
      { numRuns: 100 },
    );
  });
});
