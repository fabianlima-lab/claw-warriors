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
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,

  // AI Models
  MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

  // APIs
  BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  // App
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
};

export default env;
