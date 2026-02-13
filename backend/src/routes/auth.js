import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

async function authRoutes(app) {
  // POST /api/auth/signup
  app.post('/signup', {
    config: {
      rateLimit: { max: 3, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { email, password } = request.body || {};

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    if (!EMAIL_RE.test(email)) {
      return reply.code(400).send({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return reply.code(400).send({ error: 'Password must be at least 8 characters' });
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.code(409).send({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          tier: 'trial',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const token = app.jwt.sign({ userId: user.id, email: user.email });
      console.log(`[AUTH] signup: ${user.id}`);

      return reply.code(201).send({
        user_id: user.id,
        token,
      });
    } catch (error) {
      console.error('[ERROR] signup failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });

  // POST /api/auth/login
  app.post('/login', {
    config: {
      rateLimit: { max: 5, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { email, password } = request.body || {};

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.code(401).send({ error: 'Invalid email or password' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid email or password' });
      }

      const token = app.jwt.sign({ userId: user.id, email: user.email });
      console.log(`[AUTH] login: ${user.id}`);

      return reply.send({
        user_id: user.id,
        token,
      });
    } catch (error) {
      console.error('[ERROR] login failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

export default authRoutes;
