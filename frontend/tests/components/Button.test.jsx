import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '#test-utils';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders children text when not loading', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('shows loading state with translated loading text', () => {
    render(<Button loading>Click Me</Button>);
    // en.json Common.loading = "Loading..."
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Click Me')).not.toBeInTheDocument();
  });

  it('is disabled when loading=true', () => {
    render(<Button loading>Click Me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled=true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
