const MAX_MESSAGE_LENGTH = 4000;

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

async function demoRoutes(app) {
  // POST /api/demo/chat — stub for now (will integrate MiniMax in Phase 3)
  app.post('/chat', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 hour' },
    },
  }, async (request, reply) => {
    const { message } = request.body || {};

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
      // Stub response until MiniMax integration
      return reply.send({
        response: 'The demo warrior is being summoned. Check back soon when the AI integration is complete.',
      });
    } catch (error) {
      console.error('[ERROR] demo chat failed:', error.message);
      return reply.code(500).send({ error: 'Something went wrong. Try again in a moment.' });
    }
  });
}

export default demoRoutes;
