const STEPS = [
  { num: '1', title: 'Pick Your Warrior', desc: 'Choose a personality that fits your vibe — work mode, creative, no-nonsense, or chill.' },
  { num: '2', title: 'Connect Telegram', desc: 'One tap. Your warrior goes live in your favorite messaging app instantly.' },
  { num: '3', title: 'Just Ask', desc: 'Text your warrior like a friend. It handles the rest — emails, calendar, research, anything.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 px-6 text-center">
      <span className="text-xs font-semibold text-accent tracking-[2px] uppercase">
        GETTING STARTED
      </span>
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] font-bold text-txt mt-3 mb-12 leading-tight">
        Live in 3 Minutes. Seriously.
      </h2>

      <div className="flex justify-center gap-6 flex-wrap max-w-[900px] mx-auto">
        {STEPS.map((s) => (
          <div
            key={s.num}
            className="flex-1 min-w-[250px] max-w-[280px] bg-card border border-border rounded-[var(--radius-card)] p-8 text-left relative"
          >
            <div
              className="font-[family-name:var(--font-display)] text-5xl font-extrabold absolute top-4 right-5"
              style={{ color: 'rgba(232,99,43,0.12)' }}
            >
              {s.num}
            </div>
            <h3 className="text-xl font-bold text-txt mb-2">{s.title}</h3>
            <p className="text-base text-txt-muted leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
