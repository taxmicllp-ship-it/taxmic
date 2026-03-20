// Feature: ui-missing-pages, Property 5: ContactList search passthrough

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fc from 'fast-check';

// Mock contacts API before importing ContactList
vi.mock('../features/contacts/api/contacts-api', () => ({
  contactsApi: {
    list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { contactsApi } from '../features/contacts/api/contacts-api';
import ContactList from '../features/contacts/components/ContactList';

const mockList = contactsApi.list as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mockList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderContactList() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ContactList />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/**
 * Property 5: ContactList search passthrough
 * Validates: Requirements 7.5
 *
 * For any non-empty string typed into the search input, after the 300 ms
 * debounce fires, ContactList SHALL call contactsApi.list with an object
 * containing `search` equal to the typed value.
 */
describe('Property 5: ContactList search passthrough', () => {
  it('passes the typed search value to contactsApi.list after 300ms debounce', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (searchValue) => {
          vi.clearAllMocks();
          mockList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

          const container = document.createElement('div');
          document.body.appendChild(container);

          const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
          });

          const { unmount } = render(
            <QueryClientProvider client={queryClient}>
              <MemoryRouter>
                <ContactList />
              </MemoryRouter>
            </QueryClientProvider>,
            { container },
          );

          const input = container.querySelector('input[placeholder="Search contacts..."]') as HTMLInputElement;
          expect(input).not.toBeNull();

          fireEvent.change(input, { target: { value: searchValue } });

          // Before 300ms — debounce has not fired
          act(() => { vi.advanceTimersByTime(299); });

          // Advance past debounce threshold
          act(() => { vi.advanceTimersByTime(1); });

          // contactsApi.list should have been called with search = searchValue
          const calls = mockList.mock.calls;
          const matchingCall = calls.find(
            (call) => call[0] && call[0].search === searchValue,
          );
          expect(matchingCall).toBeDefined();

          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 100 },
    );
  }, 60_000);
});
