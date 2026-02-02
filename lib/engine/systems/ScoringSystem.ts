/**
 * ScoringSystem - Handles points, streaks, and rankings
 */

import type {
  GameSpecification,
  PlayerState,
  Effect,
} from "../types";

export interface ScoreConfig {
  basePoints: number;
  timeBonus: number;
  streakMultiplier: number;
  maxStreak: number;
}

export interface ScoreResult {
  points: number;
  streak: number;
  breakdown: {
    base: number;
    time: number;
    streak: number;
    total: number;
  };
}

/**
 * Calculate score for a correct answer
 */
export function calculateScore(
  config: ScoreConfig,
  timeMs: number,
  timeLimitMs: number,
  currentStreak: number,
  isCorrect: boolean
): ScoreResult {
  if (!isCorrect) {
    return {
      points: 0,
      streak: 0,
      breakdown: { base: 0, time: 0, streak: 0, total: 0 },
    };
  }

  // Base points
  const base = config.basePoints;

  // Time bonus (faster = more points)
  const timeFraction = Math.max(0, 1 - timeMs / timeLimitMs);
  const time = Math.floor(config.timeBonus * timeFraction);

  // New streak
  const newStreak = currentStreak + 1;
  const cappedStreak = Math.min(newStreak, config.maxStreak);

  // Streak bonus (multiplier on base + time)
  const streakBonus = cappedStreak * config.streakMultiplier;
  const subtotal = base + time;
  const streak = Math.floor(subtotal * streakBonus);

  const total = subtotal + streak;

  return {
    points: total,
    streak: newStreak,
    breakdown: { base, time, streak, total },
  };
}

/**
 * Apply scoring effects from game spec
 */
export function applyScoreEffects(
  effects: Effect[],
  player: PlayerState
): Partial<PlayerState> {
  const updates: Partial<PlayerState> = {};
  let scoreChange = 0;

  for (const effect of effects) {
    switch (effect.type) {
      case "grant-points":
        scoreChange += effect.amount || 0;
        break;
      case "remove-points":
        scoreChange -= effect.amount || 0;
        break;
      case "multiply-points":
        scoreChange = Math.floor(player.score * (effect.amount || 1)) - player.score;
        break;
    }
  }

  if (scoreChange !== 0) {
    updates.score = Math.max(0, player.score + scoreChange);
  }

  return updates;
}

/**
 * Calculate rankings from player list
 */
export function calculateRankings(players: PlayerState[]): Array<PlayerState & { rank: number }> {
  const sorted = [...players].sort((a, b) => {
    // Primary: score descending
    if (b.score !== a.score) return b.score - a.score;
    // Secondary: correct answers descending
    if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
    // Tertiary: questions answered ascending (efficiency)
    return a.questionsAnswered - b.questionsAnswered;
  });

  let currentRank = 1;
  let previousScore = -1;

  return sorted.map((player, index) => {
    if (player.score !== previousScore) {
      currentRank = index + 1;
      previousScore = player.score;
    }
    return { ...player, rank: currentRank };
  });
}

/**
 * Get score configuration from game spec
 */
export function getScoreConfig(spec: GameSpecification): ScoreConfig {
  return {
    basePoints: spec.scoring.basePoints,
    timeBonus: spec.scoring.timeBonus,
    streakMultiplier: spec.scoring.streakMultiplier,
    maxStreak: spec.scoring.maxStreak,
  };
}

/**
 * Check if player has achieved score threshold
 */
export function hasReachedScoreThreshold(
  player: PlayerState,
  threshold: number
): boolean {
  return player.score >= threshold;
}

/**
 * Get top N players by score
 */
export function getTopPlayers(players: PlayerState[], n: number): PlayerState[] {
  return [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/**
 * Calculate average score
 */
export function calculateAverageScore(players: PlayerState[]): number {
  if (players.length === 0) return 0;
  const total = players.reduce((sum, p) => sum + p.score, 0);
  return Math.round(total / players.length);
}

/**
 * Get score distribution (for analytics)
 */
export function getScoreDistribution(
  players: PlayerState[],
  bucketSize: number = 100
): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const player of players) {
    const bucket = Math.floor(player.score / bucketSize) * bucketSize;
    const key = `${bucket}-${bucket + bucketSize - 1}`;
    distribution[key] = (distribution[key] || 0) + 1;
  }

  return distribution;
}
