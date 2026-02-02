# CLAUDE.md

LessonPlay — Transform lesson materials into interactive classroom games using AI-generated pedagogically-grounded questions.

## Tech Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Convex (database, serverless functions, real-time sync, file storage)
- Gemini API (content analysis, question generation)
- Vercel (deployment)

## Commands

```bash
npm run dev        # Dev server (Next.js + Convex)
npx convex dev     # Convex dev server
npm run build      # Production build
npm run lint       # Linting
```

## Development Phases

| Phase | Focus | User Stories | Status |
|-------|-------|--------------|--------|
| 1 | Project Setup & Upload | US-001, US-002 | ✅ |
| 2 | AI Question Generation | US-003 | ✅ |
| 3 | Real-time Game Engine | US-004, US-005, US-006 | ✅ |
| 4 | Game UI & Leaderboard | US-007, US-008 | ✅ |
| 5 | Polish & Demo Prep | All | ✅ |

**Status:** All phases complete. See `docs/development-progress.yaml` for details.

## Development Workflow

**For new features:**
1. Read relevant skill docs in `.claude/skills/*/`
2. Check `docs/PRD.md` for acceptance criteria
3. Build → Test → Commit

**Key docs:**
- `docs/PRD.md` — Product requirements, acceptance criteria
- `docs/design.md` — UI specifications
- `docs/development-progress.yaml` — Phase history

## Skills

Implementation patterns live in `.claude/skills/`:
- `create-skill/` — How to create new skills
- `convex/` — Convex schema, queries, mutations, real-time subscriptions
- `gemini-ai/` — Gemini API integration, prompt engineering, structured output
- `game-engine/` — Game state machine, lobby, question flow
- `file-upload/` — File parsing (PDF, PPTX, DOCX, Pages), Convex storage
- `ui-components/` — shadcn/ui patterns, game UI, responsive layouts

Use `/create-skill` to add new skills as needed.

## Environment Variables

```bash
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=...
GEMINI_API_KEY=...
```

## Boundaries

**Always:**
- Test every change before committing
- Commit after every small change
- Sacrifice grammar for conciseness

**Never:** Skip tests. Store secrets outside `.gitignore`.
