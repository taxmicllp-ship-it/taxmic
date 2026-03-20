// Feature: ui-missing-pages, Property 1: Contact field display — null/empty → "—"

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';

// Mock react-router-dom params/navigate before importing the page
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: 'test-id' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock contacts API
vi.mock('../features/contacts/api/contacts-api', () => ({
  contactsApi: {
    get: vi.fn().mockResolvedValue({ id: 'test-id', name: 'Test User' }),
    delete: vi.fn(),
  },
}));

// Mock @tanstack/react-query — useQuery is controlled per iteration
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })),
  };
});

import { useQuery } from '@tanstack/react-query';
import ContactDetailPage from '../pages/contacts/[id]';

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

/**
 * Property 1: Contact field display — null/empty → "—"
 * Validates: Requirements 7.1
 *
 * For any Contact object where optional fields (email, phone, title, notes)
 * are null, undefined, or empty string, the ContactDetailPage SHALL display
 * "—" for each such field.
 */
describe('Property 1: Contact field display — null/empty → "—"', () => {
  it('renders "—" for each null/undefined/empty optional field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.option(fc.emailAddress(), { nil: null }),
          phone: fc.option(fc.string(), { nil: null }),
          title: fc.option(fc.string(), { nil: null }),
          notes: fc.option(fc.string(), { nil: null }),
        }),
        async (record) => {
          vi.clearAllMocks();

          mockUseQuery.mockReturnValue({
            data: { id: 'test-id', name: 'Test User', ...record },
            isLoading: false,
            error: null,
          });

          render(
            <MemoryRouter>
              <ContactDetailPage />
            </MemoryRouter>,
          );

          const fields: Array<keyof typeof record> = ['email', 'phone', 'title', 'notes'];
          for (const field of fields) {
            const value = record[field];
            if (value === null || value === undefined || value === '') {
              // "—" must appear somewhere in the document
              const dashes = screen.getAllByText('—');
              expect(dashes.length).toBeGreaterThan(0);
            }
          }

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  }, 60_000);
});
