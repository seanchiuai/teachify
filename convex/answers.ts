import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TIMER_DURATION = 30000; // 30 seconds

export const submit = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    questionIndex: v.number(),
    answer: v.union(v.string(), v.array(v.string())),
    timeMs: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.state !== "question") throw new Error("Not accepting answers");
    if (game.currentQuestion !== args.questionIndex) throw new Error("Wrong question");

    const existing = await ctx.db
      .query("answers")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("questionIndex"), args.questionIndex))
      .first();
    if (existing) throw new Error("Already answered");

    const question = game.questions[args.questionIndex];
    const correct = checkAnswer(question, args.answer);

    const points = correct
      ? 1000 + Math.max(0, Math.round(500 * (1 - args.timeMs / TIMER_DURATION)))
      : 0;

    await ctx.db.insert("answers", {
      gameId: args.gameId,
      playerId: args.playerId,
      questionIndex: args.questionIndex,
      answer: args.answer,
      correct,
      timeMs: args.timeMs,
    });

    if (points > 0) {
      const player = await ctx.db.get(args.playerId);
      if (player) {
        await ctx.db.patch(args.playerId, { score: player.score + points });
      }
    }

    return { correct, points };
  },
});

function checkAnswer(
  question: { type: string; correct: string | string[] },
  answer: string | string[]
): boolean {
  if (question.type === "multiple_choice") {
    return answer === question.correct;
  }
  if (question.type === "ordering" || question.type === "categorization") {
    return JSON.stringify(answer) === JSON.stringify(question.correct);
  }
  return false;
}

export const questionStats = query({
  args: {
    gameId: v.id("games"),
    questionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_game_question", (q) =>
        q.eq("gameId", args.gameId).eq("questionIndex", args.questionIndex)
      )
      .collect();

    const total = answers.length;
    const correctCount = answers.filter((a) => a.correct).length;
    const avgTime =
      total > 0
        ? Math.round(answers.reduce((sum, a) => sum + a.timeMs, 0) / total)
        : 0;

    const distribution: Record<string, number> = {};
    for (const a of answers) {
      const key = typeof a.answer === "string" ? a.answer : JSON.stringify(a.answer);
      distribution[key] = (distribution[key] || 0) + 1;
    }

    return {
      total,
      correct: correctCount,
      percentCorrect: total > 0 ? Math.round((correctCount / total) * 100) : 0,
      avgTime,
      distribution,
    };
  },
});

export const getByPlayerAndQuestion = query({
  args: {
    playerId: v.id("players"),
    questionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("answers")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("questionIndex"), args.questionIndex))
      .first();
  },
});

export const gameAnalytics = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const allAnswers = await ctx.db
      .query("answers")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const totalPlayers = players.length;
    const questionCount = game.questions.length;

    // Per-question stats
    const questionStats = game.questions.map((q, idx) => {
      const answers = allAnswers.filter((a) => a.questionIndex === idx);
      const total = answers.length;
      const correctCount = answers.filter((a) => a.correct).length;
      const percentCorrect = total > 0 ? Math.round((correctCount / total) * 100) : 0;

      // Distribution of answers
      const distribution: Record<string, number> = {};
      for (const a of answers) {
        const key = typeof a.answer === "string" ? a.answer : JSON.stringify(a.answer);
        distribution[key] = (distribution[key] || 0) + 1;
      }

      // Find most common wrong answer
      let mostCommonWrong: { answer: string; count: number } | null = null;
      const correctAnswer = typeof q.correct === "string" ? q.correct : JSON.stringify(q.correct);
      for (const [answer, count] of Object.entries(distribution)) {
        if (answer !== correctAnswer) {
          if (!mostCommonWrong || count > mostCommonWrong.count) {
            mostCommonWrong = { answer, count };
          }
        }
      }

      return {
        questionIndex: idx,
        question: q.question,
        correct: q.correct,
        total,
        correctCount,
        percentCorrect,
        distribution,
        mostCommonWrong,
        misconception: q.misconception,
        explanation: q.explanation,
        needsAttention: percentCorrect < 60 && total > 0,
      };
    });

    // Overall stats
    const totalAnswers = allAnswers.length;
    const totalCorrect = allAnswers.filter((a) => a.correct).length;
    const overallPercent = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

    // Comprehension gaps (questions with < 60% correct)
    const comprehensionGaps = questionStats
      .filter((q) => q.needsAttention)
      .map((q) => ({
        questionIndex: q.questionIndex,
        question: q.question,
        percentCorrect: q.percentCorrect,
        misconception: q.misconception,
        mostCommonWrong: q.mostCommonWrong,
      }));

    return {
      totalPlayers,
      questionCount,
      overallPercent,
      totalAnswers,
      totalCorrect,
      questionStats,
      comprehensionGaps,
    };
  },
});
