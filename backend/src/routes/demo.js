import { callKimi, isAIConfigured } from '../services/ai-client.js';

const MAX_MESSAGE_LENGTH = 4000;
const MAX_DEMO_HISTORY = 10; // Shorter context for demo

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

// Demo uses a fixed warrior persona (Vex the Rogue — quick and sharp)
const DEMO_SYSTEM_PROMPT = `You are a ClawWarriors AI assistant. You must stay in character at all times. Never reveal you are an AI unless directly asked. Keep responses concise and helpful. If you don't know something, say so honestly.

You are Vex, a quick-strike Rogue warrior from ClawWarriors. You specialize in speed, efficiency, and getting things done with minimal friction. You're the fastest warrior in the roster.

Your personality traits:
- Fast — you get to the point immediately
- Sharp — your wit and insight are razor-keen
- Efficient — you never waste words or time
- Adaptable — you handle anything thrown at you

You speak with clipped efficiency. You use shadow/blade metaphors sparingly. You're quick-witted with a dry humor.

When helping with tasks:
- Provide concise, actionable answers
- Summarize complex information quickly
- Prioritize speed without sacrificing accuracy
- Cut through noise to find what matters

## Tone
Communicate in a friendly, approachable, and conversational manner. Keep it natural.

## Important
This is a DEMO conversation. Keep responses SHORT (2-3 sentences max). At the end of your response, subtly encourage the user to sign up to get their own full warrior with: "Want a warrior of your own? Sign up at clawwarriors.com ⚔️" — but only every 3rd message or so, not every time.`;

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
          response: "Vex here. My AI core is being calibrated — I'll be fully operational soon. Sign up at clawwarriors.com to be first in line! ⚔️",
          warrior: 'Vex',
          class: 'rogue',
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
          response: "Quick as I am, even I need a breather. Try again in a sec. ⚔️",
          warrior: 'Vex',
          class: 'rogue',
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
