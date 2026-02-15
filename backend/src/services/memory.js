import { PrismaClient } from '@prisma/client';
import { callAI, isAIConfigured } from './ai-client.js';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────
// Battle Memory — Persistent Long-Term Memory Service
// ─────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are a memory extraction assistant. Analyze the conversation and extract key facts, preferences, or instructions the user shared that are worth remembering long-term.

Rules:
- Only extract NEW information (not things already in the memory list below)
- Each memory should be a single, concise sentence
- Categorize each as: "preference", "fact", "instruction", or "summary"
  - preference: User likes/dislikes, communication style, habits
  - fact: Personal details, context about their life/work
  - instruction: Standing orders or rules ("always do X", "never do Y")
  - summary: Key takeaway from the conversation
- Return a JSON array: [{"category":"...", "content":"..."}]
- If nothing new is worth remembering, return: []
- Maximum 3 memories per extraction
- Do NOT include the JSON in markdown code blocks, just raw JSON`;

/**
 * Extract memorable facts from a conversation and save to DB.
 * Uses a cheap Tier 1 AI call (fire-and-forget after main response).
 *
 * @param {string} warriorId
 * @param {string} userId
 * @param {Array<{role:string, content:string}>} conversationHistory - Last few messages
 * @param {Array<string>} existingMemories - Already stored memories to avoid duplicates
 * @param {number} maxMemories - Max memories allowed for this tier
 */
export async function extractMemories(warriorId, userId, conversationHistory, existingMemories = [], maxMemories = 50) {
  if (!isAIConfigured()) return;

  // Check current memory count
  const currentCount = await prisma.warriorMemory.count({
    where: { warriorId },
  });

  if (currentCount >= maxMemories) {
    console.log(`[MEMORY] warrior:${warriorId} at memory limit (${currentCount}/${maxMemories}), skipping extraction`);
    return;
  }

  // Only use the last 6 messages for extraction (efficient)
  const recentMessages = conversationHistory.slice(-6);

  const existingMemoryText = existingMemories.length > 0
    ? `\n\nAlready known memories (DO NOT re-extract these):\n${existingMemories.map((m) => `- ${m}`).join('\n')}`
    : '';

  const extractionMessages = [
    {
      role: 'user',
      content: `${EXTRACTION_PROMPT}${existingMemoryText}\n\nConversation to analyze:\n${recentMessages.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
    },
  ];

  try {
    const { content, error } = await callAI(
      'You are a JSON-only memory extraction tool. Only return valid JSON arrays.',
      extractionMessages,
      { forceTier: 1 },
    );

    if (error || !content) {
      console.log(`[MEMORY] extraction failed for warrior:${warriorId}: ${error}`);
      return;
    }

    // Parse the JSON response
    let memories;
    try {
      // Strip markdown code blocks if present
      const cleanContent = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      memories = JSON.parse(cleanContent);
    } catch {
      console.log(`[MEMORY] failed to parse extraction response for warrior:${warriorId}`);
      return;
    }

    if (!Array.isArray(memories) || memories.length === 0) return;

    // Validate and save each memory
    const validCategories = ['preference', 'fact', 'instruction', 'summary'];
    const toSave = memories
      .filter((m) => m.category && m.content && validCategories.includes(m.category))
      .slice(0, 3); // Max 3 per extraction

    if (toSave.length === 0) return;

    // Check how many we can still add
    const slotsRemaining = maxMemories - currentCount;
    const finalBatch = toSave.slice(0, slotsRemaining);

    await prisma.warriorMemory.createMany({
      data: finalBatch.map((m) => ({
        warriorId,
        userId,
        category: m.category,
        content: m.content.slice(0, 500), // Cap at 500 chars per memory
        source: 'extracted',
      })),
    });

    console.log(`[MEMORY] extracted ${finalBatch.length} memories for warrior:${warriorId}`);
  } catch (error) {
    console.error(`[MEMORY] extraction error for warrior:${warriorId}: ${error.message}`);
  }
}

/**
 * Load memories for a warrior, formatted as a text block for system prompt injection.
 *
 * @param {string} warriorId
 * @param {number} limit - Max memories to load
 * @returns {Promise<{text: string, memories: Array}>}
 */
export async function loadMemories(warriorId, limit = 20) {
  const memories = await prisma.warriorMemory.findMany({
    where: { warriorId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  if (memories.length === 0) {
    return { text: '', memories: [] };
  }

  // Group by category for a clean prompt format
  const grouped = {};
  for (const m of memories) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m.content);
  }

  let text = '';
  for (const [category, items] of Object.entries(grouped)) {
    text += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)}s\n`;
    text += items.map((item) => `- ${item}`).join('\n');
  }

  return {
    text: text.trim(),
    memories: memories.map((m) => m.content),
  };
}

/**
 * List memories for a warrior with optional category filter.
 */
export async function listMemories(warriorId, { category, page = 1, limit = 50 } = {}) {
  const where = { warriorId };
  if (category) where.category = category;

  const [memories, total] = await Promise.all([
    prisma.warriorMemory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.warriorMemory.count({ where }),
  ]);

  return { memories, total, page, limit };
}

/**
 * Delete a specific memory.
 */
export async function deleteMemory(memoryId, warriorId) {
  return prisma.warriorMemory.delete({
    where: { id: memoryId, warriorId },
  });
}

/**
 * Clear all memories for a warrior.
 */
export async function clearMemories(warriorId) {
  const { count } = await prisma.warriorMemory.deleteMany({
    where: { warriorId },
  });
  console.log(`[MEMORY] cleared ${count} memories for warrior:${warriorId}`);
  return count;
}
