'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/* eslint-disable @next/next/no-img-element */

const APPS_MAP = {
  gmail: 'https://cdn.simpleicons.org/gmail',
  slack: 'https://cdn.simpleicons.org/slack/4A154B',
  gcal: 'https://cdn.simpleicons.org/googlecalendar',
  notion: 'https://cdn.simpleicons.org/notion/white',
  canva: 'https://cdn.simpleicons.org/canva',
  sheets: 'https://cdn.simpleicons.org/googlesheets/34A853',
  instagram: 'https://cdn.simpleicons.org/instagram/E4405F',
  x: 'https://cdn.simpleicons.org/x/white',
  youtube: 'https://cdn.simpleicons.org/youtube/FF0000',
  gdrive: 'https://cdn.simpleicons.org/googledrive',
  spotify: 'https://cdn.simpleicons.org/spotify/1DB954',
  notes: 'https://cdn.simpleicons.org/apple/white',
};

const USE_CASE_KEYS = [
  { icon: '📧', key: 'inbox', apps: ['gmail', 'slack'] },
  { icon: '📅', key: 'calendar', apps: ['gcal', 'notion'] },
  { icon: '🛒', key: 'shopping', apps: ['canva', 'sheets'] },
  { icon: '📱', key: 'social', apps: ['instagram', 'x', 'youtube'] },
  { icon: '💰', key: 'money', apps: ['sheets', 'gdrive'] },
  { icon: '🎵', key: 'control', apps: ['spotify', 'notes'] },
];

export default function AgentValueProps() {
  const [active, setActive] = useState(0);
  const t = useTranslations('ValueProps');

  return (
    <section className="py-20 px-6">
      <div className="text-center mb-12">
        <span className="text-xs font-semibold text-accent tracking-[2px] uppercase">
          {t('label')}
        </span>
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] font-bold text-txt mt-3 leading-tight">
          {t('title')}
        </h2>
      </div>

      <div className="max-w-[900px] mx-auto flex flex-col gap-3">
        {USE_CASE_KEYS.map((uc, i) => (
          <div
            key={i}
            onClick={() => setActive(active === i ? -1 : i)}
            className="rounded-[var(--radius-card)] p-5 md:px-6 cursor-pointer transition-all duration-300"
            style={{
              background: active === i ? 'rgba(232,99,43,0.06)' : 'var(--color-card)',
              border: active === i ? '1px solid rgba(232,99,43,0.2)' : '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[28px]">{uc.icon}</span>
                <div>
                  <h3 className="text-xl font-semibold text-txt">{t(`${uc.key}_title`)}</h3>
                  {active !== i && (
                    <p className="text-[15px] text-txt-muted mt-1">{t(`${uc.key}_desc`)}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                {uc.apps.map((a) => (
                  <img key={a} src={APPS_MAP[a]} alt="" className="w-[22px] h-[22px] object-contain opacity-60" />
                ))}
                <span
                  className="text-txt-dim text-xl ml-2 transition-transform duration-300"
                  style={{ transform: active === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▾
                </span>
              </div>
            </div>

            {active === i && (
              <div className="mt-4 pl-11">
                <p className="text-base text-txt-muted mb-3 leading-relaxed">{t(`${uc.key}_desc`)}</p>
                <div
                  className="rounded-[10px] px-4 py-3"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderLeft: '3px solid var(--color-accent)',
                  }}
                >
                  <p className="font-[family-name:var(--font-mono)] text-[15px] text-txt-muted italic">
                    {t(`${uc.key}_example`)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
