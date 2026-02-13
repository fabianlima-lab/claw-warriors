import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const VALID_CHANNELS = ['telegram', 'whatsapp'];

// In-memory store for connection codes (short-lived, <10min)
// Maps code → { userId, channel, expiresAt }
const pendingConnections = new Map();

// Clean expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of pendingConnections) {
    if (data.expiresAt < now) {
      pendingConnections.delete(code);
    }
  }
}, 5 * 60 * 1000);

async function channelRoutes(app) {
  // ─────────────────────────────────────────────
  // POST /api/channels/connect/request
  // Generates a 6-digit connection code for the user
  // User then sends this code to the bot in the target channel
  // ─────────────────────────────────────────────
  app.post('/connect/request', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { channel } = request.body || {};

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return reply.code(400).send({
        error: `Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}`,
      });
    }

    try {
      // Generate 6-digit code
      const code = crypto.randomInt(100000, 999999).toString();

      pendingConnections.set(code, {
        userId,
        channel,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      console.log(`[CHANNEL] connection code generated for user:${userId} channel:${channel}`);

      return reply.send({
        code,
        channel,
        expires_in: 600, // 10 minutes in seconds
        instructions: channel === 'telegram'
          ? `Send this code to your ClawWarriors bot on Telegram: ${code}`
          : `Send this code to the ClawWarriors WhatsApp number: ${code}`,
      });
    } catch (error) {
      console.error('[ERROR] connection request failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/channels/connect/verify
  // Called internally when a bot receives a connection code
  // Verifies the code and links the channel to the user
  // ─────────────────────────────────────────────
  app.post('/connect/verify', {
    config: {
      rateLimit: { max: 20, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { code, channel, channelId } = request.body || {};

    if (!code || !channel || !channelId) {
      return reply.code(400).send({ error: 'code, channel, and channelId are required' });
    }

    try {
      const pending = pendingConnections.get(code);

      if (!pending) {
        return reply.code(404).send({ error: 'Invalid or expired connection code' });
      }

      if (pending.expiresAt < Date.now()) {
        pendingConnections.delete(code);
        return reply.code(410).send({ error: 'Connection code has expired' });
      }

      if (pending.channel !== channel) {
        return reply.code(400).send({ error: 'Connection code is for a different channel' });
      }

      // Check if this channelId is already linked to another user
      const existingPrimary = await prisma.user.findFirst({
        where: { channel, channelId },
      });
      const existingSecondary = await prisma.user.findFirst({
        where: { channel2: channel, channel2Id: channelId },
      });

      if (existingPrimary || existingSecondary) {
        const existingId = existingPrimary?.id || existingSecondary?.id;
        if (existingId !== pending.userId) {
          return reply.code(409).send({
            error: 'This channel account is already linked to a different user',
          });
        }
        // Already linked to the same user — treat as success
        pendingConnections.delete(code);
        return reply.send({ status: 'already_connected', channel });
      }

      // Link channel to user — fill primary slot first, then secondary
      const user = await prisma.user.findUnique({ where: { id: pending.userId } });

      const updateData = {};
      if (!user.channel) {
        // Primary slot empty
        updateData.channel = channel;
        updateData.channelId = channelId;
      } else if (user.channel === channel && user.channelId === channelId) {
        // Already connected to primary
        pendingConnections.delete(code);
        return reply.send({ status: 'already_connected', channel });
      } else if (!user.channel2) {
        // Secondary slot empty
        updateData.channel2 = channel;
        updateData.channel2Id = channelId;
      } else if (user.channel2 === channel && user.channel2Id === channelId) {
        // Already connected to secondary
        pendingConnections.delete(code);
        return reply.send({ status: 'already_connected', channel });
      } else {
        // Both slots taken
        pendingConnections.delete(code);
        return reply.code(409).send({
          error: 'Both channel slots are already in use. Disconnect one first.',
        });
      }

      await prisma.user.update({
        where: { id: pending.userId },
        data: updateData,
      });

      pendingConnections.delete(code);

      console.log(`[CHANNEL] connected: ${channel}:${channelId} → user:${pending.userId}`);

      return reply.send({
        status: 'connected',
        channel,
      });
    } catch (error) {
      console.error('[ERROR] connection verify failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // ─────────────────────────────────────────────
  // DELETE /api/channels/:channel
  // Disconnect a channel from the user's account
  // ─────────────────────────────────────────────
  app.delete('/:channel', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { channel } = request.params;

    if (!VALID_CHANNELS.includes(channel)) {
      return reply.code(400).send({
        error: `Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}`,
      });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const updateData = {};
      if (user.channel === channel) {
        updateData.channel = null;
        updateData.channelId = null;
      } else if (user.channel2 === channel) {
        updateData.channel2 = null;
        updateData.channel2Id = null;
      } else {
        return reply.code(404).send({ error: 'Channel not connected' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      console.log(`[CHANNEL] disconnected: ${channel} from user:${userId}`);

      return reply.send({ status: 'disconnected', channel });
    } catch (error) {
      console.error('[ERROR] channel disconnect failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/channels/status
  // Returns the user's connected channels
  // ─────────────────────────────────────────────
  app.get('/status', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const channels = [];
      if (user.channel) {
        channels.push({
          channel: user.channel,
          channel_id: user.channelId,
          slot: 'primary',
        });
      }
      if (user.channel2) {
        channels.push({
          channel: user.channel2,
          channel_id: user.channel2Id,
          slot: 'secondary',
        });
      }

      return reply.send({ channels });
    } catch (error) {
      console.error('[ERROR] channel status failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

// Export for use by webhook handlers (code verification from bot messages)
export { pendingConnections };
export default channelRoutes;
