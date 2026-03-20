import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock clients API
vi.mock('../features/clients/api/clients-api', () => ({
  clientsApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

import TaskForm from '../features/tasks/components/TaskForm';
import InvoiceForm from '../features/invoices/components/InvoiceForm';

beforeEach(() => {
  vi.clearAllMocks();
});

// Req 2.11 — TaskForm uses ClientPicker for client_id
describe('TaskForm — client_id field', () => {
  it('renders ClientPicker (search input) instead of a raw UUID input', () => {
    render(<TaskForm onSubmit={vi.fn()} />);

    // ClientPicker renders a text input with this placeholder
    expect(screen.getByPlaceholderText('Search clients…')).toBeInTheDocument();
  });

  it('does not render a raw UUID/text input for client_id', () => {
    render(<TaskForm onSubmit={vi.fn()} />);

    // No raw placeholder that would indicate a plain UUID input
    expect(screen.queryByPlaceholderText('Client UUID')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('client_id')).not.toBeInTheDocument();
  });
});

// Req 2.12 — InvoiceForm uses ClientPicker for client_id
describe('InvoiceForm — client_id field', () => {
  it('renders ClientPicker (search input) instead of a raw UUID input', () => {
    render(<InvoiceForm onSubmit={vi.fn()} />);

    // ClientPicker renders a text input with this placeholder
    expect(screen.getByPlaceholderText('Search clients…')).toBeInTheDocument();
  });

  it('does not render a raw UUID/text input for client_id', () => {
    render(<InvoiceForm onSubmit={vi.fn()} />);

    expect(screen.queryByPlaceholderText('Client UUID')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('client_id')).not.toBeInTheDocument();
  });
});
