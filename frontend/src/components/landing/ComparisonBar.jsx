const POINTS = [
  { icon: '🔑', text: 'No API keys needed' },
  { icon: '💰', text: 'No surprise bills' },
  { icon: '⚙️', text: 'No setup headaches' },
  { icon: '🎭', text: 'Real personality' },
];

export default function ComparisonBar() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="bg-gradient-to-r from-card to-card-end border border-border rounded-[var(--radius-card)] p-8 md:p-12 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-txt">
          Why ClawWarriors vs BYOK?
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8 mt-8">
          {POINTS.map((p) => (
            <div key={p.text} className="flex items-center gap-2">
              <span className="text-xl">{p.icon}</span>
              <span className="text-txt-body text-sm font-medium">{p.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
