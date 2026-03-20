/**
 * Property-based tests for Modal component.
 * Validates: Requirements 4 (Modal Correctness Properties)
 */
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import Modal from '../components/ui/Modal';

describe('Modal property tests', () => {
  /**
   * P5: closed-state invariant
   * Validates: Requirements 4 — "WHEN isOpen is false, Modal SHALL render no DOM nodes"
   */
  it('P5: closed-state invariant — no dialog in DOM when isOpen=false', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (title, body) => {
        render(
          <Modal isOpen={false} onClose={() => {}} title={title}>
            <span>{body}</span>
          </Modal>
        );
        const dialog = document.querySelector('[role="dialog"]');
        cleanup();
        return dialog === null;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * P6: Escape key single call
   * Validates: Requirements 4 — "WHEN isOpen is true and Escape is pressed, onClose SHALL be called exactly once"
   */
  it('P6: Escape key — onClose called exactly once', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (title, body) => {
        const onClose = vi.fn();
        render(
          <Modal isOpen={true} onClose={onClose} title={title}>
            <span>{body}</span>
          </Modal>
        );
        fireEvent.keyDown(document, { key: 'Escape' });
        const callCount = onClose.mock.calls.length;
        cleanup();
        return callCount === 1;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * P7: backdrop click single call
   * Validates: Requirements 4 — "WHEN isOpen is true and the backdrop is clicked, onClose SHALL be called exactly once"
   */
  it('P7: backdrop click — onClose called exactly once', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (title, body) => {
        const onClose = vi.fn();
        render(
          <Modal isOpen={true} onClose={onClose} title={title}>
            <span>{body}</span>
          </Modal>
        );
        const backdrop = document.body.querySelector('.fixed.inset-0.z-50');
        if (!backdrop) {
          cleanup();
          return false;
        }
        fireEvent.click(backdrop);
        const callCount = onClose.mock.calls.length;
        cleanup();
        return callCount === 1;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * P8: panel click isolation
   * Validates: Requirements 4 — "WHEN the dialog panel itself is clicked, onClose SHALL NOT be called"
   */
  it('P8: panel click isolation — onClose NOT called when dialog panel clicked', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (title, body) => {
        const onClose = vi.fn();
        render(
          <Modal isOpen={true} onClose={onClose} title={title}>
            <span>{body}</span>
          </Modal>
        );
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) {
          cleanup();
          return false;
        }
        fireEvent.click(dialog);
        const callCount = onClose.mock.calls.length;
        cleanup();
        return callCount === 0;
      }),
      { numRuns: 100 }
    );
  });
});
