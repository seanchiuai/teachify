---
name: convex
description: Convex database schema, queries, mutations, actions, and real-time subscriptions for LessonPlay
---

# Convex

Convex is the backend for LessonPlay — database, serverless functions, real-time sync, and file storage in one platform.

## Overview

- **Schema**: Typed tables for games, players, answers
- **Queries**: Read data with automatic real-time subscriptions
- **Mutations**: Write data transactionally
- **Actions**: Run external API calls (Gemini) in serverless functions
- **File Storage**: Upload and serve lesson material files
- **Real-time**: All queries automatically re-run when underlying data changes

## When to Use This Skill

- Defining or modifying the database schema
- Writing queries, mutations, or actions
- Setting up real-time subscriptions in React
- Uploading/serving files via Convex storage
- Connecting Next.js frontend to Convex backend

## Key Concepts

### Schema Definition
Schema lives in `convex/schema.ts`. All tables are typed. Use `v` validators for field types.

### Function Types
| Type | Use For | Can Call External APIs? |
|------|---------|----------------------|
| Query | Reading data, real-time | No |
| Mutation | Writing data | No |
| Action | External APIs, file processing | Yes |

### Real-time Pattern
React components use `useQuery()` hook — data updates automatically when the underlying table changes. No manual polling or WebSocket setup needed.

### File Storage
Upload files via `generateUploadUrl()` mutation, store the returned `Id<"_storage">`, serve via `getUrl()`.

## Related Files

- `convex/schema.ts` — Table definitions
- `convex/games.ts` — Game queries/mutations
- `convex/players.ts` — Player queries/mutations
- `convex/answers.ts` — Answer submissions
- `convex/generate.ts` — AI generation action

## Reference Files

- [reference.md](reference.md) — Code examples and patterns
