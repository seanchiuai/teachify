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
