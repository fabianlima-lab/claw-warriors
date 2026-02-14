/**
 * Model routing configuration for 3-tier intelligent routing.
 *
 * Tier 1 — Fast, lightweight model for simple queries (greetings, short Qs)
 * Tier 2 — Balanced model for general conversation
 * Tier 3 — Powerful model for complex reasoning, code, analysis
 *
 * All models are free via NVIDIA NIMs (OpenAI-compatible API).
 */

export const MODEL_TIERS = {
  1: {
    name: 'Tier 1 (Fast)',
    model: 'meta/llama-3.2-3b-instruct',
    temperature: 0.7,
    maxTokens: 512,
    timeoutMs: 15000,
  },
  2: {
    name: 'Tier 2 (Balanced)',
    model: 'meta/llama-3.3-70b-instruct',
    temperature: 0.7,
    maxTokens: 1024,
    timeoutMs: 20000,
  },
  3: {
    name: 'Tier 3 (Deep)',
    model: 'moonshotai/kimi-k2.5',
    temperature: 0.6,
    maxTokens: 2048,
    timeoutMs: 60000,
    extraBody: {
      chat_template_kwargs: { thinking: false },
    },
  },
};

/** Fallback chain: tier N fails → try next tier in this order */
export const FALLBACK_CHAIN = {
  1: 2,
  2: 3,
  3: null, // no further fallback
};

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
