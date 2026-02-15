import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '#test-utils';
import ClassTabs from '@/components/ClassTabs';

describe('ClassTabs', () => {
  const classes = ['guardian', 'scholar', 'creator', 'strategist', 'sentinel'];
  // Translated labels from en.json Classes namespace
  const classLabels = ['Guardian', 'Scholar', 'Creator', 'Strategist', 'Sentinel'];

  it('renders all 5 class tabs', () => {
    render(<ClassTabs selected="guardian" onSelect={vi.fn()} />);
    classLabels.forEach((label) => {
      expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
    });
  });

  it('renders exactly 5 buttons', () => {
    render(<ClassTabs selected="guardian" onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('calls onSelect with correct class when tab clicked', () => {
    const handleSelect = vi.fn();
    render(<ClassTabs selected="guardian" onSelect={handleSelect} />);
    fireEvent.click(screen.getByText(/Scholar/));
    expect(handleSelect).toHaveBeenCalledWith('scholar');
  });
});
