import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import env from '../config/env.js';

const prisma = new PrismaClient();

// Initialize Google OAuth client (null if not configured)
const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

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

      if (!user.passwordHash) {
        return reply.code(401).send({ error: 'This account uses Google sign-in. Please use "Continue with Google" to log in.' });
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

  // POST /api/auth/google
  app.post('/google', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { credential } = request.body || {};

    if (!credential) {
      return reply.code(400).send({ error: 'Google credential is required' });
    }

    if (!googleClient) {
      return reply.code(503).send({ error: 'Google authentication is not configured' });
    }

    try {
      // 1. Verify the Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { sub: googleId, email, email_verified: emailVerified } = payload;

      if (!email || !emailVerified) {
        return reply.code(400).send({ error: 'Google account email must be verified' });
      }

      // 2. Look up user by googleId first, then by email
      let user = await prisma.user.findUnique({ where: { googleId } });
      let isNewUser = false;

      if (!user) {
        // No user with this googleId — check if email exists (account linking)
        user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // Existing email+password user — link Google account
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              authProvider: user.authProvider === 'email' ? 'both' : user.authProvider,
            },
          });
          console.log(`[AUTH] google-link: ${user.id} (existing email user)`);
        } else {
          // Brand new user — create account via Google
          user = await prisma.user.create({
            data: {
              email,
              googleId,
              authProvider: 'google',
              tier: 'trial',
              trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
          isNewUser = true;
          console.log(`[AUTH] google-signup: ${user.id}`);
        }
      } else {
        console.log(`[AUTH] google-login: ${user.id}`);
      }

      // 3. Sign JWT (same as email auth)
      const token = app.jwt.sign({ userId: user.id, email: user.email });

      return reply.code(isNewUser ? 201 : 200).send({
        user_id: user.id,
        token,
        is_new_user: isNewUser,
      });
    } catch (error) {
      console.error('[ERROR] google auth failed:', error.message);
      if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
        return reply.code(401).send({ error: 'Google authentication failed. Please try again.' });
      }
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

export default authRoutes;
