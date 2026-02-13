export const CLASS_COLORS = {
  guardian: 'guardian',
  scholar: 'scholar',
  bard: 'bard',
  artificer: 'artificer',
  rogue: 'rogue',
};

export const CLASS_HEX = {
  guardian: '#4A9EFF',
  scholar: '#B47AFF',
  bard: '#FFB347',
  artificer: '#FF7847',
  rogue: '#47FFB3',
};

export const CLASS_ICONS = {
  guardian: '🛡️',
  scholar: '📚',
  bard: '🎭',
  artificer: '⚒️',
  rogue: '🗡️',
};

export const CLASS_STAT_NAMES = {
  guardian: ['protection', 'precision', 'loyalty'],
  scholar: ['wisdom', 'patience', 'clarity'],
  bard: ['creativity', 'strategy', 'momentum'],
  artificer: ['precision', 'speed', 'depth'],
  rogue: ['analysis', 'speed', 'instinct'],
};

export const CLASS_STAT_KEYS = {
  guardian: ['protection', 'precision', 'loyalty'],
  scholar: ['wisdom', 'patience', 'clarity'],
  bard: ['creativity', 'strategy', 'momentum'],
  artificer: ['precision', 'speed', 'depth'],
  rogue: ['analysis', 'speed', 'instinct'],
};

export const CLASS_LABELS = {
  guardian: 'guardian',
  scholar: 'scholar',
  bard: 'bard',
  artificer: 'artificer',
  rogue: 'rogue',
};

export const CLASS_DESCRIPTIONS = {
  guardian: 'guardian_desc',
  scholar: 'scholar_desc',
  bard: 'bard_desc',
  artificer: 'artificer_desc',
  rogue: 'rogue_desc',
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
    price: '$39/mo',
    maxWarriors: 1,
    channels: 2,
    customName: true,
    customTone: true,
  },
  pro_tribe: {
    label: 'Pro Tribe',
    price: '$59/mo',
    maxWarriors: 3,
    channels: 2,
    customName: true,
    customTone: true,
  },
};

export const GOAL_OPTIONS = [
  { id: 'productivity', labelKey: 'productivity', icon: '⚔️', class: 'guardian' },
  { id: 'learning', labelKey: 'learning', icon: '📚', class: 'scholar' },
  { id: 'content', labelKey: 'content', icon: '🎭', class: 'bard' },
  { id: 'coding', labelKey: 'coding', icon: '🔨', class: 'artificer' },
  { id: 'trading', labelKey: 'trading', icon: '🗡️', class: 'rogue' },
  { id: 'general', labelKey: 'general', icon: '✨', class: 'guardian' },
];

export const CLASSES = ['guardian', 'scholar', 'bard', 'artificer', 'rogue'];
