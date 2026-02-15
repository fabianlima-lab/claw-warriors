/**
 * Support articles for ClawWarriors.
 * Text-only, hand-held guide for every feature.
 *
 * Each article has:
 * - slug: URL-friendly identifier
 * - icon: Emoji icon
 * - category: Grouping key
 * - titleKey/bodyKey: i18n keys in the Support namespace
 */

export const SUPPORT_CATEGORIES = [
  { key: 'getting-started', icon: '🚀' },
  { key: 'features', icon: '⚔️' },
  { key: 'account', icon: '👤' },
  { key: 'troubleshooting', icon: '🔧' },
];

export const SUPPORT_ARTICLES = [
  // ── Getting Started ──
  {
    slug: 'what-is-clawwarriors',
    category: 'getting-started',
    icon: '🏰',
    titleKey: 'whatIsTitle',
    bodyKey: 'whatIsBody',
  },
  {
    slug: 'choosing-your-warrior',
    category: 'getting-started',
    icon: '🗡️',
    titleKey: 'choosingWarriorTitle',
    bodyKey: 'choosingWarriorBody',
  },
  {
    slug: 'connecting-telegram',
    category: 'getting-started',
    icon: '📱',
    titleKey: 'connectTelegramTitle',
    bodyKey: 'connectTelegramBody',
  },
  {
    slug: 'first-conversation',
    category: 'getting-started',
    icon: '💬',
    titleKey: 'firstConvoTitle',
    bodyKey: 'firstConvoBody',
  },

  // ── Features ──
  {
    slug: 'soul-forge',
    category: 'features',
    icon: '✨',
    titleKey: 'soulForgeTitle',
    bodyKey: 'soulForgeBody',
  },
  {
    slug: 'deep-memory',
    category: 'features',
    icon: '🧠',
    titleKey: 'deepMemoryTitle',
    bodyKey: 'deepMemoryBody',
  },
  {
    slug: 'pulse-check',
    category: 'features',
    icon: '💓',
    titleKey: 'pulseCheckTitle',
    bodyKey: 'pulseCheckBody',
  },
  {
    slug: 'war-rhythms',
    category: 'features',
    icon: '⚡',
    titleKey: 'warRhythmsTitle',
    bodyKey: 'warRhythmsBody',
  },
  {
    slug: 'the-vault',
    category: 'features',
    icon: '🔐',
    titleKey: 'vaultTitle',
    bodyKey: 'vaultBody',
  },
  {
    slug: 'warrior-quest',
    category: 'features',
    icon: '🏆',
    titleKey: 'questTitle',
    bodyKey: 'questBody',
  },
  {
    slug: 'warrior-classes',
    category: 'features',
    icon: '🛡️',
    titleKey: 'classesTitle',
    bodyKey: 'classesBody',
  },
  {
    slug: 'web-search',
    category: 'features',
    icon: '🌐',
    titleKey: 'webSearchTitle',
    bodyKey: 'webSearchBody',
  },

  // ── Account ──
  {
    slug: 'plans-and-pricing',
    category: 'account',
    icon: '💎',
    titleKey: 'plansTitle',
    bodyKey: 'plansBody',
  },
  {
    slug: 'manage-subscription',
    category: 'account',
    icon: '💳',
    titleKey: 'subscriptionTitle',
    bodyKey: 'subscriptionBody',
  },
  {
    slug: 'account-settings',
    category: 'account',
    icon: '⚙️',
    titleKey: 'settingsTitle',
    bodyKey: 'settingsBody',
  },

  // ── Troubleshooting ──
  {
    slug: 'warrior-not-responding',
    category: 'troubleshooting',
    icon: '🔇',
    titleKey: 'notRespondingTitle',
    bodyKey: 'notRespondingBody',
  },
  {
    slug: 'reset-gateway',
    category: 'troubleshooting',
    icon: '🔄',
    titleKey: 'resetGatewayTitle',
    bodyKey: 'resetGatewayBody',
  },
  {
    slug: 'trial-expired',
    category: 'troubleshooting',
    icon: '⏰',
    titleKey: 'trialExpiredTitle',
    bodyKey: 'trialExpiredBody',
  },
];

export function getArticleBySlug(slug) {
  return SUPPORT_ARTICLES.find((a) => a.slug === slug) || null;
}

export function getArticlesByCategory(category) {
  return SUPPORT_ARTICLES.filter((a) => a.category === category);
}
