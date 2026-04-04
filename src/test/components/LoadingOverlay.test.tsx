import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingOverlay } from '../../components/LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders default loading text', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingOverlay message="Saving project..." />);
    expect(screen.getByText('Saving project...')).toBeInTheDocument();
  });

  it('renders spinner element', () => {
    const { container } = render(<LoadingOverlay />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
