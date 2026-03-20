import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Badge, { BadgeVariant } from '../components/ui/Badge';

const variants: BadgeVariant[] = ['success', 'warning', 'error', 'info', 'neutral', 'purple'];

const variantColorClasses: Record<BadgeVariant, string[]> = {
  success: ['bg-green-100', 'text-green-800'],
  warning: ['bg-yellow-100', 'text-yellow-800'],
  error:   ['bg-red-100', 'text-red-800'],
  info:    ['bg-blue-100', 'text-blue-800'],
  neutral: ['bg-gray-100', 'text-gray-700'],
  purple:  ['bg-purple-100', 'text-purple-800'],
};

describe('Badge — variant classes', () => {
  variants.forEach((variant) => {
    it(`renders correct color classes for variant="${variant}"`, () => {
      const { container } = render(<Badge variant={variant}>label</Badge>);
      const span = container.querySelector('span')!;
      variantColorClasses[variant].forEach((cls) => {
        expect(span.className).toContain(cls);
      });
    });
  });
});

describe('Badge — size classes', () => {
  it('renders sm size classes', () => {
    const { container } = render(<Badge variant="info" size="sm">label</Badge>);
    const span = container.querySelector('span')!;
    expect(span.className).toContain('px-2');
    expect(span.className).toContain('py-0.5');
    expect(span.className).toContain('text-xs');
  });

  it('renders md size classes (default)', () => {
    const { container } = render(<Badge variant="info">label</Badge>);
    const span = container.querySelector('span')!;
    expect(span.className).toContain('px-2.5');
    expect(span.className).toContain('py-1');
    expect(span.className).toContain('text-xs');
  });
});

describe('Badge — className prop', () => {
  it('merges optional className with base classes', () => {
    const { container } = render(<Badge variant="success" className="my-custom-class">label</Badge>);
    const span = container.querySelector('span')!;
    expect(span.className).toContain('my-custom-class');
    expect(span.className).toContain('bg-green-100');
  });
});

describe('Badge — children', () => {
  it('renders children as label text', () => {
    const { getByText } = render(<Badge variant="neutral">Hello Badge</Badge>);
    expect(getByText('Hello Badge')).toBeTruthy();
  });
});
