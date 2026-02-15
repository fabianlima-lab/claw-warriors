import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { callAI, isAIConfigured } from './ai-client.js';
import { sendTelegramMessage } from './telegram.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { loadMemories } from './memory.js';
import { calculateNextRun, pulseHourToCron } from './cron-utils.js';

const prisma = new PrismaClient();

let schedulerRunning = false;

/**
 * Start the master scheduler.
 * Runs every minute and checks for due pulse checks and war rhythms.
 */
export function startScheduler() {
  if (schedulerRunning) {
    console.log('[SCHEDULER] already running, skipping duplicate start');
    return;
  }

  schedulerRunning = true;
  console.log('[SCHEDULER] starting master cron (every minute)');

  // Master tick — every minute
  cron.schedule('* * * * *', async () => {
    try {
      await Promise.all([
        processPulseChecks(),
        processWarRhythms(),
      ]);
    } catch (err) {
      console.error(`[SCHEDULER] tick error: ${err.message}`);
    }
  });
}

/**
 * Process all due pulse checks.
 * A pulse is due when:
 * - isActive = true
 * - Current hour in user's timezone matches the pulse hour
 * - lastRunAt is null or older than 23 hours (prevents double-fire)
 */
async function processPulseChecks() {
  try {
    // Get all active pulses with their warrior + user data
    const activePulses = await prisma.pulseCheck.findMany({
      where: { isActive: true },
      include: {
        warrior: {
          include: {
            template: true,
            user: true,
          },
        },
      },
      take: 100,
    });

    if (activePulses.length === 0) return;

    const now = new Date();
    const duePulses = [];

    for (const pulse of activePulses) {
      const user = pulse.warrior.user;
      if (!user) continue;

      // Get current hour in user's timezone
      const userHour = getCurrentHourInTimezone(user.timezone || 'America/New_York');

      // Check if the pulse hour matches current hour
      if (userHour !== pulse.hour) continue;

      // Prevent double-fire: skip if ran less than 23 hours ago
      if (pulse.lastRunAt) {
        const hoursSinceLastRun = (now - new Date(pulse.lastRunAt)) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 23) continue;
      }

      duePulses.push(pulse);
    }

    if (duePulses.length === 0) return;

    console.log(`[SCHEDULER] ${duePulses.length} pulse(s) due`);

    // Process each due pulse (one at a time to avoid flooding)
    for (const pulse of duePulses) {
      await executePulse(pulse).catch((err) => {
        console.error(`[SCHEDULER] pulse ${pulse.id} failed: ${err.message}`);
      });
    }
  } catch (err) {
    console.error(`[SCHEDULER] pulse check error: ${err.message}`);
  }
}

/**
 * Execute a single pulse check — generate AI message and send to user.
 */
