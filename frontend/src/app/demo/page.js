'use client';

import Link from 'next/link';
import { PublicNav } from '@/components/Nav';
import PageShell from '@/components/ui/PageShell';
import ChatWidget from '@/components/ChatWidget';
import { apiPost } from '@/lib/api';

export default function DemoPage() {
  const handleSend = async (message) => {
    try {
      const data = await apiPost('/demo/chat', { message });
      return data.reply || data.response || data.message;
    } catch {
      return "Hmm, I couldn't connect to my power source. Try again in a moment!";
    }
  };

  return (
    <PageShell>
      <PublicNav />
      <main className="pt-16 max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-bard font-medium">Live Demo</span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-txt mt-3">
            Chat with Luna
          </h1>
          <p className="text-txt-muted mt-2">
            Luna is a Bard-class warrior — bold, trend-aware, and creatively fearless.
          </p>
        </div>

        <div className="h-[500px]">
          <ChatWidget
            warriorName="Luna"
            warriorClass="bard"
            portraitSrc="/warriors/luna_bard.png"
            onSend={handleSend}
            messages={[
              { role: 'assistant', content: "Hey! I'm Luna, your Bard. I'm here to make your content impossible to ignore. What are we creating? 🎭" },
            ]}
          />
        </div>

        <div className="text-center mt-8">
          <Link
            href="/signup"
            className="bg-bard text-bg px-8 py-4 rounded-[var(--radius-btn)] font-medium hover:brightness-110 transition-all inline-block"
          >
            Like Luna? Start Your Free Trial →
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
