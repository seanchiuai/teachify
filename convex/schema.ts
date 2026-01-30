import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    state: v.union(
      v.literal("lobby"),
      v.literal("playing"),
      v.literal("question"),
      v.literal("results"),
      v.literal("complete")
    ),
    currentQuestion: v.number(),
    fileId: v.optional(v.id("_storage")),
  }).index("by_code", ["code"]),

  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    score: v.number(),
  }).index("by_game", ["gameId"]),

  answers: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    questionIndex: v.number(),
    answer: v.union(v.string(), v.array(v.string())),
    correct: v.boolean(),
    timeMs: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_question", ["gameId", "questionIndex"])
    .index("by_player", ["playerId"]),
});
