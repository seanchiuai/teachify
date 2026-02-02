// Game Engine Type Definitions
// Composable game engine for AI-generated educational games

// =============================================================================
// ENUMS & LITERALS
// =============================================================================

export type Genre =
  | "economic"    // Currency, trading, resource management
  | "combat"      // Health, damage, elimination
  | "spatial"     // Movement, territory, zones
  | "social"      // Voting, roles, alliances
  | "racing"      // Speed, first-to-finish
  | "puzzle";     // Logic, pattern matching

export type GamePhase =
  | "lobby"       // Waiting for players
  | "countdown"   // Starting soon
  | "active"      // Game in progress
  | "paused"      // Temporarily stopped
  | "question"    // Question being displayed
  | "results"     // Showing answer results
  | "complete";   // Game finished

export type QuestionTrigger =
  | "timed"       // Questions appear on timer
  | "action"      // Questions triggered by player actions
  | "zone"        // Questions triggered by entering zones
  | "combat"      // Questions triggered in combat
  | "turn";       // Questions at start/end of turns

export type QuestionDisplayStyle =
  | "modal"       // Full-screen overlay
  | "inline"      // Embedded in game UI
  | "challenge";  // Dramatic challenge presentation

export type VictoryType =
  | "score"       // Highest score wins
  | "elimination" // Last player standing
  | "objective"   // First to complete objective
  | "survival"    // Survive longest
  | "collective"; // Team/collaborative win

export type WorldType =
  | "grid"        // Square grid
  | "hex"         // Hexagonal grid
  | "zones"       // Named areas
  | "track"       // Linear path
  | "freeform";   // Free movement

export type ThemeStyle =
  | "pirate"
  | "space"
  | "jungle"
  | "medieval"
  | "cyber"
  | "underwater"
  | "desert"
  | "arctic"
  | "volcanic"
  | "fantasy"
  | "steampunk"
  | "prehistoric"
  | "microscopic"
  | "urban"
  | "revolutionary"
  | "ancient"
  | "futuristic"
  | "magical"
  | "industrial"
  | "academic";

export type ThemeMood =
  | "competitive"
  | "cooperative"
  | "mysterious"
  | "frantic"
  | "strategic"
  | "playful"
  | "intense"
  | "relaxed";

export type AvatarStyle =
  | "emoji"
  | "character"
  | "icon"
  | "initials";

export type EffectType =
  | "grant-currency"
  | "remove-currency"
  | "grant-resource"
  | "remove-resource"
  | "deal-damage"
  | "heal"
  | "grant-shield"
  | "grant-movement"
  | "capture-influence"
  | "reveal-info"
  | "charge-ability"
  | "grant-points"
  | "remove-points"
  | "multiply-points"
  | "skip-turn"
  | "extra-turn"
  | "teleport"
  | "freeze"
  | "boost-speed";

export type ActionType =
  | "move"
  | "attack"
  | "defend"
  | "trade"
  | "steal"
  | "use-item"
  | "craft"
  | "gather"
  | "vote"
  | "accuse"
  | "ally"
  | "betray"
  | "answer-question"
  | "use-ability"
  | "skip";

export type PlayerStatus =
  | "active"
  | "eliminated"
  | "winner"
  | "frozen"
  | "shielded";

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface ThemeConfig {
  style: ThemeStyle;
  primaryColor: string;    // Hex color
  accentColor: string;     // Hex color
  backgroundColor: string; // Hex color
  mood: ThemeMood;
}

export interface WorldFeature {
  id: string;
  type: "obstacle" | "spawn" | "goal" | "resource" | "hazard" | "portal" | "shop";
  position: Position;
  size?: { width: number; height: number };
  properties?: Record<string, unknown>;
}

export interface WorldConfig {
  type: WorldType;
  size: { width: number; height: number };
  features: WorldFeature[];
  zones?: ZoneConfig[];
}

export interface ZoneConfig {
  id: string;
  name: string;
  position: Position;
  size: { width: number; height: number };
  color?: string;
  controlledBy?: string;  // Player ID or faction
  capturePoints?: number; // Points needed to capture
}

export interface Position {
  x: number;
  y: number;
}

// =============================================================================
// PLAYER CONFIGURATION
// =============================================================================

export interface AbilityConfig {
  id: string;
  name: string;
  description: string;
  cooldown: number;        // Turns or seconds
  cost?: ResourceSet;
  effects: Effect[];
}

export interface ResourceSet {
  [resourceName: string]: number;
}

export interface PlayerConfig {
  hasAvatar: boolean;
  avatarStyle: AvatarStyle;
  startingResources: ResourceSet;
  startingHealth?: number;
  maxHealth?: number;
  abilities: AbilityConfig[];
  startingPosition?: Position | "random" | "spawn";
}

