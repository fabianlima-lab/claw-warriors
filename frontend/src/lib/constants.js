export const CLASS_COLORS = {
  guardian: 'guardian',
  scholar: 'scholar',
  creator: 'creator',
  strategist: 'strategist',
  sentinel: 'sentinel',
};

export const CLASS_HEX = {
  guardian: '#4A9EFF',
  scholar: '#B47AFF',
  creator: '#FFB347',
  strategist: '#FF7847',
  sentinel: '#47FFB3',
};

export const CLASS_ICONS = {
  guardian: '🛡️',
  scholar: '📚',
  creator: '✨',
  strategist: '🧠',
  sentinel: '🔒',
};

export const CLASS_STAT_NAMES = {
  guardian: ['protection', 'precision', 'loyalty'],
  scholar: ['wisdom', 'patience', 'clarity'],
  creator: ['creativity', 'strategy', 'momentum'],
  strategist: ['precision', 'speed', 'depth'],
  sentinel: ['analysis', 'speed', 'instinct'],
};

export const CLASS_STAT_KEYS = {
  guardian: ['protection', 'precision', 'loyalty'],
  scholar: ['wisdom', 'patience', 'clarity'],
  creator: ['creativity', 'strategy', 'momentum'],
  strategist: ['precision', 'speed', 'depth'],
  sentinel: ['analysis', 'speed', 'instinct'],
};

export const CLASS_LABELS = {
  guardian: 'guardian',
  scholar: 'scholar',
  creator: 'creator',
  strategist: 'strategist',
  sentinel: 'sentinel',
};

export const CLASS_DESCRIPTIONS = {
  guardian: 'guardian_desc',
  scholar: 'scholar_desc',
  creator: 'creator_desc',
  strategist: 'strategist_desc',
  sentinel: 'sentinel_desc',
};

export const TIER_FEATURES = {
  trial: {
    label: 'Free Trial',
    maxWarriors: 1,
    channels: 1,
    customName: false,
    customTone: false,
  },
  pro: {
    label: 'Pro',
    price: '$30/mo',
    maxWarriors: 1,
    channels: 2,
    customName: true,
    customTone: true,
  },
  pro_tribe: {
    label: 'Pro Tribe',
    price: '$50/mo',
    maxWarriors: 3,
    channels: 2,
    customName: true,
    customTone: true,
  },
};

export const GOAL_OPTIONS = [
  { id: 'productivity', labelKey: 'productivity', icon: '⚔️', class: 'guardian' },
  { id: 'learning', labelKey: 'learning', icon: '📚', class: 'scholar' },
  { id: 'content', labelKey: 'content', icon: '✨', class: 'creator' },
  { id: 'coding', labelKey: 'coding', icon: '🧠', class: 'strategist' },
  { id: 'trading', labelKey: 'trading', icon: '🔒', class: 'sentinel' },
  { id: 'general', labelKey: 'general', icon: '✨', class: 'guardian' },
];

export const CLASSES = ['guardian', 'scholar', 'creator', 'strategist', 'sentinel'];
