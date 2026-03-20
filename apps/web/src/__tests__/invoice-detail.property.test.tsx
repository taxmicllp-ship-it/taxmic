/**
 * P2 — Invoice status guard
 * Validates: Requirements 4.13
 *
 * For all invoice statuses that are NOT `draft` (sent, paid, overdue, cancelled),
 * the Edit and Delete buttons SHALL be absent from InvoiceDetailPage.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fc from 'fast-check';
import { afterEach, describe, it, vi } from 'vitest';
import type { InvoiceStatus } from '../features/invoices/types';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../features/invoices/hooks/useInvoice', () => ({
  useInvoice: vi.fn(),
}));

vi.mock('../features/invoices/hooks/useSendInvoice', () => ({
  useSendInvoice: vi.fn(),
}));

vi.mock('../features/invoices/components/InvoiceDetails', () => ({
  default: () => <div data-testid="invoice-details" />,
}));

vi.mock('../features/invoices/api/invoices-api', () => ({
  invoicesApi: {
    delete: vi.fn(),
    send: vi.fn(),
  },
}));

import { useInvoice } from '../features/invoices/hooks/useInvoice';
import { useSendInvoice } from '../features/invoices/hooks/useSendInvoice';
import InvoiceDetailPage from '../pages/invoices/[id]';

const mockUseInvoice = useInvoice as ReturnType<typeof vi.fn>;
const mockUseSendInvoice = useSendInvoice as ReturnType<typeof vi.fn>;

afterEach(() => {
  cleanup();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeInvoice(status: InvoiceStatus) {
  return {
    id: 'test-id',
    firm_id: 'firm-1',
    client_id: 'client-1',
    number: 42,
    status,
    issue_date: '2024-01-01',
    due_date: null,
    subtotal_amount: '100.00',
    tax_amount: '0.00',
    total_amount: '100.00',
    paid_amount: '0.00',
    notes: null,
    pdf_url: null,
    sent_at: null,
    paid_at: null,
    invoice_items: [],
    payments: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
}

function renderPage(status: InvoiceStatus) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  mockUseInvoice.mockReturnValue({ data: makeInvoice(status), isLoading: false });
  mockUseSendInvoice.mockReturnValue({ mutate: vi.fn(), isPending: false });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/invoices/test-id']}>
        <Routes>
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── Property test ─────────────────────────────────────────────────────────────

describe('P2: Invoice status guard — Edit and Delete absent for non-draft statuses', () => {
  it('Edit and Delete buttons are NOT rendered for sent/paid/overdue/cancelled', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<InvoiceStatus>('sent', 'paid', 'overdue', 'cancelled'),
        (status) => {
          vi.clearAllMocks();

          renderPage(status);

          const editEl = screen.queryByText('Edit');
          const deleteEl = screen.queryByText('Delete');

          cleanup();

          return editEl === null && deleteEl === null;
        },
      ),
      { numRuns: 100 },
    );
  });
});
