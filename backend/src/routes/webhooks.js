import { routeIncomingMessage } from '../services/message-router.js';
import { sendTelegramMessage } from '../services/telegram.js';
import { sendWhatsAppMessage } from '../services/whatsapp.js';
import { pendingConnections } from './channels.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Regex to match a 6-digit connection code
const CONNECTION_CODE_RE = /^\d{6}$/;

async function webhookRoutes(app) {
  // ─────────────────────────────────────────────
  // POST /api/webhooks/telegram
  // Telegram Bot API sends updates here (@ClawWarriorsBot)
  // Always returns 200 to prevent retries
  // ─────────────────────────────────────────────
  app.post('/telegram', async (request, reply) => {
    try {
      const update = request.body || {};

      // Handle text messages
      if (update.message && update.message.text) {
        const { message } = update;
        const chatId = String(message.chat.id);
        const text = message.text.trim();
        const senderName = message.from?.first_name || 'Unknown';

        // Handle /start command — welcome message
        if (text === '/start') {
          await sendTelegramMessage(chatId,
            "⚔️ Welcome to ClawWarriors!\n\nI'm @ClawWarriorsBot — your portal to your AI warrior.\n\nIf you already have an account, connect this chat using the 6-digit code from your dashboard.\n\nNew here? Sign up at clawwarriors.com and deploy your first AI warrior!"
          );
          return reply.code(200).send();
        }

        // Handle connection code (6-digit number)
        if (CONNECTION_CODE_RE.test(text)) {
          await handleConnectionCode('telegram', chatId, text);
          return reply.code(200).send();
        }

        // Route all other messages
        // Fire-and-forget: don't await so Telegram gets 200 immediately
        routeIncomingMessage({
          channel: 'telegram',
          channelId: chatId,
          text,
          senderName,
        }).catch((err) => {
          console.error('[ERROR] telegram message routing:', err.message);
        });
      }

      // Handle callback queries (button presses) — future use
      if (update.callback_query) {
        console.log(`[MSG_IN] telegram:callback:${update.callback_query.from.id}`);
      }
    } catch (error) {
      console.error('[ERROR] telegram webhook:', error.message);
    }

    // Always return 200
    return reply.code(200).send();
  });

  // ─────────────────────────────────────────────
  // POST /api/webhooks/whatsapp
  // Twilio sends WhatsApp messages here
  // Always returns 200 to prevent retries
  // ─────────────────────────────────────────────
  app.post('/whatsapp', async (request, reply) => {
    try {
      const { From, Body, ProfileName } = request.body || {};

      if (From && Body) {
        // Strip "whatsapp:" prefix for storage, keep raw phone
        const phone = From.replace('whatsapp:', '');
        const text = Body.trim();

        // Handle connection code (6-digit number)
        if (CONNECTION_CODE_RE.test(text)) {
          await handleConnectionCode('whatsapp', phone, text);
          return reply.code(200).send();
        }

        // Fire-and-forget
        routeIncomingMessage({
          channel: 'whatsapp',
          channelId: phone,
          text,
          senderName: ProfileName || 'Unknown',
        }).catch((err) => {
          console.error('[ERROR] whatsapp message routing:', err.message);
        });
      }
    } catch (error) {
      console.error('[ERROR] whatsapp webhook:', error.message);
    }

    // Always return 200 (Twilio expects this)
    return reply.code(200).send();
  });
}

/**
 * Handle a 6-digit connection code sent by a user via a channel.
 * Verifies the code and links the channel to their account.
 */
async function handleConnectionCode(channel, channelId, code) {
  const pending = pendingConnections.get(code);

  if (!pending) {
    await sendChannelReply(channel, channelId,
      "❌ Invalid or expired connection code. Please request a new one from your dashboard."
    );
    return;
  }

  if (pending.expiresAt < Date.now()) {
    pendingConnections.delete(code);
    await sendChannelReply(channel, channelId,
      "⏰ This connection code has expired. Please request a new one from your dashboard."
    );
    return;
  }

  if (pending.channel !== channel) {
    await sendChannelReply(channel, channelId,
      `❌ This code is for ${pending.channel}, not ${channel}. Please request a code for the correct channel.`
    );
    return;
  }

  try {
    // Check if channelId already linked to another user
    const existingPrimary = await prisma.user.findFirst({
      where: { channel, channelId },
    });
    const existingSecondary = await prisma.user.findFirst({
      where: { channel2: channel, channel2Id: channelId },
    });

    if (existingPrimary || existingSecondary) {
      const existingId = existingPrimary?.id || existingSecondary?.id;
      if (existingId !== pending.userId) {
        await sendChannelReply(channel, channelId,
          "❌ This account is already linked to a different ClawWarriors user."
        );
        pendingConnections.delete(code);
        return;
      }
      // Already linked to same user
      await sendChannelReply(channel, channelId,
        "✅ This channel is already connected to your account! You're all set."
      );
      pendingConnections.delete(code);
      return;
    }

    // Link to user — fill primary slot first, then secondary
    const user = await prisma.user.findUnique({ where: { id: pending.userId } });

    const updateData = {};
    if (!user.channel) {
      updateData.channel = channel;
      updateData.channelId = channelId;
    } else if (!user.channel2) {
      updateData.channel2 = channel;
      updateData.channel2Id = channelId;
    } else {
      await sendChannelReply(channel, channelId,
        "❌ Both channel slots are full. Disconnect one from your dashboard first."
      );
      pendingConnections.delete(code);
      return;
    }

    await prisma.user.update({
      where: { id: pending.userId },
      data: updateData,
    });

    pendingConnections.delete(code);

    console.log(`[CHANNEL] connected via bot: ${channel}:${channelId} → user:${pending.userId}`);

    // Check if they have an active warrior
    const warrior = await prisma.warrior.findFirst({
      where: { userId: pending.userId, isActive: true },
      include: { template: true },
    });

    if (warrior) {
      const name = warrior.customName || warrior.template.name;
      await sendChannelReply(channel, channelId,
        `✅ Channel connected! Your warrior ${name} (${warrior.warriorClass}) is ready.\n\n${warrior.template.firstMessage}`
      );
    } else {
      await sendChannelReply(channel, channelId,
        "✅ Channel connected! Now deploy a warrior from your dashboard to start chatting."
      );
    }
  } catch (error) {
    console.error(`[ERROR] connection code handling: ${error.message}`);
    await sendChannelReply(channel, channelId,
      "⚠️ Something went wrong connecting your account. Please try again."
    );
  }
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
}

export default webhookRoutes;
