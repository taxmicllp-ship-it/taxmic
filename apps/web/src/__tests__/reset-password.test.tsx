import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useMutation from @tanstack/react-query
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useMutation: vi.fn(),
  };
});

// Mock resetPassword from auth-api
vi.mock('../features/auth/api/auth-api', () => ({
  resetPassword: vi.fn(),
}));

import { useMutation } from '@tanstack/react-query';
import ResetPasswordPage from '../pages/auth/reset-password';

const mockUseMutation = useMutation as ReturnType<typeof vi.fn>;

// Default mutation state: idle
const idleMutation = {
  mutate: vi.fn(),
  isPending: false,
  error: null,
  isSuccess: false,
};

function renderWithRouter(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMutation.mockReturnValue(idleMutation);
});

// Req 1.1 — page renders inside AuthPageLayout
describe('ResetPasswordPage layout', () => {
  it('renders with AuthPageLayout (contains "Reset your password" heading)', () => {
    renderWithRouter('?token=abc123');
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
  });
});

// Req 1.9 — missing or empty token shows error Alert, no form
describe('ResetPasswordPage — missing/empty token', () => {
  it('shows error Alert when ?token= param is absent', () => {
    renderWithRouter('');
    expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('shows error Alert when ?token= is an empty string', () => {
    renderWithRouter('?token=');
    expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });
});

// Req 1.3 — two password fields rendered when token is present
describe('ResetPasswordPage — token present', () => {
  it('renders two password fields when token is present', () => {
    renderWithRouter('?token=valid-token');
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs).toHaveLength(2);
  });
});

// Req 1.8 — submit button disabled while isPending
describe('ResetPasswordPage — isPending state', () => {
  it('disables submit button while isPending is true', () => {
    mockUseMutation.mockReturnValue({ ...idleMutation, isPending: true });
    renderWithRouter('?token=valid-token');
    const button = screen.getByRole('button', { name: /resetting/i });
    expect(button).toBeDisabled();
  });
});

// Req 1.6 — success Alert + login link on API success
describe('ResetPasswordPage — success state', () => {
  it('shows success Alert and login link on API success', () => {
    mockUseMutation.mockReturnValue({ ...idleMutation, isSuccess: true });
    renderWithRouter('?token=valid-token');
    expect(screen.getByText('Password reset')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    // The link should point to /login
    const loginLink = screen.getByRole('link', { name: /sign in to your account/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

// Req 1.7 — error Alert with getErrorMessage output on API error
describe('ResetPasswordPage — error state', () => {
  it('shows error Alert with getErrorMessage output on API error', () => {
    const error = new Error('Token has expired');
    mockUseMutation.mockReturnValue({ ...idleMutation, error });
    renderWithRouter('?token=valid-token');
    expect(screen.getByText('Token has expired')).toBeInTheDocument();
  });

  it('shows error Alert with response data message when available', () => {
    const error = Object.assign(new Error('Network Error'), {
      response: { data: { message: 'Reset token is invalid' } },
    });
    mockUseMutation.mockReturnValue({ ...idleMutation, error });
    renderWithRouter('?token=valid-token');
    expect(screen.getByText('Reset token is invalid')).toBeInTheDocument();
  });
});
