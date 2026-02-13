import env from '../config/env.js';

const TELEGRAM_API = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

/**
 * Send a text message via Telegram Bot API
 * @param {string} chatId - Telegram chat ID
 * @param {string} text - Message text
 * @param {object} options - Optional: parse_mode, reply_markup, etc.
 * @returns {object} Telegram API response
 */
export async function sendTelegramMessage(chatId, text, options = {}) {
  const body = {
    chat_id: chatId,
    text: text.slice(0, 4096), // Telegram max message length
    ...options,
  };

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error(`[ERROR] telegram send failed: ${data.description}`);
      return null;
    }

    console.log(`[MSG_OUT] telegram:${chatId} - len:${text.length}`);
    return data.result;
  } catch (error) {
    console.error(`[ERROR] telegram send exception: ${error.message}`);
    return null;
  }
}

/**
 * Set the webhook URL for the Telegram bot
 * @param {string} url - Full webhook URL (e.g., https://yourdomain.com/api/webhooks/telegram)
 * @returns {boolean} Success
 */
export async function setTelegramWebhook(url) {
  try {
    const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (data.ok) {
      console.log(`[STARTUP] Telegram webhook set: ${url}`);
    } else {
      console.error(`[ERROR] Telegram webhook failed: ${data.description}`);
    }

    return data.ok;
  } catch (error) {
    console.error(`[ERROR] Telegram webhook exception: ${error.message}`);
    return false;
  }
}

/**
 * Send "typing" indicator to show the bot is processing
 * @param {string} chatId - Telegram chat ID
 */
export async function sendTypingAction(chatId) {
  try {
    await fetch(`${TELEGRAM_API}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
    });
  } catch {
    // Typing indicator is non-critical, silently fail
  }
}
