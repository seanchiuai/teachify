/**
 * GameRunner - Main game loop orchestrator
 *
 * Initializes game from GameSpecification, coordinates systems,
 * manages game phases, triggers questions, and checks victory conditions.
 */

import type { Id } from "@/convex/_generated/dataModel";
import type {
  GameSpecification,
  GameState,
  PlayerState,
  GamePhase,
  Question,
  Condition,
  Effect,
  GameEvent,
  PlayerAction,
} from "../types";
import { StateManager, type ConvexGameData, type ConvexPlayerData } from "./StateManager";
import { ActionProcessor, type ActionResult } from "./ActionProcessor";

export interface GameRunnerConfig {
  onPhaseChange?: (phase: GamePhase, prevPhase: GamePhase) => void;
  onQuestionTrigger?: (question: Question) => void;
  onEffectApplied?: (effect: Effect, playerId: string) => void;
  onVictory?: (winners: PlayerState[]) => void;
  onEvent?: (event: GameEvent) => void;
}

export interface GameRunnerContext {
  gameId: Id<"games">;
  stateManager: StateManager;
  actionProcessor: ActionProcessor;
  config: GameRunnerConfig;
}

/**
 * GameRunner class - orchestrates the game loop
 */
export class GameRunner {
  private gameId: Id<"games">;
  private stateManager: StateManager;
  private actionProcessor: ActionProcessor;
  private config: GameRunnerConfig;
  private questionTimer: ReturnType<typeof setTimeout> | null = null;
  private gameTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning: boolean = false;

  constructor(context: GameRunnerContext) {
    this.gameId = context.gameId;
    this.stateManager = context.stateManager;
    this.actionProcessor = context.actionProcessor;
    this.config = context.config;
  }

  /**
   * Initialize the game runner with Convex data
   */
  initialize(game: ConvexGameData, players: ConvexPlayerData[]): void {
    this.stateManager.initialize(game, players);
  }

  /**
   * Sync state from Convex subscription
   */
  sync(game: ConvexGameData, players: ConvexPlayerData[]): void {
    this.stateManager.syncFromConvex(game, players);
  }

  /**
   * Get current game state
   */
  getState(): GameState | null {
    return this.stateManager.getState();
  }

  /**
   * Get current game spec
   */
  getSpec(): GameSpecification | null {
    return this.stateManager.getSpec();
  }

  /**
   * Get all players
   */
  getPlayers(): Map<string, PlayerState> {
    return this.stateManager.getPlayers();
  }

