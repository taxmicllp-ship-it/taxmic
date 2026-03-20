/**
 * Property test for TaskStatusBadge
 * Validates: Requirements 2 (TaskStatusBadge Refactor) — Property 3
 */
import { cleanup, render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { afterEach, describe, it } from 'vitest';
import TaskStatusBadge from '../features/tasks/components/TaskStatusBadge';
import type { TaskStatus } from '../features/tasks/types';

afterEach(() => {
  cleanup();
});

const allTaskStatuses: TaskStatus[] = [
  'new',
  'in_progress',
  'waiting_client',
  'review',
  'completed',
];

describe('TaskStatusBadge — property tests', () => {
  /**
   * P3: For all TaskStatus values, TaskStatusBadge renders a Badge with a non-empty text label.
   * Validates: Requirements 2
   */
  it('P3: renders a non-empty label for every TaskStatus value', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allTaskStatuses), (status) => {
        const { unmount } = render(<TaskStatusBadge status={status} />);

        // Badge renders as a <span>; grab all spans and find one with text
        const spans = document.querySelectorAll('span');
        const labelSpan = Array.from(spans).find(
          (el) => el.textContent && el.textContent.trim().length > 0
        );

        unmount();

        return labelSpan !== undefined;
      }),
      { numRuns: 100 }
    );
  });
});
