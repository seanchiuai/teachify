import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Question schema (shared between legacy and new engine)
const questionSchema = v.object({
  type: v.union(
    v.literal("multiple_choice"),
    v.literal("ordering"),
    v.literal("categorization"),
    v.literal("true_false"),
    v.literal("fill_blank"),
    v.literal("matching")
  ),
  question: v.string(),
  options: v.array(v.string()),
  correct: v.union(v.string(), v.array(v.string())),
  explanation: v.string(),
  misconception: v.string(),
  id: v.optional(v.string()),
  difficulty: v.optional(v.number()),
  points: v.optional(v.number()),
  timeLimit: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
});

// Game phase for new engine
const gamePhaseValidator = v.union(
  v.literal("lobby"),
  v.literal("countdown"),
  v.literal("active"),
  v.literal("paused"),
  v.literal("question"),
  v.literal("results"),
  v.literal("complete")
);

// Legacy state (for backward compatibility)
const legacyStateValidator = v.union(
  v.literal("lobby"),
  v.literal("playing"),
  v.literal("question"),
  v.literal("results"),
  v.literal("complete")
);

// Player status
const playerStatusValidator = v.union(
  v.literal("active"),
  v.literal("eliminated"),
  v.literal("winner"),
  v.literal("frozen"),
  v.literal("shielded")
);

export default defineSchema({
  games: defineTable({
    code: v.string(),
    topic: v.string(),
    objective: v.string(),
    objectiveType: v.union(
      v.literal("understand"),
      v.literal("explain"),
      v.literal("apply"),
      v.literal("distinguish"),
      v.literal("perform"),
      v.literal("analyze")
    ),
    content: v.string(),

    // Questions array
    questions: v.array(questionSchema),

    // Legacy: HTML-based game (kept for backward compatibility)
    gameHtml: v.optional(v.string()),

    // New: AI-generated game specification (full GameSpecification)
    gameSpec: v.optional(v.any()),

    // State management
    // Legacy state field
    state: v.optional(legacyStateValidator),
    // New phase field for engine-based games
    phase: v.optional(gamePhaseValidator),

    // Shared state fields
    currentQuestion: v.number(),

    // New: World state for engine (zones, resources, entities)
    worldState: v.optional(v.any()),

    // New: Round/turn tracking
    roundNumber: v.optional(v.number()),
    turnNumber: v.optional(v.number()),
    currentPlayerTurn: v.optional(v.id("players")),

    // New: Timer state
    timeRemaining: v.optional(v.number()),
    questionStartTime: v.optional(v.number()),

    // New: Game mode indicator
    engineMode: v.optional(v.boolean()), // true = new engine, false/undefined = legacy

    // File storage
    fileId: v.optional(v.id("_storage")),

    // Timestamps
    createdAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_code", ["code"]),

  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    score: v.number(),

    // New: Position (for spatial games)
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),

    // New: Resources (currencies, items count, etc.)
    resources: v.optional(v.any()), // Record<string, number>

    // New: Health/combat state
    health: v.optional(v.number()),
    maxHealth: v.optional(v.number()),
    shield: v.optional(v.number()),

    // New: Inventory
    inventory: v.optional(v.array(v.string())),

    // New: Player status
    status: v.optional(playerStatusValidator),

    // New: Social game state
    role: v.optional(v.string()),       // Hidden role
    faction: v.optional(v.string()),    // Team/faction
    votes: v.optional(v.any()),         // Voting records

    // New: Streak tracking
    streak: v.optional(v.number()),

    // New: Ability cooldowns
    abilityCooldowns: v.optional(v.any()), // Record<string, number>

    // New: Statistics
    questionsAnswered: v.optional(v.number()),
    correctAnswers: v.optional(v.number()),

    // New: Last action tracking
    lastAction: v.optional(v.string()),
    lastActionTime: v.optional(v.number()),

    // Timestamps
    joinedAt: v.optional(v.number()),
  }).index("by_game", ["gameId"]),

  answers: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    questionIndex: v.number(),
    answer: v.union(v.string(), v.array(v.string())),
    correct: v.boolean(),
    timeMs: v.number(),

    // New: Effects applied from this answer
    effectsApplied: v.optional(v.array(v.any())),
  })
    .index("by_game", ["gameId"])
    .index("by_game_question", ["gameId", "questionIndex"])
    .index("by_player", ["playerId"]),

  // New: Game events for replay and analytics
  gameEvents: defineTable({
    gameId: v.id("games"),
    playerId: v.optional(v.id("players")),
    eventType: v.string(),
    payload: v.any(),
    timestamp: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_time", ["gameId", "timestamp"]),
});
