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
