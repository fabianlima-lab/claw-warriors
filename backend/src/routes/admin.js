import { PrismaClient } from '@prisma/client';
import adminGuard from '../middleware/adminGuard.js';

const prisma = new PrismaClient();

const VALID_SORT_FIELDS = {
  created_at: 'createdAt',
  email: 'email',
  tier: 'tier',
};

function groupByDate(items) {
  const map = {};
  for (const item of items) {
    const date = new Date(item.createdAt).toISOString().slice(0, 10);
    map[date] = (map[date] || 0) + 1;
  }
  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function adminRoutes(app) {
  const adminPreHandlers = [app.authenticate, adminGuard];
  const rl = { max: 30, timeWindow: '1 minute' };

  // ── GET /api/admin/overview ──
  app.get('/overview', {
    preHandler: adminPreHandlers,
    config: { rateLimit: rl },
  }, async (request, reply) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [totalUsers, totalMessages, totalWarriors, activeUsers] = await Promise.all([
        prisma.user.count(),
        prisma.message.count(),
        prisma.warrior.count(),
        prisma.user.count({
          where: { messages: { some: { createdAt: { gte: sevenDaysAgo } } } },
        }),
      ]);

      return reply.send({
        total_users: totalUsers,
        total_messages: totalMessages,
        total_warriors: totalWarriors,
        active_users_7d: activeUsers,
      });
    } catch (error) {
      console.error('[ADMIN] overview error:', error.message);
      return reply.code(500).send({ error: 'Failed to load overview' });
    }
  });

  // ── GET /api/admin/signups ──
  app.get('/signups', {
    preHandler: adminPreHandlers,
    config: { rateLimit: rl },
  }, async (request, reply) => {
    try {
      const days = Math.min(parseInt(request.query.days || '30', 10), 90);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const users = await prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      return reply.send({ days, data: groupByDate(users) });
    } catch (error) {
      console.error('[ADMIN] signups error:', error.message);
      return reply.code(500).send({ error: 'Failed to load signups' });
    }
  });

  // ── GET /api/admin/tiers ──
  app.get('/tiers', {
    preHandler: adminPreHandlers,
    config: { rateLimit: rl },
  }, async (request, reply) => {
    try {
      const tiers = await prisma.user.groupBy({
        by: ['tier'],
        _count: { id: true },
      });

      return reply.send({
        tiers: tiers.map(t => ({ tier: t.tier, count: t._count.id })),
      });
    } catch (error) {
      console.error('[ADMIN] tiers error:', error.message);
      return reply.code(500).send({ error: 'Failed to load tiers' });
    }
  });

  // ── GET /api/admin/users ──
  app.get('/users', {
    preHandler: adminPreHandlers,
    config: { rateLimit: rl },
  }, async (request, reply) => {
    try {
      const sortParam = request.query.sort || 'created_at';
      const orderParam = request.query.order === 'asc' ? 'asc' : 'desc';
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
      const offset = Math.max(parseInt(request.query.offset || '0', 10), 0);

      const sortField = VALID_SORT_FIELDS[sortParam] || 'createdAt';

      const [total, users] = await Promise.all([
        prisma.user.count(),
        prisma.user.findMany({
          orderBy: { [sortField]: orderParam },
          take: limit,
          skip: offset,
          select: {
            id: true,
            email: true,
            tier: true,
            authProvider: true,
            channel: true,
            channel2: true,
            createdAt: true,
            _count: {
              select: {
                warriors: true,
                messages: true,
              },
            },
          },
        }),
      ]);

      // Get last active dates for these users
      const userIds = users.map(u => u.id);
      let lastActiveMap = {};

      if (userIds.length > 0) {
        const lastMessages = await prisma.$queryRaw`
          SELECT user_id, MAX(created_at) as last_active
          FROM messages
          WHERE user_id = ANY(${userIds}::uuid[])
          GROUP BY user_id
        `;
        for (const row of lastMessages) {
          lastActiveMap[row.user_id] = row.last_active;
        }
      }

      const formatted = users.map(u => {
        const channels = [u.channel, u.channel2].filter(Boolean);
        return {
          id: u.id,
          email: u.email,
          tier: u.tier,
          auth_provider: u.authProvider,
          channels,
          signup_date: u.createdAt,
          message_count: u._count.messages,
          warrior_count: u._count.warriors,
          last_active: lastActiveMap[u.id] || null,
        };
      });

      return reply.send({ total, users: formatted });
    } catch (error) {
      console.error('[ADMIN] users error:', error.message);
      return reply.code(500).send({ error: 'Failed to load users' });
    }
  });

  // ── GET /api/admin/messages ──
  app.get('/messages', {
    preHandler: adminPreHandlers,
    config: { rateLimit: rl },
  }, async (request, reply) => {
    try {
      const days = Math.min(parseInt(request.query.days || '30', 10), 90);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const messages = await prisma.message.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      return reply.send({ days, data: groupByDate(messages) });
    } catch (error) {
      console.error('[ADMIN] messages error:', error.message);
      return reply.code(500).send({ error: 'Failed to load messages' });
    }
  });

  // ── GET /api/admin/popular-warriors ──
  app.get('/popular-warriors', {
    preHandler: adminPreHandlers,
    config: { rateLimit: rl },
  }, async (request, reply) => {
    try {
      const popular = await prisma.warrior.groupBy({
        by: ['templateId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      });

      const templateIds = popular.map(p => p.templateId);
      const templates = await prisma.warriorTemplate.findMany({
        where: { id: { in: templateIds } },
        select: { id: true, name: true, warriorClass: true, artFile: true },
      });

      const templateMap = {};
      for (const t of templates) {
        templateMap[t.id] = t;
      }

      const warriors = popular.map(p => {
        const t = templateMap[p.templateId] || {};
        return {
          template_id: p.templateId,
          name: t.name || p.templateId,
          warrior_class: t.warriorClass || 'unknown',
          art_file: t.artFile || `${p.templateId}.png`,
          deploy_count: p._count.id,
        };
      });

      return reply.send({ warriors });
    } catch (error) {
      console.error('[ADMIN] popular-warriors error:', error.message);
      return reply.code(500).send({ error: 'Failed to load popular warriors' });
    }
  });

  // ── GET /api/admin/channels ──
  app.get('/channels', {
    preHandler: adminPreHandlers,
    config: { rateLimit: rl },
  }, async (request, reply) => {
    try {
      const [primaryChannels, secondaryChannels, messageChannels] = await Promise.all([
        prisma.user.groupBy({
          by: ['channel'],
          _count: { id: true },
          where: { channel: { not: null } },
        }),
        prisma.user.groupBy({
          by: ['channel2'],
          _count: { id: true },
          where: { channel2: { not: null } },
        }),
        prisma.message.groupBy({
          by: ['channel'],
          _count: { id: true },
        }),
      ]);

      // Merge primary + secondary channel counts
      const channelCounts = {};
      for (const c of primaryChannels) {
        channelCounts[c.channel] = (channelCounts[c.channel] || 0) + c._count.id;
      }
      for (const c of secondaryChannels) {
        channelCounts[c.channel2] = (channelCounts[c.channel2] || 0) + c._count.id;
      }

      const connectedChannels = Object.entries(channelCounts)
        .map(([channel, count]) => ({ channel, count }))
        .sort((a, b) => b.count - a.count);

      const msgChannels = messageChannels
        .map(c => ({ channel: c.channel, count: c._count.id }))
        .sort((a, b) => b.count - a.count);

      return reply.send({
        connected_channels: connectedChannels,
        message_channels: msgChannels,
      });
    } catch (error) {
      console.error('[ADMIN] channels error:', error.message);
      return reply.code(500).send({ error: 'Failed to load channels' });
    }
  });
}

export default adminRoutes;
