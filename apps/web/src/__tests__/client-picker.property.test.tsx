// Feature: ui-critical-fixes, Property 4: Debounce — no API call before 300 ms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { act } from 'react';
import * as fc from 'fast-check';

/**
 * Property 4: Debounce — no API call before 300 ms
 * Validates: Requirements 2.4
 *
 * For any sequence of keystrokes typed into the ClientPicker search input,
 * no call to `clientsApi.list` SHALL be issued until at least 300 ms have
 * elapsed since the last keystroke.
 */

// Mock clientsApi before importing ClientPicker
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
  vi.useFakeTimers();
  vi.clearAllMocks();
  mockGet.mockResolvedValue({
    id: 'test-id',
    name: 'Test Client',
    firm_id: 'f1',
    status: 'active',
    created_at: '',
    updated_at: '',
  });
  mockList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Property 4: Debounce — no API call before 300 ms', () => {
  it('does not call clientsApi.list before 300ms, then calls it exactly once after 300ms', () => {
    fc.assert(
      fc.property(
        // Use non-whitespace strings so the debounce effect actually triggers a search
        fc.array(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          { minLength: 1, maxLength: 5 },
        ),
        (keystrokes) => {
          vi.clearAllMocks();

          // Render into a dedicated container so cleanup is isolated per iteration
          const container = document.createElement('div');
          document.body.appendChild(container);

          const { unmount } = render(
            <ClientPicker value={null} onChange={vi.fn()} />,
            { container },
          );

          const input = container.querySelector('input[type="text"]') as HTMLInputElement;

          // Fire a change event for each keystroke
          for (const keystroke of keystrokes) {
            fireEvent.change(input, { target: { value: keystroke } });
          }

          // At 299ms — debounce timer has NOT fired yet
          act(() => { vi.advanceTimersByTime(299); });
          expect(mockList).not.toHaveBeenCalled();

          // Advance 1ms more (total 300ms) — debounce timer fires
          act(() => { vi.advanceTimersByTime(1); });
          expect(mockList).toHaveBeenCalledTimes(1);

          // The call should use the last keystroke value
          const lastKeystroke = keystrokes[keystrokes.length - 1];
          expect(mockList).toHaveBeenCalledWith(
            { search: lastKeystroke, limit: 50 },
            expect.any(AbortSignal),
          );

          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 50 },
    );
  }, 30_000);
});

// Feature: ui-critical-fixes, Property 5: Search query produces correct API call

/**
 * Property 5: Search query produces correct API call
 * Validates: Requirements 2.5
 *
 * For any debounced search query string, the ClientPicker SHALL call
 * `clientsApi.list({ search: query, limit: 50 })`.
 */
describe('Property 5: Search query produces correct API call', () => {
  it('calls clientsApi.list with { search: query, limit: 50 } and an AbortSignal after 300ms', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (query) => {
          vi.clearAllMocks();

          const container = document.createElement('div');
          document.body.appendChild(container);

          const { unmount } = render(
            <ClientPicker value={null} onChange={vi.fn()} />,
            { container },
          );

          const input = container.querySelector('input[type="text"]') as HTMLInputElement;

          fireEvent.change(input, { target: { value: query } });

          // Advance 300ms to trigger debounce
          act(() => { vi.advanceTimersByTime(300); });

          expect(mockList).toHaveBeenCalledWith(
            { search: query, limit: 50 },
            expect.any(AbortSignal),
          );

          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 50 },
    );
  }, 30_000);
});

// Feature: ui-critical-fixes, Property 6: Client selection calls onChange with UUID and shows name

/**
 * Property 6: Client selection calls onChange with UUID and shows name
 * Validates: Requirements 2.6
 *
 * For any client returned in the dropdown, selecting it SHALL call `onChange`
 * with that client's `id` (UUID) and SHALL display that client's `name` in
 * the input field.
 */
describe('Property 6: Client selection calls onChange with UUID and shows name', () => {
  it('calls onChange with client.id and displays client.name after selection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        }),
        async (client) => {
          vi.clearAllMocks();

          // Mock list to return this single client
          mockList.mockResolvedValue({
            data: [
              {
                ...client,
                firm_id: 'firm-1',
                status: 'active' as const,
                created_at: '',
                updated_at: '',
              },
            ],
            total: 1,
            page: 1,
            limit: 50,
          });

          const container = document.createElement('div');
          document.body.appendChild(container);

          const onChange = vi.fn();
          const { unmount } = render(
            <ClientPicker value={null} onChange={onChange} />,
            { container },
          );

          const input = container.querySelector('input[type="text"]') as HTMLInputElement;

          // Type a query to trigger search
          fireEvent.change(input, { target: { value: client.name.slice(0, 3) || 'a' } });

          // Advance 300ms to trigger debounce
          await act(async () => {
            vi.advanceTimersByTime(300);
          });

          // Flush promises so the mock resolves and results render
          await act(async () => {
            await Promise.resolve();
          });

          // Find and click the dropdown item
          const buttons = container.querySelectorAll('button[type="button"]');
          const clientButton = Array.from(buttons).find(
            (btn) => btn.textContent === client.name,
          ) as HTMLButtonElement | undefined;

          expect(clientButton).toBeDefined();

          fireEvent.mouseDown(clientButton!);

          // Assert onChange was called with the client's UUID
          expect(onChange).toHaveBeenCalledWith(client.id);

          // Assert the input now shows the client's name
          const updatedInput = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(updatedInput.value).toBe(client.name);

          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 50 },
    );
  }, 30_000);
});

