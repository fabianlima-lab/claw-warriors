async function webhookRoutes(app) {
  // POST /api/webhooks/telegram — stub for Phase 2
  // Webhooks always return 200 to prevent retries
  app.post('/telegram', async (request, reply) => {
    try {
      const { message } = request.body || {};
      if (message && message.text) {
        console.log(`[MSG_IN] telegram:${message.chat.id} - len:${message.text.length}`);
      }
    } catch (error) {
      console.error('[ERROR] telegram webhook:', error.message);
    }
    return reply.code(200).send();
  });

  // POST /api/webhooks/whatsapp — stub for Phase 2
  app.post('/whatsapp', async (request, reply) => {
    try {
      const { From, Body } = request.body || {};
      if (From && Body) {
        console.log(`[MSG_IN] whatsapp:${From} - len:${Body.length}`);
      }
    } catch (error) {
      console.error('[ERROR] whatsapp webhook:', error.message);
    }
    return reply.code(200).send();
  });
}

export default webhookRoutes;
