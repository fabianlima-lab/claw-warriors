import { describe, it, expect } from 'vitest';
import { render, screen } from '#test-utils';
import HeroSection from '@/components/landing/HeroSection';

describe('HeroSection', () => {
  it('renders without crashing', () => {
    const { container } = render(<HeroSection />);
    expect(container).toBeTruthy();
  });

  it('contains the hero headline text', () => {
    render(<HeroSection />);
    // en.json Hero.headlineTop = "Your AI Assistant"
    expect(screen.getByText('Your AI Assistant')).toBeInTheDocument();
  });

  it('contains the accent headline text', () => {
    render(<HeroSection />);
    // en.json Hero.headlineAccent = "That Actually Does Things"
    expect(screen.getByText('That Actually Does Things')).toBeInTheDocument();
  });

  it('contains the badge text', () => {
    render(<HeroSection />);
    // en.json Hero.badge = "Powered by OpenClaw"
    expect(screen.getByText('Powered by OpenClaw')).toBeInTheDocument();
  });

  it('contains the CTA links', () => {
    render(<HeroSection />);
    // en.json Hero.ctaPrimary = "Start 7-Day Free Trial"
    expect(screen.getByText('Start 7-Day Free Trial')).toBeInTheDocument();
    // en.json Hero.ctaSecondary = "Watch Demo ->"
    expect(screen.getByText(/Watch Demo/)).toBeInTheDocument();
  });
});
