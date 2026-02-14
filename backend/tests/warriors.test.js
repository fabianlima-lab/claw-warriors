import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildTestApp, mockPrisma, getAuthToken } from './helpers.js';

describe('Warrior Routes', () => {
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
    mockPrisma.warriorTemplate.findMany.mockReset();
    mockPrisma.warriorTemplate.findUnique.mockReset();
    mockPrisma.warrior.findFirst.mockReset();
    mockPrisma.warrior.findMany.mockReset();
    mockPrisma.warrior.create.mockReset();
    mockPrisma.warrior.update.mockReset();
    mockPrisma.warrior.updateMany.mockReset();
    mockPrisma.warrior.count.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.update.mockReset();
    mockPrisma.message.deleteMany.mockReset();
  });

  // ── Templates ──
  describe('GET /api/warriors/templates', () => {
    it('returns templates grouped by class', async () => {
      mockPrisma.warriorTemplate.findMany.mockResolvedValue([
        { id: '1', warriorClass: 'guardian', name: 'Mia' },
        { id: '2', warriorClass: 'guardian', name: 'Atlas' },
        { id: '3', warriorClass: 'bard', name: 'Luna' },
      ]);

      const res = await app.inject({ method: 'GET', url: '/api/warriors/templates' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.guardian).toHaveLength(2);
      expect(body.bard).toHaveLength(1);
    });
  });

  describe('GET /api/warriors/templates/:class', () => {
    it('returns templates for a specific class', async () => {
      mockPrisma.warriorTemplate.findMany.mockResolvedValue([
        { id: '1', warriorClass: 'guardian', name: 'Mia' },
      ]);

      const res = await app.inject({ method: 'GET', url: '/api/warriors/templates/guardian' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveLength(1);
    });
  });

  // ── Deploy ──
  describe('POST /api/warriors/deploy', () => {
    it('requires authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/warriors/deploy',
        payload: { templateId: 'test-template' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('deploys a warrior with valid data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        tier: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      mockPrisma.warriorTemplate.findUnique.mockResolvedValue({
        id: 'template-1',
        name: 'Mia',
        warriorClass: 'guardian',
        baseSystemPrompt: 'You are Mia.',
        firstMessage: 'Hello!',
      });
      mockPrisma.warrior.count.mockResolvedValue(0);
      mockPrisma.warrior.create.mockResolvedValue({
        id: 'new-warrior-id',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/warriors/deploy',
        headers: { authorization: 'Bearer ' + token },
        payload: { templateId: 'template-1' },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.warrior_id).toBe('new-warrior-id');
      expect(body.first_message).toBe('Hello!');
    });

    it('rejects missing templateId with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/warriors/deploy',
        headers: { authorization: 'Bearer ' + token },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid tone with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/warriors/deploy',
        headers: { authorization: 'Bearer ' + token },
        payload: { templateId: 'template-1', tone: 'invalid' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects expired trial with 403', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        tier: 'trial',
        trialEndsAt: new Date(Date.now() - 1000),
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/warriors/deploy',
        headers: { authorization: 'Bearer ' + token },
        payload: { templateId: 'template-1' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── Mine ──
  describe('GET /api/warriors/mine', () => {
    it('requires authentication', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/warriors/mine' });
      expect(res.statusCode).toBe(401);
    });

    it('returns active warriors', async () => {
      mockPrisma.warrior.findMany.mockResolvedValue([
        { id: 'w1', warriorClass: 'guardian', template: { name: 'Mia' } },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/warriors/mine',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveLength(1);
    });

    it('returns 404 when no active warriors', async () => {
      mockPrisma.warrior.findMany.mockResolvedValue([]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/warriors/mine',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── Restart ──
  describe('POST /api/warriors/:id/restart', () => {
    it('clears conversation history', async () => {
      mockPrisma.warrior.findFirst.mockResolvedValue({ id: 'w1' });
      mockPrisma.message.deleteMany.mockResolvedValue({ count: 5 });

      const res = await app.inject({
        method: 'POST',
        url: '/api/warriors/w1/restart',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('restarted');
    });

    it('returns 404 for non-owned warrior', async () => {
      mockPrisma.warrior.findFirst.mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST',
        url: '/api/warriors/nonexistent/restart',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── Delete ──
  describe('DELETE /api/warriors/:id', () => {
    it('deactivates a warrior', async () => {
      mockPrisma.warrior.findFirst.mockResolvedValue({ id: 'w1' });
      mockPrisma.warrior.update.mockResolvedValue({ id: 'w1', isActive: false });

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/warriors/w1',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('deactivated');
    });
  });
});
