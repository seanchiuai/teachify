/**
 * TimerSystem - Game timers, rounds, waves, countdowns
 */

import type {
  TimerConfig,
  GameState,
} from "../types";

export interface TimerState {
  gameTimeRemaining: number | null;
  turnTimeRemaining: number | null;
  questionTimeRemaining: number | null;
  roundTimeRemaining: number | null;
  currentRound: number;
  currentWave: number;
  isPaused: boolean;
}

export interface TimerTick {
  gameTimeRemaining?: number;
  turnTimeRemaining?: number;
  questionTimeRemaining?: number;
  roundTimeRemaining?: number;
  events: TimerEvent[];
}

export type TimerEvent =
  | { type: "game_time_up" }
  | { type: "turn_time_up" }
  | { type: "question_time_up" }
  | { type: "round_end"; round: number }
  | { type: "wave_start"; wave: number };

/**
 * Initialize timer state from config
 */
export function initializeTimers(config: TimerConfig): TimerState {
  return {
    gameTimeRemaining: config.gameDuration || null,
    turnTimeRemaining: config.turnDuration || null,
    questionTimeRemaining: config.questionDuration || null,
    roundTimeRemaining: config.roundDuration || null,
    currentRound: 1,
    currentWave: 1,
    isPaused: false,
  };
}

/**
 * Process a single tick (1 second) of all timers
 */
export function tickTimers(
  state: TimerState,
  config: TimerConfig,
  deltaMs: number = 1000
): TimerTick {
  if (state.isPaused) {
    return { events: [] };
  }

  const deltaSec = deltaMs / 1000;
  const events: TimerEvent[] = [];
  const result: TimerTick = { events };

  // Game timer
  if (state.gameTimeRemaining !== null) {
    const newTime = Math.max(0, state.gameTimeRemaining - deltaSec);
    result.gameTimeRemaining = newTime;
    if (newTime <= 0 && state.gameTimeRemaining > 0) {
      events.push({ type: "game_time_up" });
    }
  }

  // Turn timer
  if (state.turnTimeRemaining !== null) {
    const newTime = Math.max(0, state.turnTimeRemaining - deltaSec);
    result.turnTimeRemaining = newTime;
    if (newTime <= 0 && state.turnTimeRemaining > 0) {
      events.push({ type: "turn_time_up" });
    }
  }

  // Question timer
  if (state.questionTimeRemaining !== null) {
    const newTime = Math.max(0, state.questionTimeRemaining - deltaSec);
    result.questionTimeRemaining = newTime;
    if (newTime <= 0 && state.questionTimeRemaining > 0) {
      events.push({ type: "question_time_up" });
    }
  }

  // Round timer
  if (state.roundTimeRemaining !== null) {
    const newTime = Math.max(0, state.roundTimeRemaining - deltaSec);
    result.roundTimeRemaining = newTime;
    if (newTime <= 0 && state.roundTimeRemaining > 0) {
      events.push({ type: "round_end", round: state.currentRound });
    }
  }

  return result;
}

/**
 * Start a new turn
 */
export function startTurn(
  state: TimerState,
  config: TimerConfig
): TimerState {
  return {
    ...state,
    turnTimeRemaining: config.turnDuration || null,
  };
}

/**
 * Start a new question
 */
export function startQuestion(
  state: TimerState,
  config: TimerConfig,
  customDuration?: number
): TimerState {
  return {
    ...state,
    questionTimeRemaining: customDuration || config.questionDuration || 30,
  };
}

/**
 * Start a new round
 */
export function startRound(
  state: TimerState,
  config: TimerConfig,
  roundNumber: number
): TimerState {
  return {
    ...state,
    currentRound: roundNumber,
    roundTimeRemaining: config.roundDuration || null,
  };
}

/**
 * Start a new wave
 */
export function startWave(
  state: TimerState,
  waveNumber: number
): TimerState {
  return {
    ...state,
    currentWave: waveNumber,
  };
}

/**
 * Pause all timers
 */
export function pauseTimers(state: TimerState): TimerState {
  return {
    ...state,
    isPaused: true,
  };
}

/**
 * Resume all timers
 */
export function resumeTimers(state: TimerState): TimerState {
  return {
    ...state,
    isPaused: false,
  };
}

/**
 * Reset turn timer
 */
export function resetTurnTimer(
  state: TimerState,
  config: TimerConfig
): TimerState {
  return {
    ...state,
    turnTimeRemaining: config.turnDuration || null,
  };
}

/**
 * Reset question timer
 */
export function resetQuestionTimer(
  state: TimerState,
  config: TimerConfig,
  customDuration?: number
): TimerState {
  return {
    ...state,
    questionTimeRemaining: customDuration || config.questionDuration || 30,
  };
}

/**
 * Add bonus time to game timer
 */
export function addBonusTime(
  state: TimerState,
  bonusSeconds: number
): TimerState {
  if (state.gameTimeRemaining === null) return state;

  return {
    ...state,
    gameTimeRemaining: state.gameTimeRemaining + bonusSeconds,
  };
}

/**
 * Get formatted time string (MM:SS)
 */
export function formatTime(seconds: number | null): string {
  if (seconds === null) return "--:--";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get formatted time with milliseconds (MM:SS.mmm)
 */
export function formatTimeWithMs(milliseconds: number): string {
  const totalSeconds = milliseconds / 1000;
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const ms = Math.floor((milliseconds % 1000) / 10);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

/**
 * Check if time is running low (for UI warnings)
 */
export function isTimeLow(
  seconds: number | null,
  threshold: number = 10
): boolean {
  return seconds !== null && seconds <= threshold && seconds > 0;
}

/**
 * Check if time is critical (for UI urgency)
 */
export function isTimeCritical(
  seconds: number | null,
  threshold: number = 5
): boolean {
  return seconds !== null && seconds <= threshold && seconds > 0;
}

/**
 * Calculate time percentage remaining
 */
export function getTimePercentage(
  remaining: number | null,
  total: number | null
): number {
  if (remaining === null || total === null || total === 0) return 100;
  return Math.max(0, Math.min(100, (remaining / total) * 100));
}

/**
 * Get elapsed time from start timestamp
 */
export function getElapsedTime(startTimestamp: number): number {
  return Date.now() - startTimestamp;
}

/**
 * Check if should trigger next wave
 */
export function shouldTriggerWave(
  state: TimerState,
  config: TimerConfig
): boolean {
  if (!config.waveInterval) return false;

  const elapsedRounds = state.currentRound - 1;
  return elapsedRounds > 0 && elapsedRounds % Math.ceil(config.waveInterval) === 0;
}

/**
 * Check if game should end due to rounds
 */
export function hasReachedMaxRounds(
  state: TimerState,
  config: TimerConfig
): boolean {
  if (!config.totalRounds) return false;
  return state.currentRound > config.totalRounds;
}
