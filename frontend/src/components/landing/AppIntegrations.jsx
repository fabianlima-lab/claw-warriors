'use client';

import { useTranslations } from 'next-intl';

/* eslint-disable @next/next/no-img-element */

const APPS = [
  { key: 'gmail', name: 'Gmail', logo: 'https://cdn.simpleicons.org/gmail', fallback: '✉️' },
  { key: 'gcal', name: 'Google Calendar', logo: 'https://cdn.simpleicons.org/googlecalendar', fallback: '📅' },
  { key: 'spotify', name: 'Spotify', logo: 'https://cdn.simpleicons.org/spotify/1DB954', fallback: '🎵' },
  { key: 'whatsapp', name: 'WhatsApp', logo: 'https://cdn.simpleicons.org/whatsapp/25D366', fallback: '💬' },
  { key: 'telegram', name: 'Telegram', logo: 'https://cdn.simpleicons.org/telegram/26A5E4', fallback: '📱' },
  { key: 'notion', name: 'Notion', logo: 'https://cdn.simpleicons.org/notion/white', fallback: '📝' },
  { key: 'canva', name: 'Canva', logo: 'https://cdn.simpleicons.org/canva', fallback: '🎨' },
  { key: 'slack', name: 'Slack', logo: 'https://cdn.simpleicons.org/slack/4A154B', fallback: '💼' },
  { key: 'discord', name: 'Discord', logo: 'https://cdn.simpleicons.org/discord/5865F2', fallback: '🎮' },
  { key: 'gdrive', name: 'Google Drive', logo: 'https://cdn.simpleicons.org/googledrive', fallback: '📁' },
  { key: 'youtube', name: 'YouTube', logo: 'https://cdn.simpleicons.org/youtube/FF0000', fallback: '▶️' },
  { key: 'instagram', name: 'Instagram', logo: 'https://cdn.simpleicons.org/instagram/E4405F', fallback: '📷' },
  { key: 'x', name: 'X / Twitter', logo: 'https://cdn.simpleicons.org/x/white', fallback: '𝕏' },
  { key: 'sheets', name: 'Google Sheets', logo: 'https://cdn.simpleicons.org/googlesheets/34A853', fallback: '📊' },
  { key: 'github', name: 'GitHub', logo: 'https://cdn.simpleicons.org/github/white', fallback: '🐙' },
  { key: 'notes', name: 'Apple Notes', logo: 'https://cdn.simpleicons.org/apple/white', fallback: '🍎' },
];

export default function AppIntegrations() {
  const t = useTranslations('Integrations');

  return (
    <section id="apps" className="py-20 px-6 text-center">
      <span className="text-xs font-semibold text-accent tracking-[2px] uppercase">
        {t('label')}
      </span>
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] font-bold text-txt mt-3 mb-3 leading-tight">
        {t('title')}
      </h2>
      <p className="text-lg text-txt-muted max-w-[500px] mx-auto mb-12">
        {t('subtitle')}
      </p>

      <div className="flex flex-wrap justify-center gap-5 max-w-[680px] mx-auto">
        {APPS.map((app) => (
          <div key={app.key} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-[rgba(255,255,255,0.04)] border border-border hover:border-elevated transition-all">
              <img
                src={app.logo}
                alt={app.name}
                className="w-9 h-9 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <span className="text-2xl hidden items-center justify-center">{app.fallback}</span>
            </div>
            <span className="text-xs text-txt-dim">{app.name}</span>
          </div>
        ))}
      </div>

      <p className="text-[15px] text-txt-dim mt-8">
        {t('moreApps')}
      </p>
      <p className="text-[13px] text-txt-dim mt-4">
        {t('trustLine')}
      </p>
    </section>
  );
}
