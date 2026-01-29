# Convex Reference

Code examples and patterns for LessonPlay's Convex backend.

## Schema

```typescript
// convex/schema.ts
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
    questions: v.array(v.object({
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
    })),
    state: v.union(
      v.literal("lobby"),
      v.literal("playing"),
      v.literal("question"),
      v.literal("results"),
      v.literal("complete")
    ),
    currentQuestion: v.number(),
    fileId: v.optional(v.id("_storage")),
  })
    .index("by_code", ["code"]),

  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    score: v.number(),
  })
    .index("by_game", ["gameId"]),

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
```

## Query Pattern

```typescript
// convex/games.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});
```

## Mutation Pattern

```typescript
// convex/games.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateState = mutation({
  args: {
    gameId: v.id("games"),
    state: v.union(
      v.literal("lobby"),
      v.literal("playing"),
      v.literal("question"),
      v.literal("results"),
      v.literal("complete")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, { state: args.state });
  },
});
```

## Action Pattern (External API)

```typescript
// convex/generate.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generateGame = action({
  args: {
    content: v.string(),
    objective: v.string(),
    objectiveType: v.string(),
  },
  handler: async (ctx, args) => {
    // Call Gemini API
    const response = await fetch("https://generativelanguage.googleapis.com/...", {
      method: "POST",
      body: JSON.stringify({ /* prompt */ }),
    });
    const questions = await response.json();

    // Generate 6-char code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store game via mutation
    const gameId = await ctx.runMutation(api.games.create, {
      code,
      content: args.content,
      objective: args.objective,
      objectiveType: args.objectiveType,
      questions,
    });

    return { gameId, code };
  },
});
```

## React Integration

```typescript
// Using queries (auto real-time)
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// Real-time query — re-renders when data changes
const game = useQuery(api.games.getByCode, { code });
const players = useQuery(api.players.listByGame, { gameId: game?._id });

// Mutation
const joinGame = useMutation(api.players.join);
await joinGame({ gameId, name: "Alex" });

// Action (for AI generation)
const generate = useAction(api.generate.generateGame);
const { code } = await generate({ content, objective, objectiveType });
```

## File Upload Pattern

```typescript
// 1. Get upload URL (mutation)
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// 2. Upload from client
const uploadUrl = await generateUploadUrl();
const result = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});
const { storageId } = await result.json();

// 3. Get file URL for reading
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

## ConvexProvider Setup

```typescript
// app/providers.tsx
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```
