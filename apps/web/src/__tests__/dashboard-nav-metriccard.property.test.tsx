// Feature: ui-dashboard-live-data, Properties P6 and P7

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import MetricCard from '../components/ui/MetricCard';

// ── P6: Nav badge hidden when unreadCount is 0 or undefined ──────────────────

vi.mock('../features/notifications/hooks/useUnreadNotificationCount', () => ({
  useUnreadNotificationCount: vi.fn(),
}));

vi.mock('../features/notifications/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({ data: undefined, isLoading: false })),
  useMarkAsRead: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('../components/common/ThemeToggleButton', () => ({
  ThemeToggleButton: () => null,
}));

vi.mock('../components/ui/dropdown/Dropdown', () => ({
  Dropdown: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../lib/auth', () => ({
  getRole: vi.fn(() => 'staff'),
  removeToken: vi.fn(),
  getToken: vi.fn(() => 'token'),
  getTokenPayload: vi.fn(() => ({ role: 'staff' })),
  setToken: vi.fn(),
  isAuthenticated: vi.fn(() => true),
}));

import { useUnreadNotificationCount } from '../features/notifications/hooks/useUnreadNotificationCount';
import DashboardLayout from '../components/layout/DashboardLayout';

const mockUseUnreadNotificationCount = useUnreadNotificationCount as ReturnType<typeof vi.fn>;

afterEach(() => {
  cleanup();
});

describe('P6: Nav badge hidden when unreadCount is 0 or undefined', () => {
  it('renders no badge element when unreadCount is 0 or undefined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0 as number | undefined, undefined as number | undefined),
        (unreadCount) => {
          vi.clearAllMocks();
          mockUseUnreadNotificationCount.mockReturnValue({ unreadCount, isLoading: false });

          const { container } = render(
            <MemoryRouter initialEntries={['/dashboard']}>
              <DashboardLayout />
            </MemoryRouter>,
          );

          // No badge span with bg-red-500 should be present
          const badges = container.querySelectorAll('span.bg-red-500');
          expect(badges.length).toBe(0);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── P7: MetricCard count and value round-trip display ────────────────────────

const METRIC_CARD_PROPS = {
  label: 'Test',
  description: 'Test description',
  path: '/test',
  iconPath: 'M12 4v16m8-8H4',
  iconBg: 'bg-slate-50',
};

describe('P7a: MetricCard count round-trip', () => {
  it('renders count.toLocaleString() for any non-negative integer count', () => {
    fc.assert(
      fc.property(fc.nat(), (count) => {
        const { container } = render(
          <MemoryRouter>
            <MetricCard {...METRIC_CARD_PROPS} count={count} />
          </MemoryRouter>,
        );

        const display = container.querySelector('p.text-2xl');
        expect(display).not.toBeNull();
        expect(display!.textContent).toBe(count.toLocaleString());

        cleanup();
      }),
      { numRuns: 100 },
    );
  });
});

describe('P7b: MetricCard value round-trip', () => {
  it('renders value string directly when value prop is provided', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (value) => {
        const { container } = render(
          <MemoryRouter>
            <MetricCard {...METRIC_CARD_PROPS} value={value} count={42} />
          </MemoryRouter>,
        );

        const display = container.querySelector('p.text-2xl');
        expect(display).not.toBeNull();
        // value takes priority over count
        expect(display!.textContent).toBe(value);

        cleanup();
      }),
      { numRuns: 100 },
    );
  });
});
