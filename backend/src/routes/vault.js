import {
  createVaultEntry,
  listVaultEntries,
  updateVaultEntry,
  deleteVaultEntry,
} from '../services/vault.js';
import { getFeaturesByTier } from '../utils/helpers.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_TYPES = ['api_key', 'oauth_token'];
const MAX_ENTRIES_BY_TIER = { trial: 0, pro: 5, pro_tribe: 10 };

async function vaultRoutes(app) {
  // ─────────────────────────────────────────────
  // GET /api/vault — List all vault entries (no raw values)
  // ─────────────────────────────────────────────
  app.get('/', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;

    try {
      const entries = await listVaultEntries(userId);
      return reply.send({ entries });
    } catch (error) {
      console.error('[ERROR] vault list failed:', error.message);
      return reply.code(500).send({ error: 'Failed to load vault' });
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/vault — Add a new encrypted entry
  // ─────────────────────────────────────────────
  app.post('/', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { label, type, value, expires_at } = request.body || {};

    // Validate inputs
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return reply.code(400).send({ error: 'Label is required' });
    }
    if (!type || !VALID_TYPES.includes(type)) {
      return reply.code(400).send({ error: `Type must be one of: ${VALID_TYPES.join(', ')}` });
    }
    if (!value || typeof value !== 'string' || value.trim().length < 4) {
      return reply.code(400).send({ error: 'Value must be at least 4 characters' });
    }
    if (value.length > 2000) {
      return reply.code(400).send({ error: 'Value too long (max 2000 characters)' });
    }

    try {
      // Check tier limits
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const maxEntries = MAX_ENTRIES_BY_TIER[user.tier] || 0;
      if (maxEntries === 0) {
        return reply.code(403).send({ error: 'The Vault requires a Pro plan' });
      }

      const existing = await listVaultEntries(userId);
      if (existing.length >= maxEntries) {
        return reply.code(403).send({ error: `Vault limit reached (${existing.length}/${maxEntries})` });
      }

      // Check VAULT_MASTER_KEY is configured
      if (!process.env.VAULT_MASTER_KEY || process.env.VAULT_MASTER_KEY.length !== 64) {
        return reply.code(503).send({ error: 'Vault encryption not configured. Contact support.' });
      }

      const entry = await createVaultEntry(
        userId,
        label.trim().slice(0, 100),
        type,
        value,
        expires_at || null,
      );

      return reply.code(201).send(entry);
    } catch (error) {
      console.error('[ERROR] vault create failed:', error.message);
      return reply.code(500).send({ error: 'Failed to store entry' });
    }
  });

  // ─────────────────────────────────────────────
  // PATCH /api/vault/:id — Update entry value (re-encrypt)
  // ─────────────────────────────────────────────
  app.patch('/:id', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;
    const { value } = request.body || {};

    if (!value || typeof value !== 'string' || value.trim().length < 4) {
      return reply.code(400).send({ error: 'Value must be at least 4 characters' });
    }

    try {
      const result = await updateVaultEntry(id, userId, value);
      if (!result) {
        return reply.code(404).send({ error: 'Entry not found' });
      }
      return reply.send(result);
    } catch (error) {
      console.error('[ERROR] vault update failed:', error.message);
      return reply.code(500).send({ error: 'Failed to update entry' });
    }
  });

  // ─────────────────────────────────────────────
  // DELETE /api/vault/:id — Remove an entry
  // ─────────────────────────────────────────────
  app.delete('/:id', {
    preHandler: [app.authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { id } = request.params;

    try {
      const deleted = await deleteVaultEntry(id, userId);
      if (!deleted) {
        return reply.code(404).send({ error: 'Entry not found' });
      }
      return reply.send({ deleted: true });
    } catch (error) {
      console.error('[ERROR] vault delete failed:', error.message);
      return reply.code(500).send({ error: 'Failed to delete entry' });
    }
  });
}

export default vaultRoutes;
