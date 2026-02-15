import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import env from './config/env.js';

import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import warriorRoutes from './routes/warriors.js';
import billingRoutes from './routes/billing.js';
import dashboardRoutes from './routes/dashboard.js';
import demoRoutes from './routes/demo.js';
import webhookRoutes from './routes/webhooks.js';
import channelRoutes from './routes/channels.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import memoryRoutes from './routes/memory.js';
import pulseRoutes from './routes/pulse.js';
import rhythmRoutes from './routes/rhythms.js';
import questRoutes from './routes/quests.js';
import vaultRoutes from './routes/vault.js';
import { startScheduler } from './services/scheduler.js';

async function build() {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Add raw body support for Stripe webhook signature verification
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    try {
      // Store raw body for Stripe webhook verification
      req.rawBody = body;
      const str = body.toString();
      const json = str.length > 0 ? JSON.parse(str) : {};
      done(null, json);
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // Plugins
  await app.register(cors, {
    origin: env.NODE_ENV === 'production'
      ? [env.APP_URL, env.APP_URL.replace('://', '://www.')]
      : true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '7d' },
  });

  await app.register(rateLimit, {
    global: false,
    max: env.NODE_ENV === 'test' ? 1000 : 1000,
    allowList: env.NODE_ENV === 'test' ? () => true : undefined,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB max
      files: 1,
    },
  });

  // Prisma instance (shared across routes)
  const prisma = new PrismaClient();
  app.decorate('prisma', prisma);

  // Auth decorator
  app.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Routes
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(warriorRoutes, { prefix: '/api/warriors' });
  app.register(billingRoutes, { prefix: '/api/billing' });
  app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  app.register(demoRoutes, { prefix: '/api/demo' });
  app.register(webhookRoutes, { prefix: '/api/webhooks' });
  app.register(channelRoutes, { prefix: '/api/channels' });
  app.register(userRoutes, { prefix: '/api/users' });
  app.register(chatRoutes, { prefix: '/api/chat' });
  app.register(adminRoutes, { prefix: '/api/admin' });
  app.register(memoryRoutes, { prefix: '/api/memory' });
  app.register(pulseRoutes, { prefix: '/api/pulse' });
  app.register(rhythmRoutes, { prefix: '/api/rhythms' });
  app.register(questRoutes, { prefix: '/api/quests' });
  app.register(vaultRoutes, { prefix: '/api/vault' });

  return app;
}

async function start() {
  const app = await build();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`[STARTUP] Server running on port ${env.PORT}`);
    console.log(`[STARTUP] Environment: ${env.NODE_ENV}`);

    // Start the scheduler for pulse checks and war rhythms
    startScheduler();
    console.log(`[STARTUP] Scheduler started`);
  } catch (err) {
    console.error('[STARTUP] Failed to start server:', err.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { build };
