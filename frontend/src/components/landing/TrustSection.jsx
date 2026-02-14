'use client';

import { useTranslations } from 'next-intl';

export default function TrustSection() {
  const t = useTranslations('Trust');

  const dataPoints = [
    { icon: '🔐', key: 'data1' },
    { icon: '🚫', key: 'data2' },
    { icon: '🗑️', key: 'data3' },
    { icon: '🌐', key: 'data4' },
  ];

  const rulesPoints = [
    { icon: '✕', key: 'rules1' },
    { icon: '🔓', key: 'rules2' },
    { icon: '📦', key: 'rules3' },
    { icon: '💰', key: 'rules4' },
  ];

  return (
    <section className="py-20 px-6 text-center">
      <span className="text-xs font-semibold text-accent tracking-[2px] uppercase">
        {t('label')}
      </span>
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] font-bold text-txt mt-3 mb-12 leading-tight">
        {t('title')}
      </h2>

      <div className="flex gap-5 justify-center flex-wrap max-w-[700px] mx-auto">
        {/* Your Data card */}
        <div className="flex-1 min-w-[280px] max-w-[340px] bg-card border border-border rounded-[var(--radius-card)] p-8 text-left">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="text-lg font-bold text-txt mb-4">{t('dataTitle')}</h3>
          {dataPoints.map((item) => (
            <div key={item.key} className="flex items-start gap-3 py-2 text-[15px] text-txt-muted">
              <span className="mt-0.5">{item.icon}</span>
              <span>{t(item.key)}</span>
            </div>
          ))}
        </div>

        {/* Your Rules card */}
        <div className="flex-1 min-w-[280px] max-w-[340px] bg-card border border-border rounded-[var(--radius-card)] p-8 text-left">
          <div className="text-3xl mb-3">⚙️</div>
          <h3 className="text-lg font-bold text-txt mb-4">{t('rulesTitle')}</h3>
          {rulesPoints.map((item) => (
            <div key={item.key} className="flex items-start gap-3 py-2 text-[15px] text-txt-muted">
              <span className="mt-0.5">{item.icon}</span>
              <span>{t(item.key)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
