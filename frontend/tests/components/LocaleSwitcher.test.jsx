import { describe, it, expect } from 'vitest';
import { render, screen } from '#test-utils';
import LocaleSwitcher from '@/components/LocaleSwitcher';

describe('LocaleSwitcher', () => {
  it('renders EN and PT buttons', () => {
    render(<LocaleSwitcher />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('PT')).toBeInTheDocument();
  });

  it('renders exactly 2 locale buttons', () => {
    render(<LocaleSwitcher />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });
});
