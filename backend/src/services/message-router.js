import { PrismaClient } from '@prisma/client';
import { isTrialExpired, getFeaturesByTier } from '../utils/helpers.js';
import { sendTelegramMessage, startTypingLoop } from './telegram.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { callAI, isAIConfigured } from './ai-client.js';

const prisma = new PrismaClient();

const MAX_MESSAGE_LENGTH = 4000;

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

// User-friendly error messages by AI error type
const ERROR_MESSAGES = {
  ai_not_configured: "⚙️ My AI connection is being set up. I'll be fully operational soon — check back shortly!",
  timeout: "⏳ I'm thinking extra hard on this one... but I timed out. Could you try again or rephrase?",
  rate_limited: "🛡️ I'm getting a lot of requests right now. Give me a moment and try again.",
  auth_failed: "🔑 There's an issue with my AI connection. The team has been notified — try again later.",
  server_error: "⚔️ The AI forge is temporarily down. Try again in a few minutes.",
  empty_response: "🤔 I drew a blank on that one. Could you rephrase your question?",
  empty_content: "🤔 I drew a blank on that one. Could you rephrase your question?",
  unknown: "⚠️ Something went wrong on my end. Try again in a moment.",
};

/**
 * Main message routing function.
 * Called by webhook handlers after parsing channel-specific payload.
 *
 * 6-step pipeline (from V2 architecture Section 5):
 * 1. RECEIVE → Identify user by channel + channel_id
 * 2. VALIDATE → Check tier (trial expiry)
 * 3. LOAD → Get active warrior config + system prompt
 * 4. CONTEXT → Load last 20 messages for conversation history
 * 5. CALL → Send to AI via 3-tier intelligent routing
 * 6. RESPOND → Save message to DB, send response to channel
 *
 * @param {object} params
 * @param {string} params.channel - 'telegram' | 'whatsapp'
 * @param {string} params.channelId - chat ID or phone number
 * @param {string} params.text - incoming message text
 * @param {string} [params.senderName] - display name from channel
 */
export async function routeIncomingMessage({ channel, channelId, text, senderName }) {
  if (!text || text.trim().length === 0) {
    return; // Ignore empty messages
  }

  const cleanText = stripHtml(text).slice(0, MAX_MESSAGE_LENGTH);

  console.log(`[MSG_IN] ${channel}:${channelId} - len:${cleanText.length}`);

  try {
    // ── Step 1: RECEIVE — Identify user ──
    const user = await findUserByChannel(channel, channelId);

    if (!user) {
      await sendChannelReply(channel, channelId,
        "⚔️ I don't recognize you yet, warrior.\n\nTo connect this channel to your ClawWarriors account:\n1. Sign up at clawwarriors.com\n2. Deploy a warrior\n3. Send your 6-digit connection code here\n\nOr sign up at clawwarriors.com to get started!"
      );
      return;
    }

    // ── Step 2: VALIDATE — Check trial expiry ──
    if (isTrialExpired(user)) {
      await sendChannelReply(channel, channelId,
        "⚔️ My power has faded — my trial period has ended. Reactivate me by choosing a plan at clawwarriors.com/dashboard"
      );
      return;
    }

    // ── Step 3: LOAD — Get active warrior ──
    const warrior = await prisma.warrior.findFirst({
      where: { userId: user.id, isActive: true },
      include: { template: true },
    });

    if (!warrior) {
      await sendChannelReply(channel, channelId,
        "🗡️ You don't have an active warrior deployed.\n\nVisit clawwarriors.com to deploy one!"
      );
      return;
    }

    // Start continuous typing indicator (Telegram only)
    // This re-sends every 4s so users see "typing..." during the full AI call
    let stopTyping = null;
    if (channel === 'telegram') {
      stopTyping = startTypingLoop(channelId);
    }

    try {
      // ── Step 4: CONTEXT — Save incoming + load history (PARALLEL) ──
      const [, recentMessages] = await Promise.all([
        prisma.message.create({
          data: {
            userId: user.id,
            warriorId: warrior.id,
            direction: 'in',
            channel,
            content: cleanText,
          },
        }),
        prisma.message.findMany({
          where: { userId: user.id, warriorId: warrior.id },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

      // Reverse to chronological order for the AI
      const conversationHistory = recentMessages.reverse().map((m) => ({
        role: m.direction === 'in' ? 'user' : 'assistant',
        content: m.content,
      }));

      // ── Step 5: CALL — Send to AI via 3-tier routing ──
      const features = getFeaturesByTier(user.tier);
      const aiResponse = await generateAIResponse(warrior, conversationHistory, {
        webSearch: features.web_search,
        userMessage: cleanText,
      });

      // ── Step 6: RESPOND — Save + send (PARALLEL) ──
      await Promise.all([
        prisma.message.create({
          data: {
            userId: user.id,
            warriorId: warrior.id,
            direction: 'out',
            channel,
            content: aiResponse,
          },
        }),
        sendChannelReply(channel, channelId, aiResponse),
      ]);
    } finally {
      // Always stop the typing loop
      if (stopTyping) stopTyping();
    }

  } catch (error) {
    console.error(`[ERROR] message routing failed: ${error.message}`);
    await sendChannelReply(channel, channelId,
      "⚠️ Something went wrong. Your warrior is recovering — try again in a moment."
    ).catch(() => {}); // Swallow reply errors
  }
}

/**
 * Find a user by their channel type and channel ID.
 * Checks both primary (channel/channelId) and secondary (channel2/channel2Id) slots
 * in a single OR query for speed.
 */
async function findUserByChannel(channel, channelId) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { channel, channelId },
        { channel2: channel, channel2Id: channelId },
      ],
    },
  });
}

/**
 * Send a reply via the appropriate channel.
 */
async function sendChannelReply(channel, channelId, text) {
  if (channel === 'telegram') {
    return sendTelegramMessage(channelId, text);
  }
  if (channel === 'whatsapp') {
    return sendWhatsAppMessage(channelId, text);
  }
  console.error(`[ERROR] unknown channel: ${channel}`);
}

/**
 * Generate AI response using 3-tier intelligent model routing.
 * Falls back to a friendly in-character message if AI is unavailable.
 *
 * @param {object} warrior - Warrior record with template included
 * @param {Array} conversationHistory - Formatted message array
 * @param {object} options - { webSearch: boolean, userMessage: string }
 * @returns {string} Response text
 */
async function generateAIResponse(warrior, conversationHistory, options = {}) {
  const name = warrior.customName || warrior.template.name;

  // If AI is not configured, return a stub response
  if (!isAIConfigured()) {
    console.log(`[MSG_OUT] AI not configured, using stub for warrior:${warrior.id}`);
    return ERROR_MESSAGES.ai_not_configured;
  }

  const { content, error, tier, model, responseTimeMs } = await callAI(
    warrior.systemPrompt,
    conversationHistory,
    { webSearch: options.webSearch, userMessage: options.userMessage },
  );

  if (error) {
    console.error(`[ERROR] AI response error for warrior:${warrior.id} - ${error} (tier:${tier} model:${model})`);
    return ERROR_MESSAGES[error] || ERROR_MESSAGES.unknown;
  }

  console.log(`[MSG_OUT] warrior:${warrior.id} tier:${tier} model:${model} time:${responseTimeMs}ms len:${content.length}`);
  return content;
}

export { findUserByChannel, generateAIResponse };
