import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import ConfirmModal from '../components/ui/ConfirmModal';

/**
 * P9: Cancel isolation
 * Validates: Requirements 5.11
 *
 * For any title/message, clicking cancel must NOT call onConfirm.
 */
describe('P9: ConfirmModal cancel isolation', () => {
  it('clicking cancel never calls onConfirm', () => {
    fc.assert(
      fc.property(
        fc.record({ title: fc.string(), message: fc.string() }),
        ({ title, message }) => {
          const onClose = vi.fn();
          const onConfirm = vi.fn();

          render(
            <ConfirmModal
              isOpen={true}
              onClose={onClose}
              onConfirm={onConfirm}
              title={title}
              message={message}
            />
          );

          fireEvent.click(screen.getByText('Cancel'));
          expect(onConfirm).not.toHaveBeenCalled();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * P10: Confirm single call
 * Validates: Requirements 5.7
 *
 * For any title/message, clicking confirm calls onConfirm exactly once.
 */
describe('P10: ConfirmModal confirm single call', () => {
  it('clicking confirm calls onConfirm exactly once', () => {
    fc.assert(
      fc.property(
        fc.record({ title: fc.string(), message: fc.string() }),
        ({ title, message }) => {
          const onClose = vi.fn();
          const onConfirm = vi.fn();

          render(
            <ConfirmModal
              isOpen={true}
              onClose={onClose}
              onConfirm={onConfirm}
              title={title}
              message={message}
            />
          );

          fireEvent.click(screen.getByText('Confirm'));
          expect(onConfirm).toHaveBeenCalledTimes(1);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
