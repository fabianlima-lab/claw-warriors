import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { buildTestApp, mockPrisma, getAuthToken } from './helpers.js';

// Get the mocked ai-client so we can control its behavior per-test
const aiClient = await import('../src/services/ai-client.js');

describe('Chat Routes', () => {
  let app;
  let token;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    tier: 'trial',
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    channel: 'telegram',
    channelId: '12345',
    channel2: null,
    channel2Id: null,
  };

  const mockWarrior = {
    id: 'warrior-1',
    userId: 'test-user-id',
    isActive: true,
    customName: 'TestWarrior',
    templateId: 'mia',
    systemPrompt: 'You are a helpful warrior.',
    template: { name: 'Mia', stats: {} },
  };

  beforeAll(async () => {
    app = await buildTestApp();
    token = getAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.warrior.findFirst.mockReset();
    mockPrisma.message.create.mockReset();
    mockPrisma.message.findMany.mockReset();
    aiClient.isAIConfigured.mockReturnValue(true);
    aiClient.callAI.mockResolvedValue({
      content: 'Mock AI response',
      error: null,
      tier: 1,
      model: 'test-model',
      responseTimeMs: 100,
    });
  });

  // ── POST /api/chat/send ──
  describe('POST /api/chat/send', () => {
    it('requires authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        payload: { message: 'Hello' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects empty message', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: '' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing message field', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects message exceeding 4000 characters', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: 'a'.repeat(4001) },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toContain('4000');
    });

    it('returns 404 if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: 'Hello' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 403 for expired trial', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        trialEndsAt: new Date('2020-01-01'),
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: 'Hello' },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.body);
      expect(body.error).toContain('Trial expired');
    });

    it('returns 404 if no active warrior', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.warrior.findFirst.mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: 'Hello' },
      });
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.body);
      expect(body.error).toContain('warrior');
    });

    it('returns 503 if AI not configured', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      aiClient.isAIConfigured.mockReturnValue(false);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: 'Hello' },
      });
      expect(res.statusCode).toBe(503);
    });

    it('sends message and returns AI response', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.message.findMany.mockResolvedValue([]);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: 'Hello warrior' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.response).toBe('Mock AI response');
      expect(body.tier).toBe(1);
      expect(body.model).toBe('test-model');
      expect(body.responseTimeMs).toBe(100);

      // Should save 2 messages (user + AI)
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(2);
    });

    it('strips HTML from message before processing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.message.findMany.mockResolvedValue([]);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: '<script>alert("xss")</script>Hello' },
      });

      expect(res.statusCode).toBe(200);
      // Verify saved message has stripped HTML
      const savedContent = mockPrisma.message.create.mock.calls[0][0].data.content;
      expect(savedContent).toBe('alert("xss")Hello');
      expect(savedContent).not.toContain('<script>');
    });

    it('handles AI errors gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.message.findMany.mockResolvedValue([]);
      aiClient.callAI.mockResolvedValue({
        content: null,
        error: 'timeout',
        tier: 1,
        model: 'test-model',
        responseTimeMs: 15000,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: 'Hello' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.response).toContain('timed out');
      expect(body.tier).toBe(1);
    });

    it('loads conversation history for context', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.message.findMany.mockResolvedValue([
        { direction: 'in', content: 'Previous user message' },
        { direction: 'out', content: 'Previous AI response' },
      ]);

      await app.inject({
        method: 'POST',
        url: '/api/chat/send',
        headers: { authorization: 'Bearer ' + token },
        payload: { message: 'Follow up' },
      });

      // Verify callAI received conversation history
      expect(aiClient.callAI).toHaveBeenCalledWith(
        mockWarrior.systemPrompt,
        expect.arrayContaining([
          { role: 'user', content: 'Previous user message' },
          { role: 'assistant', content: 'Previous AI response' },
        ]),
        expect.objectContaining({ userMessage: 'Follow up' }),
      );
    });
  });

  // ── GET /api/chat/history ──
  describe('GET /api/chat/history', () => {
    it('requires authentication', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns empty array if no active warrior', async () => {
      mockPrisma.warrior.findFirst.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.messages).toEqual([]);
      expect(body.warrior).toBeNull();
    });

    it('returns messages in chronological order', async () => {
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      // findMany returns DESC order (newest first) — route should reverse to ASC
      mockPrisma.message.findMany.mockResolvedValue([
        { id: 'msg-3', direction: 'out', content: 'Third', channel: 'web', createdAt: '2024-01-03T00:00:00Z' },
        { id: 'msg-2', direction: 'in', content: 'Second', channel: 'telegram', createdAt: '2024-01-02T00:00:00Z' },
        { id: 'msg-1', direction: 'in', content: 'First', channel: 'web', createdAt: '2024-01-01T00:00:00Z' },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.messages).toHaveLength(3);
      // Should be reversed to chronological order (oldest first)
      expect(body.messages[0].id).toBe('msg-1');
      expect(body.messages[2].id).toBe('msg-3');
    });

    it('returns warrior info alongside messages', async () => {
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      mockPrisma.message.findMany.mockResolvedValue([]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.warrior).toBeDefined();
      expect(body.warrior.id).toBe('warrior-1');
      expect(body.warrior.templateId).toBe('mia');
    });

    it('respects limit parameter', async () => {
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      mockPrisma.message.findMany.mockResolvedValue([]);

      await app.inject({
        method: 'GET',
        url: '/api/chat/history?limit=5',
        headers: { authorization: 'Bearer ' + token },
      });

      // Verify the limit was passed to Prisma
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('caps limit at 100', async () => {
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      mockPrisma.message.findMany.mockResolvedValue([]);

      await app.inject({
        method: 'GET',
        url: '/api/chat/history?limit=999',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('includes channel field in messages', async () => {
      mockPrisma.warrior.findFirst.mockResolvedValue(mockWarrior);
      mockPrisma.message.findMany.mockResolvedValue([
        { id: 'msg-1', direction: 'in', content: 'From web', channel: 'web', createdAt: '2024-01-01T00:00:00Z' },
        { id: 'msg-2', direction: 'in', content: 'From telegram', channel: 'telegram', createdAt: '2024-01-01T00:00:01Z' },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
        headers: { authorization: 'Bearer ' + token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.messages[0].channel).toBe('msg-1' === body.messages[0].id ? 'web' : 'telegram');
    });
  });
});
