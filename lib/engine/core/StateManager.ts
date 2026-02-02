/**
 * StateManager - Handles Convex real-time state synchronization
 *
 * Provides methods to read/write game state, world state, player state
 * with optimistic updates for responsive gameplay.
 */

import type { Id } from "@/convex/_generated/dataModel";
import type {
  GameSpecification,
  GameState,
  PlayerState,
  WorldState,
  GamePhase,
  ResourceSet,
  Position,
  ZoneState,
  PlayerStatus,
  GameEvent,
} from "../types";

// Types for Convex data
export interface ConvexGameData {
  _id: Id<"games">;
  code: string;
  topic: string;
  objective: string;
  objectiveType: string;
  content: string;
  questions: Array<{
    type: string;
    question: string;
    options: string[];
    correct: string | string[];
    explanation: string;
    misconception: string;
    id?: string;
    difficulty?: number;
    points?: number;
    timeLimit?: number;
    tags?: string[];
  }>;
  gameSpec?: GameSpecification;
  state?: string;
  phase?: GamePhase;
  currentQuestion: number;
  worldState?: WorldState;
  roundNumber?: number;
  turnNumber?: number;
  currentPlayerTurn?: Id<"players">;
  timeRemaining?: number;
  questionStartTime?: number;
  engineMode?: boolean;
}

export interface ConvexPlayerData {
  _id: Id<"players">;
  gameId: Id<"games">;
  name: string;
  score: number;
  position?: Position;
  resources?: ResourceSet;
  health?: number;
  maxHealth?: number;
  shield?: number;
  inventory?: string[];
  status?: PlayerStatus;
  role?: string;
  faction?: string;
  votes?: Record<string, string>;
  streak?: number;
  abilityCooldowns?: Record<string, number>;
  questionsAnswered?: number;
  correctAnswers?: number;
  lastAction?: string;
  lastActionTime?: number;
}

/**
 * Convert Convex game data to engine GameState
 */
export function convexToGameState(game: ConvexGameData): GameState {
  const spec = game.gameSpec;

  return {
    phase: game.phase || (game.state as GamePhase) || "lobby",
    roundNumber: game.roundNumber || 0,
    turnNumber: game.turnNumber || 0,
    currentPlayerTurn: game.currentPlayerTurn,
    timeRemaining: game.timeRemaining,
    currentQuestionIndex: game.currentQuestion,
    activeQuestion: game.currentQuestion >= 0 && game.currentQuestion < game.questions.length
      ? { ...game.questions[game.currentQuestion], id: game.questions[game.currentQuestion].id || `q-${game.currentQuestion}` } as GameState["activeQuestion"]
      : undefined,
    questionStartTime: game.questionStartTime,
    worldState: game.worldState || createDefaultWorldState(spec),
    events: [],
  };
}

/**
 * Convert Convex player data to engine PlayerState
 */
export function convexToPlayerState(player: ConvexPlayerData): PlayerState {
  return {
    id: player._id,
    name: player.name,
    position: player.position,
    resources: player.resources || {},
    health: player.health,
    shield: player.shield,
    status: player.status || "active",
    score: player.score,
    streak: player.streak || 0,
    role: player.role,
    faction: player.faction,
    inventory: player.inventory || [],
    abilityCooldowns: player.abilityCooldowns || {},
    questionsAnswered: player.questionsAnswered || 0,
    correctAnswers: player.correctAnswers || 0,
    votes: player.votes,
    lastAction: player.lastAction as PlayerState["lastAction"],
    lastActionTime: player.lastActionTime,
  };
}

/**
 * Create default world state from game specification
 */
export function createDefaultWorldState(spec?: GameSpecification): WorldState {
  if (!spec) {
    return {
      zones: {},
      resources: [],
      entities: [],
      effects: [],
    };
  }

  const zones: Record<string, ZoneState> = {};

  // Initialize zones from world config
  if (spec.world?.zones) {
    for (const zone of spec.world.zones) {
      zones[zone.id] = {
        id: zone.id,
        controlledBy: zone.controlledBy,
        influence: {},
        playersInZone: [],
      };
    }
  }

  return {
    zones,
    resources: [],
    entities: [],
    effects: [],
  };
}

/**
 * Initialize player state from game specification
 */
export function initializePlayerState(
  playerId: string,
  playerName: string,
  spec: GameSpecification,
  playerIndex: number
): Partial<ConvexPlayerData> {
  const playerConfig = spec.players;

  // Determine starting position
  let position: Position | undefined;
  if (playerConfig.startingPosition === "random") {
    position = {
      x: Math.floor(Math.random() * spec.world.size.width),
      y: Math.floor(Math.random() * spec.world.size.height),
    };
  } else if (playerConfig.startingPosition === "spawn") {
    const spawns = spec.world.features.filter(f => f.type === "spawn");
    if (spawns.length > 0) {
      const spawn = spawns[playerIndex % spawns.length];
      position = spawn.position;
    }
  } else if (playerConfig.startingPosition) {
    position = playerConfig.startingPosition;
  }

  // Determine starting health
  let health: number | undefined;
  let maxHealth: number | undefined;
  if (spec.mechanics.combat) {
    health = spec.mechanics.combat.startingHealth;
    maxHealth = spec.mechanics.combat.maxHealth;
  } else if (playerConfig.startingHealth) {
    health = playerConfig.startingHealth;
    maxHealth = playerConfig.maxHealth || playerConfig.startingHealth;
  }

  // Determine starting resources
  let resources: ResourceSet = { ...playerConfig.startingResources };
  if (spec.mechanics.economy) {
    resources = { ...resources, ...spec.mechanics.economy.startingAmounts };
  }

  // Determine faction
  let faction: string | undefined;
  if (spec.mechanics.social?.factions) {
    const factions = spec.mechanics.social.factions;
    faction = factions[playerIndex % factions.length].id;
  }

  return {
    position,
    resources,
    health,
    maxHealth,
    shield: 0,
    inventory: [],
    status: "active",
    streak: 0,
    faction,
    abilityCooldowns: {},
    questionsAnswered: 0,
    correctAnswers: 0,
  };
}

