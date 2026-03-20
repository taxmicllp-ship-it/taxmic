// Feature: ui-missing-pages, Property 3 + 4: ChangePasswordForm validation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fc from 'fast-check';

// Mock auth-api — me returns a never-resolving promise so the profile sections stay in loading state
vi.mock('../features/auth/api/auth-api', () => ({
  me: vi.fn().mockReturnValue(new Promise(() => {})),
  resetPassword: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
}));

// Mock the api lib so POST /auth/change-password never actually fires
vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../lib/api';
import SettingsPage from '../pages/settings/index';

const mockPost = api.post as ReturnType<typeof vi.fn>;

function renderSettings() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const { unmount } = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
    { container },
  );

  const currentInput = container.querySelector('#current_password') as HTMLInputElement;
  const newInput = container.querySelector('#new_password') as HTMLInputElement;
  const confirmInput = container.querySelector('#confirm_new_password') as HTMLInputElement;
  const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;

  return {
    container,
    currentInput,
    newInput,
    confirmInput,
    submitBtn,
    unmount: () => {
      unmount();
      document.body.removeChild(container);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPost.mockResolvedValue({ data: { message: 'ok' } });
});

afterEach(() => {
  cleanup();
});

/**
 * Property 3: ChangePasswordForm — mismatched passwords blocked
 * Validates: Requirements 7.3
 *
 * For any two non-empty strings that differ, submitting the form with
 * new_password ≠ confirm_new_password SHALL display a validation error
 * and SHALL NOT call the API.
 */
describe('Property 3: ChangePasswordForm — mismatched passwords blocked', () => {
  it('shows validation error and does not call API when passwords differ', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
        ).filter(([a, b]) => a !== b),
        async ([newPassword, confirmPassword]) => {
          vi.clearAllMocks();
          mockPost.mockResolvedValue({ data: { message: 'ok' } });

          const { container, currentInput, newInput, confirmInput, submitBtn, unmount } = renderSettings();

          fireEvent.change(currentInput, { target: { value: 'anyCurrentPass' } });
          fireEvent.change(newInput, { target: { value: newPassword } });
          fireEvent.change(confirmInput, { target: { value: confirmPassword } });

          await act(async () => {
            fireEvent.click(submitBtn);
          });

          // Validation error should appear (either mismatch or length)
          await waitFor(() => {
            const allText = container.textContent ?? '';
            expect(/do not match|at least 8/i.test(allText)).toBe(true);
          });

          // API must NOT have been called with change-password
          expect(mockPost).not.toHaveBeenCalledWith(
            expect.stringContaining('change-password'),
            expect.anything(),
          );

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  }, 120_000);
});

/**
 * Property 4: ChangePasswordForm — short password blocked
 * Validates: Requirements 7.4
 *
 * For any new_password shorter than 8 characters, submitting the form
 * SHALL display a validation error and SHALL NOT call the API.
 */
describe('Property 4: ChangePasswordForm — short password blocked', () => {
  it('shows validation error and does not call API when new_password < 8 chars', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ maxLength: 7 }),
        async (shortPassword) => {
          vi.clearAllMocks();
          mockPost.mockResolvedValue({ data: { message: 'ok' } });

          const { container, currentInput, newInput, confirmInput, submitBtn, unmount } = renderSettings();

          fireEvent.change(currentInput, { target: { value: 'anyCurrentPass' } });
          fireEvent.change(newInput, { target: { value: shortPassword } });
          fireEvent.change(confirmInput, { target: { value: shortPassword } });

          await act(async () => {
            fireEvent.click(submitBtn);
          });

          // Validation error should appear
          await waitFor(() => {
            const allText = container.textContent ?? '';
            expect(/at least 8|required/i.test(allText)).toBe(true);
          });

          // API must NOT have been called with change-password
          expect(mockPost).not.toHaveBeenCalledWith(
            expect.stringContaining('change-password'),
            expect.anything(),
          );

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  }, 120_000);
});
