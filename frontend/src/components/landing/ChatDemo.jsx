'use client';

import { useState, useEffect } from 'react';

const MESSAGES = [
  { from: 'user', text: 'Hey Mia, check my Gmail and summarize anything urgent' },
  { from: 'bot', name: 'Mia', text: 'On it! You have 3 unread emails. One urgent: your flight to Orlando was changed to 6:15 AM. Want me to update your calendar and set an earlier alarm?' },
  { from: 'user', text: 'Yes please, and order me an Uber for 4:30 AM' },
  { from: 'bot', name: 'Mia', text: 'Done \u2713 Calendar updated, alarm set for 4:00 AM, and Uber scheduled for 4:30 AM to AUS airport. Anything else?' },
];

export default function ChatDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < MESSAGES.length) {
      const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 1200 : 2000);
      return () => clearTimeout(t);
    }
    const reset = setTimeout(() => setStep(0), 4000);
    return () => clearTimeout(reset);
  }, [step]);

  return (
    <section className="px-6 pb-20 flex justify-center">
      <div className="w-full max-w-[420px] bg-card rounded-[20px] border border-border overflow-hidden"
        style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.4)' }}>
        {/* Phone header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #e8632b, #f0924d)' }}>
            ⚔️
          </div>
          <div>
            <div className="font-semibold text-base text-txt">Mia &middot; Guardian</div>
            <div className="text-[13px] text-success">● Online — Telegram</div>
          </div>
        </div>

        {/* Messages */}
        <div className="px-4 py-5 min-h-[260px] flex flex-col gap-3">
          {MESSAGES.slice(0, step).map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: 'fadeSlideUp 0.4s ease' }}>
              <div
                className="max-w-[80%] px-3.5 py-2.5 rounded-[14px] text-[15px] leading-relaxed text-txt"
                style={{
                  background: msg.from === 'user' ? 'rgba(232,99,43,0.15)' : 'rgba(255,255,255,0.05)',
                  border: msg.from === 'user' ? '1px solid rgba(232,99,43,0.25)' : '1px solid var(--color-border)',
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {step < MESSAGES.length && (
            <div className="flex gap-1 pl-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-txt-dim"
                  style={{ animation: `pulse-dot 1s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
