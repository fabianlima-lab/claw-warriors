import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildTestApp, mockPrisma, getAuthToken } from './helpers.js';

describe('Billing Routes', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = await buildTestApp();
    token = getAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.findFirst.mockReset();
    mockPrisma.user.update.mockReset();
  });

  // ── Webhook ──
  describe('POST /api/billing/webhook', () => {
    it('always returns 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/billing/webhook',
        payload: { type: 'unknown.event', data: { object: {} } },
      });
      expect(res.statusCode).toBe(200);
    });

    it('upgrades user on checkout.session.completed', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      const res = await app.inject({
        method: 'POST',
        url: '/api/billing/webhook',
        payload: {
          type: 'checkout.session.completed',
          data: {
            object: {
              metadata: { user_id: 'user-1', plan: 'pro' },
              customer: 'cus_123',
              subscription: 'sub_123',
              amount_total: 3900,
            },
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            tier: 'pro',
            stripeCustomerId: 'cus_123',
            trialEndsAt: null,
          }),
        }),
      );
    });

    it('downgrades user on subscription.deleted', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', tier: 'pro' });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await app.inject({
        method: 'POST',
        url: '/api/billing/webhook',
        payload: {
          type: 'customer.subscription.deleted',
          data: {
            object: { id: 'sub_123' },
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tier: 'trial',
            stripeSubscriptionId: null,
          }),
        }),
      );
    });
  });

  // ── Checkout ──
  describe('POST /api/billing/checkout', () => {
    it('requires authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/billing/checkout',
        payload: { plan: 'pro' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects invalid plan with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/billing/checkout',
        headers: { authorization: 'Bearer ' + token },
        payload: { plan: 'invalid' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 503 when Stripe not configured', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/billing/checkout',
        headers: { authorization: 'Bearer ' + token },
        payload: { plan: 'pro' },
      });
      expect(res.statusCode).toBe(503);
    });
  });

  // ── Status ──
  describe('GET /api/billing/status', () => {
    it('requires authentication', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/billing/status' });
      expect(res.statusCode).toBe(401);
    });

    it('returns billing status for trial user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        tier: 'trial',
        trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/billing/status',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.tier).toBe('trial');
      expect(body.is_trial).toBe(true);
      expect(body.trial_expired).toBe(false);
      expect(body.trial_days_remaining).toBeGreaterThan(0);
    });
  });

  // ── Portal ──
  describe('POST /api/billing/portal', () => {
    it('requires authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/billing/portal',
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 503 when Stripe not configured', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/billing/portal',
        headers: { authorization: 'Bearer ' + token },
      });
      expect(res.statusCode).toBe(503);
    });
  });
});
