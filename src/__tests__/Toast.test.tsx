import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../components/Toast/Toast';
import { describe, it, expect, vi } from 'vitest';

describe('Toast', () => {
  it('should not render when message is null', () => {
    render(<Toast message={null} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render toast when message is provided', () => {
    render(<Toast message="Test message" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should use warning severity by default', () => {
    render(<Toast message="Test message" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardWarning');
  });

  it('should use custom severity when provided', () => {
    render(<Toast message="Test message" severity="error" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardError');
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<Toast message="Test message" onClose={handleClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });
});
