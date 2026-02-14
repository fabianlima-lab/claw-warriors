import { describe, it, expect } from 'vitest';
import { render, screen } from '#test-utils';
import PricingSection from '@/components/landing/PricingSection';

describe('PricingSection', () => {
  it('renders without crashing', () => {
    const { container } = render(<PricingSection />);
    expect(container).toBeTruthy();
  });

  it('displays the pricing section title', () => {
    render(<PricingSection />);
    // en.json Pricing.title = "Simple, Flat Pricing"
    expect(screen.getByText('Simple, Flat Pricing')).toBeInTheDocument();
  });

  it('shows all three pricing tiers', () => {
    render(<PricingSection />);
    // en.json Pricing.trialName = "Trial", proName = "Pro", proTribeName = "Pro Tribe"
    expect(screen.getByText('Trial')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Pro Tribe')).toBeInTheDocument();
  });

  it('shows prices for each tier', () => {
    render(<PricingSection />);
    // en.json: trialPrice = "Free", proPrice = "", proTribePrice = ""
    expect(screen.getByText('Free')).toBeInTheDocument();
    // Use getAllByText since \ and \ each appear once as price text
    const price39 = screen.getAllByText('');
    expect(price39.length).toBeGreaterThanOrEqual(1);
    const price59 = screen.getAllByText('');
    expect(price59.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Most Popular badge on Pro plan', () => {
    render(<PricingSection />);
    // en.json Pricing.proBadge = "Most Popular"
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });
});
