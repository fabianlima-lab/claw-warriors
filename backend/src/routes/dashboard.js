import { PrismaClient } from '@prisma/client';

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
      const energy = await prisma.energy.findUnique({ where: { userId } });
      const warrior = await prisma.warrior.findFirst({
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

      const daysUntilReset = energy
        ? Math.max(0, Math.ceil(
          (new Date(energy.resetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ))
        : 0;

      return reply.send({
        energy_used: energy?.usedThisMonth || 0,
        energy_total: energy?.monthlyAllocation || 0,
        energy_percent: energy?.monthlyAllocation
          ? Math.round((energy.usedThisMonth / energy.monthlyAllocation) * 100)
          : 0,
        messages_today: messagesToday,
        messages_this_month: messagesThisMonth,
        warrior_status: warrior
          ? (warrior.isActive ? 'active' : 'inactive')
          : 'none',
        tier: user?.tier || 'free',
        days_until_reset: daysUntilReset,
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
