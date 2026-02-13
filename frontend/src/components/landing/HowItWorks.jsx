const STEPS = [
  { num: '01', title: 'Tell Your Goals', desc: 'What do you need help with? Productivity, learning, content, coding, or trading.' },
  { num: '02', title: 'Choose Your Warrior', desc: 'Browse 15 warriors across 5 classes. Each has a unique personality and skill set.' },
  { num: '03', title: 'Connect Telegram', desc: 'Link your Telegram account in one tap. Your warrior goes live instantly.' },
  { num: '04', title: 'Start Chatting', desc: 'Message your warrior anytime. They remember context and get smarter over time.' },
];

export default function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest text-bard font-medium">Getting Started</span>
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-txt mt-3">
          Live in 5 Minutes
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {STEPS.map((step) => (
          <div key={step.num} className="text-center">
            <span className="text-4xl font-bold text-border font-[family-name:var(--font-display)]">{step.num}</span>
            <h3 className="text-txt font-medium mt-3">{step.title}</h3>
            <p className="text-txt-muted text-sm mt-2">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
