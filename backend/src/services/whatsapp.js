import env from '../config/env.js';

const TWILIO_API = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;

/**
 * Send a WhatsApp message via Twilio
 * @param {string} to - Recipient phone (e.g., "+1234567890" or "whatsapp:+1234567890")
 * @param {string} body - Message text
 * @returns {object|null} Twilio API response or null on error
 */
export async function sendWhatsAppMessage(to, body) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_NUMBER) {
    console.error('[ERROR] whatsapp send: missing Twilio credentials');
    return null;
  }

  // Ensure whatsapp: prefix
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const fromNumber = env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
    ? env.TWILIO_WHATSAPP_NUMBER
    : `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`;

  // Twilio WhatsApp message limit is 1600 chars
  const truncatedBody = body.slice(0, 1600);

  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');

  const params = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    Body: truncatedBody,
  });

  try {
    const res = await fetch(TWILIO_API, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (data.error_code) {
      console.error(`[ERROR] whatsapp send failed: ${data.error_code} - ${data.error_message}`);
      return null;
    }

    console.log(`[MSG_OUT] whatsapp:${to} - len:${body.length}`);
    return data;
  } catch (error) {
    console.error(`[ERROR] whatsapp send exception: ${error.message}`);
    return null;
  }
}
