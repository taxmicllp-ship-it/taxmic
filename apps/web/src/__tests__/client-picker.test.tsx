import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock clients API
vi.mock('../features/clients/api/clients-api', () => ({
  clientsApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

import { clientsApi } from '../features/clients/api/clients-api';
import ClientPicker from '../components/form/ClientPicker';

const mockList = clientsApi.list as ReturnType<typeof vi.fn>;
const mockGet = clientsApi.get as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue({ id: '1', name: 'Test Client', firm_id: 'f1', status: 'active', created_at: '', updated_at: '' });
});

afterEach(() => {
  vi.useRealTimers();
});

// Req 2.3 — renders a text input
describe('ClientPicker — renders text input', () => {
  it('renders a text input with placeholder', () => {
    render(<ClientPicker value={null} onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });
});

// Req 2.10 — disabled prop disables input and clear button
describe('ClientPicker — disabled prop', () => {
  it('disables the input when disabled=true', () => {
    render(<ClientPicker value={null} onChange={vi.fn()} disabled={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('disables the clear button when disabled=true and a value is selected', async () => {
    render(<ClientPicker value="c1" onChange={vi.fn()} disabled={true} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Clear selection')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Clear selection')).toBeDisabled();
  });
});

// Req 2.8 — shows "No clients found" when API returns empty array
describe('ClientPicker — empty results', () => {
  it('shows "No clients found" when API returns empty array', async () => {
    // Use fake timers that still auto-advance so waitFor works
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });

    render(<ClientPicker value={null} onChange={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'xyz' } });

    // Advance past the 300ms debounce
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText('No clients found')).toBeInTheDocument();
    });
  });
});

// Req 2.9 — shows inline error when API call fails
describe('ClientPicker — API error', () => {
  it('shows inline error message when API call fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockList.mockRejectedValue(new Error('Network error'));

    render(<ClientPicker value={null} onChange={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });

    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