/**
 * StateManager class for managing game state
 */
export class StateManager {
  private gameId: Id<"games">;
  private spec: GameSpecification | null = null;
  private localState: GameState | null = null;
  private localPlayers: Map<string, PlayerState> = new Map();
  private pendingUpdates: Array<{
    type: "game" | "player" | "world";
    data: unknown;
    timestamp: number;
  }> = [];
  private listeners: Set<(state: GameState, players: Map<string, PlayerState>) => void> = new Set();

  constructor(gameId: Id<"games">) {
    this.gameId = gameId;
  }

  /**
   * Initialize state manager with game specification
   */
  initialize(game: ConvexGameData, players: ConvexPlayerData[]): void {
    this.spec = game.gameSpec || null;
    this.localState = convexToGameState(game);
    this.localPlayers.clear();

    for (const player of players) {
      this.localPlayers.set(player._id, convexToPlayerState(player));
    }
  }

  /**
   * Get current game specification
   */
  getSpec(): GameSpecification | null {
    return this.spec;
  }

  /**
   * Get current game state
   */
  getState(): GameState | null {
    return this.localState;
  }

  /**
   * Get all players
   */
  getPlayers(): Map<string, PlayerState> {
    return this.localPlayers;
  }

  /**
   * Get specific player
   */
  getPlayer(playerId: string): PlayerState | undefined {
    return this.localPlayers.get(playerId);
  }

  /**
   * Update game state from Convex (called on subscription update)
   */
  syncFromConvex(game: ConvexGameData, players: ConvexPlayerData[]): void {
    // Remove stale pending updates (older than 2 seconds)
    const now = Date.now();
    this.pendingUpdates = this.pendingUpdates.filter(u => now - u.timestamp < 2000);

    // Update local state
    this.spec = game.gameSpec || null;
    this.localState = convexToGameState(game);
    this.localPlayers.clear();

    for (const player of players) {
      this.localPlayers.set(player._id, convexToPlayerState(player));
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Apply optimistic update locally (before Convex confirms)
   */
  applyOptimisticUpdate(
    type: "game" | "player" | "world",
    update: Partial<GameState> | { playerId: string; update: Partial<PlayerState> } | Partial<WorldState>
  ): void {
    this.pendingUpdates.push({
      type,
      data: update,
      timestamp: Date.now(),
    });

    if (type === "game" && this.localState) {
      this.localState = { ...this.localState, ...(update as Partial<GameState>) };
    } else if (type === "player") {
      const playerUpdate = update as { playerId: string; update: Partial<PlayerState> };
      const player = this.localPlayers.get(playerUpdate.playerId);
      if (player) {
        this.localPlayers.set(playerUpdate.playerId, { ...player, ...playerUpdate.update });
      }
    } else if (type === "world" && this.localState) {
      this.localState.worldState = { ...this.localState.worldState, ...(update as Partial<WorldState>) };
    }

    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: GameState, players: Map<string, PlayerState>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    if (!this.localState) return;
    this.listeners.forEach(listener => {
      listener(this.localState!, this.localPlayers);
    });
  }

  /**
   * Get player by position (for spatial queries)
   */
  getPlayerAtPosition(position: Position): PlayerState | undefined {
    for (const player of this.localPlayers.values()) {
      if (player.position &&
          player.position.x === position.x &&
          player.position.y === position.y) {
        return player;
      }
    }
    return undefined;
  }

  /**
   * Get players in zone
   */
  getPlayersInZone(zoneId: string): PlayerState[] {
    if (!this.localState?.worldState?.zones?.[zoneId]) return [];

    const playerIds = this.localState.worldState.zones[zoneId].playersInZone;
    return playerIds
      .map(id => this.localPlayers.get(id))
      .filter((p): p is PlayerState => p !== undefined);
  }

  /**
   * Get zone state
   */
  getZoneState(zoneId: string): ZoneState | undefined {
    return this.localState?.worldState?.zones?.[zoneId];
  }

  /**
   * Check if game is in active phase
   */
  isActive(): boolean {
    return this.localState?.phase === "active" || this.localState?.phase === "question";
  }

  /**
   * Get active players (not eliminated)
   */
  getActivePlayers(): PlayerState[] {
    return Array.from(this.localPlayers.values()).filter(
      p => p.status === "active" || p.status === "shielded"
    );
  }

  /**
   * Get leaderboard (sorted by score)
   */
  getLeaderboard(): PlayerState[] {
    return Array.from(this.localPlayers.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Add event to local state
   */
  addEvent(event: GameEvent): void {
    if (this.localState) {
      this.localState.events.push(event);
      this.notifyListeners();
    }
  }
}

/**
 * Create a new StateManager instance
 */
export function createStateManager(gameId: Id<"games">): StateManager {
  return new StateManager(gameId);
}
