/**
 * Property test for InvoiceStatusBadge
 * Validates: Requirements 3 (InvoiceStatusBadge Refactor) — Property 4
 */
import { cleanup, render } from '@testing-library/react';
import * as fc from 'fast-check';
import { afterEach, describe, it } from 'vitest';
import InvoiceStatusBadge from '../features/invoices/components/InvoiceStatusBadge';
import type { InvoiceStatus } from '../features/invoices/types';

afterEach(() => {
  cleanup();
});

const allInvoiceStatuses: InvoiceStatus[] = [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
];

describe('InvoiceStatusBadge — property tests', () => {
  /**
   * P4: For all InvoiceStatus values, InvoiceStatusBadge renders a Badge with a non-empty text label.
   * Validates: Requirements 3
   */
  it('P4: renders a non-empty label for every InvoiceStatus value', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allInvoiceStatuses), (status) => {
        const { unmount } = render(<InvoiceStatusBadge status={status} />);

        const spans = document.querySelectorAll('span');
        const labelSpan = Array.from(spans).find(
          (el) => el.textContent && el.textContent.trim().length > 0
        );

        unmount();

        return labelSpan !== undefined;
      }),
      { numRuns: 100 }
    );
  });
});
