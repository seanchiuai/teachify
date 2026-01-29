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

| Phase | Focus | User Stories |
|-------|-------|--------------|
| 1 | Project Setup & Upload | US-001, US-002 |
| 2 | AI Question Generation | US-003 |
| 3 | Real-time Game Engine | US-004, US-005, US-006 |
| 4 | Game UI & Leaderboard | US-007, US-008 |
| 5 | Polish & Demo Prep | All |

**Current phase:** `docs/development-progress.yaml`

## Ralph Loop Workflow

Each phase runs as one Ralph loop. Prompts live in `prompts/`. Run `/ralph-loop:help` before creating new prompts.

Per iteration:

**Read:**
1. `docs/PRD.md` → Acceptance criteria for phase's user stories
2. `.claude/skills/*/SKILL.md` → Overview, when to use
3. `.claude/skills/*/reference.md` → Code patterns, API examples
4. `docs/design.md` → UI specs (if building UI)

**Build → Test → Commit:**
- Build feature
- Test with agent-browser (mandatory)
- Commit only if tests pass

**After phase complete:**
1. Check off `[x]` in PRD.md acceptance criteria
2. Move tasks to "Complete" in TASKS.md
3. Human confirms → Update `development-progress.yaml`

## Skills

Implementation patterns live in `.claude/skills/`:
- `create-skill/` — How to create new skills
- `convex/` — Convex schema, queries, mutations, real-time subscriptions
- `gemini-ai/` — Gemini API integration, prompt engineering, structured output
- `game-engine/` — Game state machine, lobby, question flow
- `file-upload/` — File parsing (PDF, PPTX, DOCX), Convex storage
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
- Commit after every small change (when tests pass)
- Sacrifice grammar for conciseness
- Only work on current phase

**Never:** Skip tests. Store secrets outside `.gitignore`.
