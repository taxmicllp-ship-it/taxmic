import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Spinner from '../components/ui/Spinner';

describe('Spinner', () => {
  it('renders with size="sm" — className contains w-4 and h-4', () => {
    const { container } = render(<Spinner size="sm" />);
    const svg = container.firstChild as SVGElement;
    expect(svg.className.baseVal).toContain('w-4');
    expect(svg.className.baseVal).toContain('h-4');
  });

  it('renders with size="md" (default) — className contains w-6 and h-6', () => {
    const { container } = render(<Spinner />);
    const svg = container.firstChild as SVGElement;
    expect(svg.className.baseVal).toContain('w-6');
    expect(svg.className.baseVal).toContain('h-6');
  });

  it('renders with size="lg" — className contains w-8 and h-8', () => {
    const { container } = render(<Spinner size="lg" />);
    const svg = container.firstChild as SVGElement;
    expect(svg.className.baseVal).toContain('w-8');
    expect(svg.className.baseVal).toContain('h-8');
  });

  it('has aria-label="Loading"', () => {
    const { getByLabelText } = render(<Spinner />);
    expect(getByLabelText('Loading')).toBeTruthy();
  });

  it('renders a single root SVG element (container has exactly one child)', () => {
    const { container } = render(<Spinner />);
    expect(container.childElementCount).toBe(1);
    expect(container.firstChild?.nodeName).toBe('svg');
  });

  it('merges optional className prop', () => {
    const { container } = render(<Spinner className="text-blue-500" />);
    const svg = container.firstChild as SVGElement;
    expect(svg.className.baseVal).toContain('text-blue-500');
  });
});