// =============================================================================
// MECHANIC CONFIGURATIONS
// =============================================================================

export interface EconomyConfig {
  currencies: string[];           // e.g., ["gold", "gems"]
  startingAmounts: ResourceSet;
  tradingEnabled: boolean;
  stealingEnabled: boolean;
  earnRates: {
    perCorrectAnswer?: ResourceSet;
    perTurn?: ResourceSet;
    perZone?: Record<string, ResourceSet>;
  };
  shop?: ShopItem[];
}

export interface ShopItem {
  id: string;
  name: string;
  cost: ResourceSet;
  effects: Effect[];
  quantity?: number;  // -1 for unlimited
}

export interface CombatConfig {
  maxHealth: number;
  startingHealth: number;
  damagePerAttack: number;
  damagePerIncorrect?: number;
  healPerCorrect?: number;
  shieldDuration?: number;
  respawnEnabled: boolean;
  respawnDelay?: number;
  friendlyFire: boolean;
}

export interface MovementConfig {
  type: "grid" | "zone" | "track" | "free";
  movementPerTurn?: number;
  movementPerCorrect?: number;
  canPassThrough: boolean;
  captureEnabled: boolean;
  influencePerCorrect?: number;
  influenceToCapture?: number;
}

export interface ResourceConfig {
  resources: string[];
  gatheringEnabled: boolean;
  gatherLocations?: Position[];
  craftingRecipes?: CraftingRecipe[];
  inventorySize?: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  inputs: ResourceSet;
  outputs: ResourceSet | Effect[];
}

export interface SocialConfig {
  type: "voting" | "roles" | "factions" | "alliances";
  roles?: RoleConfig[];
  factions?: FactionConfig[];
  votingRounds?: number;
  accusationEnabled: boolean;
  revealOnDeath?: boolean;
}

export interface RoleConfig {
  id: string;
  name: string;
  team: string;
  abilities: AbilityConfig[];
  winCondition: string;
  isHidden: boolean;
}

export interface FactionConfig {
  id: string;
  name: string;
  color: string;
  startingZones?: string[];
}

export interface TimerConfig {
  gameDuration?: number;      // Total game time in seconds
  turnDuration?: number;      // Per-turn time limit
  questionDuration?: number;  // Time to answer questions
  roundDuration?: number;     // Duration of each round
  totalRounds?: number;
  waveInterval?: number;      // For wave-based games
}

// =============================================================================
// EFFECTS & CONDITIONS
// =============================================================================

export interface Effect {
  type: EffectType;
  target?: "self" | "opponent" | "all" | "zone" | string;  // string for specific player ID
  amount?: number;
  resource?: string;
  currency?: string;
  position?: Position;
  duration?: number;
  ability?: string;
  info?: string;
}

export interface Condition {
  type: "score-threshold" | "elimination-count" | "zone-control" | "resource-amount" |
        "time-elapsed" | "questions-answered" | "survival-time" | "all-collected";
  target?: string;
  threshold?: number;
  comparison?: "gte" | "lte" | "eq";
}

export interface VictoryConfig {
  type: VictoryType;
  conditions: Condition[];
  duration: number;           // Max game time in seconds
  tiebreaker?: "score" | "time" | "eliminations" | "zones";
}

// =============================================================================
// QUESTION TYPES
// =============================================================================

export type QuestionType =
  | "multiple_choice"
  | "ordering"
  | "categorization"
  | "true_false"
  | "fill_blank"
  | "matching";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correct: string | string[];
  explanation: string;
  misconception: string;
  difficulty?: number;        // 1-5
  points?: number;            // Override default points
  timeLimit?: number;         // Override default time
  tags?: string[];
}

export interface QuestionIntegration {
  trigger: QuestionTrigger;
  interval?: number;          // For timed trigger (seconds)
  triggerActions?: ActionType[]; // For action trigger
  triggerZones?: string[];    // For zone trigger
  onCorrect: Effect[];
  onIncorrect: Effect[];
  displayStyle: QuestionDisplayStyle;
  allowSkip: boolean;
  penaltyForSkip?: Effect[];
}

// =============================================================================
// GAME SPECIFICATION (AI Output)
// =============================================================================

export interface GameSpecification {
  // Identity
  title: string;
  narrative: string;
  genre: Genre;
  subGenres: Genre[];

  // Visual design
  theme: ThemeConfig;

  // World/board
  world: WorldConfig;

  // Player setup
  players: PlayerConfig;

  // Mechanics (all optional - AI composes what's needed)
  mechanics: {
    economy?: EconomyConfig;
    combat?: CombatConfig;
    movement?: MovementConfig;
    resources?: ResourceConfig;
    social?: SocialConfig;
    timer?: TimerConfig;
  };

