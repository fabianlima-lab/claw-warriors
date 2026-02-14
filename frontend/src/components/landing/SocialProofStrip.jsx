'use client';

import { useTranslations } from 'next-intl';

export default function SocialProofStrip() {
  const t = useTranslations('SocialProof');

  return (
    <section className="py-6 px-6">
      <div className="max-w-[600px] mx-auto flex items-center justify-center gap-4 flex-wrap">
        {/* Avatar stack */}
        <div className="flex -space-x-2">
          {['M', 'A', 'R'].map((letter, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-elevated border-2 border-bg flex items-center justify-center text-xs font-bold text-txt-muted"
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Count */}
        <span className="text-[15px] text-txt-muted font-medium">
          {t('count')}
        </span>

        <span className="text-txt-dim">·</span>

        {/* Quote */}
        <span className="text-[14px] text-txt-dim italic">
          &ldquo;{t('quote')}&rdquo;
        </span>
      </div>
    </section>
  );
}
