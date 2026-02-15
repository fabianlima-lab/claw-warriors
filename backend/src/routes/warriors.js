import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
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
        updateData.systemPrompt = compileSystemPrompt(warrior.template, tone, warrior.soulConfig);
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

  // ── SOUL FORGE (6 structured fields) ──

  // GET /api/warriors/:id/soul — get current soul config
  app.get('/:id/soul', {
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
        include: { template: true },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      // Parse structured soul config (or migrate legacy plain text)
      const soulFields = parseSoulConfig(warrior.soulConfig);

      return reply.send({
        warrior_id: warrior.id,
        warrior_name: warrior.customName || warrior.template.name,
        soul: soulFields,
      });
    } catch (error) {
      console.error('[ERROR] soul config fetch failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // PUT /api/warriors/:id/soul — save soul config + recompile system prompt
  app.put('/:id/soul', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { soul } = request.body || {};
    const userId = request.user.userId;

    // Validate input — accept the 6-field object
    if (!soul || typeof soul !== 'object') {
      return reply.code(400).send({ error: 'soul object is required with fields: nickname, role, tone, aboutHuman, alwaysDo, neverDo' });
    }

    // Sanitize each field
    const cleanSoul = {};
    for (const key of SOUL_FIELDS) {
      const raw = soul[key];
      if (raw !== undefined && raw !== null) {
        cleanSoul[key] = stripHtml(String(raw)).slice(0, SOUL_FIELD_LIMITS[key] || 500);
      } else {
        cleanSoul[key] = '';
      }
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const features = getFeaturesByTier(user.tier);

      // Tier gating: trial users can read but not edit
      if (!features.soul_config) {
        return reply.code(403).send({ error: 'Soul Forge requires a Pro plan. Upgrade to unlock!' });
      }

      const warrior = await prisma.warrior.findFirst({
        where: { id, userId },
        include: { template: true },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'Warrior not found' });
      }

      // Store as JSON string in the soulConfig column
      const soulJson = JSON.stringify(cleanSoul);

      // Recompile system prompt with new structured soul config
      const newSystemPrompt = compileSystemPrompt(warrior.template, warrior.tone, soulJson);

      const updated = await prisma.warrior.update({
        where: { id },
        data: {
          soulConfig: soulJson,
          systemPrompt: newSystemPrompt,
        },
      });

      console.log(`[WARRIOR] soul forge updated: ${id} fields:${Object.keys(cleanSoul).filter(k => cleanSoul[k]).length}/6 for user:${userId}`);

      return reply.send({
        warrior_id: updated.id,
        soul: cleanSoul,
        system_prompt_updated: true,
      });
    } catch (error) {
      console.error('[ERROR] soul config update failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/warriors/:id/avatar — Upload custom avatar
  // Accepts multipart form with 'avatar' file (PNG/JPG/WebP, max 2MB)
  // ─────────────────────────────────────────────
  app.post('/:id/avatar', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
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

      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Validate file type
      const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        return reply.code(400).send({ error: 'Only PNG, JPG, and WebP images are allowed' });
      }

      // Read file buffer
      const buffer = await data.toBuffer();
      if (buffer.length > 2 * 1024 * 1024) {
        return reply.code(400).send({ error: 'File too large. Max 2MB.' });
      }

      // Save to frontend/public/avatars/
      const ext = data.mimetype === 'image/png' ? '.png'
        : data.mimetype === 'image/webp' ? '.webp' : '.jpg';
      const filename = `${warrior.id}-${randomUUID().slice(0, 8)}${ext}`;
      const avatarDir = path.resolve(process.cwd(), '../frontend/public/avatars');
      await mkdir(avatarDir, { recursive: true });
      await writeFile(path.join(avatarDir, filename), buffer);

      const avatarUrl = `/avatars/${filename}`;

      // Update warrior record
      await prisma.warrior.update({
        where: { id },
        data: { avatarUrl: avatarUrl },
      });

      console.log(`[WARRIOR] avatar uploaded: ${id} → ${avatarUrl}`);

      return reply.send({ avatar_url: avatarUrl });
    } catch (error) {
      console.error('[ERROR] avatar upload failed:', error.message);
      return reply.code(500).send({ error: 'Avatar upload failed. Try again.' });
    }
  });

  // ─────────────────────────────────────────────
  // DELETE /api/warriors/:id/avatar — Remove custom avatar
  // ─────────────────────────────────────────────
  app.delete('/:id/avatar', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
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
        data: { avatarUrl: null },
      });

      console.log(`[WARRIOR] avatar removed: ${id}`);

      return reply.send({ avatar_url: null });
    } catch (error) {
      console.error('[ERROR] avatar delete failed:', error.message);
      return reply.code(500).send({ error: 'Failed to remove avatar.' });
    }
  });
}