  /**
   * Get specific player
   */
  getPlayer(playerId: string): PlayerState | undefined {
    return this.stateManager.getPlayer(playerId);
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(): PlayerState[] {
    return this.stateManager.getLeaderboard();
  }

  /**
   * Start the game (transition from lobby to active/countdown)
   */
  async start(): Promise<{ phase: GamePhase; updates: Partial<GameState> }> {
    const state = this.stateManager.getState();
    const spec = this.stateManager.getSpec();

    if (!state || !spec) {
      throw new Error("Game not initialized");
    }

    if (state.phase !== "lobby") {
      throw new Error("Game already started");
    }

    this.isRunning = true;

    // Emit phase change event
    const newPhase: GamePhase = "countdown";
    this.emitEvent({
      id: `evt-${Date.now()}-phase`,
      timestamp: Date.now(),
      type: "phase_change",
      payload: { from: "lobby", to: newPhase },
    });

    this.config.onPhaseChange?.(newPhase, "lobby");

    return {
      phase: newPhase,
      updates: {
        phase: newPhase,
        roundNumber: 1,
        turnNumber: 0,
        timeRemaining: spec.victory.duration,
      },
    };
  }

  /**
   * Transition to active gameplay after countdown
   */
  async beginActivePlay(): Promise<{ phase: GamePhase; updates: Partial<GameState> }> {
    const state = this.stateManager.getState();
    const spec = this.stateManager.getSpec();

    if (!state || !spec) {
      throw new Error("Game not initialized");
    }

    const prevPhase = state.phase;
    const newPhase: GamePhase = "active";

    this.emitEvent({
      id: `evt-${Date.now()}-phase`,
      timestamp: Date.now(),
      type: "phase_change",
      payload: { from: prevPhase, to: newPhase },
    });

    this.config.onPhaseChange?.(newPhase, prevPhase);

    // Start timers based on question integration
    this.startTimers();

    return {
      phase: newPhase,
      updates: {
        phase: newPhase,
      },
    };
  }

  /**
   * Trigger a question
   */
  async triggerQuestion(questionIndex?: number): Promise<{
    phase: GamePhase;
    question: Question;
    updates: Partial<GameState>;
  }> {
    const state = this.stateManager.getState();
    const spec = this.stateManager.getSpec();

    if (!state || !spec) {
      throw new Error("Game not initialized");
    }

    const prevPhase = state.phase;
    const newPhase: GamePhase = "question";

    // Determine which question to ask
    const nextIndex = questionIndex ?? state.currentQuestionIndex;
    if (nextIndex >= spec.questions.length) {
      // No more questions, end game
      return this.endGame() as Promise<{ phase: GamePhase; question: Question; updates: Partial<GameState> }>;
    }

    const question = spec.questions[nextIndex];

    this.emitEvent({
      id: `evt-${Date.now()}-question`,
      timestamp: Date.now(),
      type: "question_triggered",
      payload: { questionIndex: nextIndex, questionId: question.id },
    });

    this.config.onQuestionTrigger?.(question);
    this.config.onPhaseChange?.(newPhase, prevPhase);

    return {
      phase: newPhase,
      question,
      updates: {
        phase: newPhase,
        currentQuestionIndex: nextIndex,
        activeQuestion: question,
        questionStartTime: Date.now(),
      },
    };
  }

  /**
   * Show results after question
   */
  async showResults(): Promise<{ phase: GamePhase; updates: Partial<GameState> }> {
    const state = this.stateManager.getState();
    const spec = this.stateManager.getSpec();

    if (!state || !spec) {
      throw new Error("Game not initialized");
    }

    const prevPhase = state.phase;
    const newPhase: GamePhase = "results";

    this.emitEvent({
      id: `evt-${Date.now()}-results`,
      timestamp: Date.now(),
      type: "phase_change",
      payload: { from: prevPhase, to: newPhase },
    });

    this.config.onPhaseChange?.(newPhase, prevPhase);

    return {
      phase: newPhase,
      updates: {
        phase: newPhase,
      },
    };
  }

  /**
   * Move to next question or phase
   */
  async next(): Promise<{ phase: GamePhase; updates: Partial<GameState> }> {
    const state = this.stateManager.getState();
    const spec = this.stateManager.getSpec();

    if (!state || !spec) {
      throw new Error("Game not initialized");
    }

    const nextQuestionIndex = state.currentQuestionIndex + 1;

    // Check if more questions
    if (nextQuestionIndex >= spec.questions.length) {
      return this.endGame();
    }

    // Check victory conditions
    const victoryResult = this.checkVictoryConditions();
    if (victoryResult.isComplete) {
      this.config.onVictory?.(victoryResult.winners);
      return this.endGame();
    }

    // For timed question triggers, return to active
    if (spec.questionIntegration.trigger === "timed") {
      return this.beginActivePlay();
    }

    // Otherwise, trigger next question
    return this.triggerQuestion(nextQuestionIndex) as Promise<{ phase: GamePhase; updates: Partial<GameState> }>;
  }

  /**
   * Process a player action
   */
  processAction(action: PlayerAction): ActionResult {
    const result = this.actionProcessor.processAction(action);

    // Add events to state
    for (const event of result.events) {
      this.emitEvent(event);
    }

    // Apply effects
    for (const effect of result.effects) {
      const targetId = effect.target === "self" ? action.playerId : effect.target;
      if (targetId) {
        this.config.onEffectApplied?.(effect, targetId);
      }
    }

    // Check victory conditions after action
    if (result.success) {
      const victoryResult = this.checkVictoryConditions();
      if (victoryResult.isComplete) {
        this.config.onVictory?.(victoryResult.winners);
      }
    }

    return result;
  }

  /**
   * End the game
   */
  async endGame(): Promise<{ phase: GamePhase; updates: Partial<GameState> }> {
    this.isRunning = false;
    this.stopTimers();

    const state = this.stateManager.getState();
    const prevPhase = state?.phase || "active";
    const newPhase: GamePhase = "complete";

    // Determine winners
    const victoryResult = this.checkVictoryConditions();

    this.emitEvent({
      id: `evt-${Date.now()}-complete`,
      timestamp: Date.now(),
      type: "game_complete",
      payload: { winners: victoryResult.winners.map(w => w.id) },
    });

    this.config.onPhaseChange?.(newPhase, prevPhase);
    this.config.onVictory?.(victoryResult.winners);

    return {
      phase: newPhase,
      updates: {
        phase: newPhase,
      },
    };
  }

  /**
   * Pause the game
   */
  async pause(): Promise<{ phase: GamePhase; updates: Partial<GameState> }> {
    const state = this.stateManager.getState();
    const prevPhase = state?.phase || "active";

    this.stopTimers();

    return {
      phase: "paused",
      updates: {
        phase: "paused",
      },
    };
  }

  /**
   * Resume the game
   */
  async resume(): Promise<{ phase: GamePhase; updates: Partial<GameState> }> {
    const state = this.stateManager.getState();

    // Resume to active or question phase
    const resumePhase: GamePhase = state?.activeQuestion ? "question" : "active";

    this.startTimers();

    return {
      phase: resumePhase,
      updates: {
        phase: resumePhase,
      },
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: GameState, players: Map<string, PlayerState>) => void): () => void {
    return this.stateManager.subscribe(listener);
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Start game timers
   */
  private startTimers(): void {
    const spec = this.stateManager.getSpec();
    if (!spec) return;

    // Question timer for timed triggers
    if (spec.questionIntegration.trigger === "timed" && spec.questionIntegration.interval) {
      this.questionTimer = setInterval(() => {
        if (this.isRunning && this.stateManager.getState()?.phase === "active") {
          const state = this.stateManager.getState();
          if (state) {
            this.triggerQuestion(state.currentQuestionIndex);
          }
        }
      }, spec.questionIntegration.interval * 1000);
    }

    // Game duration timer
    if (spec.victory.duration) {
      this.gameTimer = setTimeout(() => {
        this.endGame();
      }, spec.victory.duration * 1000);
    }
  }

  /**
   * Stop all timers
   */
  private stopTimers(): void {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
  }

  /**
   * Check victory conditions
   */
  private checkVictoryConditions(): { isComplete: boolean; winners: PlayerState[] } {
    const spec = this.stateManager.getSpec();
    const state = this.stateManager.getState();
    const players = Array.from(this.stateManager.getPlayers().values());

    if (!spec || !state) {
      return { isComplete: false, winners: [] };
    }

    // Check each condition
    for (const condition of spec.victory.conditions) {
      const result = this.evaluateCondition(condition, players, state);
      if (result.met) {
        return { isComplete: true, winners: result.winners || [] };
      }
    }

    // Check victory type specific conditions
    switch (spec.victory.type) {
      case "score": {
        // Game continues until time/questions run out
        // Winner is highest score
        const sorted = [...players].sort((a, b) => b.score - a.score);
        return {
          isComplete: state.currentQuestionIndex >= spec.questions.length - 1,
          winners: sorted.slice(0, 1),
        };
      }

      case "elimination": {
        const activePlayers = players.filter(p => p.status === "active");
        if (activePlayers.length <= 1) {
          return { isComplete: true, winners: activePlayers };
        }
        break;
      }

      case "survival": {
        // Time-based survival, check time remaining
        if (state.timeRemaining !== undefined && state.timeRemaining <= 0) {
          const survivors = players.filter(p => p.status === "active");
          return { isComplete: true, winners: survivors };
        }
        break;
      }

      case "collective": {
        // Check if team objective met
        // Implementation depends on specific game
        break;
      }
    }

    return { isComplete: false, winners: [] };
  }

  /**
   * Evaluate a single victory condition
   */
  private evaluateCondition(
    condition: Condition,
    players: PlayerState[],
    state: GameState
  ): { met: boolean; winners?: PlayerState[] } {
    switch (condition.type) {
      case "score-threshold": {
        const winners = players.filter(p => p.score >= (condition.threshold || 0));
        return { met: winners.length > 0, winners };
      }

      case "elimination-count": {
        const eliminated = players.filter(p => p.status === "eliminated");
        const threshold = condition.threshold || players.length - 1;
        const met = eliminated.length >= threshold;
        const winners = met ? players.filter(p => p.status === "active") : [];
        return { met, winners };
      }

      case "zone-control": {
        const targetZone = condition.target;
        if (!targetZone) return { met: false };

        const zone = state.worldState.zones[targetZone];
        if (!zone?.controlledBy) return { met: false };

        const controller = players.find(p => p.id === zone.controlledBy);
        return { met: true, winners: controller ? [controller] : [] };
      }

      case "resource-amount": {
        const resource = condition.target;
        const threshold = condition.threshold || 0;
        const comparison = condition.comparison || "gte";

        const winners = players.filter(p => {
          const amount = p.resources[resource || ""] || 0;
          switch (comparison) {
            case "gte": return amount >= threshold;
            case "lte": return amount <= threshold;
            case "eq": return amount === threshold;
            default: return false;
          }
        });

        return { met: winners.length > 0, winners };
      }

      case "questions-answered": {
        const threshold = condition.threshold || 0;
        const winners = players.filter(p => p.questionsAnswered >= threshold);
        return { met: winners.length > 0, winners };
      }

      default:
        return { met: false };
    }
  }

  /**
   * Emit a game event
   */
  private emitEvent(event: GameEvent): void {
    this.stateManager.addEvent(event);
    this.config.onEvent?.(event);
  }
}

/**
 * Create a GameRunner instance
 */
export function createGameRunner(
  gameId: Id<"games">,
  config: GameRunnerConfig = {}
): GameRunner {
  const stateManager = new StateManager(gameId);
  const actionProcessor = new ActionProcessor(stateManager);

  return new GameRunner({
    gameId,
    stateManager,
    actionProcessor,
    config,
  });
}
