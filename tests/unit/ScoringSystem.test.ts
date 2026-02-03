import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  calculateRankings,
  applyScoreEffects,
  getTopPlayers,
  calculateAverageScore,
  getScoreDistribution,
  hasReachedScoreThreshold,
  type ScoreConfig,
} from '@/lib/engine/systems/ScoringSystem';
import type { PlayerState, Effect } from '@/lib/engine/types';

// Helper to create test config
const createConfig = (overrides?: Partial<ScoreConfig>): ScoreConfig => ({
  basePoints: 100,
  timeBonus: 50,
  streakMultiplier: 0.1,
  maxStreak: 5,
  ...overrides,
});

// Helper to create test player
const createPlayer = (overrides?: Partial<PlayerState>): PlayerState => ({
  id: 'player-1',
  name: 'Test Player',
  resources: {},
  status: 'active',
  score: 0,
  streak: 0,
  inventory: [],
  abilityCooldowns: {},
  questionsAnswered: 0,
  correctAnswers: 0,
  ...overrides,
});

describe('ScoringSystem', () => {
  describe('calculateScore', () => {
    const config = createConfig();

    it('returns 0 points for incorrect answer', () => {
      const result = calculateScore(config, 5000, 30000, 0, false);

      expect(result.points).toBe(0);
      expect(result.streak).toBe(0);
      expect(result.breakdown.base).toBe(0);
      expect(result.breakdown.time).toBe(0);
      expect(result.breakdown.streak).toBe(0);
      expect(result.breakdown.total).toBe(0);
    });

    it('calculates base points for correct answer', () => {
      const result = calculateScore(config, 30000, 30000, 0, true);

      // At time limit, no time bonus
      expect(result.breakdown.base).toBe(100);
      expect(result.breakdown.time).toBe(0);
      expect(result.streak).toBe(1);
    });

    it('adds time bonus for fast answers', () => {
      // Answer instantly (0ms)
      const result = calculateScore(config, 0, 30000, 0, true);

      expect(result.breakdown.base).toBe(100);
      expect(result.breakdown.time).toBe(50); // Full time bonus
      expect(result.points).toBeGreaterThan(100);
    });

    it('calculates proportional time bonus', () => {
      // Answer at 50% time remaining (15s out of 30s)
      const result = calculateScore(config, 15000, 30000, 0, true);

      expect(result.breakdown.time).toBe(25); // 50% of time bonus
    });

    it('applies streak multiplier correctly', () => {
      // With 2-question streak
      const result = calculateScore(config, 0, 30000, 2, true);

      // New streak is 3, multiplier is 3 * 0.1 = 0.3
      // Subtotal is 100 + 50 = 150
      // Streak bonus is 150 * 0.3 = 45
      expect(result.streak).toBe(3);
      expect(result.breakdown.streak).toBe(45);
      expect(result.breakdown.total).toBe(150 + 45);
    });

    it('caps streak at maxStreak', () => {
      // Already at max streak
      const result = calculateScore(config, 0, 30000, 5, true);

      // Streak is 6 but capped at 5 for multiplier
      expect(result.streak).toBe(6);
      // Multiplier uses capped value: 5 * 0.1 = 0.5
      const subtotal = 100 + 50;
      const expectedStreakBonus = Math.floor(subtotal * 0.5);
      expect(result.breakdown.streak).toBe(expectedStreakBonus);
    });

    it('resets streak on incorrect answer', () => {
      const result = calculateScore(config, 0, 30000, 5, false);

      expect(result.streak).toBe(0);
      expect(result.points).toBe(0);
    });

    it('handles edge case of answer after time limit', () => {
      // Time exceeds limit
      const result = calculateScore(config, 40000, 30000, 0, true);

      // Time bonus should be 0, not negative
      expect(result.breakdown.time).toBe(0);
      expect(result.breakdown.base).toBe(100);
    });

    it('handles custom config values', () => {
      const customConfig = createConfig({
        basePoints: 200,
        timeBonus: 100,
        streakMultiplier: 0.2,
        maxStreak: 10,
      });

      const result = calculateScore(customConfig, 0, 30000, 4, true);

      expect(result.breakdown.base).toBe(200);
      expect(result.breakdown.time).toBe(100);
      // Streak 5 * 0.2 = 1.0 multiplier on 300 = 300
      expect(result.breakdown.streak).toBe(300);
    });
  });

  describe('calculateRankings', () => {
    it('ranks players by score descending', () => {
      const players = [
        createPlayer({ id: 'p1', score: 100 }),
        createPlayer({ id: 'p2', score: 300 }),
        createPlayer({ id: 'p3', score: 200 }),
      ];

      const rankings = calculateRankings(players);

      expect(rankings[0].id).toBe('p2');
      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].id).toBe('p3');
      expect(rankings[1].rank).toBe(2);
      expect(rankings[2].id).toBe('p1');
      expect(rankings[2].rank).toBe(3);
    });

    it('handles ties with same rank', () => {
      const players = [
        createPlayer({ id: 'p1', score: 200, correctAnswers: 2, questionsAnswered: 3 }),
        createPlayer({ id: 'p2', score: 200, correctAnswers: 2, questionsAnswered: 3 }),
        createPlayer({ id: 'p3', score: 100, correctAnswers: 1, questionsAnswered: 2 }),
      ];

      const rankings = calculateRankings(players);

      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].rank).toBe(1); // Tied at rank 1
      expect(rankings[2].rank).toBe(3); // Skips to 3
    });

    it('uses correctAnswers as secondary sort', () => {
      const players = [
        createPlayer({ id: 'p1', score: 200, correctAnswers: 3, questionsAnswered: 5 }),
        createPlayer({ id: 'p2', score: 200, correctAnswers: 4, questionsAnswered: 5 }),
      ];

      const rankings = calculateRankings(players);

      // p2 has more correct answers, should be ranked first
      expect(rankings[0].id).toBe('p2');
      expect(rankings[1].id).toBe('p1');
    });

    it('uses questionsAnswered as tertiary sort (efficiency)', () => {
      const players = [
        createPlayer({ id: 'p1', score: 200, correctAnswers: 4, questionsAnswered: 5 }),
        createPlayer({ id: 'p2', score: 200, correctAnswers: 4, questionsAnswered: 4 }),
      ];

      const rankings = calculateRankings(players);

      // p2 answered fewer questions for same score = more efficient
      expect(rankings[0].id).toBe('p2');
    });

    it('handles empty player list', () => {
      const rankings = calculateRankings([]);
      expect(rankings).toEqual([]);
    });

    it('handles single player', () => {
      const players = [createPlayer({ id: 'solo', score: 500 })];
      const rankings = calculateRankings(players);

      expect(rankings.length).toBe(1);
      expect(rankings[0].rank).toBe(1);
    });
  });

  describe('applyScoreEffects', () => {
    it('grants points with grant-points effect', () => {
      const player = createPlayer({ score: 100 });
      const effects: Effect[] = [{ type: 'grant-points', amount: 50 }];

      const updates = applyScoreEffects(effects, player);

      expect(updates.score).toBe(150);
    });

    it('removes points with remove-points effect', () => {
      const player = createPlayer({ score: 100 });
      const effects: Effect[] = [{ type: 'remove-points', amount: 30 }];

      const updates = applyScoreEffects(effects, player);

      expect(updates.score).toBe(70);
    });

    it('prevents negative score', () => {
      const player = createPlayer({ score: 50 });
      const effects: Effect[] = [{ type: 'remove-points', amount: 100 }];

      const updates = applyScoreEffects(effects, player);

      expect(updates.score).toBe(0);
    });

    it('multiplies points with multiply-points effect', () => {
      const player = createPlayer({ score: 100 });
      const effects: Effect[] = [{ type: 'multiply-points', amount: 2 }];

      const updates = applyScoreEffects(effects, player);

      expect(updates.score).toBe(200);
    });

    it('applies multiple effects in sequence', () => {
      const player = createPlayer({ score: 100 });
      const effects: Effect[] = [
        { type: 'grant-points', amount: 50 },
        { type: 'remove-points', amount: 20 },
      ];

      const updates = applyScoreEffects(effects, player);

      expect(updates.score).toBe(130); // 100 + 50 - 20
    });

    it('returns empty updates for no score effects', () => {
      const player = createPlayer({ score: 100 });
      const effects: Effect[] = [{ type: 'grant-currency', amount: 50 }];

      const updates = applyScoreEffects(effects, player);

      expect(updates.score).toBeUndefined();
    });

    it('handles missing amount in effect', () => {
      const player = createPlayer({ score: 100 });
      const effects: Effect[] = [{ type: 'grant-points' }];

      const updates = applyScoreEffects(effects, player);

      expect(updates.score).toBeUndefined(); // No change when amount is 0
    });
  });

  describe('getTopPlayers', () => {
    it('returns top N players by score', () => {
      const players = [
        createPlayer({ id: 'p1', score: 100 }),
        createPlayer({ id: 'p2', score: 500 }),
        createPlayer({ id: 'p3', score: 300 }),
        createPlayer({ id: 'p4', score: 200 }),
      ];

      const top2 = getTopPlayers(players, 2);

      expect(top2.length).toBe(2);
      expect(top2[0].id).toBe('p2');
      expect(top2[1].id).toBe('p3');
    });

    it('returns all players if N exceeds count', () => {
      const players = [
        createPlayer({ id: 'p1', score: 100 }),
        createPlayer({ id: 'p2', score: 200 }),
      ];

      const top10 = getTopPlayers(players, 10);

      expect(top10.length).toBe(2);
    });

    it('returns empty array for empty player list', () => {
      const top = getTopPlayers([], 5);
      expect(top).toEqual([]);
    });
  });

  describe('calculateAverageScore', () => {
    it('calculates average score correctly', () => {
      const players = [
        createPlayer({ score: 100 }),
        createPlayer({ score: 200 }),
        createPlayer({ score: 300 }),
      ];

      const avg = calculateAverageScore(players);

      expect(avg).toBe(200);
    });

    it('rounds to nearest integer', () => {
      const players = [
        createPlayer({ score: 100 }),
        createPlayer({ score: 101 }),
      ];

      const avg = calculateAverageScore(players);

      expect(avg).toBe(101); // 100.5 rounds to 101
    });

    it('returns 0 for empty player list', () => {
      const avg = calculateAverageScore([]);
      expect(avg).toBe(0);
    });
  });

  describe('getScoreDistribution', () => {
    it('groups scores into buckets', () => {
      const players = [
        createPlayer({ score: 50 }),
        createPlayer({ score: 75 }),
        createPlayer({ score: 150 }),
        createPlayer({ score: 250 }),
      ];

      const dist = getScoreDistribution(players, 100);

      expect(dist['0-99']).toBe(2);
      expect(dist['100-199']).toBe(1);
      expect(dist['200-299']).toBe(1);
    });

    it('handles custom bucket size', () => {
      const players = [
        createPlayer({ score: 25 }),
        createPlayer({ score: 75 }),
        createPlayer({ score: 125 }),
      ];

      const dist = getScoreDistribution(players, 50);

      expect(dist['0-49']).toBe(1);
      expect(dist['50-99']).toBe(1);
      expect(dist['100-149']).toBe(1);
    });

    it('returns empty object for empty player list', () => {
      const dist = getScoreDistribution([]);
      expect(dist).toEqual({});
    });
  });

  describe('hasReachedScoreThreshold', () => {
    it('returns true when score meets threshold', () => {
      const player = createPlayer({ score: 500 });
      expect(hasReachedScoreThreshold(player, 500)).toBe(true);
    });

    it('returns true when score exceeds threshold', () => {
      const player = createPlayer({ score: 600 });
      expect(hasReachedScoreThreshold(player, 500)).toBe(true);
    });

    it('returns false when score below threshold', () => {
      const player = createPlayer({ score: 400 });
      expect(hasReachedScoreThreshold(player, 500)).toBe(false);
    });
  });
});
