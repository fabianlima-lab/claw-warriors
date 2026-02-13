'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiPost } from '@/lib/api';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$39',
    period: '/mo',
    features: [
      '1 warrior',
      'Telegram (WhatsApp coming soon)',
      'Unlimited messages',
      'Web search',
      'Custom name & tone',
      'Persistent memory',
    ],
  },
  {
    id: 'pro_tribe',
    name: 'Pro Tribe',
    price: '$59',
    period: '/mo',
    features: [
      '3 warriors (separate Telegram bots)',
      'All Pro features',
      'Priority support',
    ],
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState(null);

  const handleChoose = async (plan) => {
    setLoading(plan);
    try {
      const data = await apiPost('/billing/checkout', { plan });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout failed:', err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-txt">
          Upgrade Your Power
        </h1>
        <p className="text-txt-muted mt-3">
          Choose a plan and unlock the full potential of your warrior.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {PLANS.map((plan) => (
          <Card key={plan.id} className="p-8 flex flex-col">
            <h3 className="font-[family-name:var(--font-display)] text-2xl text-txt">{plan.name}</h3>
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
            <Button
              onClick={() => handleChoose(plan.id)}
              loading={loading === plan.id}
              className="w-full mt-8"
            >
              Choose {plan.name}
            </Button>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-txt-dim mt-8">
        🔒 Secure checkout powered by Stripe
      </p>
    </div>
  );
}
