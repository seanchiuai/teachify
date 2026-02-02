/**
 * LessonPlay Composable Game Engine
 *
 * Entry point for the game engine that powers AI-generated educational games.
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core types
  Genre,
  GamePhase,
  QuestionTrigger,
  QuestionDisplayStyle,
  VictoryType,
  WorldType,
  ThemeStyle,
  ThemeMood,
  AvatarStyle,
  EffectType,
  ActionType,
  PlayerStatus,
  QuestionType,

  // Configuration types
  ThemeConfig,
  WorldFeature,
  WorldConfig,
  ZoneConfig,
  Position,
  AbilityConfig,
  ResourceSet,
  PlayerConfig,
  EconomyConfig,
  ShopItem,
  CombatConfig,
  MovementConfig,
  ResourceConfig,
  CraftingRecipe,
  SocialConfig,
  RoleConfig,
  FactionConfig,
  TimerConfig,
  Effect,
  Condition,
  VictoryConfig,
  Question,
  QuestionIntegration,
  GameSpecification,

  // Runtime state types
  PlayerState,
  WorldState,
  ZoneState,
  ResourceSpawnState,
  EntityState,
  ActiveEffect,
  GameState,

  // Event types
  GameEvent,
  ActionEvent,
  QuestionEvent,
  PhaseEvent,

  // Action types
  PlayerAction,
  ActionPayload,
  MovePayload,
  AttackPayload,
  TradePayload,
  UseItemPayload,
  VotePayload,
  AnswerPayload,
  AbilityPayload,

  // Context types
  GameContext,
  SystemContext,
  TeacherHints,
} from "./types";

// =============================================================================
// CORE ENGINE EXPORTS
// =============================================================================

export {
  StateManager,
  createStateManager,
  convexToGameState,
  convexToPlayerState,
  createDefaultWorldState,
  initializePlayerState,
  type ConvexGameData,
  type ConvexPlayerData,
} from "./core/StateManager";

export {
  ActionProcessor,
  createActionProcessor,
  type ActionResult,
  type ActionContext,
} from "./core/ActionProcessor";

export {
  GameRunner,
  createGameRunner,
  type GameRunnerConfig,
  type GameRunnerContext,
} from "./core/GameRunner";

// =============================================================================
// SYSTEM EXPORTS
// =============================================================================

export {
  calculateScore,
  applyScoreEffects,
  calculateRankings,
  getScoreConfig,
  hasReachedScoreThreshold,
  getTopPlayers,
  calculateAverageScore,
  getScoreDistribution,
  type ScoreConfig,
  type ScoreResult,
} from "./systems/ScoringSystem";

export {
  hasResources,
  addResources,
  removeResources,
  earnResources,
  purchaseItem,
  processTrade,
  processSteal,
  applyEconomyEffects,
  calculateTotalWealth,
  getRichestPlayer,
  type TransactionResult,
  type TradeOffer,
} from "./systems/EconomySystem";

export {
  applyDamage,
  applyHeal,
  applyShield,
  processAttack,
  applyIncorrectDamage,
  applyCorrectHeal,
  respawnPlayer,
  applyCombatEffects,
  isAlive,
  getAlivePlayers,
  getEliminatedPlayers,
  checkLastPlayerStanding,
  getPlayerWithMostEliminations,
  type DamageResult,
  type HealResult,
} from "./systems/CombatSystem";

export {
  isInBounds,
  isBlocked,
  calculateDistance,
  validateMove,
  getZoneAtPosition,
  processMove,
  processMoveToZone,
  addZoneInfluence,
  updateZoneOnEnter,
  updateZoneOnLeave,
  applyMovementEffects,
  getPlayersInZone,
  getControlledZones,
  countControlledZones,
  controlsMajorityZones,
  getAdjacentPositions,
  getValidMoves,
  type MoveResult,
  type ZoneCaptureResult,
} from "./systems/MovementSystem";

export {
  initializeTimers,
  tickTimers,
  startTurn,
  startQuestion,
  startRound,
  startWave,
  pauseTimers,
  resumeTimers,
  resetTurnTimer,
  resetQuestionTimer,
  addBonusTime,
  formatTime,
  formatTimeWithMs,
  isTimeLow,
  isTimeCritical,
  getTimePercentage,
  getElapsedTime,
  shouldTriggerWave,
  hasReachedMaxRounds,
  type TimerState,
  type TimerTick,
  type TimerEvent,
} from "./systems/TimerSystem";

// =============================================================================
// QUESTION SYSTEM EXPORTS
// =============================================================================

export {
  QuestionManager,
  createQuestionManager,
  applyQuestionEffects,
  type QuestionDelivery,
  type AnswerResult,
} from "./questions/QuestionManager";

// =============================================================================
// RENDERING EXPORTS
// =============================================================================

export { GameCanvas, type GameCanvasProps } from "./rendering/GameCanvas";
export { WorldRenderer, type WorldRendererProps } from "./rendering/WorldRenderer";
export { EntityRenderer, type EntityRendererProps } from "./rendering/EntityRenderer";
export { HUDRenderer, type HUDRendererProps } from "./rendering/HUDRenderer";
export { EffectsRenderer, type EffectsRendererProps } from "./rendering/EffectsRenderer";

// =============================================================================
// HOOKS
// =============================================================================

import { useEffect, useState, useCallback, useRef } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type { GameSpecification, GameState, PlayerState, PlayerAction } from "./types";
import { GameRunner, createGameRunner } from "./core/GameRunner";
import type { ConvexGameData, ConvexPlayerData } from "./core/StateManager";

/**
 * React hook for using the game engine
 */
