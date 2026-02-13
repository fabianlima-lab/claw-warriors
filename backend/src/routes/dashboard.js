import { PrismaClient } from '@prisma/client';
import { isTrialExpired, getFeaturesByTier } from '../utils/helpers.js';
import env from '../config/env.js';

const prisma = new PrismaClient();

async function dashboardRoutes(app) {
  // GET /api/dashboard/stats
  app.get('/stats', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 60, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const activeWarriors = await prisma.warrior.count({
        where: { userId, isActive: true },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const messagesToday = await prisma.message.count({
        where: { userId, createdAt: { gte: today } },
      });

      const messagesThisMonth = await prisma.message.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      });

      const trialExpired = isTrialExpired(user);
      const daysRemaining = user.trialEndsAt
        ? Math.max(0, Math.ceil(
            (new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ))
        : null;

      const features = getFeaturesByTier(user.tier);

      return reply.send({
        email: user.email,
        goals: user.goals,
        tier: user.tier,
        trial_ends_at: user.trialEndsAt,
        trial_expired: trialExpired,
        trial_days_remaining: daysRemaining,
        active_warriors: activeWarriors,
        max_warriors: features.max_active_warriors,
        messages_today: messagesToday,
        messages_this_month: messagesThisMonth,
        channel: user.channel,
        channel_2: user.channel2,
        features,
        upgrade_url: trialExpired ? `${env.APP_URL}/upgrade` : null,
      });
    } catch (error) {
      console.error('[ERROR] dashboard stats failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // GET /api/dashboard/messages
  app.get('/messages', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 60, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
    const offset = parseInt(request.query.offset || '0', 10);

    try {
      const messages = await prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return reply.send(messages);
    } catch (error) {
      console.error('[ERROR] dashboard messages failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

export default dashboardRoutes;
