'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function FinalCta() {
  const t = useTranslations('FinalCta');

  return (
    <section className="py-20 px-6 text-center relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(232,99,43,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] font-bold text-txt mb-4 leading-tight">
          {t('title')}
        </h2>
        <p className="text-[17px] text-txt-muted mb-8 max-w-[480px] mx-auto">
          {t('subtitle')}
        </p>
        <Link
          href="/signup"
          className="inline-block bg-accent text-white border-none rounded-[var(--radius-btn)] px-10 py-4 text-base font-bold hover:opacity-90 transition-all"
          style={{ boxShadow: '0 4px 24px rgba(232,99,43,0.3)' }}
        >
          {t('cta')}
        </Link>
      </div>
    </section>
  );
}
