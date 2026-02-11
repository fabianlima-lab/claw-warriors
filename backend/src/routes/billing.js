async function billingRoutes(app) {
  // POST /api/billing/checkout — stub
  app.post('/checkout', { preHandler: [app.authenticate] }, async (request, reply) => {
    return reply.code(501).send({ error: 'Billing not yet implemented' });
  });

  // POST /api/billing/elixir — stub
  app.post('/elixir', { preHandler: [app.authenticate] }, async (request, reply) => {
    return reply.code(501).send({ error: 'Billing not yet implemented' });
  });

  // POST /api/billing/webhook — always return 200 for webhooks
  app.post('/webhook', async (request, reply) => {
    return reply.code(200).send({ received: true });
  });

  // GET /api/billing/status
  app.get('/status', { preHandler: [app.authenticate] }, async (request, reply) => {
    return reply.code(501).send({ error: 'Billing not yet implemented' });
  });
}

export default billingRoutes;
