import { PrismaClient } from '@prisma/client';
import { getFeaturesByTier, isTrialExpired } from '../utils/helpers.js';
import { calculateNextRun, isValidCron, humanReadableCron } from '../services/cron-utils.js';
import { callAI, isAIConfigured } from '../services/ai-client.js';
import { executeRhythm } from '../services/scheduler.js';
import { generateSuggestions } from '../services/rhythm-suggest.js';

const prisma = new PrismaClient();

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

async function rhythmRoutes(app) {
  // GET /api/rhythms/:warriorId — list all rhythms for a warrior
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

      const rhythms = await prisma.warRhythm.findMany({
        where: { warriorId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Get user tier features for gating info
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const features = getFeaturesByTier(user.tier);

      // Enrich with human-readable schedule
      const enriched = rhythms.map((r) => ({
        ...r,
        scheduleText: humanReadableCron(r.cronExpr),
      }));

      return reply.send({
        rhythms: enriched,
        tier: user.tier,
        max_rhythms: features.max_rhythms,
        timezone: user.timezone || 'America/New_York',
      });
    } catch (error) {
      console.error('[ERROR] rhythm list failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // POST /api/rhythms/:warriorId — create a new rhythm
  app.post('/:warriorId', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId } = request.params;
    const { name, taskPrompt, cronExpr, naturalLanguage, timezone } = request.body || {};
    const userId = request.user.userId;

    if (!name || !taskPrompt) {
      return reply.code(400).send({ error: 'name and taskPrompt are required' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (isTrialExpired(user)) {
        return reply.code(403).send({ error: 'Trial expired. Upgrade to continue.' });
      }

      const features = getFeaturesByTier(user.tier);

      if (features.max_rhythms === 0) {
        return reply.code(403).send({ error: 'War Rhythms require a Pro plan. Upgrade to unlock!' });
      }

      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      // Check rhythm count limit
      const rhythmCount = await prisma.warRhythm.count({
        where: { warriorId },
      });

      if (rhythmCount >= features.max_rhythms) {
        return reply.code(403).send({
          error: `Your plan allows ${features.max_rhythms} rhythm(s). Upgrade for more.`,
        });
      }

      // Resolve cron expression
      let resolvedCron = cronExpr;

      if (naturalLanguage && !cronExpr) {
        // Use AI to convert natural language to cron
        resolvedCron = await naturalLanguageToCron(naturalLanguage);
        if (!resolvedCron) {
          return reply.code(400).send({
            error: 'Could not understand the schedule. Try something like "every weekday at 9am" or provide a cron expression.',
          });
        }
      }

      if (!resolvedCron) {
        return reply.code(400).send({ error: 'cronExpr or naturalLanguage schedule is required' });
      }

      if (!isValidCron(resolvedCron)) {
        return reply.code(400).send({ error: 'Invalid cron expression. Example: "0 9 * * 1-5" (weekdays at 9am)' });
      }

      const tz = timezone || user.timezone || 'America/New_York';
      const nextRun = calculateNextRun(resolvedCron, tz);

      const cleanName = stripHtml(String(name)).slice(0, 200);
      const cleanPrompt = stripHtml(String(taskPrompt)).slice(0, 2000);

      const rhythm = await prisma.warRhythm.create({
        data: {
          warriorId,
          userId,
          name: cleanName,
          taskPrompt: cleanPrompt,
          cronExpr: resolvedCron,
          isActive: true,
          nextRunAt: nextRun,
          timezone: tz,
        },
      });

      console.log(`[RHYTHM] created: ${rhythm.id} "${cleanName}" cron:${resolvedCron} for warrior:${warriorId}`);

      return reply.code(201).send({
        ...rhythm,
        scheduleText: humanReadableCron(resolvedCron),
      });
    } catch (error) {
      console.error('[ERROR] rhythm create failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // POST /api/rhythms/:warriorId/parse-schedule — parse natural language to cron (preview)
  app.post('/:warriorId/parse-schedule', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { schedule } = request.body || {};

    if (!schedule) {
      return reply.code(400).send({ error: 'schedule is required' });
    }

    try {
      const cronExpr = await naturalLanguageToCron(schedule);

      if (!cronExpr) {
        return reply.send({
          success: false,
          error: 'Could not understand the schedule. Try something like "every weekday at 9am".',
        });
      }

      return reply.send({
        success: true,
        cronExpr,
        humanReadable: humanReadableCron(cronExpr),
      });
    } catch (error) {
      console.error('[ERROR] schedule parse failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // PATCH /api/rhythms/:warriorId/:rhythmId — update a rhythm
  app.patch('/:warriorId/:rhythmId', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId, rhythmId } = request.params;
    const { name, taskPrompt, cronExpr, isActive, timezone } = request.body || {};
    const userId = request.user.userId;

    try {
      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      const rhythm = await prisma.warRhythm.findFirst({
        where: { id: rhythmId, warriorId },
      });

      if (!rhythm) {
        return reply.code(404).send({ error: 'Rhythm not found' });
      }

      const updateData = {};

      if (name !== undefined) {
        updateData.name = stripHtml(String(name)).slice(0, 200);
      }
      if (taskPrompt !== undefined) {
        updateData.taskPrompt = stripHtml(String(taskPrompt)).slice(0, 2000);
      }
      if (isActive !== undefined) {
        updateData.isActive = !!isActive;
      }
      if (timezone !== undefined) {
        updateData.timezone = String(timezone).slice(0, 50);
      }
      if (cronExpr !== undefined) {
        if (!isValidCron(cronExpr)) {
          return reply.code(400).send({ error: 'Invalid cron expression.' });
        }
        updateData.cronExpr = cronExpr;
        const tz = timezone || rhythm.timezone;
        updateData.nextRunAt = calculateNextRun(cronExpr, tz);
      }

      const updated = await prisma.warRhythm.update({
        where: { id: rhythmId },
        data: updateData,
      });

      console.log(`[RHYTHM] updated: ${rhythmId} for warrior:${warriorId}`);

      return reply.send({
        ...updated,
        scheduleText: humanReadableCron(updated.cronExpr),
      });
    } catch (error) {
      console.error('[ERROR] rhythm update failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // DELETE /api/rhythms/:warriorId/:rhythmId — remove a rhythm
  app.delete('/:warriorId/:rhythmId', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId, rhythmId } = request.params;
    const userId = request.user.userId;

    try {
      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      const rhythm = await prisma.warRhythm.findFirst({
        where: { id: rhythmId, warriorId },
      });

      if (!rhythm) {
        return reply.code(404).send({ error: 'Rhythm not found' });
      }

      await prisma.warRhythm.delete({ where: { id: rhythmId } });

      console.log(`[RHYTHM] deleted: ${rhythmId} for warrior:${warriorId}`);

      return reply.send({ status: 'deleted', rhythm_id: rhythmId });
    } catch (error) {
      console.error('[ERROR] rhythm delete failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // POST /api/rhythms/:warriorId/:rhythmId/trigger — manual trigger
  app.post('/:warriorId/:rhythmId/trigger', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 5, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId, rhythmId } = request.params;
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

      const rhythm = await prisma.warRhythm.findFirst({
        where: { id: rhythmId, warriorId },
      });

      if (!rhythm) {
        return reply.code(404).send({ error: 'Rhythm not found' });
      }

      // Execute async
      const rhythmWithWarrior = { ...rhythm, warrior: { ...warrior, user: warrior.user } };
      executeRhythm(rhythmWithWarrior).catch((err) => {
        console.error(`[RHYTHM] manual trigger failed: ${err.message}`);
      });

      console.log(`[RHYTHM] manual trigger: ${rhythmId} "${rhythm.name}" for warrior:${warriorId}`);

      return reply.send({
        status: 'triggered',
        rhythm_id: rhythmId,
        message: 'Rhythm is being executed. You should receive the result momentarily.',
      });
    } catch (error) {
      console.error('[ERROR] rhythm trigger failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // GET /api/rhythms/:warriorId/suggestions — auto-suggest rhythms based on patterns
  app.get('/:warriorId/suggestions', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 5, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId } = request.params;
    const userId = request.user.userId;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const features = getFeaturesByTier(user.tier);

      if (features.max_rhythms === 0) {
        return reply.code(403).send({ error: 'War Rhythms require a Pro plan.' });
      }

      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      const result = await generateSuggestions(warriorId, userId);

      console.log(`[SUGGEST] generated ${result.suggestions.length} suggestions for warrior:${warriorId} (personalized:${result.hasPersonalized})`);

      return reply.send(result);
    } catch (error) {
      console.error('[ERROR] rhythm suggestions failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // GET /api/rhythms/:warriorId/:rhythmId/history — last 10 results
  app.get('/:warriorId/:rhythmId/history', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { warriorId, rhythmId } = request.params;
    const userId = request.user.userId;

    try {
      const warrior = await prisma.warrior.findFirst({
        where: { id: warriorId, userId },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      const rhythm = await prisma.warRhythm.findFirst({
        where: { id: rhythmId, warriorId },
      });

      if (!rhythm) {
        return reply.code(404).send({ error: 'Rhythm not found' });
      }

      // Return the rhythm's last result and metadata
      // (In the future we could store a history table, for now we return the single last result)
      return reply.send({
        rhythm_id: rhythm.id,
        name: rhythm.name,
        lastRunAt: rhythm.lastRunAt,
        lastResult: rhythm.lastResult,
        nextRunAt: rhythm.nextRunAt,
        scheduleText: humanReadableCron(rhythm.cronExpr),
      });
    } catch (error) {
      console.error('[ERROR] rhythm history failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

/**
 * Convert natural language schedule to cron expression using AI.
 * Uses Tier 1 (cheapest model) for cost efficiency.
 *
 * @param {string} text - Natural language schedule (e.g., "every weekday at 9am")
 * @returns {string|null} Cron expression or null if parsing failed
 */
async function naturalLanguageToCron(text) {
  if (!isAIConfigured()) return null;

  const systemPrompt = `You are a cron expression converter. Convert the user's natural language schedule description into a standard 5-field cron expression (minute hour day-of-month month day-of-week).

Rules:
- Return ONLY a JSON object: {"cronExpr": "0 9 * * 1-5", "humanReadable": "Every weekday at 9:00 AM"}
- Use 24-hour format internally
- Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday
- If the schedule is unclear, return {"cronExpr": null, "error": "Could not understand"}
- Do NOT include seconds (5-field cron only)`;

  const messages = [{ role: 'user', content: text }];

  try {
    const { content, error } = await callAI(systemPrompt, messages, {
      forceTier: 1,
      userMessage: text,
    });

    if (error || !content) return null;

    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.cronExpr || parsed.cronExpr === null) return null;

    // Validate the cron expression
    if (!isValidCron(parsed.cronExpr)) return null;

    return parsed.cronExpr;
  } catch (err) {
    console.error(`[RHYTHM] natural language parse failed: ${err.message}`);
    return null;
  }
}

export default rhythmRoutes;
