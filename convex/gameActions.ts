import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Game Actions - Player action mutations for the composable game engine
 */

// Submit a player action
export const submitAction = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    actionType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    // Validate game is active
    if (game.phase !== "active" && game.phase !== "question") {
      throw new Error("Game not in active phase");
    }

    // Record the event
    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      playerId: args.playerId,
      eventType: args.actionType,
      payload: args.payload,
      timestamp: Date.now(),
    });

    // Update player's last action
    await ctx.db.patch(args.playerId, {
      lastAction: args.actionType,
      lastActionTime: Date.now(),
    });

    return { success: true };
  },
});

// Update player position (for movement)
export const updatePlayerPosition = mutation({
  args: {
    playerId: v.id("players"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    await ctx.db.patch(args.playerId, {
      position: args.position,
      lastAction: "move",
      lastActionTime: Date.now(),
    });

    return { success: true };
  },
});

// Update player resources
export const updatePlayerResources = mutation({
  args: {
    playerId: v.id("players"),
    resources: v.any(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    await ctx.db.patch(args.playerId, {
      resources: args.resources,
    });

    return { success: true };
  },
});

// Update player health
export const updatePlayerHealth = mutation({
  args: {
    playerId: v.id("players"),
    health: v.number(),
    shield: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const updates: Record<string, unknown> = { health: args.health };
    if (args.shield !== undefined) updates.shield = args.shield;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.playerId, updates);

    return { success: true };
  },
});

// Update player score and streak
export const updatePlayerScore = mutation({
  args: {
    playerId: v.id("players"),
    score: v.number(),
    streak: v.optional(v.number()),
    questionsAnswered: v.optional(v.number()),
    correctAnswers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const updates: Record<string, unknown> = { score: args.score };
    if (args.streak !== undefined) updates.streak = args.streak;
    if (args.questionsAnswered !== undefined) updates.questionsAnswered = args.questionsAnswered;
    if (args.correctAnswers !== undefined) updates.correctAnswers = args.correctAnswers;

    await ctx.db.patch(args.playerId, updates);

    return { success: true };
  },
});

// Update world state
export const updateWorldState = mutation({
  args: {
    gameId: v.id("games"),
    worldState: v.any(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    await ctx.db.patch(args.gameId, {
      worldState: args.worldState,
    });

    return { success: true };
  },
});

// Update game phase
export const updateGamePhase = mutation({
  args: {
    gameId: v.id("games"),
    phase: v.union(
      v.literal("lobby"),
      v.literal("countdown"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("question"),
      v.literal("results"),
      v.literal("complete")
    ),
    currentQuestion: v.optional(v.number()),
    timeRemaining: v.optional(v.number()),
    questionStartTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const updates: Record<string, unknown> = { phase: args.phase };
    if (args.currentQuestion !== undefined) updates.currentQuestion = args.currentQuestion;
    if (args.timeRemaining !== undefined) updates.timeRemaining = args.timeRemaining;
    if (args.questionStartTime !== undefined) updates.questionStartTime = args.questionStartTime;

    // Also update startedAt/completedAt
    if (args.phase === "active" && !game.startedAt) {
      updates.startedAt = Date.now();
    }
    if (args.phase === "complete") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.gameId, updates);

    // Record phase change event
    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      eventType: "phase_change",
      payload: { from: game.phase, to: args.phase },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Record game event
export const recordEvent = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.optional(v.id("players")),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      playerId: args.playerId,
      eventType: args.eventType,
      payload: args.payload,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Initialize player for engine-based game
export const initializeEnginePlayer = mutation({
  args: {
    playerId: v.id("players"),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
    resources: v.optional(v.any()),
    health: v.optional(v.number()),
    maxHealth: v.optional(v.number()),
    faction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const updates: Record<string, unknown> = {
      status: "active",
      streak: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      inventory: [],
      abilityCooldowns: {},
      joinedAt: Date.now(),
    };

    if (args.position !== undefined) updates.position = args.position;
    if (args.resources !== undefined) updates.resources = args.resources;
    if (args.health !== undefined) updates.health = args.health;
    if (args.maxHealth !== undefined) updates.maxHealth = args.maxHealth;
    if (args.faction !== undefined) updates.faction = args.faction;

    await ctx.db.patch(args.playerId, updates);

    return { success: true };
  },
});

// Get game events
export const getGameEvents = query({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("gameEvents")
      .withIndex("by_game", q => q.eq("gameId", args.gameId))
      .order("desc");

    const events = args.limit
      ? await query.take(args.limit)
      : await query.collect();

    return events.reverse(); // Return in chronological order
  },
});

// Start engine-based game
export const startEngineGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (!game.engineMode) throw new Error("Not an engine-based game");
    if (game.phase !== "lobby") throw new Error("Game already started");

    // Get all players and initialize them
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", q => q.eq("gameId", args.gameId))
      .collect();

    const spec = game.gameSpec;

    // Initialize each player with game spec defaults
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const updates: Record<string, unknown> = {
        status: "active",
        streak: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        inventory: [],
        abilityCooldowns: {},
      };

      if (spec?.players) {
        updates.resources = { ...spec.players.startingResources };

        if (spec.mechanics?.combat) {
          updates.health = spec.mechanics.combat.startingHealth;
          updates.maxHealth = spec.mechanics.combat.maxHealth;
        }

        // Assign position based on spawn points
        if (spec.world?.features) {
          const spawns = spec.world.features.filter((f: { type: string }) => f.type === "spawn");
          if (spawns.length > 0) {
            const spawn = spawns[i % spawns.length];
            updates.position = spawn.position;
          }
        }

        // Assign faction if applicable
        if (spec.mechanics?.social?.factions) {
          const factions = spec.mechanics.social.factions;
          updates.faction = factions[i % factions.length].id;
        }
      }

      await ctx.db.patch(player._id, updates);
    }

    // Initialize world state
    const worldState = {
      zones: {} as Record<string, { id: string; controlledBy: undefined; influence: Record<string, never>; playersInZone: never[] }>,
      resources: [] as Array<{ id: string; type: string; position: { x: number; y: number }; amount: number }>,
      entities: [] as Array<{ id: string; type: string; position: { x: number; y: number }; properties: Record<string, unknown> }>,
      effects: [] as never[],
    };

    if (spec?.world?.zones) {
      for (const zone of spec.world.zones) {
        worldState.zones[zone.id] = {
          id: zone.id,
          controlledBy: undefined,
          influence: {},
          playersInZone: [],
        };
      }
    }

    // Update game state
    await ctx.db.patch(args.gameId, {
      phase: "countdown",
      worldState,
      roundNumber: 1,
      turnNumber: 0,
      startedAt: Date.now(),
    });

    return { success: true };
  },
});

