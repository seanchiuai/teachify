---
name: convex
description: Convex database schema, queries, mutations, actions, and real-time subscriptions for LessonPlay
---

# Convex

Convex is the backend for LessonPlay — database, serverless functions, real-time sync, and file storage in one platform.

## Overview

- **Schema**: Typed tables in `convex/schema.ts` using `defineSchema` / `defineTable` from `"convex/server"` and `v` validators from `"convex/values"`
- **Queries**: Read data with automatic real-time subscriptions
- **Mutations**: Write data transactionally
- **Actions**: Run external API calls (Gemini) in serverless functions
- **Internal Functions**: Use `internalMutation` / `internalQuery` for server-only functions
- **File Storage**: Upload via `generateUploadUrl()`, read via `ctx.storage.getUrl()` or `ctx.storage.get()`
- **Real-time**: All queries automatically re-run when underlying data changes — no polling or WebSocket setup

## When to Use This Skill

- Defining or modifying the database schema
- Writing queries, mutations, or actions
- Setting up real-time subscriptions in React
- Uploading/serving files via Convex storage
- Connecting Next.js frontend to Convex backend

## Key Concepts

### Schema Definition
Schema lives in `convex/schema.ts`. All tables are typed. Use `v` validators for field types. Convex auto-adds `_id` and `_creationTime` to all documents.

### Function Types
| Type | Use For | Can Call External APIs? | DB Access |
|------|---------|----------------------|-----------|
| `query` | Reading data, real-time | No | `ctx.db` (read) |
| `mutation` | Writing data | No | `ctx.db` (read/write) |
| `action` | External APIs, file processing | Yes | Via `ctx.runQuery` / `ctx.runMutation` only |

### Public vs Internal Functions
- **Public** (`query`, `mutation`, `action`): Callable from clients via `api.xxx.yyy`
- **Internal** (`internalQuery`, `internalMutation`): Only callable server-side via `internal.xxx.yyy`
- Actions should call internal mutations (not public ones) for security

### Real-time Pattern
React components use `useQuery()` hook — returns `undefined` while loading, then auto-updates when underlying data changes. No manual polling needed.

### File Storage
Three-step upload: (1) call `generateUploadUrl()` mutation, (2) POST file to URL, (3) store returned `storageId`. Read files with `ctx.storage.getUrl(id)` in queries or `ctx.storage.get(id)` in actions.

### React Provider Setup
Wrap app in `ConvexProvider` from `"convex/react"` with a `ConvexReactClient` instance. Must be a `"use client"` component in Next.js App Router.

## Related Files

- `convex/schema.ts` — Table definitions
- `convex/games.ts` — Game queries/mutations
- `convex/players.ts` — Player queries/mutations
- `convex/answers.ts` — Answer submissions
- `convex/generate.ts` — AI generation action
- `convex/files.ts` — File upload/parsing
- `app/ConvexClientProvider.tsx` — React provider

## Reference Files

- [reference.md](reference.md) — Code examples and patterns
