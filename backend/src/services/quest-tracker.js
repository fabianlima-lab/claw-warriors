import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * WarriorQuest Definitions
 * Each quest has: id, tier (level range), xp reward, and what triggers it.
 * Quests are auto-completed when certain events happen in the app.
 */
export const QUESTS = [
  // ── Recruit (Lv. 1–3) ──
  { id: 'summon_warrior', tier: 'recruit', xp: 100, label: 'Summon Your Warrior' },
  { id: 'first_words', tier: 'recruit', xp: 50, label: 'First Words' },
  { id: 'avatar_awakening', tier: 'recruit', xp: 200, label: 'Avatar Awakening' },

  // ── Apprentice (Lv. 4–7) ──
  { id: 'name_your_blade', tier: 'apprentice', xp: 50, label: 'Name Your Blade' },
  { id: 'soul_forge', tier: 'apprentice', xp: 150, label: 'Soul Forge' },
  { id: 'deep_memory_10', tier: 'apprentice', xp: 100, label: 'Deep Memory Entry' },
  { id: 'second_channel', tier: 'apprentice', xp: 150, label: 'Second Channel' },
  { id: 'all_four_pulses', tier: 'apprentice', xp: 100, label: 'All Four Pulses' },

  // ── Warrior (Lv. 8–12) ──
  { id: 'forge_your_key', tier: 'warrior', xp: 300, label: 'Forge Your Own Key' },
  { id: 'forge_vault', tier: 'warrior', xp: 200, label: 'Forge Your Vault' },
  { id: 'first_standing_order', tier: 'warrior', xp: 200, label: 'First Standing Order' },
  { id: 'armory_scout', tier: 'warrior', xp: 200, label: 'Armory Scout' },
  { id: 'second_warrior', tier: 'warrior', xp: 250, label: 'Second Warrior' },

  // ── Commander (Lv. 13+) ──
  { id: 'custom_warrior', tier: 'commander', xp: 400, label: 'Custom Warrior' },
  { id: 'order_master', tier: 'commander', xp: 300, label: 'Order Master' },
  { id: 'full_armory', tier: 'commander', xp: 300, label: 'Full Armory' },
  { id: 'three_warriors', tier: 'commander', xp: 500, label: 'Three Warriors' },
];

