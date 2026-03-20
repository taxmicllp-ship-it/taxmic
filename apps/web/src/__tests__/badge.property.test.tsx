/**
 * Property-based tests for Badge component
 * Validates: Requirements 1 (Badge Correctness Properties)
 */
import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import Badge, { BadgeVariant, BadgeSize } from '../components/ui/Badge';

const allVariants: BadgeVariant[] = ['success', 'warning', 'error', 'info', 'neutral', 'purple'];
const allSizes: BadgeSize[] = ['sm', 'md'];

// Color class tokens unique to each variant (light-mode classes are sufficient for isolation check)
const variantColorTokens: Record<BadgeVariant, string[]> = {
  success: ['green-100', 'green-800'],
  warning: ['yellow-100', 'yellow-800'],
  error:   ['red-100', 'red-800'],
  info:    ['blue-100', 'blue-800'],
  neutral: ['gray-100', 'gray-700'],
  purple:  ['purple-100', 'purple-800'],
};

/**
 * P1: Variant isolation
 * **Validates: Requirements 1 (variant isolation property)**
 *
 * For each variant v, the rendered span's className MUST contain v's color tokens
 * and MUST NOT contain any other variant's color tokens.
 */
describe('P1: Badge variant isolation', () => {
  it('only contains color classes for the rendered variant', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allVariants),
        (variant) => {
          const { container } = render(<Badge variant={variant}>test</Badge>);
          const span = container.querySelector('span')!;
          const className = span.className;

          // Own tokens must be present
          variantColorTokens[variant].forEach((token) => {
            expect(className).toContain(token);
          });

          // Other variants' tokens must NOT be present
          allVariants
            .filter((v) => v !== variant)
            .forEach((otherVariant) => {
              variantColorTokens[otherVariant].forEach((token) => {
                expect(className).not.toContain(token);
              });
            });

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * P2: No-crash
 * **Validates: Requirements 1 (no-crash property)**
 *
 * For all valid variant + size combinations, Badge renders without throwing.
 */
describe('P2: Badge no-crash for all variant/size combinations', () => {
  it('renders without throwing for any valid variant and size', () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom(...allVariants),
          size: fc.constantFrom(...allSizes),
        }),
        ({ variant, size }) => {
          expect(() => {
            const { container } = render(<Badge variant={variant} size={size}>label</Badge>);
            expect(container.querySelector('span')).not.toBeNull();
            cleanup();
          }).not.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });
});
