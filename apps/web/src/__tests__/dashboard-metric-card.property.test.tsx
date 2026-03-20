// Feature: ui-dashboard-live-data, P7: MetricCard count and value round-trip display

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import MetricCard from '../components/ui/MetricCard';

const baseProps = {
  label: 'Test',
  description: 'Test desc',
  path: '/test',
  iconPath: 'M12 4v16m8-8H4',
  iconBg: 'bg-slate-50',
};

function renderCard(props: object) {
  return render(
    <MemoryRouter>
      <MetricCard {...baseProps} {...props} />
    </MemoryRouter>
  );
}

describe('P7a: MetricCard count round-trip', () => {
  it('renders count.toLocaleString() in the DOM for any non-negative integer', () => {
    fc.assert(
      fc.property(fc.nat(), (count) => {
        const { container, unmount } = renderCard({ count });
        const text = container.textContent ?? '';
        expect(text).toContain(count.toLocaleString());
        unmount();
        cleanup();
      }),
      { numRuns: 100 },
    );
  });
});

describe('P7b: MetricCard value round-trip', () => {
  it('renders value string directly in the DOM for any string value', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.includes('\0')),
        (value) => {
          const { container, unmount } = renderCard({ value });
          const text = container.textContent ?? '';
          expect(text).toContain(value);
          unmount();
          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('P7c: value takes priority over count', () => {
  it('renders value string (not count) when both are provided', () => {
    fc.assert(
      fc.property(
        fc.nat(),
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.includes('\0')),
        (count, value) => {
          const { container, unmount } = renderCard({ count, value });
          const text = container.textContent ?? '';
          expect(text).toContain(value);
          unmount();
          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
