/**
 * Query complexity analyzer for intelligent model routing.
 *
 * Classifies incoming messages into 3 tiers:
 *   Tier 1 — Simple (greetings, short messages, single-word, emoji)
 *   Tier 2 — Medium (general conversation, moderate length)
 *   Tier 3 — Complex (reasoning, code, analysis, multi-question)
 *
 * IMPORTANT: Tier 3 patterns are checked FIRST to avoid false positives
 * where a message like "help me build a script" would match the Tier 1
 * "help" keyword before reaching Tier 3's "build"/"script" keywords.
 */

// ── Tier 3 patterns (complex reasoning, code, analysis) ──
const COMPLEX_PATTERNS = [
  /(explain how|why does|analyze|compare|difference between)/i,
  /(code|build|create|implement|debug|function|script)/i,
  /(strategy|optimization|best practice|recommendation)/i,
];

// ── Tier 1 patterns (greetings, simple questions, help keyword) ──
const SIMPLE_GREETING_PATTERNS = [
  /^(hi|hello|hey|yo|sup|what's up|good morning|good afternoon|good evening)/i,
];

const SIMPLE_QUESTION_PATTERNS = [
  /^(what|who|when|where) (is|are|was|were)/i,
];

const SIMPLE_KEYWORD_PATTERNS = [
  /^(help|info|about|introduce)$/i, // Exact match only — avoids "help me build..."
];

/**
 * Classify a user message into a routing tier (1, 2, or 3).
 *
 * @param {string} message - The user's incoming message text
 * @returns {{ tier: number, reason: string }}
 */
export function classifyQuery(message) {
  const trimmed = (message || '').trim();
  const length = trimmed.length;

  // ── Edge case: empty or whitespace-only → Tier 1 ──
  if (length === 0) {
    return { tier: 1, reason: 'empty message' };
  }

  // ── Check Tier 3 FIRST (complex patterns take priority) ──
  const hasMultipleQuestions = (trimmed.match(/\?/g) || []).length >= 2;

  if (length > 200) {
    return { tier: 3, reason: 'long message (>200 chars)' };
  }

  if (COMPLEX_PATTERNS.some((p) => p.test(trimmed))) {
    return { tier: 3, reason: 'complex pattern match' };
  }

  if (hasMultipleQuestions) {
    return { tier: 3, reason: 'multiple questions' };
  }

  // ── Now check Tier 1 (simple queries) ──
  if (length < 50) {
    // Short message — check if it's a greeting, simple question, or single word
    if (SIMPLE_GREETING_PATTERNS.some((p) => p.test(trimmed))) {
      return { tier: 1, reason: 'greeting' };
    }
    if (SIMPLE_QUESTION_PATTERNS.some((p) => p.test(trimmed))) {
      return { tier: 1, reason: 'simple question' };
    }
    if (SIMPLE_KEYWORD_PATTERNS.some((p) => p.test(trimmed))) {
      return { tier: 1, reason: 'help/info keyword' };
    }
    // Single word or emoji
    if (!/\s/.test(trimmed) || length < 10) {
      return { tier: 1, reason: 'short/single-word message' };
    }
    // Short message that doesn't match any specific pattern → still Tier 1
    return { tier: 1, reason: 'short message (<50 chars)' };
  }

  // ── Default: Tier 2 (medium complexity, 50-200 chars) ──
  return { tier: 2, reason: 'medium complexity' };
}
