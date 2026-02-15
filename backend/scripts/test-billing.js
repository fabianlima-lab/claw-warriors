import { build } from '../src/server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = await build();
await app.listen({ port: 3092, host: '127.0.0.1' });
const BASE = 'http://127.0.0.1:3092';
console.log('=== Phase 4 Billing Smoke Test ===\n');

let pass = 0;
let fail = 0;

function check(name, condition, extra) {
  if (condition) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}`);
  }
  if (extra) console.log(`     ${extra}`);
}

// 1. Signup
let res = await fetch(BASE + '/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'bill3@test.com', password: 'testpass123' }),
});
let data = await res.json();
const token = data.token;
const userId = data.user_id;
const auth = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
check('Signup', res.status === 201);

// 2. Billing status (trial)
res = await fetch(BASE + '/api/billing/status', { headers: auth });
data = await res.json();
check('Billing status (trial)', data.tier === 'trial' && data.is_trial === true && data.trial_expired === false,
  `tier=${data.tier} is_trial=${data.is_trial} expired=${data.trial_expired} days=${data.trial_days_remaining}`);

// 3. Invalid plan
res = await fetch(BASE + '/api/billing/checkout', {
  method: 'POST', headers: auth,
  body: JSON.stringify({ plan: 'premium' }),
});
check('Invalid plan rejected (400)', res.status === 400);

// 4. Valid plan, no Stripe configured
res = await fetch(BASE + '/api/billing/checkout', {
  method: 'POST', headers: auth,
  body: JSON.stringify({ plan: 'pro' }),
});
check('Checkout without Stripe (503)', res.status === 503);

// 5. Simulate upgrade via webhook (checkout.session.completed)
res = await fetch(BASE + '/api/billing/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'checkout.session.completed',
    data: {
      object: {
        metadata: { user_id: userId, plan: 'pro' },
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_total: 3000,
      },
    },
  }),
});
check('Upgrade webhook (200)', res.status === 200);

// 6. Verify upgrade
res = await fetch(BASE + '/api/billing/status', { headers: auth });
data = await res.json();
check('User upgraded to pro', data.tier === 'pro' && data.has_subscription === true && data.is_trial === false,
  `tier=${data.tier} sub=${data.has_subscription} trial=${data.is_trial}`);

// 7. Dashboard shows pro features
res = await fetch(BASE + '/api/dashboard/stats', { headers: auth });
data = await res.json();
check('Dashboard: pro features', data.tier === 'pro' && data.features.custom_name === true && data.max_warriors === 1,
  `max_warriors=${data.max_warriors} custom_name=${data.features.custom_name} custom_tone=${data.features.custom_tone}`);

// 8. Upgrade to pro_tribe via new checkout
res = await fetch(BASE + '/api/billing/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'checkout.session.completed',
    data: {
      object: {
        metadata: { user_id: userId, plan: 'pro_tribe' },
        customer: 'cus_test_123',
        subscription: 'sub_test_456',
        amount_total: 5000,
      },
    },
  }),
});
res = await fetch(BASE + '/api/dashboard/stats', { headers: auth });
data = await res.json();
check('Upgrade to pro_tribe', data.tier === 'pro_tribe' && data.max_warriors === 3,
  `tier=${data.tier} max_warriors=${data.max_warriors}`);

// 9. Cancellation webhook
res = await fetch(BASE + '/api/billing/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'customer.subscription.deleted',
    data: { object: { id: 'sub_test_456' } },
  }),
});
check('Cancellation webhook (200)', res.status === 200);

// 10. Verify downgrade to expired trial
res = await fetch(BASE + '/api/billing/status', { headers: auth });
data = await res.json();
check('Downgraded to expired trial', data.tier === 'trial' && data.trial_expired === true && data.has_subscription === false,
  `tier=${data.tier} expired=${data.trial_expired} sub=${data.has_subscription}`);

// 11. Deploy blocked after cancellation
await prisma.warrior.deleteMany({ where: { userId } });
res = await fetch(BASE + '/api/warriors/deploy', {
  method: 'POST', headers: auth,
  body: JSON.stringify({ templateId: 'vex_rogue' }),
});
check('Deploy blocked (expired trial)', res.status === 403);

// 12. Portal without Stripe
res = await fetch(BASE + '/api/billing/portal', {
  method: 'POST', headers: auth,
  body: JSON.stringify({}),
});
check('Portal without Stripe (503)', res.status === 503);

// 13. Amount-based tier detection (no plan in metadata)
const res13 = await fetch(BASE + '/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'amount@test.com', password: 'testpass123' }),
});
const data13 = await res13.json();
await fetch(BASE + '/api/billing/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'checkout.session.completed',
    data: {
      object: {
        metadata: { user_id: data13.user_id },
        customer: 'cus_test_amt',
        subscription: 'sub_test_amt',
        amount_total: 5000,
      },
    },
  }),
});
const user13 = await prisma.user.findUnique({ where: { id: data13.user_id } });
check('Amount-based tier detection ($50 → pro_tribe)', user13.tier === 'pro_tribe',
  `tier=${user13.tier}`);

console.log(`\n=== Results: ${pass}/${pass + fail} passed ===`);

await prisma.$disconnect();
await app.close();
process.exit(fail > 0 ? 1 : 0);