async function executePulse(pulse) {
  const warrior = pulse.warrior;
  const user = warrior.user;

  if (!isAIConfigured()) {
    console.log(`[SCHEDULER] AI not configured, skipping pulse ${pulse.id}`);
    return;
  }

  // Determine channel to send to
  const { channel, channelId } = getUserChannel(user);
  if (!channel || !channelId) {
    console.log(`[SCHEDULER] no channel for user:${user.id}, skipping pulse ${pulse.id}`);
    return;
  }

  console.log(`[SCHEDULER] executing pulse: ${pulse.type} for warrior:${warrior.id} user:${user.id}`);

  // Load memories for context
  let memoryBlock = '';
  try {
    const { text } = await loadMemories(warrior.id, 10);
    memoryBlock = text;
  } catch (err) {
    console.error(`[SCHEDULER] memory load failed for pulse: ${err.message}`);
  }

  // Build enriched system prompt
  let systemPrompt = warrior.systemPrompt;
  if (memoryBlock) {
    systemPrompt += `\n\n## Long-Term Memory (things you know about this user)\n${memoryBlock}`;
  }

  // Load recent conversation for context (last 5 messages)
  const recentMessages = await prisma.message.findMany({
    where: { userId: user.id, warriorId: warrior.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const conversationHistory = recentMessages.reverse().map((m) => ({
    role: m.direction === 'in' ? 'user' : 'assistant',
    content: m.content,
  }));

  // Add the pulse prompt as a system instruction
  conversationHistory.push({
    role: 'user',
    content: `[SYSTEM: This is a scheduled ${pulse.type} check-in. The user did NOT send a message — you are reaching out proactively. ${pulse.prompt}]`,
  });

  // Call AI (use Tier 1 for cost efficiency)
  const { content, error } = await callAI(systemPrompt, conversationHistory, {
    forceTier: 1,
    userMessage: pulse.prompt,
  });

  if (error || !content) {
    console.error(`[SCHEDULER] AI error for pulse ${pulse.id}: ${error}`);
    return;
  }

  // Send message to user
  await sendChannelMessage(channel, channelId, content);

  // Save as outgoing message
  await prisma.message.create({
    data: {
      userId: user.id,
      warriorId: warrior.id,
      direction: 'out',
      channel,
      content,
    },
  });

  // Update lastRunAt
  await prisma.pulseCheck.update({
    where: { id: pulse.id },
    data: { lastRunAt: new Date() },
  });

  console.log(`[SCHEDULER] pulse sent: ${pulse.type} for warrior:${warrior.id} via ${channel}`);
}

/**
 * Process all due war rhythms.
 * A rhythm is due when isActive = true AND nextRunAt <= now.
 */
async function processWarRhythms() {
  try {
    const now = new Date();

    const dueRhythms = await prisma.warRhythm.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
      include: {
        warrior: {
          include: {
            template: true,
            user: true,
          },
        },
      },
      take: 50,
    });

    if (dueRhythms.length === 0) return;

    console.log(`[SCHEDULER] ${dueRhythms.length} rhythm(s) due`);

    for (const rhythm of dueRhythms) {
      await executeRhythm(rhythm).catch((err) => {
        console.error(`[SCHEDULER] rhythm ${rhythm.id} failed: ${err.message}`);
      });
    }
  } catch (err) {
    console.error(`[SCHEDULER] rhythm check error: ${err.message}`);
  }
}

/**
 * Execute a single war rhythm — generate AI response for the task.
 */
async function executeRhythm(rhythm) {
  const warrior = rhythm.warrior;
  const user = warrior.user;

  if (!isAIConfigured()) {
    console.log(`[SCHEDULER] AI not configured, skipping rhythm ${rhythm.id}`);
    return;
  }

  const { channel, channelId } = getUserChannel(user);
  if (!channel || !channelId) {
    console.log(`[SCHEDULER] no channel for user:${user.id}, skipping rhythm ${rhythm.id}`);
    return;
  }

  console.log(`[SCHEDULER] executing rhythm: "${rhythm.name}" for warrior:${warrior.id} user:${user.id}`);

  // Load memories
  let memoryBlock = '';
  try {
    const { text } = await loadMemories(warrior.id, 10);
    memoryBlock = text;
  } catch (err) {
    console.error(`[SCHEDULER] memory load failed for rhythm: ${err.message}`);
  }

  let systemPrompt = warrior.systemPrompt;
  if (memoryBlock) {
    systemPrompt += `\n\n## Long-Term Memory (things you know about this user)\n${memoryBlock}`;
  }

  // Build conversation with the task prompt
  const conversationHistory = [{
    role: 'user',
    content: `[SYSTEM: This is an automated scheduled task. The user set this up to run automatically. Task: "${rhythm.name}". Instructions: ${rhythm.taskPrompt}]`,
  }];

  // Call AI (Tier 1 for cost efficiency)
  const { content, error } = await callAI(systemPrompt, conversationHistory, {
    forceTier: 1,
    userMessage: rhythm.taskPrompt,
  });

  if (error || !content) {
    console.error(`[SCHEDULER] AI error for rhythm ${rhythm.id}: ${error}`);
    // Update with error result
    await prisma.warRhythm.update({
      where: { id: rhythm.id },
      data: {
        lastRunAt: new Date(),
        lastResult: `Error: ${error || 'empty response'}`,
        nextRunAt: calculateNextRun(rhythm.cronExpr, rhythm.timezone),
      },
    });
    return;
  }

  // Send to user
  await sendChannelMessage(channel, channelId, content);

  // Save as outgoing message
  await prisma.message.create({
    data: {
      userId: user.id,
      warriorId: warrior.id,
      direction: 'out',
      channel,
      content,
    },
  });

  // Update rhythm: lastRunAt, lastResult, nextRunAt
  const nextRun = calculateNextRun(rhythm.cronExpr, rhythm.timezone);

  await prisma.warRhythm.update({
    where: { id: rhythm.id },
    data: {
      lastRunAt: new Date(),
      lastResult: content.slice(0, 2000),
      nextRunAt: nextRun,
    },
  });

  console.log(`[SCHEDULER] rhythm sent: "${rhythm.name}" for warrior:${warrior.id} via ${channel}, next: ${nextRun?.toISOString()}`);
}

// ── Helpers ──

/**
 * Get the user's primary connected channel.
 */
function getUserChannel(user) {
  if (user.channel && user.channelId) {
    return { channel: user.channel, channelId: user.channelId };
  }
  if (user.channel2 && user.channel2Id) {
    return { channel: user.channel2, channelId: user.channel2Id };
  }
  return { channel: null, channelId: null };
}

/**
 * Send a message via the appropriate channel.
 */
async function sendChannelMessage(channel, channelId, text) {
  if (channel === 'telegram') {
    return sendTelegramMessage(channelId, text);
  }
  if (channel === 'whatsapp') {
    return sendWhatsAppMessage(channelId, text);
  }
  console.error(`[SCHEDULER] unknown channel: ${channel}`);
}

/**
 * Get the current hour (0-23) in a given timezone.
 */
function getCurrentHourInTimezone(timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    // Fallback to UTC
    return new Date().getUTCHours();
  }
}

export { processPulseChecks, processWarRhythms, executePulse, executeRhythm };
