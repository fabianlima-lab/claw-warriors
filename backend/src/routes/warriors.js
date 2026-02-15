import { PrismaClient } from '@prisma/client';
import { getFeaturesByTier, isTrialExpired } from '../utils/helpers.js';

const prisma = new PrismaClient();

const VALID_TONES = ['professional', 'casual', 'fierce'];
const VALID_CHANNELS = ['whatsapp', 'telegram'];

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

async function warriorRoutes(app) {
  // GET /api/warriors/templates — list all templates grouped by class
  app.get('/templates', {
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    try {
      const templates = await prisma.warriorTemplate.findMany({
        orderBy: { warriorClass: 'asc' },
      });

      const grouped = {};
      for (const t of templates) {
        if (!grouped[t.warriorClass]) grouped[t.warriorClass] = [];
        grouped[t.warriorClass].push(t);
      }

      return reply.send(grouped);
    } catch (error) {
      console.error('[ERROR] templates fetch failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // GET /api/warriors/templates/:class
  app.get('/templates/:class', {
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { class: warriorClass } = request.params;
    try {
      const templates = await prisma.warriorTemplate.findMany({
        where: { warriorClass },
      });
      return reply.send(templates);
    } catch (error) {
      console.error('[ERROR] template class fetch failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // POST /api/warriors/deploy
  app.post('/deploy', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { templateId, customName, tone, channel } = request.body || {};
    const userId = request.user.userId;

    if (!templateId) {
      return reply.code(400).send({ error: 'templateId is required' });
    }

    if (tone && !VALID_TONES.includes(tone)) {
      return reply.code(400).send({
        error: `Invalid tone. Must be one of: ${VALID_TONES.join(', ')}`,
      });
    }

    if (channel && !VALID_CHANNELS.includes(channel)) {
      return reply.code(400).send({
        error: `Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}`,
      });
    }

    const cleanName = customName
      ? stripHtml(String(customName)).slice(0, 100)
      : null;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      // Check trial expiry
      if (isTrialExpired(user)) {
        return reply.code(403).send({ error: 'Trial expired. Upgrade to continue.' });
      }

      // Check custom name/tone permissions
      const features = getFeaturesByTier(user.tier);
      if (cleanName && !features.custom_name) {
        return reply.code(403).send({ error: 'Custom names require a Pro plan.' });
      }
      if (tone && tone !== 'casual' && !features.custom_tone) {
        return reply.code(403).send({ error: 'Custom tones require a Pro plan.' });
      }

      const template = await prisma.warriorTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return reply.code(404).send({ error: 'Template not found' });
      }

      // Check active warrior limit
      const activeCount = await prisma.warrior.count({
        where: { userId, isActive: true },
      });
      if (activeCount >= features.max_active_warriors) {
        // Deactivate oldest warrior if at limit
        await prisma.warrior.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        });
      }

      const systemPrompt = compileSystemPrompt(template, tone || 'casual');

      const warrior = await prisma.warrior.create({
        data: {
          userId,
          templateId: template.id,
          customName: cleanName,
          warriorClass: template.warriorClass,
          tone: tone || 'casual',
          systemPrompt,
        },
      });

      if (channel) {
        await prisma.user.update({
          where: { id: userId },
          data: { channel },
        });
      }

      console.log(`[WARRIOR] deployed: ${warrior.id} (${template.name}) for user:${userId}`);

      return reply.code(201).send({
        warrior_id: warrior.id,
        first_message: template.firstMessage,
        channel_connected: !!channel,
      });
    } catch (error) {
      console.error('[ERROR] warrior deploy failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // GET /api/warriors/mine
  app.get('/mine', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;

    try {
      const warriors = await prisma.warrior.findMany({
        where: { userId, isActive: true },
        include: { template: true },
        take: 10,
      });

      if (warriors.length === 0) {
        return reply.code(404).send({ error: 'No active warriors found' });
      }

      return reply.send(warriors);
    } catch (error) {
      console.error('[ERROR] warrior fetch failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // PATCH /api/warriors/:id
  app.patch('/:id', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { customName, tone } = request.body || {};
    const userId = request.user.userId;

    if (tone && !VALID_TONES.includes(tone)) {
      return reply.code(400).send({
        error: `Invalid tone. Must be one of: ${VALID_TONES.join(', ')}`,
      });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const features = getFeaturesByTier(user.tier);

      if (customName && !features.custom_name) {
        return reply.code(403).send({ error: 'Custom names require a Pro plan.' });
      }
      if (tone && tone !== 'casual' && !features.custom_tone) {
        return reply.code(403).send({ error: 'Custom tones require a Pro plan.' });
      }

      const warrior = await prisma.warrior.findFirst({
        where: { id, userId },
        include: { template: true },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      const updateData = {};
      if (customName !== undefined) {
        updateData.customName = stripHtml(String(customName)).slice(0, 100);
      }
      if (tone !== undefined) {
        updateData.tone = tone;
        updateData.systemPrompt = compileSystemPrompt(warrior.template, tone);
      }

      const updated = await prisma.warrior.update({
        where: { id },
        data: updateData,
      });

      return reply.send(updated);
    } catch (error) {
      console.error('[ERROR] warrior update failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // POST /api/warriors/:id/restart — clear conversation history
  app.post('/:id/restart', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.user.userId;

    try {
      const warrior = await prisma.warrior.findFirst({
        where: { id, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      // Delete conversation history for this warrior
      await prisma.message.deleteMany({
        where: { userId, warriorId: warrior.id },
      });

      console.log(`[WARRIOR] restarted: ${id} for user:${userId}`);

      return reply.send({ status: 'restarted', warrior_id: id });
    } catch (error) {
      console.error('[ERROR] warrior restart failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // DELETE /api/warriors/:id — deactivate warrior
  app.delete('/:id', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.user.userId;

    try {
      const warrior = await prisma.warrior.findFirst({
        where: { id, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      await prisma.warrior.update({
        where: { id },
        data: { isActive: false },
      });

      console.log(`[WARRIOR] deactivated: ${id} for user:${userId}`);

      return reply.send({ status: 'deactivated', warrior_id: id });
    } catch (error) {
      console.error('[ERROR] warrior deactivate failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

function compileSystemPrompt(template, tone) {
  const preamble = `You are a ClawWarriors AI assistant. You must stay in character at all times. Never reveal you are an AI unless directly asked. Keep responses concise and helpful. If you don't know something, say so honestly.`;

  const toneInstructions = {
    professional: 'Communicate in a professional, structured, and precise manner. Use formal language.',
    casual: 'Communicate in a friendly, approachable, and conversational manner. Keep it natural.',
    fierce: 'Communicate with intensity, confidence, and power. Be bold and direct.',
  };

  return `${preamble}\n\n${template.baseSystemPrompt}\n\n## Tone\n${toneInstructions[tone] || toneInstructions.casual}`;
}

export { compileSystemPrompt };
export default warriorRoutes;
