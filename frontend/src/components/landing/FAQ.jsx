'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function FAQ() {
  const t = useTranslations('FAQ');
  const [openIndex, setOpenIndex] = useState(null);

  const questions = [
    { q: 'q1', a: 'a1' },
    { q: 'q2', a: 'a2' },
    { q: 'q3', a: 'a3' },
    { q: 'q4', a: 'a4' },
    { q: 'q5', a: 'a5' },
  ];

  return (
    <section className="py-20 px-6 text-center">
      <span className="text-xs font-semibold text-accent tracking-[2px] uppercase">
        {t('label')}
      </span>
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] font-bold text-txt mt-3 mb-12 leading-tight">
        {t('title')}
      </h2>

      <div className="max-w-[640px] mx-auto text-left">
        {questions.map((item, i) => (
          <div key={item.q} className="border-b border-border">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between py-5 text-left cursor-pointer"
            >
              <span className="text-[16px] font-semibold text-txt pr-4">
                {t(item.q)}
              </span>
              <span
                className="text-txt-dim text-lg transition-transform duration-200 flex-shrink-0"
                style={{
                  transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                ▾
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: openIndex === i ? '200px' : '0',
                opacity: openIndex === i ? 1 : 0,
              }}
            >
              <p className="text-[15px] text-txt-muted pb-5 leading-relaxed">
                {t(item.a)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
