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
    gameHtml: v.string(),  // AI-generated self-contained HTML game (rendered in sandboxed iframe)
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

**Notes:**
- `_creationTime` is automatically added by Convex to all documents — no need for `createdAt` or `joinedAt` fields
- `v.id("_storage")` references Convex's built-in file storage table

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

## Internal Functions (for action → mutation calls)

Use `internalMutation` and `internalQuery` for functions that should only be called from other server functions (not directly from clients):

```typescript
// convex/games.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    code: v.string(),
    content: v.string(),
    objective: v.string(),
    objectiveType: v.string(),
    questions: v.array(v.any()),
    gameHtml: v.string(),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", {
      ...args,
      state: "lobby",
      currentQuestion: 0,
    });
  },
});
```

Then call from an action:
```typescript
import { internal } from "./_generated/api";
// Inside action handler:
const gameId = await ctx.runMutation(internal.games.create, { ... });
```

**Important:** Use `internal` (not `api`) when calling functions from actions. The `api` object exposes public functions callable from clients. The `internal` object exposes internal functions only callable server-side.

## Action Pattern (External API)

```typescript
// convex/generate.ts
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const generateGame = action({
  args: {
    content: v.string(),
    objective: v.string(),
    objectiveType: v.string(),
  },
  handler: async (ctx, args) => {
    // Actions CAN call external APIs
    // Actions CANNOT directly use ctx.db
    // Use ctx.runMutation / ctx.runQuery to access the database

    // Step 1: Generate questions (structured JSON)
    const questions = await generateQuestions(args);
    // Step 2: Generate HTML game from questions
    const gameHtml = await generateGameHtml(questions, args);
    const code = generateGameCode();

    const gameId = await ctx.runMutation(internal.games.create, {
      code,
      content: args.content,
      objective: args.objective,
      objectiveType: args.objectiveType,
      questions,
      gameHtml,
      topic: args.content.substring(0, 100),
    });

    return { gameId, code };
  },
});
```

## React Integration

```typescript
// Using queries and mutations from React
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

// Real-time query — re-renders automatically when data changes
const game = useQuery(api.games.getByCode, { code });
const players = useQuery(api.players.listByGame, { gameId: game?._id });

// Mutation — write data
const joinGame = useMutation(api.players.join);
await joinGame({ gameId, name: "Alex" });

// Action — call external APIs (for AI generation)
const generate = useAction(api.generate.generateGame);
const { code } = await generate({ content, objective, objectiveType });
```

**Hooks:**
- `useQuery(functionRef, args)` — subscribes to real-time data. Returns `undefined` while loading.
- `useMutation(functionRef)` — returns async function to call mutation
- `useAction(functionRef)` — returns async function to call action
- All imported from `"convex/react"`

## File Upload Pattern

```typescript
// convex/files.ts — Upload URL generation
import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Client-side upload flow:
// 1. Call generateUploadUrl mutation to get presigned URL
// 2. POST file to that URL with Content-Type header
// 3. Parse response JSON to get { storageId }
// 4. Pass storageId to another mutation/action for processing
```

```typescript
// Client-side upload
const generateUploadUrl = useMutation(api.files.generateUploadUrl);

const url = await generateUploadUrl();
const result = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});
const { storageId } = await result.json();
```

```typescript
// Get file URL for reading (in a query or mutation)
const url = await ctx.storage.getUrl(storageId);

// Get file blob for processing (in an action)
const blob = await ctx.storage.get(storageId);
```

## ConvexProvider Setup (Next.js App Router)

```typescript
// app/ConvexClientProvider.tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

```typescript
// app/layout.tsx
import { ConvexClientProvider } from "./ConvexClientProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
```

**Key points (from Convex docs):**
- Provider must be a `"use client"` component
- Use `ConvexProvider` from `"convex/react"` (not `ConvexReactProvider`)
- Client is `ConvexReactClient` from `"convex/react"`
- Env var must be `NEXT_PUBLIC_CONVEX_URL` (public prefix required for client-side)