  // Scoring
  scoring: {
    basePoints: number;
    timeBonus: number;
    streakMultiplier: number;
    maxStreak: number;
  };

  // Question integration
  questionIntegration: QuestionIntegration;

  // Win conditions
  victory: VictoryConfig;

  // Generated questions
  questions: Question[];
}

// =============================================================================
// RUNTIME STATE TYPES
// =============================================================================

export interface PlayerState {
  id: string;
  name: string;
  position?: Position;
  resources: ResourceSet;
  health?: number;
  maxHealth?: number;
  shield?: number;
  status: PlayerStatus;
  score: number;
  streak: number;
  role?: string;
  faction?: string;
  inventory: string[];
  abilityCooldowns: Record<string, number>;
  questionsAnswered: number;
  correctAnswers: number;
  votes?: Record<string, string>;  // Who they voted for
  lastAction?: ActionType;
  lastActionTime?: number;
}

export interface WorldState {
  zones: Record<string, ZoneState>;
  resources: ResourceSpawnState[];
  entities: EntityState[];
  effects: ActiveEffect[];
}

export interface ZoneState {
  id: string;
  controlledBy?: string;
  influence: Record<string, number>;  // Player ID -> influence points
  playersInZone: string[];
}

export interface ResourceSpawnState {
  id: string;
  type: string;
  position: Position;
  amount: number;
  respawnTime?: number;
}

export interface EntityState {
  id: string;
  type: "item" | "enemy" | "structure" | "projectile";
  position: Position;
  properties: Record<string, unknown>;
}

export interface ActiveEffect {
  id: string;
  type: EffectType;
  target: string;
  remainingDuration: number;
  value?: number;
}

export interface GameState {
  phase: GamePhase;
  roundNumber: number;
  turnNumber: number;
  currentPlayerTurn?: string;
  timeRemaining?: number;
  currentQuestionIndex: number;
  activeQuestion?: Question;
  questionStartTime?: number;
  worldState: WorldState;
  events: GameEvent[];
}

// =============================================================================
// EVENTS
// =============================================================================

export interface GameEvent {
  id: string;
  timestamp: number;
  type: string;
  playerId?: string;
  payload: Record<string, unknown>;
}

export interface ActionEvent extends GameEvent {
  type: "action";
  payload: {
    action: ActionType;
    target?: string;
    position?: Position;
    result: "success" | "failed" | "blocked";
    effects: Effect[];
  };
}

export interface QuestionEvent extends GameEvent {
  type: "question";
  payload: {
    questionId: string;
    playerId: string;
    answer: string | string[];
    correct: boolean;
    timeMs: number;
    effects: Effect[];
  };
}

export interface PhaseEvent extends GameEvent {
  type: "phase_change";
  payload: {
    from: GamePhase;
    to: GamePhase;
  };
}

// =============================================================================
// ACTION TYPES
// =============================================================================

export interface PlayerAction {
  type: ActionType;
  playerId: string;
  timestamp: number;
  payload: ActionPayload;
}

export type ActionPayload =
  | MovePayload
  | AttackPayload
  | TradePayload
  | UseItemPayload
  | VotePayload
  | AnswerPayload
  | AbilityPayload;

export interface MovePayload {
  targetPosition: Position;
  targetZone?: string;
}

export interface AttackPayload {
  targetPlayerId: string;
  damage?: number;
}

export interface TradePayload {
  targetPlayerId: string;
  offer: ResourceSet;
  request: ResourceSet;
}

export interface UseItemPayload {
  itemId: string;
  targetPlayerId?: string;
  targetPosition?: Position;
}

export interface VotePayload {
  targetPlayerId: string;
  voteType: "eliminate" | "accuse" | "ally";
}

export interface AnswerPayload {
  questionId: string;
  answer: string | string[];
  timeMs: number;
}

export interface AbilityPayload {
  abilityId: string;
  targetPlayerId?: string;
  targetPosition?: Position;
}

// =============================================================================
// ENGINE CONTEXT
// =============================================================================

export interface GameContext {
  spec: GameSpecification;
  state: GameState;
  players: Record<string, PlayerState>;
}

export interface SystemContext {
  game: GameContext;
  currentPlayer?: PlayerState;
  emit: (event: GameEvent) => void;
  applyEffect: (effect: Effect, target: string) => void;
}

// =============================================================================
// TEACHER HINTS (Optional guidance for AI)
// =============================================================================

export interface TeacherHints {
  preferredGenre?: Genre;
  preferredMechanics?: string[];
  avoidMechanics?: string[];
  preferredTheme?: ThemeStyle;
  maxDuration?: number;
  difficulty?: "easy" | "medium" | "hard";
  collaborative?: boolean;
}
