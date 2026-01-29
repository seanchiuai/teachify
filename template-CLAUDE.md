# CLAUDE.md

{{APP_DESCRIPTION_ONE_LINE}}

## Tech Stack

{{TECH_STACK_LIST}}
<!-- Example:
- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- Convex (database, serverless functions, auth)
- Vercel AI SDK (AI calls)
-->

## Commands

```bash
{{COMMANDS}}
```
<!-- Example:
npm run dev        # Dev server
npm run build      # Production build
npm run test       # Run tests
npm run lint       # Linting
-->

## Development Phases

| Phase | Focus | User Stories |
|-------|-------|--------------|
{{PHASES_TABLE}}
<!-- Example:
| 1 | UI + Auth | US-001, US-002 |
| 2 | Core Features | US-003, US-004, US-005 |
| 3 | Integrations | US-006, US-007 |
| 4 | Production Deploy | US-008 |
-->

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
{{SKILLS_LIST}}
<!-- Example:
- `auth/`, `database/`, `api/`
- `ui-components/`, `deployment/`
-->

Use `/create-skill` to add new skills as needed.

## Environment Variables

```bash
{{ENV_VARS}}
```
<!-- Example:
DATABASE_URL=...
API_KEY=...
AUTH_SECRET=...
-->

## Boundaries

**Always:**
- Test every change before committing
- Commit after every small change (when tests pass)
- Sacrifice grammar for conciseness
- Only work on current phase

**Never:** Skip tests. Store secrets outside `.gitignore`.
