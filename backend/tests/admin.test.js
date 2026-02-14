import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildTestApp, mockPrisma, getAuthToken } from './helpers.js';

describe('Admin Routes', () => {
  let app;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    app = await buildTestApp();
    adminToken = getAuthToken(app, 'admin-id', 'admin@test.com');
    userToken = getAuthToken(app, 'user-id', 'regular@test.com');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset all mocks
    for (const model of Object.values(mockPrisma)) {
      if (typeof model === 'object' && model !== null) {
        for (const fn of Object.values(model)) {
          if (typeof fn?.mockReset === 'function') fn.mockReset();
        }
      }
      if (typeof model?.mockReset === 'function') model.mockReset();
    }
  });

  // ── Access Control ──
  describe('Access Control', () => {
    it('returns 401 without auth token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/admin/overview' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 403 for non-admin user', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/overview',
        headers: { authorization: 'Bearer ' + userToken },
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns 200 for admin user', async () => {
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.message.count.mockResolvedValue(50);
      mockPrisma.warrior.count.mockResolvedValue(15);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/overview',
        headers: { authorization: 'Bearer ' + adminToken },
      });
      expect(res.statusCode).toBe(200);
    });

    it('blocks non-admin on all endpoints', async () => {
      const endpoints = [
        '/api/admin/overview',
        '/api/admin/signups',
        '/api/admin/tiers',
        '/api/admin/users',
        '/api/admin/messages',
        '/api/admin/popular-warriors',
        '/api/admin/channels',
      ];
      for (const url of endpoints) {
        const res = await app.inject({
          method: 'GET',
          url,
          headers: { authorization: 'Bearer ' + userToken },
        });
        expect(res.statusCode).toBe(403);
      }
    });
  });

  // ── GET /api/admin/overview ──
  describe('GET /api/admin/overview', () => {
    it('returns correct aggregate counts', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(42)  // totalUsers
        .mockResolvedValueOnce(10); // activeUsers
      mockPrisma.message.count.mockResolvedValue(500);
      mockPrisma.warrior.count.mockResolvedValue(60);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/overview',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.total_users).toBe(42);
      expect(body.total_messages).toBe(500);
      expect(body.total_warriors).toBe(60);
      expect(body.active_users_7d).toBe(10);
    });
  });

  // ── GET /api/admin/signups ──
  describe('GET /api/admin/signups', () => {
    it('returns daily signup data', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { createdAt: new Date('2026-02-10T10:00:00Z') },
        { createdAt: new Date('2026-02-10T15:00:00Z') },
        { createdAt: new Date('2026-02-11T09:00:00Z') },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/signups?days=30',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.days).toBe(30);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].date).toBe('2026-02-10');
      expect(body.data[0].count).toBe(2);
      expect(body.data[1].count).toBe(1);
    });

    it('caps days at 90', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/signups?days=999',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      const body = JSON.parse(res.body);
      expect(body.days).toBe(90);
    });
  });

  // ── GET /api/admin/tiers ──
  describe('GET /api/admin/tiers', () => {
    it('returns tier breakdown', async () => {
      mockPrisma.user.groupBy.mockResolvedValue([
        { tier: 'trial', _count: { id: 80 } },
        { tier: 'pro', _count: { id: 20 } },
        { tier: 'pro_tribe', _count: { id: 5 } },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/tiers',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.tiers).toHaveLength(3);
      expect(body.tiers[0]).toEqual({ tier: 'trial', count: 80 });
    });
  });

  // ── GET /api/admin/users ──
  describe('GET /api/admin/users', () => {
    it('returns paginated user list', async () => {
      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          email: 'alice@test.com',
          tier: 'pro',
          authProvider: 'email',
          channel: 'telegram',
          channel2: null,
          createdAt: '2026-01-01T00:00:00Z',
          _count: { warriors: 1, messages: 50 },
        },
        {
          id: 'u2',
          email: 'bob@test.com',
          tier: 'trial',
          authProvider: 'google',
          channel: null,
          channel2: null,
          createdAt: '2026-02-01T00:00:00Z',
          _count: { warriors: 0, messages: 0 },
        },
      ]);
      mockPrisma.$queryRaw.mockResolvedValue([
        { user_id: 'u1', last_active: '2026-02-13T12:00:00Z' },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users?limit=10&offset=0',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.total).toBe(2);
      expect(body.users).toHaveLength(2);
      expect(body.users[0].email).toBe('alice@test.com');
      expect(body.users[0].message_count).toBe(50);
      expect(body.users[0].channels).toEqual(['telegram']);
      expect(body.users[0].last_active).toBe('2026-02-13T12:00:00Z');
      expect(body.users[1].last_active).toBeNull();
    });

    it('caps limit at 100', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await app.inject({
        method: 'GET',
        url: '/api/admin/users?limit=999',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('uses whitelist for sort field', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await app.inject({
        method: 'GET',
        url: '/api/admin/users?sort=email&order=asc',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { email: 'asc' } }),
      );
    });

    it('falls back to createdAt for invalid sort field', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await app.inject({
        method: 'GET',
        url: '/api/admin/users?sort=DROP_TABLE',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });
  });

  // ── GET /api/admin/messages ──
  describe('GET /api/admin/messages', () => {
    it('returns daily message volume', async () => {
      mockPrisma.message.findMany.mockResolvedValue([
        { createdAt: new Date('2026-02-12T10:00:00Z') },
        { createdAt: new Date('2026-02-12T14:00:00Z') },
        { createdAt: new Date('2026-02-12T18:00:00Z') },
        { createdAt: new Date('2026-02-13T09:00:00Z') },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/messages?days=7',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.days).toBe(7);
      expect(body.data[0].date).toBe('2026-02-12');
      expect(body.data[0].count).toBe(3);
      expect(body.data[1].count).toBe(1);
    });
  });

  // ── GET /api/admin/popular-warriors ──
  describe('GET /api/admin/popular-warriors', () => {
    it('returns ranked warrior templates', async () => {
      mockPrisma.warrior.groupBy.mockResolvedValue([
        { templateId: 'mia', _count: { id: 15 } },
        { templateId: 'atlas', _count: { id: 10 } },
      ]);
      mockPrisma.warriorTemplate.findMany.mockResolvedValue([
        { id: 'mia', name: 'Mia', warriorClass: 'guardian', artFile: 'mia.png' },
        { id: 'atlas', name: 'Atlas', warriorClass: 'scholar', artFile: 'atlas.png' },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/popular-warriors',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.warriors).toHaveLength(2);
      expect(body.warriors[0].name).toBe('Mia');
      expect(body.warriors[0].deploy_count).toBe(15);
      expect(body.warriors[1].warrior_class).toBe('scholar');
    });
  });

  // ── GET /api/admin/channels ──
  describe('GET /api/admin/channels', () => {
    it('returns channel usage breakdown', async () => {
      mockPrisma.user.groupBy
        .mockResolvedValueOnce([  // primary
          { channel: 'telegram', _count: { id: 50 } },
        ])
        .mockResolvedValueOnce([  // secondary
          { channel2: 'whatsapp', _count: { id: 5 } },
        ]);
      mockPrisma.message.groupBy.mockResolvedValue([
        { channel: 'telegram', _count: { id: 3000 } },
        { channel: 'web', _count: { id: 800 } },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/channels',
        headers: { authorization: 'Bearer ' + adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.connected_channels).toBeDefined();
      expect(body.message_channels).toBeDefined();
      expect(body.connected_channels.find(c => c.channel === 'telegram').count).toBe(50);
      expect(body.message_channels.find(c => c.channel === 'web').count).toBe(800);
    });
  });
});
