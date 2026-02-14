import { describe, it, expect } from 'vitest';
import { render, screen } from '#test-utils';
import TrialBanner from '@/components/TrialBanner';

describe('TrialBanner', () => {
  it('returns null when trialEndsAt is not provided', () => {
    const { container } = render(<TrialBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('renders upgrade link text when trial is active', () => {
    // Set trialEndsAt to 5 days from now
    const future = new Date();
    future.setDate(future.getDate() + 5);
    render(<TrialBanner trialEndsAt={future.toISOString()} />);
    // en.json TrialBanner.upgrade = "Upgrade"
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('shows days remaining when trial is active', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    render(<TrialBanner trialEndsAt={future.toISOString()} />);
    // en.json TrialBanner.daysLeftPlural = "{count} days left"
    expect(screen.getByText('5 days left')).toBeInTheDocument();
  });

  it('shows 1 day left using singular form', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    render(<TrialBanner trialEndsAt={future.toISOString()} />);
    // en.json TrialBanner.daysLeft = "{count} day left"
    expect(screen.getByText('1 day left')).toBeInTheDocument();
  });

  it('shows expired state when trial has ended', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    render(<TrialBanner trialEndsAt={past.toISOString()} />);
    // en.json TrialBanner.expired = "Trial expired"
    expect(screen.getByText('Trial expired')).toBeInTheDocument();
    // en.json TrialBanner.upgradeNow = "Upgrade Now"
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
  });
});
