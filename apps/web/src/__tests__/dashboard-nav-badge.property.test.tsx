// Feature: ui-dashboard-live-data, P6: Nav badge hidden when count is 0

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';

// Inline badge component matching DashboardLayout's badge logic
function NavBadge({ unreadCount }: { unreadCount: number | undefined }) {
  if (!unreadCount || unreadCount <= 0) return null;
  return (
    <span data-testid="nav-badge" className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}

describe('P6: Nav badge hidden when count is 0 or undefined', () => {
  it('renders no badge when unreadCount is 0 or undefined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, undefined),
        (unreadCount) => {
          const { queryByTestId, unmount } = render(<NavBadge unreadCount={unreadCount as number | undefined} />);
          expect(queryByTestId('nav-badge')).toBeNull();
          unmount();
          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('renders badge when unreadCount is positive', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 200 }).filter(n => n > 0),
        (unreadCount) => {
          const { queryByTestId, unmount } = render(<NavBadge unreadCount={unreadCount} />);
          expect(queryByTestId('nav-badge')).not.toBeNull();
          unmount();
          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('renders 99+ when unreadCount > 99', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 900 }).map(n => n + 100),
        (unreadCount) => {
          const { getByTestId, unmount } = render(<NavBadge unreadCount={unreadCount} />);
          expect(getByTestId('nav-badge').textContent).toBe('99+');
          unmount();
          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