export function useGameEngine(
  gameId: Id<"games"> | null,
  game: ConvexGameData | null | undefined,
  players: ConvexPlayerData[] | undefined,
  currentPlayerId?: string
) {
  const runnerRef = useRef<GameRunner | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [playerMap, setPlayerMap] = useState<Map<string, PlayerState>>(new Map());

  // Initialize runner when gameId changes
  useEffect(() => {
    if (!gameId) {
      runnerRef.current = null;
      return;
    }

    runnerRef.current = createGameRunner(gameId, {
      onPhaseChange: (phase, prev) => {
        console.log(`Phase changed: ${prev} -> ${phase}`);
      },
      onEvent: (event) => {
        console.log("Game event:", event);
      },
    });

    // Subscribe to state changes
    const unsubscribe = runnerRef.current.subscribe((newState, newPlayers) => {
      setState(newState);
      setPlayerMap(new Map(newPlayers));
    });

    return () => {
      unsubscribe();
    };
  }, [gameId]);

  // Sync with Convex data
  useEffect(() => {
    if (runnerRef.current && game && players) {
      runnerRef.current.sync(game, players);
    }
  }, [game, players]);

  // Action handler
  const submitAction = useCallback((action: Omit<PlayerAction, "playerId" | "timestamp">) => {
    if (!runnerRef.current || !currentPlayerId) return null;

    const fullAction: PlayerAction = {
      ...action,
      playerId: currentPlayerId,
      timestamp: Date.now(),
    };

    return runnerRef.current.processAction(fullAction);
  }, [currentPlayerId]);

  // Get current player
  const currentPlayer = currentPlayerId ? playerMap.get(currentPlayerId) : undefined;

  // Get spec
  const spec = runnerRef.current?.getSpec() || null;

  return {
    runner: runnerRef.current,
    spec,
    state,
    players: playerMap,
    currentPlayer,
    submitAction,
    leaderboard: runnerRef.current?.getLeaderboard() || [],
    isEngineGame: game?.engineMode || false,
  };
}

/**
 * Check if a game uses the new engine
 */
export function isEngineGame(game: ConvexGameData | null | undefined): boolean {
  return game?.engineMode === true && game?.gameSpec != null;
}
