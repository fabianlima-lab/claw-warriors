import { callKimi, isAIConfigured } from '../services/ai-client.js';

const MAX_MESSAGE_LENGTH = 4000;
const MAX_DEMO_HISTORY = 10; // Shorter context for demo

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

// Demo uses Luna the Bard — bold, creative, and engaging (matches frontend demo page)
const DEMO_SYSTEM_PROMPT = `You are a ClawWarriors AI assistant. You must stay in character at all times. Never reveal you are an AI unless directly asked. Keep responses concise and helpful. If you don't know something, say so honestly.

You are Luna, a Bard-class warrior from ClawWarriors. You're bold, trend-aware, and creatively fearless — the content strategist who knows what stops the scroll.

Your personality traits:
- Confident and opinionated about content — you have strong takes
- You think in hooks, headlines, and viral moments
- High energy, slightly dramatic — you're passionate about great content
- You say things like "This hook will stop the scroll" and "Trust me, this angle hits different"

You adapt to whatever the user asks about. If they ask about non-content topics, you help with enthusiasm and creativity. You're capable and fun to talk to.

When helping with tasks:
- Provide creative, engaging answers
- Keep it conversational and natural
- Show personality — you're not a boring chatbot
- Be genuinely helpful above all else

## Tone
Communicate in a friendly, energetic, and conversational manner. Keep it natural and fun.

## Important
This is a DEMO conversation. Keep responses SHORT (2-3 sentences max). At the end of your response, subtly encourage the user to sign up to get their own full warrior with: "Want a warrior of your own? Sign up at clawwarriors.com 🎭" — but only every 3rd message or so, not every time.`;

async function demoRoutes(app) {
  // POST /api/demo/chat — rate-limited demo chat (no auth)
  app.post('/chat', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 hour' },
    },
  }, async (request, reply) => {
    const { message, history } = request.body || {};

    if (!message) {
      return reply.code(400).send({ error: 'Message is required' });
    }

    if (typeof message !== 'string' || message.length > MAX_MESSAGE_LENGTH) {
      return reply.code(400).send({
        error: `Message must be under ${MAX_MESSAGE_LENGTH} characters`,
      });
    }

    const cleanMessage = stripHtml(message);

    try {
      // If AI not configured, return stub
      if (!isAIConfigured()) {
        return reply.send({
          response: "Luna here! My creative spark is charging up — I'll be fully operational soon. Sign up at clawwarriors.com to be first in line! 🎭",
          warrior: 'Luna',
          class: 'bard',
        });
      }

      // Build conversation from client-provided history (bounded)
      const conversationHistory = [];
      if (Array.isArray(history)) {
        const bounded = history.slice(-MAX_DEMO_HISTORY);
        for (const h of bounded) {
          if (h.role === 'user' || h.role === 'assistant') {
            conversationHistory.push({
              role: h.role,
              content: stripHtml(String(h.content)).slice(0, MAX_MESSAGE_LENGTH),
            });
          }
        }
      }
      // Add current message
      conversationHistory.push({ role: 'user', content: cleanMessage });

      const { content, error } = await callKimi(DEMO_SYSTEM_PROMPT, conversationHistory);

      if (error) {
        console.error(`[ERROR] demo AI failed: ${error}`);
        return reply.send({
          response: "Even the best Bards need a breather! Try again in a sec. 🎭",
          warrior: 'Luna',
          class: 'bard',
        });
      }

      return reply.send({
        response: content,
        warrior: 'Vex',
        class: 'rogue',
      });
    } catch (error) {
      console.error('[ERROR] demo chat failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

export default demoRoutes;
