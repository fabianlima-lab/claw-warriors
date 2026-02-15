import { listMemories, deleteMemory, clearMemories } from '../services/memory.js';

/**
 * Memory routes — view and manage warrior long-term memories.
 * All routes require authentication.
 */
export default async function memoryRoutes(fastify) {
  // All routes require auth
  fastify.addHook('onRequest', async (request) => {
    await request.jwtVerify();
  });

  // ── GET /api/memory/:warriorId — List memories ──
  fastify.get('/:warriorId', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { warriorId } = request.params;
    const { category, page } = request.query;

    try {
      // Verify warrior belongs to user
      const warrior = await fastify.prisma.warrior.findFirst({
        where: { id: warriorId, userId: request.user.id },
      });

      if (!warrior) {
        return reply.status(404).send({ error: 'Warrior not found' });
      }

      const result = await listMemories(warriorId, {
        category: category || null,
        page: parseInt(page) || 1,
      });

      return reply.send(result);
    } catch (error) {
      console.error(`[MEMORY] list error: ${error.message}`);
      return reply.status(500).send({ error: 'Failed to load memories' });
    }
  });

  // ── DELETE /api/memory/:warriorId/:memoryId — Delete a memory ──
  fastify.delete('/:warriorId/:memoryId', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { warriorId, memoryId } = request.params;

    try {
      // Verify warrior belongs to user
      const warrior = await fastify.prisma.warrior.findFirst({
        where: { id: warriorId, userId: request.user.id },
      });

      if (!warrior) {
        return reply.status(404).send({ error: 'Warrior not found' });
      }

      await deleteMemory(memoryId, warriorId);
      return reply.send({ success: true });
    } catch (error) {
      console.error(`[MEMORY] delete error: ${error.message}`);
      return reply.status(500).send({ error: 'Failed to delete memory' });
    }
  });

  // ── DELETE /api/memory/:warriorId — Clear all memories ──
  fastify.delete('/:warriorId', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { warriorId } = request.params;

    try {
      // Verify warrior belongs to user
      const warrior = await fastify.prisma.warrior.findFirst({
        where: { id: warriorId, userId: request.user.id },
      });

      if (!warrior) {
        return reply.status(404).send({ error: 'Warrior not found' });
      }

      const count = await clearMemories(warriorId);
      return reply.send({ success: true, cleared: count });
    } catch (error) {
      console.error(`[MEMORY] clear error: ${error.message}`);
      return reply.status(500).send({ error: 'Failed to clear memories' });
    }
  });
}
