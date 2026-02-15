import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import env from '../config/env.js';
import { isValidTier } from '../utils/helpers.js';

const prisma = new PrismaClient();

// Initialize Stripe (null if not configured)
const stripe = env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_test_xxx')
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

// Price IDs are set in Stripe Dashboard — map them here
// These get populated when you create products in Stripe
const PRICE_MAP = {
  pro: process.env.STRIPE_PRICE_PRO || null,
  pro_tribe: process.env.STRIPE_PRICE_PRO_TRIBE || null,
};

// Reverse lookup: price ID → tier
function tierFromPriceId(priceId) {
  if (priceId === PRICE_MAP.pro) return 'pro';
  if (priceId === PRICE_MAP.pro_tribe) return 'pro_tribe';
  return null;
}

// Reverse lookup: amount → tier (fallback when price IDs not configured)
function tierFromAmount(amountInCents) {
  if (amountInCents === 3000) return 'pro';
  if (amountInCents === 5000) return 'pro_tribe';
  return null;
}

async function billingRoutes(app) {
  // ─────────────────────────────────────────────
  // POST /api/billing/checkout
  // Creates a Stripe Checkout Session for Pro or Pro Tribe
  // ─────────────────────────────────────────────
  app.post('/checkout', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { plan } = request.body || {};
    const userId = request.user.userId;

    if (!plan || !['pro', 'pro_tribe'].includes(plan)) {
      return reply.code(400).send({ error: 'Plan must be "pro" or "pro_tribe"' });
    }

    if (!stripe) {
      return reply.code(503).send({ error: 'Billing is not configured yet' });
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return reply.code(503).send({ error: `Price not configured for ${plan}. Set STRIPE_PRICE_PRO and STRIPE_PRICE_PRO_TRIBE env vars.` });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // If user already has a Stripe customer, reuse it
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: userId },
        });
        customerId = customer.id;

        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${env.APP_URL}/dashboard?upgraded=true`,
        cancel_url: `${env.APP_URL}/dashboard`,
        metadata: { user_id: userId, plan },
      });

      console.log(`[BILLING] checkout session created for user:${userId} plan:${plan}`);

      return reply.send({ url: session.url, session_id: session.id });
    } catch (error) {
      console.error('[ERROR] checkout failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong creating checkout. Try again.' });
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/billing/webhook
  // Stripe webhook handler — processes subscription events
  // Always returns 200 to prevent retries
  // ─────────────────────────────────────────────
  app.post('/webhook', {
    config: {
      // No rate limit on webhooks — Stripe needs to reach us
    },
  }, async (request, reply) => {
    let event;

    // Verify webhook signature if Stripe SDK + webhook secret are configured
    const canVerify = stripe && env.STRIPE_WEBHOOK_SECRET
      && !env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_xxx');

    if (canVerify) {
      const sig = request.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          request.rawBody,
          sig,
          env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        console.error(`[ERROR] stripe webhook signature failed: ${err.message}`);
        return reply.code(200).send({ received: true }); // Still 200 to not trigger retries
      }
    } else {
      // No signature verification in dev — process raw body
      event = request.body;
    }

    try {
      switch (event.type) {
        // ── New subscription from checkout ──
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = session.metadata?.user_id;

          if (!userId) {
            console.error('[ERROR] checkout.session.completed: no user_id in metadata');
            break;
          }

          // Determine tier from metadata or amount
          let tier = session.metadata?.plan;
          if (!tier || !isValidTier(tier)) {
            tier = tierFromAmount(session.amount_total);
          }

          if (!tier) {
            console.error(`[ERROR] checkout.session.completed: cannot determine tier from amount ${session.amount_total}`);
            break;
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              tier,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              trialEndsAt: null, // Clear trial — they're paid now
            },
          });

          console.log(`[BILLING] upgraded user:${userId} to ${tier}`);
          break;
        }

        // ── Subscription updated (plan change, renewal) ──
        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const subId = subscription.id;

          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subId },
          });

          if (!user) {
            console.log(`[BILLING] subscription.updated: no user found for sub:${subId}`);
            break;
          }

          // Check if subscription is still active
          if (subscription.status === 'active') {
            // Determine new tier from price
            const priceId = subscription.items?.data?.[0]?.price?.id;
            const newTier = tierFromPriceId(priceId) || user.tier;

            if (newTier !== user.tier) {
              await prisma.user.update({
                where: { id: user.id },
                data: { tier: newTier },
              });
              console.log(`[BILLING] plan changed user:${user.id} from ${user.tier} to ${newTier}`);
            }
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            console.log(`[BILLING] subscription ${subscription.status} for user:${user.id}`);
            // Don't downgrade immediately — Stripe retries payment
          }

          break;
        }

        // ── Subscription cancelled or expired ──
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const subId = subscription.id;

          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subId },
          });

          if (!user) {
            console.log(`[BILLING] subscription.deleted: no user found for sub:${subId}`);
            break;
          }

          // Downgrade to expired trial (paywall)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tier: 'trial',
              trialEndsAt: new Date(0), // Epoch = expired immediately
              stripeSubscriptionId: null,
            },
          });

          console.log(`[BILLING] cancelled: user:${user.id} downgraded to expired trial`);
          break;
        }

        default:
          // Unhandled event type — log but don't error
          console.log(`[BILLING] unhandled event: ${event.type}`);
      }
    } catch (error) {
      console.error(`[ERROR] stripe webhook processing: ${error.message}`);
    }

    // Always return 200
    return reply.code(200).send({ received: true });
  });

  // ─────────────────────────────────────────────
  // GET /api/billing/status
  // Returns current billing status for the user
  // ─────────────────────────────────────────────
  app.get('/status', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const isTrialUser = user.tier === 'trial';
      const trialExpired = isTrialUser && user.trialEndsAt && new Date() > new Date(user.trialEndsAt);
      const daysRemaining = user.trialEndsAt
        ? Math.max(0, Math.ceil(
            (new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ))
        : null;

      const status = {
        tier: user.tier,
        is_trial: isTrialUser,
        trial_expired: trialExpired,
        trial_days_remaining: daysRemaining,
        has_subscription: !!user.stripeSubscriptionId,
        stripe_customer_id: user.stripeCustomerId || null,
      };

      // If they have an active subscription and Stripe is configured, get details
      if (stripe && user.stripeSubscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          status.subscription = {
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          };
        } catch (subErr) {
          console.error(`[ERROR] stripe subscription fetch: ${subErr.message}`);
          // Don't fail the whole request
        }
      }

      return reply.send(status);
    } catch (error) {
      console.error('[ERROR] billing status failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/billing/portal
  // Creates a Stripe Customer Portal session for managing subscription
  // ─────────────────────────────────────────────
  app.post('/portal', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    if (!stripe) {
      return reply.code(503).send({ error: 'Billing is not configured yet' });
    }

    const userId = request.user.userId;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user.stripeCustomerId) {
        return reply.code(400).send({ error: 'No billing account found. Subscribe first.' });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${env.APP_URL}/dashboard`,
      });

      console.log(`[BILLING] portal session created for user:${userId}`);

      return reply.send({ url: session.url });
    } catch (error) {
      console.error('[ERROR] portal session failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

export default billingRoutes;
