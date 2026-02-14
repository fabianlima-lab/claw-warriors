import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '#test-utils';
import WarriorCard from '@/components/WarriorCard';

const mockWarrior = {
  id: 1,
  name: 'Mia',
  warriorClass: 'guardian',
  artFile: '/warriors/1.png',
  introQuote: 'I protect what matters.',
  stats: { protection: 90, precision: 80, loyalty: 95 },
};

describe('WarriorCard', () => {
  it('renders warrior name from props', () => {
    render(<WarriorCard warrior={mockWarrior} />);
    expect(screen.getByText('Mia')).toBeInTheDocument();
  });

  it('renders warrior class label', () => {
    render(<WarriorCard warrior={mockWarrior} />);
    // Classes.guardian = "Guardian" from en.json
    expect(screen.getByText('Guardian')).toBeInTheDocument();
  });

  it('renders intro quote when provided', () => {
    render(<WarriorCard warrior={mockWarrior} />);
    // The quote is wrapped in curly quotes in the component
    expect(screen.getByText(/I protect what matters/)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<WarriorCard warrior={mockWarrior} onClick={handleClick} />);
    fireEvent.click(screen.getByText('Mia'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
