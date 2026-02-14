import { PrismaClient } from '@prisma/client';
import { isTrialExpired, getFeaturesByTier } from '../utils/helpers.js';
import { callAI, isAIConfigured } from '../services/ai-client.js';
import { sendTelegramMessage } from '../services/telegram.js';

const prisma = new PrismaClient();

const MAX_MESSAGE_LENGTH = 4000;

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

// User-friendly error messages
const ERROR_MESSAGES = {
  ai_not_configured: "My AI connection is being set up. Check back shortly!",
  timeout: "I timed out on that one. Could you try again?",
  rate_limited: "I'm getting a lot of requests. Give me a moment.",
  auth_failed: "There's an issue with my connection. Try again later.",
  server_error: "The AI forge is temporarily down. Try again in a few minutes.",
  empty_response: "I drew a blank. Could you rephrase?",
  empty_content: "I drew a blank. Could you rephrase?",
  unknown: "Something went wrong. Try again in a moment.",
};

async function chatRoutes(app) {
  // POST /api/chat/send — send a message from the dashboard
  app.post('/send', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { message, warriorId } = request.body || {};

    if (!message || typeof message !== 'string') {
      return reply.code(400).send({ error: 'Message is required' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return reply.code(400).send({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters` });
    }

    const cleanMessage = stripHtml(message).trim();
    if (!cleanMessage) {
      return reply.code(400).send({ error: 'Message cannot be empty' });
    }

    try {
      // Get user
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Check trial expiry
      if (isTrialExpired(user)) {
        return reply.code(403).send({ error: 'Trial expired. Upgrade to continue chatting.' });
      }

      // Get active warrior (use specified warriorId or default to active)
      const whereClause = warriorId
        ? { id: warriorId, userId, isActive: true }
        : { userId, isActive: true };

      const warrior = await prisma.warrior.findFirst({
        where: whereClause,
        include: { template: true },
      });

      if (!warrior) {
        return reply.code(404).send({ error: 'No active warrior found. Deploy one first.' });
      }

      // Check AI config
      if (!isAIConfigured()) {
        return reply.code(503).send({ error: 'AI not configured' });
      }

      // Save incoming message
      await prisma.message.create({
        data: {
          userId,
          warriorId: warrior.id,
          direction: 'in',
          channel: 'web',
          content: cleanMessage,
        },
      });

      // Load conversation history (last 20 messages)
      const recentMessages = await prisma.message.findMany({
        where: { userId, warriorId: warrior.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const conversationHistory = recentMessages.reverse().map((m) => ({
        role: m.direction === 'in' ? 'user' : 'assistant',
        content: m.content,
      }));

      // Call AI with 3-tier routing
      const features = getFeaturesByTier(user.tier);
      const { content, error, tier, model, responseTimeMs } = await callAI(
        warrior.systemPrompt,
        conversationHistory,
        { webSearch: features.web_search, userMessage: cleanMessage },
      );

      if (error) {
        console.error(`[ERROR] chat AI failed for warrior:${warrior.id} - ${error} (tier:${tier})`);
        const errorMsg = ERROR_MESSAGES[error] || ERROR_MESSAGES.unknown;

        // Still save the error response so it appears in history
        await prisma.message.create({
          data: {
            userId,
            warriorId: warrior.id,
            direction: 'out',
            channel: 'web',
            content: errorMsg,
          },
        });

        return reply.send({
          response: errorMsg,
          tier,
          model,
          responseTimeMs,
        });
      }

      // Save AI response
      await prisma.message.create({
        data: {
          userId,
          warriorId: warrior.id,
          direction: 'out',
          channel: 'web',
          content,
        },
      });

      // Forward to Telegram if user has it connected (fire-and-forget)
      const telegramChatId = getTelegramChatId(user);
      if (telegramChatId) {
        // Send both the user message and AI reply to keep Telegram in sync
        sendTelegramMessage(telegramChatId, `[Web] ${cleanMessage}`).catch(() => {});
        sendTelegramMessage(telegramChatId, content).catch(() => {});
      }

      console.log(`[CHAT:WEB] warrior:${warrior.id} tier:${tier} model:${model} time:${responseTimeMs}ms`);

      return reply.send({
        response: content,
        tier,
        model,
        responseTimeMs,
      });
    } catch (error) {
      console.error('[ERROR] chat send failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again.' });
    }
  });

  // GET /api/chat/history — get conversation history for the active warrior
  app.get('/history', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 60, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const warriorId = request.query.warriorId;
    const limit = Math.min(parseInt(request.query.limit || '30', 10), 100);

    try {
      // Get active warrior
      const whereClause = warriorId
        ? { id: warriorId, userId, isActive: true }
        : { userId, isActive: true };

      const warrior = await prisma.warrior.findFirst({ where: whereClause });

      if (!warrior) {
        return reply.send({ messages: [], warrior: null });
      }

      const messages = await prisma.message.findMany({
        where: { userId, warriorId: warrior.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          direction: true,
          content: true,
          channel: true,
          createdAt: true,
        },
      });

      // Reverse to chronological order
      messages.reverse();

      return reply.send({
        messages,
        warrior: {
          id: warrior.id,
          name: warrior.customName || warrior.template?.name,
          templateId: warrior.templateId,
        },
      });
    } catch (error) {
      console.error('[ERROR] chat history failed:', error.message);
      return reply.code(500).send({ error: 'Failed to load chat history' });
    }
  });
}

/**
 * Get the user's Telegram chat ID (from either channel slot).
 */
function getTelegramChatId(user) {
  if (user.channel === 'telegram' && user.channelId) return user.channelId;
  if (user.channel2 === 'telegram' && user.channel2Id) return user.channel2Id;
  return null;
}

export default chatRoutes;
