import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import env from './config/env.js';

import authRoutes from './routes/auth.js';
import warriorRoutes from './routes/warriors.js';
import billingRoutes from './routes/billing.js';
import dashboardRoutes from './routes/dashboard.js';
import demoRoutes from './routes/demo.js';
import webhookRoutes from './routes/webhooks.js';

async function build() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Plugins
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? env.APP_URL : true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '7d' },
  });

  await app.register(rateLimit, {
    global: false,
  });

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

  return app;
}

async function start() {
  const app = await build();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`[STARTUP] Server running on port ${env.PORT}`);
    console.log(`[STARTUP] Environment: ${env.NODE_ENV}`);
  } catch (err) {
    console.error('[STARTUP] Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

export { build };
