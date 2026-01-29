# Game Engine Reference

Code patterns for LessonPlay game state management.

## State Transition Mutations

```typescript
// convex/games.ts

// Host starts the game
export const startGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.state !== "lobby") throw new Error("Cannot start game");

    await ctx.db.patch(args.gameId, {
      state: "question",
      currentQuestion: 0,
    });
  },
});

// Host advances to next question or shows results
export const nextQuestion = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.state !== "results") throw new Error("Invalid state");

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

// Host shows results for current question
export const showResults = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.state !== "question") throw new Error("Invalid state");

    await ctx.db.patch(args.gameId, { state: "results" });
  },
});
```

## Answer Submission

```typescript
// convex/answers.ts
export const submitAnswer = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    questionIndex: v.number(),
    answer: v.union(v.string(), v.array(v.string())),
    timeMs: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.state !== "question") throw new Error("Not accepting answers");
    if (game.currentQuestion !== args.questionIndex) throw new Error("Wrong question");

    // Check if already answered
    const existing = await ctx.db
      .query("answers")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("questionIndex"), args.questionIndex))
      .unique();
    if (existing) throw new Error("Already answered");

    // Determine correctness
    const question = game.questions[args.questionIndex];
    const correct = checkAnswer(question, args.answer);

    // Calculate score
    const TIMER_DURATION = 30000; // 30 seconds
    const points = correct ? 1000 + Math.max(0, Math.round(500 * (1 - args.timeMs / TIMER_DURATION))) : 0;

    // Store answer
    await ctx.db.insert("answers", {
      gameId: args.gameId,
      playerId: args.playerId,
      questionIndex: args.questionIndex,
      answer: args.answer,
      correct,
      timeMs: args.timeMs,
    });

    // Update player score
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
  if (question.type === "ordering") {
    return JSON.stringify(answer) === JSON.stringify(question.correct);
  }
  if (question.type === "categorization") {
    return JSON.stringify(answer) === JSON.stringify(question.correct);
  }
  return false;
}
```

## Player Management

```typescript
// convex/players.ts
export const join = mutation({
  args: {
    gameId: v.id("games"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.state !== "lobby") throw new Error("Cannot join game");

    return await ctx.db.insert("players", {
      gameId: args.gameId,
      name: args.name,
      score: 0,
    });
  },
});

export const listByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

// Leaderboard — sorted by score descending
export const leaderboard = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    return players.sort((a, b) => b.score - a.score);
  },
});
```

## Question Analytics

```typescript
// convex/answers.ts
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
    const correct = answers.filter((a) => a.correct).length;
    const avgTime = total > 0
      ? Math.round(answers.reduce((sum, a) => sum + a.timeMs, 0) / total)
      : 0;

    // Count answer distribution
    const distribution: Record<string, number> = {};
    for (const a of answers) {
      const key = typeof a.answer === "string" ? a.answer : JSON.stringify(a.answer);
      distribution[key] = (distribution[key] || 0) + 1;
    }

    return { total, correct, percentCorrect: total > 0 ? Math.round((correct / total) * 100) : 0, avgTime, distribution };
  },
});
```

## Client-Side Timer

```typescript
// hooks/useTimer.ts
import { useState, useEffect, useRef } from "react";

export function useTimer(durationMs: number, active: boolean) {
  const [remaining, setRemaining] = useState(durationMs);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setRemaining(durationMs);
      return;
    }
    startTime.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      setRemaining(Math.max(0, durationMs - elapsed));
    }, 100);
    return () => clearInterval(interval);
  }, [active, durationMs]);

  const elapsedMs = durationMs - remaining;
  return { remaining, elapsedMs };
}
```
