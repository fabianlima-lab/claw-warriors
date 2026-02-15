import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import env from '../config/env.js';

const prisma = new PrismaClient();

/**
 * AES-256-GCM Encryption Service for The Vault
 *
 * Security properties:
 * - AES-256-GCM provides authenticated encryption (confidentiality + integrity)
 * - Each entry gets a unique random IV (initialization vector)
 * - Auth tag prevents tampering without detection
 * - Master key from env (VAULT_MASTER_KEY) — 32 bytes hex
 * - Raw values NEVER stored or logged
 */

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit IV recommended for GCM
const KEY_BYTES = 32; // 256-bit key

/**
 * Get or validate the master encryption key
 */
function getMasterKey() {
  const keyHex = env.VAULT_MASTER_KEY || process.env.VAULT_MASTER_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('VAULT_MASTER_KEY must be a 64-character hex string (32 bytes). Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a plaintext value using AES-256-GCM
 * @returns {{ encrypted: string, iv: string, authTag: string }}
 */
export function encrypt(plaintext) {
  const key = getMasterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypt an encrypted value using AES-256-GCM
 * @returns {string} plaintext
 */
export function decrypt(encryptedHex, ivHex, authTagHex) {
  const key = getMasterKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a masked preview of a key (e.g., "sk-...abc")
 */
export function maskKey(value) {
  if (!value || value.length < 8) return '***';
  const prefix = value.slice(0, 4);
  const suffix = value.slice(-3);
  return `${prefix}...${suffix}`;
}

/**
 * Store a new vault entry (encrypted)
 */
export async function createVaultEntry(userId, label, type, plainValue, expiresAt = null) {
  const { encrypted, iv, authTag } = encrypt(plainValue);
  const maskedPreview = maskKey(plainValue);

  const entry = await prisma.vaultEntry.create({
    data: {
      userId,
      label,
      type,
      encryptedValue: encrypted,
      iv,
      authTag,
      maskedPreview,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  console.log(`[VAULT] entry created: ${entry.id} label:${label} type:${type} for user:${userId}`);

  return {
    id: entry.id,
    label: entry.label,
    type: entry.type,
    masked_preview: entry.maskedPreview,
    expires_at: entry.expiresAt,
    created_at: entry.createdAt,
  };
}

/**
 * Retrieve and decrypt a vault entry value
 * ⚠️ NEVER log or return the decrypted value in API responses
 */
export async function decryptVaultEntry(entryId, userId) {
  const entry = await prisma.vaultEntry.findFirst({
    where: { id: entryId, userId },
  });

  if (!entry) return null;

  // Check expiry
  if (entry.expiresAt && new Date() > new Date(entry.expiresAt)) {
    return null;
  }

  const decrypted = decrypt(entry.encryptedValue, entry.iv, entry.authTag);

  // Update last used timestamp
  await prisma.vaultEntry.update({
    where: { id: entryId },
    data: { lastUsedAt: new Date() },
  }).catch(() => {}); // Non-critical

  return decrypted;
}

/**
 * List vault entries for a user (WITHOUT decrypted values)
 */
export async function listVaultEntries(userId) {
  const entries = await prisma.vaultEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      label: true,
      type: true,
      maskedPreview: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return entries.map((e) => ({
    id: e.id,
    label: e.label,
    type: e.type,
    masked_preview: e.maskedPreview,
    expires_at: e.expiresAt,
    last_used_at: e.lastUsedAt,
    created_at: e.createdAt,
    is_expired: e.expiresAt ? new Date() > new Date(e.expiresAt) : false,
  }));
}

/**
 * Update a vault entry (re-encrypt with new value)
 */
export async function updateVaultEntry(entryId, userId, newPlainValue) {
  const entry = await prisma.vaultEntry.findFirst({
    where: { id: entryId, userId },
  });

  if (!entry) return null;

  const { encrypted, iv, authTag } = encrypt(newPlainValue);
  const maskedPreview = maskKey(newPlainValue);

  await prisma.vaultEntry.update({
    where: { id: entryId },
    data: {
      encryptedValue: encrypted,
      iv,
      authTag,
      maskedPreview,
    },
  });

  console.log(`[VAULT] entry updated: ${entryId} for user:${userId}`);

  return { id: entryId, masked_preview: maskedPreview };
}

/**
 * Delete a vault entry
 */
export async function deleteVaultEntry(entryId, userId) {
  const entry = await prisma.vaultEntry.findFirst({
    where: { id: entryId, userId },
  });

  if (!entry) return false;

  await prisma.vaultEntry.delete({ where: { id: entryId } });
  console.log(`[VAULT] entry deleted: ${entryId} for user:${userId}`);

  return true;
}

/**
 * Get the user's BYOK API key (for AI calls)
 * Looks for a vault entry with type 'api_key' and a specific label pattern
 */
export async function getUserApiKey(userId) {
  const entries = await prisma.vaultEntry.findMany({
    where: {
      userId,
      type: 'api_key',
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (entries.length === 0) return null;

  const entry = entries[0];

  // Check expiry
  if (entry.expiresAt && new Date() > new Date(entry.expiresAt)) {
    return null;
  }

  try {
    const decrypted = decrypt(entry.encryptedValue, entry.iv, entry.authTag);

    // Update last used
    await prisma.vaultEntry.update({
      where: { id: entry.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    return decrypted;
  } catch {
    console.error(`[VAULT] decryption failed for entry:${entry.id}`);
    return null;
  }
}
