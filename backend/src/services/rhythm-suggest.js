import { PrismaClient } from '@prisma/client';
import { callAI, isAIConfigured } from './ai-client.js';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────
// Rhythm Suggestions — Behavioral Pattern Detection
// ─────────────────────────────────────────────────────

/**
 * Pre-built suggestion templates based on common patterns.
 * These are offered even without AI analysis as quick-start options.
 */
const TEMPLATE_SUGGESTIONS = [
  {
    id: 'morning_briefing',
    name: 'Morning Briefing',
    taskPrompt: 'Give me a quick morning briefing. Summarize anything I mentioned yesterday that needs follow-up, any pending tasks or reminders, and one motivational thought for the day.',
    schedule: 'Every day at 8:00 AM',
    cronExpr: '0 8 * * *',
    category: 'daily',
    icon: '☀️',
  },
  {
    id: 'weekly_review',
    name: 'Weekly Review',
    taskPrompt: 'Provide a weekly review: summarize key topics we discussed this week, any commitments I made, and suggest priorities for the coming week.',
    schedule: 'Every Sunday at 6:00 PM',
    cronExpr: '0 18 * * 0',
    category: 'weekly',
    icon: '📋',
  },
  {
    id: 'goal_tracker',
    name: 'Goal Progress Check',
    taskPrompt: 'Check in on my goals and progress. Review what I\'ve mentioned about my objectives and give me a brief status update with encouragement.',
    schedule: 'Every Wednesday at 12:00 PM',
    cronExpr: '0 12 * * 3',
    category: 'weekly',
    icon: '🎯',
  },
  {
    id: 'evening_journal',
    name: 'Evening Journal Prompt',
    taskPrompt: 'Send me a thoughtful journal prompt for the evening. Base it on themes from our recent conversations — something reflective and personal.',
    schedule: 'Every day at 9:00 PM',
    cronExpr: '0 21 * * *',
    category: 'daily',
    icon: '📝',
  },
  {
    id: 'learning_digest',
    name: 'Learning Digest',
    taskPrompt: 'Based on topics I\'ve been curious about recently, find and share one interesting article, fact, or resource I might enjoy. Keep it brief and engaging.',
    schedule: 'Every Tuesday & Thursday at 10:00 AM',
    cronExpr: '0 10 * * 2,4',
    category: 'weekly',
    icon: '📚',
  },
  {
    id: 'habit_reminder',
    name: 'Habit Check-in',
    taskPrompt: 'Remind me about the habits and routines I\'ve mentioned wanting to build. Ask me how I\'m doing with them today and offer gentle encouragement.',
    schedule: 'Every weekday at 2:00 PM',
    cronExpr: '0 14 * * 1-5',
    category: 'daily',
    icon: '💪',
  },
  {
    id: 'creative_spark',
    name: 'Creative Spark',
    taskPrompt: 'Send me a creative prompt, idea, or challenge based on my interests. Something fun and unexpected to spark creativity.',
    schedule: 'Every Friday at 3:00 PM',
    cronExpr: '0 15 * * 5',
    category: 'weekly',
    icon: '✨',
  },
  {
    id: 'weekend_planning',
    name: 'Weekend Planning',
    taskPrompt: 'Help me plan my weekend. Review anything I mentioned wanting to do, any social plans, errands, or hobbies I\'ve been excited about, and suggest a loose plan.',
    schedule: 'Every Friday at 5:00 PM',
    cronExpr: '0 17 * * 5',
    category: 'weekly',
    icon: '🏖️',
  },
];

/**
 * Generate personalized rhythm suggestions based on user's conversation history and memories.
 *
 * Strategy:
 * 1. Load user's existing rhythms (to avoid duplicates)
 * 2. Load user's memories (to understand patterns)
 * 3. Load recent message summary (topics, frequency)
 * 4. Use AI to generate personalized suggestions
 * 5. Merge with template suggestions (filtered for relevance)
 *
 * @param {string} warriorId
 * @param {string} userId
 * @returns {Promise<{suggestions: Array, source: string}>}
 */