// Trigger question in engine game
export const triggerEngineQuestion = mutation({
  args: {
    gameId: v.id("games"),
    questionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    await ctx.db.patch(args.gameId, {
      phase: "question",
      currentQuestion: args.questionIndex,
      questionStartTime: Date.now(),
    });

    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      eventType: "question_triggered",
      payload: { questionIndex: args.questionIndex },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Show results in engine game
export const showEngineResults = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    await ctx.db.patch(args.gameId, {
      phase: "results",
    });

    return { success: true };
  },
});

// Move to next question or complete in engine game
export const nextEngineQuestion = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const nextIndex = game.currentQuestion + 1;
    const totalQuestions = game.questions.length;

    if (nextIndex >= totalQuestions) {
      // Game complete
      await ctx.db.patch(args.gameId, {
        phase: "complete",
        completedAt: Date.now(),
      });

      await ctx.db.insert("gameEvents", {
        gameId: args.gameId,
        eventType: "game_complete",
        payload: {},
        timestamp: Date.now(),
      });
    } else {
      // Trigger next question
      await ctx.db.patch(args.gameId, {
        phase: "question",
        currentQuestion: nextIndex,
        questionStartTime: Date.now(),
      });

      await ctx.db.insert("gameEvents", {
        gameId: args.gameId,
        eventType: "question_triggered",
        payload: { questionIndex: nextIndex },
        timestamp: Date.now(),
      });
    }

    return { success: true, isComplete: nextIndex >= totalQuestions };
  },
});
