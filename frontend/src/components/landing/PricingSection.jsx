import Link from 'next/link';
import Card from '@/components/ui/Card';

const PLANS = [
  {
    name: 'Trial',
    price: 'Free',
    period: '7 days',
    features: ['1 warrior', '1 channel (Telegram)', 'Unlimited messages', 'Web search', 'Full Pro experience'],
    cta: 'Start Free Trial',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$39',
    period: '/mo',
    badge: 'Most Popular',
    features: ['1 warrior', 'Telegram + WhatsApp', 'Unlimited messages', 'Web search', 'Custom name & tone', 'Persistent memory'],
    cta: 'Choose Pro',
    href: '/signup',
    highlight: true,
  },
  {
    name: 'Pro Tribe',
    price: '$59',
    period: '/mo',
    features: ['3 warriors (separate bots)', 'Telegram + WhatsApp', 'Unlimited messages', 'Web search', 'Custom name & tone', 'Priority support'],
    cta: 'Choose Pro Tribe',
    href: '/signup',
    highlight: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest text-rogue font-medium">Pricing</span>
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-txt mt-3">
          Simple, Flat Pricing
        </h2>
        <p className="text-txt-muted mt-3">No surprise bills. No token tracking. No hidden fees.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`p-8 flex flex-col ${plan.highlight ? 'ring-2 ring-guardian border-transparent' : ''}`}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-[family-name:var(--font-display)] text-xl text-txt">{plan.name}</h3>
              {plan.badge && (
                <span className="text-[10px] uppercase tracking-wider bg-guardian/20 text-guardian px-2 py-0.5 rounded-full font-medium">
                  {plan.badge}
                </span>
              )}
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold text-txt">{plan.price}</span>
              <span className="text-txt-muted text-sm">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-txt-body">
                  <span className="text-success mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-8 block text-center py-3 rounded-[var(--radius-btn)] font-medium text-sm transition-all ${
                plan.highlight
                  ? 'bg-guardian text-bg hover:brightness-110'
                  : 'border border-border text-txt-body hover:bg-elevated'
              }`}
            >
              {plan.cta}
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