// ── Soul Forge field definitions ──

const SOUL_FIELDS = ['nickname', 'role', 'tone', 'aboutHuman', 'alwaysDo', 'neverDo'];

const SOUL_FIELD_LIMITS = {
  nickname: 100,
  role: 300,
  tone: 300,
  aboutHuman: 500,
  alwaysDo: 500,
  neverDo: 500,
};

/**
 * Parse soulConfig from DB. Handles:
 * - null/empty → returns empty 6-field object
 * - JSON string (new v2 format) → parsed object
 * - Plain text (legacy v1 format) → migrated into `aboutHuman` field
 */
function parseSoulConfig(raw) {
  const empty = { nickname: '', role: '', tone: '', aboutHuman: '', alwaysDo: '', neverDo: '' };

  if (!raw || raw.trim().length === 0) return empty;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Valid JSON — fill in any missing fields with empty string
      return { ...empty, ...parsed };
    }
  } catch {
    // Not JSON — legacy plain text. Migrate into aboutHuman field.
  }

  return { ...empty, aboutHuman: raw.trim() };
}

/**
 * Condensed platform reference injected into every warrior's system prompt.
 * Enables warriors to answer questions about ClawWarriors features naturally.
 */
const PLATFORM_REFERENCE = `## Platform Knowledge (answer naturally in your own voice if asked)
- The Hearth: The user's dashboard — mission control for all warriors and features.
- Soul Forge: The personality editor. Users can customize your name, role, tone, and rules from the dashboard or by telling you directly in chat.
- Deep Memory: Your long-term memory. Important facts about the user are stored here automatically. Users can view and manage memories from the dashboard.
- Pulse Check: Daily check-ins you send at set times (morning, midday, evening, night) without the user asking.
- Standing Orders: Recurring tasks you run automatically on a schedule (e.g., daily news, weekly budget).
- The Vault: Where users store their own API keys to upgrade to frontier AI models (GPT-4o, Claude, Gemini).
- Warrior Classes: Guardian (wellness/routines), Scholar (research/learning), Creator (writing/creativity), Strategist (business/planning), Sentinel (finance/monitoring).
- Plans: Trial (1 warrior, 1 channel), Pro $30/mo (all features), Pro Tribe $50/mo (up to 3 warriors).
- Channels: Telegram (primary), WhatsApp (coming soon), Web Chat (dashboard).
- For billing, account issues, or bugs: direct to settings or help.clawwarriors.com.
- Never make up features that don't exist. If unsure, say so honestly.`;

/**
 * Compile the system prompt from template + tone + structured soul config.
 *
 * Assembly order:
 * 1. Preamble (stay in character, be helpful)
 * 2. Base system prompt from template
 * 3. Tone instructions
 * 4. Platform Reference (feature knowledge)
 * 5. Soul Forge fields (structured personality instructions)
 */
function compileSystemPrompt(template, tone, soulConfig = null) {
  const preamble = `You are a ClawWarriors AI assistant. You must stay in character at all times. Never reveal you are an AI unless directly asked. Keep responses concise and helpful. If you don't know something, say so honestly.`;

  const toneInstructions = {
    professional: 'Communicate in a professional, structured, and precise manner. Use formal language.',
    casual: 'Communicate in a friendly, approachable, and conversational manner. Keep it natural.',
    fierce: 'Communicate with intensity, confidence, and power. Be bold and direct.',
  };

  let prompt = `${preamble}\n\n${template.baseSystemPrompt}\n\n## Tone\n${toneInstructions[tone] || toneInstructions.casual}`;

  // Platform reference — warriors can answer "what is Soul Forge?" etc.
  prompt += `\n\n${PLATFORM_REFERENCE}`;

  if (soulConfig && soulConfig.trim().length > 0) {
    const soul = parseSoulConfig(soulConfig);
    const sections = [];

    if (soul.nickname) {
      sections.push(`The user wants you to call them "${soul.nickname}".`);
    }
    if (soul.role) {
      sections.push(`Your role: ${soul.role}`);
    }
    if (soul.tone) {
      sections.push(`Communication style: ${soul.tone}`);
    }
    if (soul.aboutHuman) {
      sections.push(`About the user: ${soul.aboutHuman}`);
    }
    if (soul.alwaysDo) {
      sections.push(`ALWAYS do this: ${soul.alwaysDo}`);
    }
    if (soul.neverDo) {
      sections.push(`NEVER do this: ${soul.neverDo}`);
    }

    if (sections.length > 0) {
      prompt += `\n\n## Soul Forge (Custom Instructions from your user)\n${sections.join('\n')}`;
    }
  }

  return prompt;
}

export { compileSystemPrompt, parseSoulConfig, SOUL_FIELDS, SOUL_FIELD_LIMITS };
export default warriorRoutes;
