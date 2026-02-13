'use client';

import { useTranslations } from 'next-intl';

export default function Testimonials() {
  const t = useTranslations('Testimonials');

  const TESTIMONIALS = [
    { textKey: 't1_text', authorKey: 't1_author' },
    { textKey: 't2_text', authorKey: 't2_author' },
    { textKey: 't3_text', authorKey: 't3_author' },
  ];

  return (
    <section className="py-16 px-6 text-center">
      <div className="flex gap-5 justify-center flex-wrap max-w-[900px] mx-auto">
        {TESTIMONIALS.map((item, i) => (
          <div
            key={i}
            className="flex-1 min-w-[260px] max-w-[280px] bg-card border border-border rounded-[14px] p-5 text-left"
          >
            <p className="text-base text-txt leading-relaxed italic mb-3">
              &ldquo;{t(item.textKey)}&rdquo;
            </p>
            <p className="text-[13px] text-accent font-semibold">{t(item.authorKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
