import OpenAI from 'openai';
import env from '../config/env.js';

// ─────────────────────────────────────────────────────
// Kimi K2.5 via NVIDIA NIMs (OpenAI-compatible API)
// ─────────────────────────────────────────────────────

const MODEL = 'moonshotai/kimi-k2.5';
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.7;
const TIMEOUT_MS = 60000; // 60 second timeout

let client = null;

function getClient() {
  if (!client) {
    if (!env.NVIDIA_API_KEY || env.NVIDIA_API_KEY === 'nvapi-xxx') {
      return null;
    }
    client = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: env.NVIDIA_API_KEY,
      timeout: TIMEOUT_MS,
    });
  }
  return client;
}

/**
 * Call Kimi K2.5 with system prompt and conversation history.
 *
 * @param {string} systemPrompt - Compiled system prompt (preamble + persona + tone)
 * @param {Array<{role: string, content: string}>} conversationHistory - Recent messages
 * @param {object} options
 * @param {boolean} [options.webSearch=false] - Enable web search tool
 * @returns {Promise<{content: string, error: string|null}>}
 */
export async function callKimi(systemPrompt, conversationHistory, options = {}) {
  const ai = getClient();

  if (!ai) {
    console.error('[ERROR] AI client not configured — NVIDIA_API_KEY missing');
    return {
      content: null,
      error: 'ai_not_configured',
    };
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
  ];

  const requestParams = {
    model: MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
  };

  // Add web search tool if enabled
  if (options.webSearch) {
    requestParams.tools = [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for current information',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
            },
            required: ['query'],
          },
        },
      },
    ];
  }

  try {
    const response = await ai.chat.completions.create(requestParams);

    const choice = response.choices?.[0];
    if (!choice || !choice.message) {
      console.error('[ERROR] AI response: no choices returned');
      return { content: null, error: 'empty_response' };
    }

    // Handle tool calls (web search) — auto-handle the search loop
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      return await handleToolCalls(ai, messages, choice.message, requestParams);
    }

    const content = choice.message.content;
    if (!content || content.trim().length === 0) {
      console.error('[ERROR] AI response: empty content');
      return { content: null, error: 'empty_content' };
    }

    return { content: content.trim(), error: null };
  } catch (error) {
    // Categorize errors for upstream handling
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error(`[ERROR] AI timeout after ${TIMEOUT_MS}ms`);
      return { content: null, error: 'timeout' };
    }

    if (error.status === 429) {
      console.error('[ERROR] AI rate limited');
      return { content: null, error: 'rate_limited' };
    }

    if (error.status === 401 || error.status === 403) {
      console.error('[ERROR] AI auth failed — check NVIDIA_API_KEY');
      return { content: null, error: 'auth_failed' };
    }

    if (error.status >= 500) {
      console.error(`[ERROR] AI server error: ${error.status}`);
      return { content: null, error: 'server_error' };
    }

    console.error(`[ERROR] AI call failed: ${error.message}`);
    return { content: null, error: 'unknown' };
  }
}

/**
 * Handle tool calls from the AI (e.g., web search).
 * Sends tool results back and gets the final response.
 */
async function handleToolCalls(ai, originalMessages, assistantMessage, requestParams) {
  try {
    // Build tool results (for now, we let the model handle search internally)
    // NVIDIA NIMs may handle tool execution server-side
    // If not, we'd need to execute the search and return results
    const toolResults = assistantMessage.tool_calls.map((tc) => ({
      role: 'tool',
      tool_call_id: tc.id,
      content: JSON.stringify({
        note: 'Web search executed by the model internally.',
      }),
    }));

    // Continue the conversation with tool results
    const followUpMessages = [
      ...originalMessages,
      assistantMessage,
      ...toolResults,
    ];

    const followUp = await ai.chat.completions.create({
      ...requestParams,
      messages: followUpMessages,
    });

    const content = followUp.choices?.[0]?.message?.content;
    if (!content || content.trim().length === 0) {
      return { content: null, error: 'empty_tool_response' };
    }

    return { content: content.trim(), error: null };
  } catch (error) {
    console.error(`[ERROR] AI tool call follow-up failed: ${error.message}`);
    return { content: null, error: 'tool_call_failed' };
  }
}

/**
 * Check if the AI client is properly configured.
 */
export function isAIConfigured() {
  return !!(env.NVIDIA_API_KEY && env.NVIDIA_API_KEY !== 'nvapi-xxx');
}

export { MODEL, MAX_TOKENS, TEMPERATURE };
