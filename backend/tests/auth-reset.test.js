import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildTestApp, mockPrisma, getAuthToken } from './helpers.js';
import { sendPasswordResetEmail } from '../src/services/email.js';

describe('Password Reset & Change Endpoints', () => {
  let app;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    for (const model of Object.values(mockPrisma)) {
      if (typeof model === 'object' && model !== null) {
        for (const fn of Object.values(model)) {
          if (typeof fn?.mockReset === 'function') fn.mockReset();
        }
      }
      if (typeof model?.mockReset === 'function') model.mockReset();
    }
    sendPasswordResetEmail.mockReset();
    sendPasswordResetEmail.mockResolvedValue(true);
  });

  // ── POST /api/auth/forgot-password ──
  describe('POST /api/auth/forgot-password', () => {
    it('returns 400 without email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 with invalid email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email: 'notanemail' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 200 for non-existent email (no enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email: 'nobody@test.com' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.message).toContain('If that email exists');
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('returns 200 for Google-only user without sending email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'g1',
        email: 'google@test.com',
        authProvider: 'google',
        passwordHash: null,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email: 'google@test.com' },
      });

      expect(res.statusCode).toBe(200);
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('sends reset email for valid email+password user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@test.com',
        authProvider: 'email',
        passwordHash: '$2a$10$hash',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email: 'user@test.com' },
      });

      expect(res.statusCode).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({
            passwordResetToken: expect.any(String),
            passwordResetExpiry: expect.any(Date),
          }),
        }),
      );
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('user@test.com', expect.any(String));
    });

    it('stores hashed token (not raw)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@test.com',
        authProvider: 'email',
        passwordHash: '$2a$10$hash',
      });
      mockPrisma.user.update.mockResolvedValue({});

      await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email: 'user@test.com' },
      });

      // The raw token sent in email should be different from stored token
      const rawToken = sendPasswordResetEmail.mock.calls[0][1];
      const storedToken = mockPrisma.user.update.mock.calls[0][0].data.passwordResetToken;

      // Stored should be SHA-256 of the raw token
      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      expect(storedToken).toBe(expectedHash);
      expect(storedToken).not.toBe(rawToken);
    });

    it('sets 15 minute expiry', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@test.com',
        authProvider: 'email',
        passwordHash: '$2a$10$hash',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const before = Date.now();
      await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email: 'user@test.com' },
      });
      const after = Date.now();

      const expiry = mockPrisma.user.update.mock.calls[0][0].data.passwordResetExpiry;
      const diff = expiry.getTime() - before;
      expect(diff).toBeGreaterThanOrEqual(14 * 60 * 1000); // at least ~14 min
      expect(diff).toBeLessThanOrEqual(16 * 60 * 1000); // no more than ~16 min
    });
  });

  // ── POST /api/auth/reset-password ──
  describe('POST /api/auth/reset-password', () => {
    it('returns 400 without token or password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 with short password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: { token: 'abc123', password: 'short' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for invalid/expired token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: { token: 'bad-token', password: 'newpassword123' },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toContain('Invalid or expired');
    });

    it('resets password for valid token', async () => {
      const rawToken = 'valid-token-hex';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'user@test.com',
        authProvider: 'email',
        passwordResetToken: hashedToken,
        passwordResetExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: { token: rawToken, password: 'newpassword123' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.message).toContain('Password reset successfully');

      // Verify it looked up by hashed token
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpiry: { gt: expect.any(Date) },
        },
      });

      // Verify token is cleared after reset
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: expect.any(String),
            passwordResetToken: null,
            passwordResetExpiry: null,
          }),
        }),
      );
    });

    it('upgrades Google-only user to "both" when setting password', async () => {
      const rawToken = 'google-user-token';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'g1',
        email: 'google@test.com',
        authProvider: 'google',
        passwordResetToken: hashedToken,
        passwordResetExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: { token: rawToken, password: 'newpassword123' },
      });

      expect(res.statusCode).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            authProvider: 'both',
          }),
        }),
      );
    });
  });

  // ── POST /api/auth/change-password ──
  describe('POST /api/auth/change-password', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        payload: { currentPassword: 'old', newPassword: 'newpassword123' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 400 without required fields', async () => {
      const token = getAuthToken(app, 'u1', 'user@test.com');
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: { authorization: 'Bearer ' + token },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 with short new password', async () => {
      const token = getAuthToken(app, 'u1', 'user@test.com');
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: { authorization: 'Bearer ' + token },
        payload: { currentPassword: 'oldpass123', newPassword: 'short' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for Google-only user with no password', async () => {
      const token = getAuthToken(app, 'g1', 'google@test.com');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'g1',
        email: 'google@test.com',
        authProvider: 'google',
        passwordHash: null,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: { authorization: 'Bearer ' + token },
        payload: { currentPassword: 'anything', newPassword: 'newpassword123' },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toContain('Google');
    });

    it('returns 401 for wrong current password', async () => {
      const bcrypt = await import('bcryptjs');
      const token = getAuthToken(app, 'u1', 'user@test.com');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@test.com',
        authProvider: 'email',
        passwordHash: await bcrypt.default.hash('correctpass', 10),
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: { authorization: 'Bearer ' + token },
        payload: { currentPassword: 'wrongpass', newPassword: 'newpassword123' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('updates password for correct current password', async () => {
      const bcrypt = await import('bcryptjs');
      const token = getAuthToken(app, 'u1', 'user@test.com');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@test.com',
        authProvider: 'email',
        passwordHash: await bcrypt.default.hash('correctpass', 10),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: { authorization: 'Bearer ' + token },
        payload: { currentPassword: 'correctpass', newPassword: 'newpassword123' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.message).toContain('Password updated');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({
            passwordHash: expect.any(String),
          }),
        }),
      );
    });
  });
});
