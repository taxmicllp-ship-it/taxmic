/**
 * P3 — Document delete confirmation guard
 * Validates: Requirements 6.6
 *
 * For all document delete button clicks, `onDelete` SHALL NOT be called
 * immediately — the ConfirmModal SHALL be shown first.
 */
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { afterEach, describe, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../features/documents/api/documents-api', () => ({
  documentsApi: {
    getDownloadUrl: vi.fn(),
  },
}));

import DocumentList from '../features/documents/components/DocumentList';

afterEach(() => {
  cleanup();
});

// ── Property test ─────────────────────────────────────────────────────────────

describe('P3: Document delete confirmation guard', () => {
  it('clicking Delete opens ConfirmModal and does NOT call onDelete immediately', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1 }),
        }),
        ({ id, name }) => {
          vi.clearAllMocks();

          const onDeleteMock = vi.fn();

          const doc = {
            id,
            firm_id: 'firm-1',
            client_id: null,
            folder_id: null,
            filename: name,
            mime_type: 'application/pdf',
            size_bytes: '1024',
            description: null,
            uploaded_by: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };

          render(
            <DocumentList documents={[doc]} onDelete={onDeleteMock} />,
          );

          // Click the Delete button for the document
          const deleteButtons = screen.getAllByText('Delete');
          fireEvent.click(deleteButtons[0]);

          // ConfirmModal should be open (dialog in DOM)
          const dialog = document.querySelector('[role="dialog"]');
          const modalOpen = dialog !== null;

          // onDelete must NOT have been called yet
          const notCalledYet = onDeleteMock.mock.calls.length === 0;

          cleanup();

          return modalOpen && notCalledYet;
        },
      ),
      { numRuns: 100 },
    );
  });
});
