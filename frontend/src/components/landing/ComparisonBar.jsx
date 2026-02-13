'use client';

import { useTranslations } from 'next-intl';

export default function ComparisonBar() {
  const t = useTranslations('Comparison');

  const diyKeys = ['diy1', 'diy2', 'diy3', 'diy4', 'diy5', 'diy6'];
  const cwKeys = ['cw1', 'cw2', 'cw3', 'cw4', 'cw5', 'cw6'];

  return (
    <section className="py-16 px-6 text-center">
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(28px,3.5vw,40px)] font-bold text-txt mb-8">
        {t('title')}
      </h2>

      <div className="flex gap-6 justify-center flex-wrap max-w-[700px] mx-auto">
        {/* DIY Column */}
        <div className="flex-1 min-w-[300px] bg-card border border-border rounded-[14px] p-5 text-left opacity-50">
          <h3 className="text-lg text-txt-muted mb-4">{t('diyTitle')}</h3>
          {diyKeys.map((key) => (
            <div key={key} className="flex items-center gap-2 py-1.5 text-[15px] text-txt-dim">
              <span className="text-danger">&#10007;</span> {t(key)}
            </div>
          ))}
        </div>

        {/* CW Column */}
        <div
          className="flex-1 min-w-[300px] rounded-[14px] p-5 text-left"
          style={{
            background: 'rgba(232,99,43,0.06)',
            border: '1px solid rgba(232,99,43,0.2)',
          }}
        >
          <h3 className="text-lg text-accent font-bold mb-4">{t('cwTitle')}</h3>
          {cwKeys.map((key) => (
            <div key={key} className="flex items-center gap-2 py-1.5 text-[15px] text-txt">
              <span className="text-success">&#10003;</span> {t(key)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
