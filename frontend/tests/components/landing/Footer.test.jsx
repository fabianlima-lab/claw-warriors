import { describe, it, expect } from 'vitest';
import { render, screen } from '#test-utils';
import Footer from '@/components/landing/Footer';

describe('Footer', () => {
  it('renders without crashing', () => {
    const { container } = render(<Footer />);
    expect(container).toBeTruthy();
  });

  it('displays the brand name', () => {
    render(<Footer />);
    // en.json Footer.brand = "CLAWWARRIORS"
    expect(screen.getByText('CLAWWARRIORS')).toBeInTheDocument();
  });

  it('contains privacy link', () => {
    render(<Footer />);
    // en.json Footer.privacy = "Privacy"
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });

  it('contains contact link', () => {
    render(<Footer />);
    // en.json Footer.contact = "Contact"
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
});
