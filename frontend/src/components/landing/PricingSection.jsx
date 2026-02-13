import Link from 'next/link';

const PLANS = [
  {
    name: 'Trial',
    price: 'Free',
    period: '7 days',
    features: ['1 warrior', '1 channel (Telegram)', 'Unlimited messages', 'Web search', 'Full feature preview'],
    cta: 'Start Free Trial',
    href: '/signup?plan=trial',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$39',
    period: '/mo',
    badge: 'Most Popular',
    features: ['1 warrior', 'Telegram + WhatsApp (soon)', 'Unlimited messages', 'Web search', 'Custom name & tone', 'Persistent memory'],
    cta: 'Choose Pro',
    href: '/signup?plan=pro',
    highlight: true,
  },
  {
    name: 'Pro Tribe',
    price: '$59',
    period: '/mo',
    features: ['3 warriors', 'Telegram + WhatsApp (soon)', 'Unlimited messages', 'Web search', 'Custom name & tone', 'Priority support'],
    cta: 'Choose Pro Tribe',
    href: '/signup?plan=pro_tribe',
    highlight: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-6 text-center">
      <span className="text-xs font-semibold text-accent tracking-[2px] uppercase">
        PRICING
      </span>
      <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] font-bold text-txt mt-3 mb-2">
        Simple, Flat Pricing
      </h2>
      <p className="text-[17px] text-txt-muted mb-12">
        No surprise bills. No token tracking. No hidden fees.
      </p>

      <div className="flex gap-5 justify-center flex-wrap max-w-[860px] mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className="flex-1 min-w-[240px] max-w-[270px] rounded-[var(--radius-card)] p-8 text-left relative"
            style={{
              background: plan.highlight ? 'rgba(232,99,43,0.08)' : 'var(--color-card)',
              border: plan.highlight ? '1px solid rgba(232,99,43,0.3)' : '1px solid var(--color-border)',
            }}
          >
            {plan.badge && (
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent rounded-full px-3.5 py-0.5 text-xs font-bold text-white"
              >
                {plan.badge}
              </div>
            )}

            <h3 className="text-xl font-bold text-txt mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-txt">{plan.price}</span>
              <span className="text-[15px] text-txt-muted">{plan.period}</span>
            </div>

            {plan.features.map((f) => (
              <div key={f} className="flex items-center gap-2 py-1.5 text-[15px] text-txt-muted">
                <span className="text-success text-xs">&#10003;</span> {f}
              </div>
            ))}

            <Link
              href={plan.href}
              className={`block w-full text-center mt-5 py-2.5 rounded-[var(--radius-btn)] text-[15px] font-semibold transition-all ${
                plan.highlight
                  ? 'bg-accent text-white hover:opacity-90'
                  : 'border border-border text-txt-muted hover:bg-elevated'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
