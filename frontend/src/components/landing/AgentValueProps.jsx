import Card from '@/components/ui/Card';

const FEATURES = [
  { icon: '🔗', title: 'Connect Your Apps', desc: 'Telegram, WhatsApp, and more. Your warrior works where you do.' },
  { icon: '🧠', title: 'Persistent Memory', desc: 'Your warrior remembers context across conversations.' },
  { icon: '⚡', title: '24/7 Productivity', desc: 'Always on, always ready. No downtime, no waiting.' },
  { icon: '🌐', title: 'Real-Time Web Search', desc: 'Your warrior searches the web for up-to-date answers.' },
  { icon: '🎭', title: 'Real Personality', desc: '15 distinct personas — not generic chatbot responses.' },
  { icon: '📈', title: 'Grows With You', desc: 'Upgrade your plan, unlock more warriors and channels.' },
];

export default function AgentValueProps() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest text-scholar font-medium">Features</span>
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-txt mt-3">
          More Than a Chatbot
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-6">
            <span className="text-3xl">{f.icon}</span>
            <h3 className="text-txt font-medium mt-3">{f.title}</h3>
            <p className="text-txt-muted text-sm mt-2">{f.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
