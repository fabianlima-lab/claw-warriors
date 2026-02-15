import { getQuestState, checkAndCompleteQuests, QUESTS } from '../services/quest-tracker.js';

async function questRoutes(app) {
  // ─────────────────────────────────────────────
  // GET /api/quests
  // Returns full quest state for the authenticated user
  // ─────────────────────────────────────────────
  app.get('/', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 60, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;

    try {
      // Run auto-completion check first
      await checkAndCompleteQuests(userId);

      // Then return current state
      const state = await getQuestState(userId);
      return reply.send(state);
    } catch (err) {
      console.error('[ERROR] quest state fetch failed:', err.message);
      return reply.code(500).send({ error: 'Failed to load quest progress' });
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/quests/definitions
  // Returns all quest definitions (no auth needed for display)
  // ─────────────────────────────────────────────
  app.get('/definitions', {
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    return reply.send({ quests: QUESTS });
  });
}

export default questRoutes;
