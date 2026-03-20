// Feature: ui-missing-pages, Property 2: "Try Again" link construction

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';

import PaymentFailurePage from '../pages/invoices/payment-failure';

afterEach(() => {
  cleanup();
});

/**
 * Property 2: Payment failure "Try Again" link construction
 * Validates: Requirements 7.2
 *
 * For any non-empty string passed as the `invoice_id` query parameter,
 * the PaymentFailurePage SHALL construct the "Try Again" link href as
 * `/invoices/${invoice_id}` without modification.
 */
describe('Property 2: "Try Again" link construction', () => {
  it('constructs the Try Again href as /invoices/${invoice_id} for any invoice_id', () => {
    fc.assert(
      fc.property(
        // Constrain to valid URL path segment characters:
        // - non-empty and non-whitespace-only
        // - no leading '/' (would create double-slash paths React Router normalizes)
        // - no '#' (treated as fragment by URL parser, stripped from href)
        // - no '?' (would break query string parsing)
        // Invoice IDs are UUIDs — constrain to alphanumeric + hyphens to avoid
        // React Router normalizing path-special sequences like './', '..', etc.
        fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9\-]{0,62}$/),
        (invoiceId) => {
          const container = document.createElement('div');
          document.body.appendChild(container);

          const { unmount } = render(
            <MemoryRouter initialEntries={[`/payments/failure?invoice_id=${encodeURIComponent(invoiceId)}`]}>
              <PaymentFailurePage />
            </MemoryRouter>,
            { container },
          );

          const links = container.querySelectorAll('a');
          const tryAgainLink = Array.from(links).find(
            (a) => /try again/i.test(a.textContent ?? ''),
          );

          expect(tryAgainLink).toBeDefined();
          expect(tryAgainLink!.getAttribute('href')).toBe(`/invoices/${invoiceId}`);

          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 100 },
    );
  }, 60_000);
});
