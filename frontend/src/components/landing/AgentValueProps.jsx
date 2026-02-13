'use client';

import { useState } from 'react';

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

const USE_CASES = [
  {
    icon: '📧',
    title: 'Manages Your Inbox',
    description: 'Reads emails, drafts replies, unsubscribes from junk, and flags what matters.',
    apps: ['gmail', 'slack'],
    example: '"Hey, summarize my unread emails and draft a reply to the one from my landlord"',
  },
  {
    icon: '📅',
    title: 'Runs Your Calendar',
    description: 'Schedules meetings, sends reminders, and warns you about conflicts — before you even ask.',
    apps: ['gcal', 'notion'],
    example: '"Move my Thursday meeting to Friday and let the team know on Slack"',
  },
  {
    icon: '🛒',
    title: 'Shops & Compares for You',
    description: 'Finds the best price, tracks deals, applies coupons, and monitors price drops.',
    apps: ['canva', 'sheets'],
    example: '"Find me the best deal on AirPods Max and alert me if they drop below $400"',
  },
  {
    icon: '📱',
    title: 'Social Media Autopilot',
    description: 'Drafts posts, suggests content ideas, schedules uploads, and tracks engagement.',
    apps: ['instagram', 'x', 'youtube'],
    example: '"Write 5 Instagram caption ideas for my new product launch"',
  },
  {
    icon: '💰',
    title: 'Tracks Your Money',
    description: 'Monitors expenses, categorizes receipts, and gives you a weekly spending summary.',
    apps: ['sheets', 'gdrive'],
    example: '"How much did I spend on food this month? Show me a breakdown"',
  },
  {
    icon: '🎵',
    title: 'Controls Your World',
    description: 'Plays music, orders rides, sets alarms, and connects your smart home — all from chat.',
    apps: ['spotify', 'notes'],
    example: '"Play my chill playlist on Spotify and save my meeting notes to Apple Notes"',
  },
];

export default function AgentValueProps() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-20 px-6">
      <div className="text-center mb-12">
        <span className="text-xs font-semibold text-accent tracking-[2px] uppercase">
          WHAT IT ACTUALLY DOES
        </span>
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] font-bold text-txt mt-3 leading-tight">
          One Chat. Everything Handled.
        </h2>
      </div>

      <div className="max-w-[900px] mx-auto flex flex-col gap-3">
        {USE_CASES.map((uc, i) => (
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
                  <h3 className="text-xl font-semibold text-txt">{uc.title}</h3>
                  {active !== i && (
                    <p className="text-[15px] text-txt-muted mt-1">{uc.description}</p>
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
                <p className="text-base text-txt-muted mb-3 leading-relaxed">{uc.description}</p>
                <div
                  className="rounded-[10px] px-4 py-3"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderLeft: '3px solid var(--color-accent)',
                  }}
                >
                  <p className="font-[family-name:var(--font-mono)] text-[15px] text-txt-muted italic">
                    {uc.example}
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
