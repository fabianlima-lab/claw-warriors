import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildTestApp, mockPrisma, getAuthToken } from './helpers.js';

describe('Channel Routes', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = await buildTestApp();
    token = getAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.findFirst.mockReset();
    mockPrisma.user.update.mockReset();
  });

  // ── Connect Request ──
  describe('POST /api/channels/connect/request', () => {
    it('requires authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/channels/connect/request',
        payload: { channel: 'telegram' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('generates a 6-digit code for telegram', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/channels/connect/request',
        headers: { authorization: 'Bearer ' + token },
        payload: { channel: 'telegram' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.code).toMatch(/^\d{6}$/);
      expect(body.channel).toBe('telegram');
      expect(body.expires_in).toBe(600);
    });

    it('rejects invalid channel with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/channels/connect/request',
        headers: { authorization: 'Bearer ' + token },
        payload: { channel: 'discord' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── Channel Status ──
  describe('GET /api/channels/status', () => {
    it('requires authentication', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/channels/status' });
      expect(res.statusCode).toBe(401);
    });

    it('returns connected channels', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        channel: 'telegram',
        channelId: '123456',
        channel2: null,
        channel2Id: null,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/channels/status',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.channels).toHaveLength(1);
      expect(body.channels[0].channel).toBe('telegram');
      expect(body.channels[0].slot).toBe('primary');
    });
  });

  // ── Disconnect ──
  describe('DELETE /api/channels/:channel', () => {
    it('disconnects a connected channel', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        channel: 'telegram',
        channelId: '123456',
        channel2: null,
        channel2Id: null,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/channels/telegram',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('disconnected');
    });

    it('returns 404 for non-connected channel', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        channel: null,
        channelId: null,
        channel2: null,
        channel2Id: null,
      });

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/channels/telegram',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