// Feature: ui-critical-fixes, Property 7: Clear selection round-trip

/**
 * Property 7: Clear selection round-trip
 * Validates: Requirements 2.7, 2.14
 *
 * For any sequence of: type query → select client → click clear,
 * the ClientPicker SHALL call `onChange(null)`, reset the input to empty,
 * and close the dropdown.
 */
describe('Property 7: Clear selection round-trip', () => {
  it('calls onChange(null), resets input to empty, and closes dropdown after clear', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        }),
        async (client) => {
          vi.clearAllMocks();

          mockList.mockResolvedValue({
            data: [
              {
                ...client,
                firm_id: 'firm-1',
                status: 'active' as const,
                created_at: '',
                updated_at: '',
              },
            ],
            total: 1,
            page: 1,
            limit: 50,
          });

          const container = document.createElement('div');
          document.body.appendChild(container);

          const onChange = vi.fn();
          const { unmount } = render(
            <ClientPicker value={null} onChange={onChange} />,
            { container },
          );

          const input = container.querySelector('input[type="text"]') as HTMLInputElement;

          // Step 1: type a query
          fireEvent.change(input, { target: { value: client.name.slice(0, 3) || 'a' } });

          // Advance 300ms to trigger debounce
          await act(async () => {
            vi.advanceTimersByTime(300);
          });

          // Flush promises so mock resolves and results render
          await act(async () => {
            await Promise.resolve();
          });

          // Step 2: select the client
          const buttons = container.querySelectorAll('button[type="button"]');
          const clientButton = Array.from(buttons).find(
            (btn) => btn.textContent === client.name,
          ) as HTMLButtonElement | undefined;

          expect(clientButton).toBeDefined();
          fireEvent.mouseDown(clientButton!);

          // Assert selection step: onChange called with client.id
          expect(onChange).toHaveBeenCalledWith(client.id);

          // Step 3: click the clear button
          const clearButton = container.querySelector('button[aria-label="Clear selection"]') as HTMLButtonElement | null;
          expect(clearButton).not.toBeNull();
          fireEvent.click(clearButton!);

          // Assert onChange was called with null
          expect(onChange).toHaveBeenCalledWith(null);

          // Assert input is reset to empty
          const updatedInput = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(updatedInput.value).toBe('');

          // Assert dropdown is closed (no client buttons visible)
          const dropdownButtons = container.querySelectorAll('button[type="button"]');
          const visibleClientButtons = Array.from(dropdownButtons).filter(
            (btn) => btn.textContent === client.name,
          );
          expect(visibleClientButtons).toHaveLength(0);

          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 50 },
    );
  }, 30_000);
});

// Feature: ui-critical-fixes, Property 8: Existing UUID value resolves to client name on load

/**
 * Property 8: Existing UUID value resolves to client name on load
 * Validates: Requirements 2.13
 *
 * For any valid client UUID passed as the `value` prop on initial render,
 * the ClientPicker SHALL fetch the client and display its `name` in the
 * input field rather than the raw UUID.
 */
describe('Property 8: Existing UUID value resolves to client name on load', () => {
  it('displays client name (not raw UUID) when a UUID value is provided on mount', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (uuid) => {
          vi.clearAllMocks();

          // Use real timers so promise resolution works naturally
          vi.useRealTimers();

          mockGet.mockResolvedValue({
            id: uuid,
            name: 'Test Client',
            firm_id: 'f1',
            status: 'active' as const,
            created_at: '',
            updated_at: '',
          });

          const container = document.createElement('div');
          document.body.appendChild(container);

          const { unmount } = render(
            <ClientPicker value={uuid} onChange={vi.fn()} />,
            { container },
          );

          // Flush promises so clientsApi.get resolves and state updates
          await act(async () => {
            await Promise.resolve();
          });

          const input = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(input.value).toBe('Test Client');

          unmount();
          document.body.removeChild(container);

          // Restore fake timers for subsequent iterations / afterEach
          vi.useFakeTimers();
        },
      ),
      { numRuns: 50 },
    );
  }, 30_000);
});
