export default function ComparisonBar() {
  const diy = [
    'Buy a server or Mac Mini',
    'Install Node.js, SSH, Docker',
    'Configure API keys & models',
    'Set up Telegram bot manually',
    'Monitor uptime & debug crashes',
    '~60 min if you\'re technical',
  ];

  const cw = [
    'Pick a warrior with a personality',
    'Connect Telegram in one tap',
    'No API keys needed — ever',
    'Unlimited messages, flat price',
    'We handle servers & uptime',
    'Live in under 3 minutes',
  ];

  return (
    <section className="py-16 px-6 text-center">
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(28px,3.5vw,40px)] font-bold text-txt mb-8">
        Why ClawWarriors vs. DIY?
      </h2>

      <div className="flex gap-6 justify-center flex-wrap max-w-[700px] mx-auto">
        {/* DIY Column */}
        <div className="flex-1 min-w-[300px] bg-card border border-border rounded-[14px] p-5 text-left opacity-50">
          <h3 className="text-lg text-txt-muted mb-4">Setting up OpenClaw yourself</h3>
          {diy.map((t) => (
            <div key={t} className="flex items-center gap-2 py-1.5 text-[15px] text-txt-dim">
              <span className="text-danger">&#10007;</span> {t}
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
          <h3 className="text-lg text-accent font-bold mb-4">ClawWarriors</h3>
          {cw.map((t) => (
            <div key={t} className="flex items-center gap-2 py-1.5 text-[15px] text-txt">
              <span className="text-success">&#10003;</span> {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
