# Game Engine Reference

Code patterns for LessonPlay game state management and iframe communication.

## State Transition Mutations

```typescript
// convex/games.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

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

// Host advances to next question or completes game
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
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

    // Calculate score: 1000 base + up to 500 speed bonus
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
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

## Client-Side Timer (Parent — Authoritative)

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

Timer runs in the parent app (authoritative). When it expires, parent sends `TIME_UP` to iframe. The iframe can show a visual timer but does not enforce the limit.

## GameIframe Component (Sandboxed)

```tsx
// components/GameIframe.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";

interface GameMessage {
  type: "GAME_READY" | "ANSWER_SUBMITTED" | "GAME_OVER" | "ERROR";
  payload?: any;
}

interface ParentMessage {
  type: "START_GAME" | "NEXT_QUESTION" | "TIME_UP" | "END_GAME";
  payload?: any;
}

export function GameIframe({
  gameHtml,
  gameId,
  onReady,
  onAnswerSubmitted,
  onGameOver,
  onError,
}: {
  gameHtml: string;
  gameId: string;
  onReady: () => void;
  onAnswerSubmitted: (payload: { questionIndex: number; answer: string; timeMs: number }) => void;
  onGameOver: (payload: { finalScore: number }) => void;
  onError: (message: string) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const portRef = useRef<MessagePort | null>(null);

  // Set up MessageChannel when iframe loads
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const channel = new MessageChannel();
    portRef.current = channel.port1;

    // Listen for messages from iframe via private channel
    channel.port1.onmessage = (event: MessageEvent<GameMessage>) => {
      const { type, payload } = event.data;
      switch (type) {
        case "GAME_READY":
          onReady();
          break;
        case "ANSWER_SUBMITTED":
          onAnswerSubmitted(payload);
          break;
        case "GAME_OVER":
          onGameOver(payload);
          break;
        case "ERROR":
          onError(payload?.message || "Unknown game error");
          break;
      }
    };

    // Transfer port2 to iframe (one-time wildcard postMessage for handshake)
    iframe.contentWindow.postMessage(
      { type: "INIT_PORT" },
      "*",
      [channel.port2]
    );
  }, [onReady, onAnswerSubmitted, onGameOver, onError]);

  // Send message to iframe via private channel
  const sendToIframe = useCallback((message: ParentMessage) => {
    portRef.current?.postMessage(message);
  }, []);

  // Expose sendToIframe via ref or context for parent to use
  useEffect(() => {
    // Store sendToIframe on a ref or context so parent components can call it
    (window as any).__gameIframeSend = sendToIframe;
    return () => { delete (window as any).__gameIframeSend; };
  }, [sendToIframe]);

  return (
    <div className="relative w-full aspect-[16/9] max-w-[800px] mx-auto">
      <iframe
        ref={iframeRef}
        key={gameId} // Force re-render on game change (Firefox caching fix)
        sandbox="allow-scripts"
        srcDoc={gameHtml}
        onLoad={handleIframeLoad}
        className="absolute inset-0 w-full h-full border-0 rounded-xl"
        title="Game"
      />
    </div>
  );
}
```

### Security Notes

- `sandbox="allow-scripts"` — lets JS run but blocks same-origin access, forms, popups, navigation
- **Never** add `allow-same-origin` — combining both lets iframe escape sandbox entirely
- MessageChannel provides a private communication channel after initial handshake
- `key={gameId}` forces iframe re-render (avoids Firefox caching bugs)
- `srcdoc` iframes inherit parent CSP — ensure parent page allows inline scripts

## useGameIframe Hook

```typescript
// hooks/useGameIframe.ts
import { useRef, useCallback } from "react";

type ParentMessage =
  | { type: "START_GAME" }
  | { type: "NEXT_QUESTION"; payload: { questionIndex: number } }
  | { type: "TIME_UP" }
  | { type: "END_GAME" };

export function useGameIframe() {
  const portRef = useRef<MessagePort | null>(null);

  const setupChannel = useCallback((iframe: HTMLIFrameElement, onMessage: (msg: any) => void) => {
    const channel = new MessageChannel();
    portRef.current = channel.port1;
    channel.port1.onmessage = (e) => onMessage(e.data);
    iframe.contentWindow?.postMessage({ type: "INIT_PORT" }, "*", [channel.port2]);
  }, []);

  const send = useCallback((msg: ParentMessage) => {
    portRef.current?.postMessage(msg);
  }, []);

  return { setupChannel, send };
}
```
