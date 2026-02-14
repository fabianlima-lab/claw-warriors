import { describe, it, expect } from 'vitest';
import { classifyQuery } from '../src/utils/query-analyzer.js';

describe('Query Analyzer', () => {
  describe('Tier 1 — Simple queries', () => {
    it('classifies greetings as Tier 1', () => {
      expect(classifyQuery('Hi!').tier).toBe(1);
      expect(classifyQuery('Hello').tier).toBe(1);
      expect(classifyQuery('Hey there').tier).toBe(1);
      expect(classifyQuery('Good morning').tier).toBe(1);
      expect(classifyQuery('Yo').tier).toBe(1);
    });

    it('classifies simple questions as Tier 1', () => {
      expect(classifyQuery('What is ClawWarriors?').tier).toBe(1);
      expect(classifyQuery('Who are the warriors?').tier).toBe(1);
      expect(classifyQuery('Where is the shop?').tier).toBe(1);
    });

    it('classifies exact keyword matches as Tier 1', () => {
      expect(classifyQuery('help').tier).toBe(1);
      expect(classifyQuery('info').tier).toBe(1);
      expect(classifyQuery('about').tier).toBe(1);
    });

    it('classifies single word/emoji as Tier 1', () => {
      expect(classifyQuery('👋').tier).toBe(1);
      expect(classifyQuery('ok').tier).toBe(1);
      expect(classifyQuery('thanks').tier).toBe(1);
    });

    it('classifies short messages (<50 chars) as Tier 1', () => {
      expect(classifyQuery('How do I start?').tier).toBe(1);
      expect(classifyQuery('yes').tier).toBe(1);
    });

    it('classifies empty/whitespace as Tier 1', () => {
      expect(classifyQuery('').tier).toBe(1);
      expect(classifyQuery('   ').tier).toBe(1);
      expect(classifyQuery(null).tier).toBe(1);
      expect(classifyQuery(undefined).tier).toBe(1);
    });

    it('is case-insensitive for greetings', () => {
      expect(classifyQuery('HELLO').tier).toBe(1);
      expect(classifyQuery('HeLLo').tier).toBe(1);
      expect(classifyQuery('HI THERE').tier).toBe(1);
    });
  });

  describe('Tier 2 — Medium complexity', () => {
    it('classifies medium-length messages as Tier 2', () => {
      expect(classifyQuery('Tell me about the Fire Warrior class and its abilities').tier).toBe(2);
    });

    it('classifies general conversation (50-200 chars, no complex patterns) as Tier 2', () => {
      const msg = 'I want to learn more about the different warrior classes available';
      expect(msg.length).toBeGreaterThanOrEqual(50);
      expect(msg.length).toBeLessThanOrEqual(200);
      expect(classifyQuery(msg).tier).toBe(2);
    });
  });

  describe('Tier 3 — Complex queries', () => {
    it('classifies long messages (>200 chars) as Tier 3', () => {
      const longMsg = 'a'.repeat(201);
      expect(classifyQuery(longMsg).tier).toBe(3);
    });

    it('classifies reasoning patterns as Tier 3', () => {
      expect(classifyQuery('Explain how the warrior synergy works').tier).toBe(3);
      expect(classifyQuery('Why does this warrior have more power than that one?').tier).toBe(3);
      expect(classifyQuery('Analyze the team composition for effectiveness').tier).toBe(3);
      expect(classifyQuery('Compare these two warrior classes for me please').tier).toBe(3);
    });

    it('classifies code patterns as Tier 3', () => {
      expect(classifyQuery('Help me build a script to calculate team DPS').tier).toBe(3);
      expect(classifyQuery('Can you create a function to track warrior stats?').tier).toBe(3);
      expect(classifyQuery('I need to debug this warrior configuration issue').tier).toBe(3);
      expect(classifyQuery('Write some code for a damage calculator').tier).toBe(3);
    });

    it('classifies strategy/analysis patterns as Tier 3', () => {
      expect(classifyQuery('What is the best strategy for raiding with fire warriors?').tier).toBe(3);
      expect(classifyQuery('Give me optimization tips for my team setup please').tier).toBe(3);
      expect(classifyQuery('What is the best practice for team composition?').tier).toBe(3);
    });

    it('classifies multiple questions as Tier 3', () => {
      expect(classifyQuery('What is this? Why does it matter?').tier).toBe(3);
      expect(classifyQuery('What? Why? How?').tier).toBe(3);
    });

    it('prioritizes Tier 3 over Tier 1 when both match', () => {
      // "help" would match Tier 1 keyword, but "build"/"script" should win
      expect(classifyQuery('Help me build a script to calculate team DPS').tier).toBe(3);
      // "about" would match Tier 1 keyword, but "compare" should win
      expect(classifyQuery('Tell me about how to compare and analyze warrior stats').tier).toBe(3);
    });
  });

  describe('Edge cases', () => {
    it('handles special characters', () => {
      const result = classifyQuery('What about émojis 🔥 and spëcial çhars?');
      expect(result.tier).toBeGreaterThanOrEqual(1);
      expect(result.tier).toBeLessThanOrEqual(3);
    });

    it('returns a reason for every classification', () => {
      expect(classifyQuery('Hi').reason).toBeTruthy();
      expect(classifyQuery('Tell me about warriors and their abilities for the game').reason).toBeTruthy();
      expect(classifyQuery('Explain how synergy works in warrior combinations').reason).toBeTruthy();
    });

    it('handles very long messages', () => {
      const veryLong = 'a'.repeat(5000);
      expect(classifyQuery(veryLong).tier).toBe(3);
    });
  });
});
