import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfirmModal from '../components/ui/ConfirmModal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item?',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ConfirmModal', () => {
  it('renders message text', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
  });

  it('cancel button calls onClose and not onConfirm', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('confirm button calls onConfirm', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('confirm button does NOT call onClose', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('danger variant applies red classes to confirm button', () => {
    render(<ConfirmModal {...defaultProps} variant="danger" confirmLabel="Delete" />);
    const btn = screen.getByText('Delete');
    expect(btn.className).toMatch(/bg-red-600/);
  });

  it('warning variant applies yellow classes to confirm button', () => {
    render(<ConfirmModal {...defaultProps} variant="warning" confirmLabel="Proceed" />);
    const btn = screen.getByText('Proceed');
    expect(btn.className).toMatch(/bg-yellow-500/);
  });
});
