'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const t = useTranslations('Hero');

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(232,99,43,0.08) 0%, transparent 70%)' }}
      />

      <div
        className="relative transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-accent-glow border border-[rgba(232,99,43,0.2)] rounded-full px-4 py-1.5 mb-8">
          <span className="text-xs font-semibold text-accent tracking-[1.5px] uppercase">
            {t('badge')}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(40px,6vw,72px)] font-extrabold text-txt leading-[1.1] max-w-[800px] mx-auto mb-6">
          {t('headlineTop')}<br />
          <span className="text-accent">{t('headlineAccent')}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-[clamp(18px,2vw,22px)] text-txt-muted max-w-[580px] mx-auto mb-4 leading-relaxed">
          {t('subtitle')}
        </p>
        <p className="text-[17px] text-txt-dim max-w-[480px] mx-auto mb-10 leading-normal">
          {t('subtitleSecondary')}
        </p>

        {/* CTAs */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/signup"
            className="bg-accent text-white border-none rounded-[var(--radius-btn)] px-8 py-3.5 text-base font-bold hover:opacity-90 transition-all"
            style={{ boxShadow: '0 4px 24px rgba(232,99,43,0.3)' }}
          >
            {t('ctaPrimary')}
          </Link>
          <Link
            href="/demo"
            className="bg-transparent text-txt-muted border border-border rounded-[var(--radius-btn)] px-8 py-3.5 text-base font-medium hover:bg-elevated transition-all"
          >
            {t('ctaSecondary')}
          </Link>
        </div>

        {/* Trust bar */}
        <div className="flex items-center justify-center gap-6 mt-12 flex-wrap">
          {[
            { icon: '💬', textKey: 'trustChat' },
            { icon: '♾️', textKey: 'trustUnlimited' },
            { icon: '🧠', textKey: 'trustMemory' },
            { icon: '🔒', textKey: 'trustFree' },
          ].map((item) => (
            <div key={item.textKey} className="flex items-center gap-1.5 text-txt-dim text-[15px]">
              <span>{item.icon}</span>
              <span>{t(item.textKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
