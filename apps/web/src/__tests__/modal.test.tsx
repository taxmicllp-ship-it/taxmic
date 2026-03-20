import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Modal from '../components/ui/Modal';

afterEach(() => {
  cleanup();
});

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  title: 'Test Modal',
  children: <p>Modal body content</p>,
};

describe('Modal', () => {
  it('renders null when isOpen=false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders dialog when isOpen=true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<Modal {...defaultProps} onClose={onClose} />);
    // The outermost div is the backdrop
    const backdrop = container.ownerDocument.body.querySelector('.fixed.inset-0.z-50');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when dialog panel is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders title in h2 with id="modal-title"', () => {
    render(<Modal {...defaultProps} title="My Title" />);
    const heading = document.getElementById('modal-title');
    expect(heading).not.toBeNull();
    expect(heading?.tagName).toBe('H2');
    expect(heading?.textContent).toBe('My Title');
  });

  it('renders children as body content', () => {
    render(<Modal {...defaultProps}><span data-testid="body-child">hello</span></Modal>);
    expect(screen.getByTestId('body-child')).toBeInTheDocument();
  });

  it('renders footer when footer prop is provided', () => {
    render(
      <Modal {...defaultProps} footer={<button data-testid="footer-btn">OK</button>} />
    );
    expect(screen.getByTestId('footer-btn')).toBeInTheDocument();
  });

  it('does not render footer when footer prop is not provided', () => {
    render(<Modal {...defaultProps} />);
    // No footer button should be present
    expect(screen.queryByTestId('footer-btn')).toBeNull();
  });
});
