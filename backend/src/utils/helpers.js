const VALID_TIERS = ['trial', 'pro', 'pro_tribe'];

const TIER_FEATURES = {
  trial: {
    max_active_warriors: 1,
    max_channels: 1,
    custom_name: false,
    custom_tone: false,
    web_search: true,
  },
  pro: {
    max_active_warriors: 1,
    max_channels: 2,
    custom_name: true,
    custom_tone: true,
    web_search: true,
  },
  pro_tribe: {
    max_active_warriors: 3,
    max_channels: 2,
    custom_name: true,
    custom_tone: true,
    web_search: true,
  },
};

export function getFeaturesByTier(tier) {
  return TIER_FEATURES[tier] || TIER_FEATURES.trial;
}

export function isValidTier(tier) {
  return VALID_TIERS.includes(tier);
}

export function isTrialExpired(user) {
  return user.tier === 'trial' && user.trialEndsAt && new Date() > new Date(user.trialEndsAt);
}

export { VALID_TIERS, TIER_FEATURES };
