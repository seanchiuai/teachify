import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    code: v.string(),
    topic: v.string(),
    content: v.string(),
    objective: v.string(),
    objectiveType: v.union(
      v.literal("understand"),
      v.literal("explain"),
      v.literal("apply"),
      v.literal("distinguish"),
      v.literal("perform"),
      v.literal("analyze")
    ),
    questions: v.array(
      v.object({
        type: v.union(
          v.literal("multiple_choice"),
          v.literal("ordering"),
          v.literal("categorization")
        ),
        question: v.string(),
        options: v.array(v.string()),
        correct: v.union(v.string(), v.array(v.string())),
        explanation: v.string(),
        misconception: v.string(),
      })
    ),
    gameHtml: v.string(),
    fileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", {
      code: args.code,
      topic: args.topic,
      content: args.content,
      objective: args.objective,
      objectiveType: args.objectiveType,
      questions: args.questions,
      gameHtml: args.gameHtml,
      state: "lobby",
      currentQuestion: 0,
      fileId: args.fileId,
    });
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});

export const get = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const startGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.state !== "lobby") throw new Error("Cannot start game");

    await ctx.db.patch(args.gameId, {
      state: "question",
      currentQuestion: 0,
    });
  },
});

export const showResults = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.state !== "question") throw new Error("Invalid state");

    await ctx.db.patch(args.gameId, { state: "results" });
  },
});

export const nextQuestion = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.state !== "results") throw new Error("Invalid state");

    const nextIndex = game.currentQuestion + 1;
    if (nextIndex >= game.questions.length) {
      await ctx.db.patch(args.gameId, { state: "complete" });
    } else {
      await ctx.db.patch(args.gameId, {
        state: "question",
        currentQuestion: nextIndex,
      });
    }
  },
});

// Create test game (for testing purposes - creates engine game with preset questions)
export const createTestGame = mutation({
  args: {},
  handler: async (ctx) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const testQuestions = [
      {
        id: "q1",
        type: "multiple_choice" as const,
        question: "What process turns water from liquid to gas?",
        options: ["Evaporation", "Condensation", "Precipitation", "Collection"],
        correct: "Evaporation",
        explanation: "Evaporation is the process where water transforms from liquid to gas due to heat from the sun.",
        misconception: "Some confuse evaporation with condensation, but condensation is the opposite - gas turning to liquid.",
        difficulty: 1,
        points: 100,
        timeLimit: 30,
      },
      {
        id: "q2",
        type: "multiple_choice" as const,
        question: "What percentage of Earth's water is in the oceans?",
        options: ["97%", "75%", "50%", "25%"],
        correct: "97%",
        explanation: "About 97% of Earth's water is saltwater in the oceans.",
        misconception: "Many underestimate ocean water volume, thinking freshwater is more abundant.",
        difficulty: 1,
        points: 100,
        timeLimit: 30,
      },
      {
        id: "q3",
        type: "multiple_choice" as const,
        question: "What drives the water cycle?",
        options: ["The Sun", "The Moon", "Wind", "Gravity"],
        correct: "The Sun",
        explanation: "The sun provides the energy needed for evaporation, which starts the water cycle.",
        misconception: "While gravity helps with precipitation, the sun's energy is the primary driver.",
        difficulty: 1,
        points: 100,
        timeLimit: 30,
      },
    ];

    // Complete game spec for engine mode testing
    const gameSpec = {
      title: "Water Cycle Quiz",
      narrative: "Test your knowledge of the water cycle!",
      genre: "puzzle",
      theme: { style: "educational", palette: ["#3B82F6", "#8B5CF6"] },
      mechanics: {},
      victory: { type: "score", duration: 300, target: 300 },
      rendering: { background: "#1a1a2e", cardStyle: "modern" },
      world: {
        size: { width: 10, height: 10 },
        zones: [],
        features: [],
      },
      resources: [],
      players: {
        minPlayers: 1,
        maxPlayers: 30,
        startingResources: {},
      },
    };

    const gameId = await ctx.db.insert("games", {
      code,
      topic: "Water Cycle",
      content: "Test content about the water cycle for testing purposes.",
      objective: "Understand the water cycle processes",
      objectiveType: "understand",
      questions: testQuestions,
      gameSpec,
      engineMode: true,
      phase: "lobby",
      state: "lobby",
      currentQuestion: 0,
      roundNumber: 0,
      turnNumber: 0,
      createdAt: Date.now(),
    });

    return { code, gameId };
  },
});

// Create engine-based game
export const createEngineGame = internalMutation({
  args: {
    code: v.string(),
    topic: v.string(),
    content: v.string(),
    objective: v.string(),
    objectiveType: v.union(
      v.literal("understand"),
      v.literal("explain"),
      v.literal("apply"),
      v.literal("distinguish"),
      v.literal("perform"),
      v.literal("analyze")
    ),
    questions: v.array(
      v.object({
        id: v.string(),
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
        difficulty: v.optional(v.number()),
        points: v.optional(v.number()),
        timeLimit: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
      })
    ),
    gameSpec: v.any(),
    fileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", {
      code: args.code,
      topic: args.topic,
      content: args.content,
      objective: args.objective,
      objectiveType: args.objectiveType,
      questions: args.questions,
      gameSpec: args.gameSpec,
      engineMode: true,
      phase: "lobby",
      state: "lobby", // Keep for backward compat
      currentQuestion: 0,
      roundNumber: 0,
      turnNumber: 0,
      createdAt: Date.now(),
      fileId: args.fileId,
    });
  },
});
