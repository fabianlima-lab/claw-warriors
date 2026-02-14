import { describe, it, expect, vi } from 'vitest';
import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import Input from '@/components/ui/Input';

// Input does NOT use next-intl, so we use plain render
describe('Input', () => {
  it('renders with label', () => {
    rtlRender(<Input label="Email" id="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders without label when label prop is omitted', () => {
    rtlRender(<Input id="email" placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  it('handles value changes via onChange', () => {
    const handleChange = vi.fn();
    rtlRender(<Input label="Email" id="email" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
