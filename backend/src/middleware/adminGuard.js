import env from '../config/env.js';

/**
 * Admin access guard middleware.
 * Must be used AFTER app.authenticate (JWT already verified).
 * Checks the user's email against the ADMIN_EMAILS whitelist.
 */
async function adminGuard(request, reply) {
  const email = (request.user.email || '').toLowerCase();

  if (!env.ADMIN_EMAILS.includes(email)) {
    console.log(`[ADMIN] access denied for: ${email}`);
    return reply.code(403).send({ error: 'Forbidden' });
  }
}

export default adminGuard;