export async function generateSuggestions(warriorId, userId) {
  try {
    // Load existing rhythms to avoid suggesting duplicates
    const existingRhythms = await prisma.warRhythm.findMany({
      where: { warriorId },
      select: { name: true, taskPrompt: true, cronExpr: true },
    });

    const existingNames = new Set(existingRhythms.map((r) => r.name.toLowerCase()));

    // Filter template suggestions (remove already-created ones)
    const filteredTemplates = TEMPLATE_SUGGESTIONS.filter(
      (t) => !existingNames.has(t.name.toLowerCase())
    );

    // Load memories for behavioral signals
    const memories = await prisma.warriorMemory.findMany({
      where: { warriorId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { category: true, content: true },
    });

    // Load recent messages for conversation topic analysis
    const recentMessages = await prisma.message.findMany({
      where: { userId, warriorId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { content: true, direction: true, createdAt: true },
    });

    // If we have enough data + AI is configured, generate personalized suggestions
    let aiSuggestions = [];
    if (isAIConfigured() && (memories.length >= 3 || recentMessages.length >= 10)) {
      aiSuggestions = await getAISuggestions(memories, recentMessages, existingRhythms);
    }

    // Combine: AI personalized first, then templates
    const suggestions = [
      ...aiSuggestions.map((s) => ({ ...s, source: 'personalized' })),
      ...filteredTemplates.slice(0, 5).map((t) => ({ ...t, source: 'template' })),
    ];

    // Deduplicate by name similarity
    const seen = new Set();
    const deduplicated = suggestions.filter((s) => {
      const key = s.name.toLowerCase().replace(/[^a-z]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      suggestions: deduplicated.slice(0, 8),
      hasPersonalized: aiSuggestions.length > 0,
    };
  } catch (error) {
    console.error(`[SUGGEST] rhythm suggestion failed: ${error.message}`);
    // Graceful fallback to templates only
    return {
      suggestions: TEMPLATE_SUGGESTIONS.slice(0, 5).map((t) => ({ ...t, source: 'template' })),
      hasPersonalized: false,
    };
  }
}

/**
 * Use AI to analyze conversation patterns and generate personalized rhythm suggestions.
 */
async function getAISuggestions(memories, recentMessages, existingRhythms) {
  const memoryContext = memories
    .map((m) => `[${m.category}] ${m.content}`)
    .join('\n');

  const messageTopics = recentMessages
    .filter((m) => m.direction === 'in')
    .map((m) => m.content.slice(0, 100))
    .slice(0, 15)
    .join('\n');

  const existingContext = existingRhythms.length > 0
    ? `\n\nAlready active rhythms (do NOT suggest these again):\n${existingRhythms.map((r) => `- ${r.name}: ${r.taskPrompt.slice(0, 80)}`).join('\n')}`
    : '';

  const systemPrompt = `You are a behavioral pattern analyzer. Based on a user's conversation history and stored memories, suggest 3 personalized recurring tasks (standing orders) their AI assistant should perform automatically.

Rules:
- Suggestions must be grounded in the user's actual patterns, interests, or needs
- Each suggestion needs: name (short, clear), taskPrompt (what the AI should do), schedule (natural language), cronExpr (5-field cron), icon (single emoji)
- Schedules should make sense for the task type
- Return a JSON array: [{"name":"...", "taskPrompt":"...", "schedule":"...", "cronExpr":"...", "icon":"..."}]
- Maximum 3 suggestions
- Be creative but practical — suggest things the user would genuinely find helpful
- Do NOT wrap in markdown code blocks`;

  const userContent = `User memories:\n${memoryContext}\n\nRecent message topics:\n${messageTopics}${existingContext}\n\nBased on these patterns, suggest 3 personalized recurring tasks.`;

  try {
    const { content, error } = await callAI(
      systemPrompt,
      [{ role: 'user', content: userContent }],
      { forceTier: 1 },
    );

    if (error || !content) {
      console.log(`[SUGGEST] AI suggestion failed: ${error}`);
      return [];
    }

    // Parse JSON from response
    const cleanContent = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    // Validate and clean suggestions
    return parsed
      .filter((s) => s.name && s.taskPrompt && s.cronExpr)
      .slice(0, 3)
      .map((s) => ({
        id: `ai_${s.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}`,
        name: String(s.name).slice(0, 200),
        taskPrompt: String(s.taskPrompt).slice(0, 2000),
        schedule: String(s.schedule || '').slice(0, 100),
        cronExpr: String(s.cronExpr).slice(0, 50),
        icon: String(s.icon || '⚡').slice(0, 4),
        category: 'personalized',
      }));
  } catch (err) {
    console.error(`[SUGGEST] AI parse failed: ${err.message}`);
    return [];
  }
}
