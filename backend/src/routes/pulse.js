import { PrismaClient } from '@prisma/client';
import { getFeaturesByTier, isTrialExpired } from '../utils/helpers.js';
import { executePulse } from '../services/scheduler.js';

const prisma = new PrismaClient();

const VALID_PULSE_TYPES = ['morning', 'midday', 'evening', 'night'];
const PULSE_DEFAULTS = {
  morning: { hour: 8, prompt: 'Good morning! Give a brief, energetic start-of-day check-in. Mention anything relevant from memory.' },
  midday: { hour: 12, prompt: 'Quick midday check-in. Ask if they need help with anything or share a useful tip related to their goals.' },
  evening: { hour: 17, prompt: 'End-of-day wrap-up. Summarize what you helped with today, remind of anything pending.' },
  night: { hour: 21, prompt: 'Casual evening message. Keep it light and friendly — a thought, a recommendation, or just a check-in.' },
};

async function pulseRoutes(app) {
  // GET /api/pulse/:warriorId — list all pulse checks for a warrior
  app.get('/:warriorId', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId } = request.params;
    const userId = request.user.userId;

    try {
      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      const pulses = await prisma.pulseCheck.findMany({
        where: { warriorId },
        orderBy: { hour: 'asc' },
      });

      // Get user tier features for gating info
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const features = getFeaturesByTier(user.tier);

      return reply.send({
        pulses,
        tier: user.tier,
        max_pulses: features.max_pulses,
        timezone: user.timezone || 'America/New_York',
      });
    } catch (error) {
      console.error('[ERROR] pulse list failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // POST /api/pulse/:warriorId — create a new pulse check
  app.post('/:warriorId', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId } = request.params;
    const { type, prompt, hour, isActive } = request.body || {};
    const userId = request.user.userId;

    if (!type || !VALID_PULSE_TYPES.includes(type)) {
      return reply.code(400).send({
        error: `Invalid type. Must be one of: ${VALID_PULSE_TYPES.join(', ')}`,
      });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (isTrialExpired(user)) {
        return reply.code(403).send({ error: 'Trial expired. Upgrade to continue.' });
      }

      const features = getFeaturesByTier(user.tier);

      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      // Check if pulse of this type already exists for this warrior
      const existing = await prisma.pulseCheck.findFirst({
        where: { warriorId, type },
      });

      if (existing) {
        return reply.code(409).send({ error: `A ${type} pulse already exists for this warrior. Use PATCH to update.` });
      }

      // Tier gating: check total active pulse count
      const activeCount = await prisma.pulseCheck.count({
        where: { warriorId, isActive: true },
      });

      if (isActive && activeCount >= features.max_pulses) {
        return reply.code(403).send({
          error: `Your plan allows ${features.max_pulses} active pulse(s). Upgrade for more.`,
        });
      }

      const defaults = PULSE_DEFAULTS[type];
      const cleanPrompt = (prompt || defaults.prompt).slice(0, 1000);

      const pulse = await prisma.pulseCheck.create({
        data: {
          warriorId,
          userId,
          type,
          prompt: cleanPrompt,
          hour: hour !== undefined ? Math.max(0, Math.min(23, parseInt(hour, 10))) : defaults.hour,
          isActive: !!isActive,
        },
      });

      console.log(`[PULSE] created: ${pulse.id} type:${type} for warrior:${warriorId}`);

      return reply.code(201).send(pulse);
    } catch (error) {
      console.error('[ERROR] pulse create failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // POST /api/pulse/:warriorId/init — initialize all 4 default pulses (called on deploy)
  app.post('/:warriorId/init', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId } = request.params;
    const userId = request.user.userId;

    try {
      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      // Check if pulses already exist
      const existingCount = await prisma.pulseCheck.count({
        where: { warriorId },
      });

      if (existingCount > 0) {
        return reply.code(409).send({ error: 'Pulses already initialized for this warrior.' });
      }

      // Create all 4 default pulses (all inactive)
      const pulses = await Promise.all(
        VALID_PULSE_TYPES.map((type) =>
          prisma.pulseCheck.create({
            data: {
              warriorId,
              userId,
              type,
              prompt: PULSE_DEFAULTS[type].prompt,
              hour: PULSE_DEFAULTS[type].hour,
              isActive: false,
            },
          })
        )
      );

      console.log(`[PULSE] initialized 4 defaults for warrior:${warriorId}`);

      return reply.code(201).send({ pulses });
    } catch (error) {
      console.error('[ERROR] pulse init failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // PATCH /api/pulse/:warriorId/:pulseId — update a pulse check
  app.patch('/:warriorId/:pulseId', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId, pulseId } = request.params;
    const { prompt, isActive, hour } = request.body || {};
    const userId = request.user.userId;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const features = getFeaturesByTier(user.tier);

      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      const pulse = await prisma.pulseCheck.findFirst({
        where: { id: pulseId, warriorId },
      });

      if (!pulse) {
        return reply.code(404).send({ error: 'Pulse not found' });
      }

      // If activating, check limit
      if (isActive === true && !pulse.isActive) {
        const activeCount = await prisma.pulseCheck.count({
          where: { warriorId, isActive: true },
        });
        if (activeCount >= features.max_pulses) {
          return reply.code(403).send({
            error: `Your plan allows ${features.max_pulses} active pulse(s). Upgrade for more.`,
          });
        }
      }

      const updateData = {};
      if (prompt !== undefined) {
        updateData.prompt = String(prompt).slice(0, 1000);
      }
      if (isActive !== undefined) {
        updateData.isActive = !!isActive;
      }
      if (hour !== undefined) {
        updateData.hour = Math.max(0, Math.min(23, parseInt(hour, 10)));
      }

      const updated = await prisma.pulseCheck.update({
        where: { id: pulseId },
        data: updateData,
      });

      console.log(`[PULSE] updated: ${pulseId} for warrior:${warriorId}`);

      return reply.send(updated);
    } catch (error) {
      console.error('[ERROR] pulse update failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // DELETE /api/pulse/:warriorId/:pulseId — remove a pulse check
  app.delete('/:warriorId/:pulseId', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId, pulseId } = request.params;
    const userId = request.user.userId;

    try {
      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      const pulse = await prisma.pulseCheck.findFirst({
        where: { id: pulseId, warriorId },
      });

      if (!pulse) {
        return reply.code(404).send({ error: 'Pulse not found' });
      }

      await prisma.pulseCheck.delete({ where: { id: pulseId } });

      console.log(`[PULSE] deleted: ${pulseId} for warrior:${warriorId}`);

      return reply.send({ status: 'deleted', pulse_id: pulseId });
    } catch (error) {
      console.error('[ERROR] pulse delete failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // POST /api/pulse/:warriorId/:pulseId/trigger — manual trigger (test fire)
  app.post('/:warriorId/:pulseId/trigger', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 5, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId, pulseId } = request.params;
    const userId = request.user.userId;

    try {
      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
        include: {
          template: true,
          user: true,
        },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      const pulse = await prisma.pulseCheck.findFirst({
        where: { id: pulseId, warriorId },
      });

      if (!pulse) {
        return reply.code(404).send({ error: 'Pulse not found' });
      }

      // Attach warrior data to pulse for executePulse
      const pulseWithWarrior = { ...pulse, warrior: { ...warrior, user: warrior.user } };

      // Execute async (return immediately with status)
      executePulse(pulseWithWarrior).catch((err) => {
        console.error(`[PULSE] manual trigger failed: ${err.message}`);
      });

      console.log(`[PULSE] manual trigger: ${pulseId} for warrior:${warriorId}`);

      return reply.send({
        status: 'triggered',
        pulse_id: pulseId,
        message: 'Pulse is being sent. You should receive it momentarily.',
      });
    } catch (error) {
      console.error('[ERROR] pulse trigger failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // PUT /api/pulse/timezone — update user timezone
  app.put('/timezone', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { timezone } = request.body || {};
    const userId = request.user.userId;

    if (!timezone || typeof timezone !== 'string') {
      return reply.code(400).send({ error: 'timezone is required' });
    }

    // Validate timezone
    try {
      Intl.DateTimeFormat('en-US', { timeZone: timezone });
    } catch {
      return reply.code(400).send({ error: 'Invalid timezone. Use IANA format (e.g., America/New_York).' });
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { timezone },
      });

      console.log(`[PULSE] timezone updated: ${timezone} for user:${userId}`);

      return reply.send({ timezone });
    } catch (error) {
      console.error('[ERROR] timezone update failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

export default pulseRoutes;
