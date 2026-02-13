import 'dotenv/config';

// Required env vars — fail fast if missing
const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[STARTUP] Missing required env var: ${key}`);
    process.exit(1);
  }
}

const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
  STRIPE_PRICE_PRO_TRIBE: process.env.STRIPE_PRICE_PRO_TRIBE,

  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,

  // AI Models (Kimi K2.5 via NVIDIA)
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,

  // App
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
};

export default env;
