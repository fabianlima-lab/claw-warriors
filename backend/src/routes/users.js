import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function stripHtml(str) {
  return String(str).replace(/<[^>]*>/g, '').trim();
}

async function userRoutes(app) {
  // POST /api/users/goals — save onboarding goals
  app.post('/goals', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { goals } = request.body || {};

    if (!goals || (typeof goals !== 'string' && !Array.isArray(goals))) {
      return reply.code(400).send({ error: 'goals is required (string or array)' });
    }

    const goalsStr = Array.isArray(goals)
      ? goals.map((g) => stripHtml(String(g)).slice(0, 100)).join(',')
      : stripHtml(String(goals)).slice(0, 500);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { goals: goalsStr },
      });

      console.log(`[USER] goals saved for user:${userId} → ${goalsStr}`);
      return reply.send({ success: true, goals: goalsStr });
    } catch (error) {
      console.error('[ERROR] save goals failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // DELETE /api/users/me — permanently delete account and all associated data
  app.delete('/me', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 3, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;

    try {
      // Delete records that don't cascade from User
      await prisma.vaultEntry.deleteMany({ where: { userId } });
      await prisma.questProgress.deleteMany({ where: { userId } });

      // Delete user — cascades to warriors (→ memories, pulses, rhythms) and messages
      await prisma.user.delete({ where: { id: userId } });

      console.log(`[USER] account deleted: ${userId}`);
      return reply.send({ success: true });
    } catch (error) {
      console.error('[ERROR] account deletion failed:', error.message);
      return reply.code(500).send({ error: 'Failed to delete account. Please try again.' });
    }
  });
}

export default userRoutes;
