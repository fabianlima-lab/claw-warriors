'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const FEATURED_WARRIORS = [
  { name: 'Mia', class: 'guardian', file: 'mia_guardian' },
  { name: 'Luna', class: 'bard', file: 'luna_bard' },
  { name: 'Ada', class: 'artificer', file: 'ada_artificer' },
  { name: 'Rex', class: 'rogue', file: 'rex_rogue' },
  { name: 'Sage', class: 'scholar', file: 'sage_scholar' },
];

const CLASS_GLOW = {
  guardian: '#4A9EFF',
  bard: '#FFB347',
  artificer: '#FF7847',
  rogue: '#47FFB3',
  scholar: '#B47AFF',
};

export default function HeroSection() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % FEATURED_WARRIORS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const current = FEATURED_WARRIORS[idx];
  const glowColor = CLASS_GLOW[current.class];

  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 flex flex-col items-center text-center gap-10">
      {/* Portrait carousel */}
      <div className="relative w-40 h-40 md:w-48 md:h-48">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-colors duration-700"
          style={{ background: glowColor }}
        />
        <Image
          src={`/warriors/${current.file}.png`}
          alt={current.name}
          width={192}
          height={192}
          className="relative rounded-full object-cover w-full h-full border-2 border-border transition-all duration-500"
          priority
        />
        <span
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-full bg-card border border-border"
          style={{ color: glowColor }}
        >
          {current.name}
        </span>
      </div>

      {/* Headline */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl text-txt leading-tight">
          Your AI Warrior,<br />
          <span className="bg-gradient-to-r from-guardian via-scholar to-rogue bg-clip-text text-transparent">
            Your Rules
          </span>
        </h1>
        <p className="mt-6 text-lg text-txt-body max-w-2xl mx-auto">
          Deploy personalized AI agents to Telegram and WhatsApp.
          Pick a warrior, connect your channel, start chatting — all in under 5 minutes.
        </p>
      </div>

      {/* Stat badges */}
      <div className="flex items-center gap-6 text-sm text-txt-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-guardian" />15 Warriors
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-bard" />1 Channel
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rogue" />$0 API Keys
        </span>
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <Link
          href="/signup"
          className="bg-guardian text-bg px-8 py-4 rounded-[var(--radius-btn)] font-medium hover:brightness-110 transition-all text-base"
        >
          Start 7-Day Free Trial
        </Link>
        <Link
          href="/demo"
          className="border border-border text-txt-body px-8 py-4 rounded-[var(--radius-btn)] font-medium hover:bg-elevated transition-all text-base"
        >
          Try Live Demo →
        </Link>
      </div>
    </section>
  );
}