// XP thresholds per level (cumulative)
const LEVEL_XP = [
  0,     // Lv. 0 (impossible)
  0,     // Lv. 1
  100,   // Lv. 2
  200,   // Lv. 3
  350,   // Lv. 4
  500,   // Lv. 5
  700,   // Lv. 6
  900,   // Lv. 7
  1150,  // Lv. 8
  1400,  // Lv. 9
  1700,  // Lv. 10
  2000,  // Lv. 11
  2350,  // Lv. 12
  2750,  // Lv. 13
  3200,  // Lv. 14
  3700,  // Lv. 15
];

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXp) {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (totalXp >= LEVEL_XP[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Get tier name from level
 */
export function getTierFromLevel(level) {
  if (level <= 3) return 'recruit';
  if (level <= 7) return 'apprentice';
  if (level <= 12) return 'warrior';
  return 'commander';
}

/**
 * Get XP needed for next level
 */
export function getXpForNextLevel(level) {
  const next = level + 1;
  if (next >= LEVEL_XP.length) return null; // Max level
  return LEVEL_XP[next];
}

/**
 * Complete a quest for a user (idempotent — if already done, skips)
 */
export async function completeQuest(userId, questId) {
  const quest = QUESTS.find((q) => q.id === questId);
  if (!quest) return null;

  try {
    const existing = await prisma.questProgress.findUnique({
      where: { userId_questId: { userId, questId } },
    });

    if (existing) return null; // Already completed

    const record = await prisma.questProgress.create({
      data: {
        userId,
        questId,
        xp: quest.xp,
      },
    });

    console.log(`[QUEST] completed: ${questId} for user:${userId} (+${quest.xp} XP)`);
    return record;
  } catch (err) {
    // Unique constraint violation = already completed (race condition)
    if (err.code === 'P2002') return null;
    console.error(`[ERROR] quest completion failed: ${err.message}`);
    return null;
  }
}

/**
 * Get full quest state for a user (all quests + which are completed)
 */
export async function getQuestState(userId) {
  const completed = await prisma.questProgress.findMany({
    where: { userId },
    orderBy: { completedAt: 'asc' },
  });

  const completedMap = {};
  let totalXp = 0;
  for (const c of completed) {
    completedMap[c.questId] = c.completedAt;
    totalXp += c.xp;
  }

  const level = calculateLevel(totalXp);
  const questTier = getTierFromLevel(level);
  const nextLevelXp = getXpForNextLevel(level);

  const quests = QUESTS.map((q) => ({
    id: q.id,
    tier: q.tier,
    xp: q.xp,
    label: q.label,
    completed: !!completedMap[q.id],
    completedAt: completedMap[q.id] || null,
  }));

  return {
    totalXp,
    level,
    questTier,
    nextLevelXp,
    xpToNextLevel: nextLevelXp ? nextLevelXp - totalXp : 0,
    completedCount: completed.length,
    totalCount: QUESTS.length,
    quests,
  };
}

/**
 * Check and auto-complete quests based on current user state.
 * Called after key actions (deploy, send message, edit soul, etc.)
 */
export async function checkAndCompleteQuests(userId) {
  const completed = [];

  try {
    // Load user state
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        warriors: {
          include: {
            memories: { select: { id: true } },
            pulses: { where: { isActive: true }, select: { id: true } },
            rhythms: { select: { id: true } },
          },
        },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) return completed;

    // summon_warrior: has at least 1 warrior
    if (user.warriors.length >= 1) {
      const r = await completeQuest(userId, 'summon_warrior');
      if (r) completed.push('summon_warrior');
    }

    // first_words: has sent at least 1 message
    if (user.messages.length > 0) {
      const r = await completeQuest(userId, 'first_words');
      if (r) completed.push('first_words');
    }

    // name_your_blade: any warrior has a custom name
    const hasCustomName = user.warriors.some((w) => w.customName);
    if (hasCustomName) {
      const r = await completeQuest(userId, 'name_your_blade');
      if (r) completed.push('name_your_blade');
    }

    // soul_forge: any warrior has soul config
    const hasSoul = user.warriors.some((w) => w.soulConfig);
    if (hasSoul) {
      const r = await completeQuest(userId, 'soul_forge');
      if (r) completed.push('soul_forge');
    }

    // deep_memory_10: any warrior has 10+ memories
    const hasDeepMemory = user.warriors.some((w) => w.memories.length >= 10);
    if (hasDeepMemory) {
      const r = await completeQuest(userId, 'deep_memory_10');
      if (r) completed.push('deep_memory_10');
    }

    // second_channel: user has both channel and channel2
    if (user.channel && user.channel2) {
      const r = await completeQuest(userId, 'second_channel');
      if (r) completed.push('second_channel');
    }

    // all_four_pulses: any warrior has all 4 pulses active
    const hasAllPulses = user.warriors.some((w) => w.pulses.length >= 4);
    if (hasAllPulses) {
      const r = await completeQuest(userId, 'all_four_pulses');
      if (r) completed.push('all_four_pulses');
    }

    // first_standing_order: any warrior has at least 1 rhythm
    const hasRhythm = user.warriors.some((w) => w.rhythms.length >= 1);
    if (hasRhythm) {
      const r = await completeQuest(userId, 'first_standing_order');
      if (r) completed.push('first_standing_order');
    }

    // second_warrior: has 2+ warriors
    if (user.warriors.length >= 2) {
      const r = await completeQuest(userId, 'second_warrior');
      if (r) completed.push('second_warrior');
    }

    // three_warriors: has 3+ warriors
    if (user.warriors.length >= 3) {
      const r = await completeQuest(userId, 'three_warriors');
      if (r) completed.push('three_warriors');
    }

    // order_master: any warrior has 5+ rhythms
    const hasOrderMaster = user.warriors.some((w) => w.rhythms.length >= 5);
    if (hasOrderMaster) {
      const r = await completeQuest(userId, 'order_master');
      if (r) completed.push('order_master');
    }
  } catch (err) {
    console.error(`[ERROR] quest check failed: ${err.message}`);
  }

  return completed;
}
