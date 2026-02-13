'use client';

import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations('HowItWorks');

  const STEPS = [
    { num: '1', titleKey: 'step1_title', descKey: 'step1_desc' },
    { num: '2', titleKey: 'step2_title', descKey: 'step2_desc' },
    { num: '3', titleKey: 'step3_title', descKey: 'step3_desc' },
  ];

  return (
    <section id="how" className="py-20 px-6 text-center">
      <span className="text-xs font-semibold text-accent tracking-[2px] uppercase">
        {t('label')}
      </span>
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] font-bold text-txt mt-3 mb-12 leading-tight">
        {t('title')}
      </h2>

      <div className="flex justify-center gap-6 flex-wrap max-w-[900px] mx-auto">
        {STEPS.map((s) => (
          <div
            key={s.num}
            className="flex-1 min-w-[250px] max-w-[280px] bg-card border border-border rounded-[var(--radius-card)] p-8 text-left relative"
          >
            <div
              className="font-[family-name:var(--font-display)] text-5xl font-extrabold absolute top-4 right-5"
              style={{ color: 'rgba(232,99,43,0.12)' }}
            >
              {s.num}
            </div>
            <h3 className="text-xl font-bold text-txt mb-2">{t(s.titleKey)}</h3>
            <p className="text-base text-txt-muted leading-relaxed">{t(s.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
