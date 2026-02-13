'use client';

import Link from 'next/link';

export default function TrialBanner({ trialEndsAt }) {
  if (!trialEndsAt) return null;

  const now = new Date();
  const end = new Date(trialEndsAt);
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  if (daysLeft <= 0) {
    return (
      <div className="bg-danger/10 border border-danger/30 rounded-[var(--radius-btn)] px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm text-danger font-medium">Trial expired</span>
        <Link
          href="/upgrade"
          className="text-sm font-medium text-danger hover:underline"
        >
          Upgrade Now
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-accent-glow border border-[rgba(232,99,43,0.3)] rounded-[var(--radius-btn)] px-4 py-2.5 flex items-center justify-between">
      <span className="text-sm text-txt-body">
        Free Trial &middot; <strong className="text-txt">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</strong>
      </span>
      <Link
        href="/upgrade"
        className="text-sm font-medium text-accent hover:underline"
      >
        Upgrade
      </Link>
    </div>
  );
}
