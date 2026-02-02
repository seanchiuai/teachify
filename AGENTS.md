# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages/layouts and route segments (e.g., `app/host/`, `app/play/`).
- `components/`: reusable React components; `components/ui/` reserved for shared UI primitives.
- `convex/`: Convex backend functions and schema; `_generated/` is auto-generated.
- `lib/`: shared utilities and helpers.
- `tests/`: Playwright E2E specs (`*.spec.ts`).
- `docs/`: product/design docs and progress tracking; `prompts/` contains phase prompts.
- `test-results/`, `test-screenshots/`: Playwright artifacts (avoid committing unless needed).

## Build, Test, and Development Commands
- `npm run dev`: runs Next.js and Convex together for local development.
- `npm run dev:frontend`: Next.js dev server only.
- `npm run dev:backend`: Convex dev server only.
- `npm run build`: production build.
- `npm run start`: serve the production build.
- `npm run lint`: ESLint via Next.js.
- `npx playwright test`: run E2E tests (uses `playwright.config.ts`, base URL `http://localhost:3000`).

## Coding Style & Naming Conventions
- TypeScript + React, App Router conventions; prefer functional components.
- Follow existing formatting: 2-space indentation, double quotes, semicolons.
- Component filenames are `PascalCase.tsx` (e.g., `FileUploadZone.tsx`).
- Convex modules use domain-based filenames (e.g., `games.ts`, `players.ts`) with exported functions in `camelCase`.
- Styling is Tailwind CSS; keep class names consistent with nearby code.

## Testing Guidelines
- E2E coverage uses Playwright in `tests/` with `@playwright/test`.
- Name new specs `*.spec.ts` and keep flows deterministic (avoid flaky waits).
- No unit-test runner is configured; if you add one, update `package.json` scripts.

## Commit & Pull Request Guidelines
- Commit messages are short and imperative; follow existing style (e.g., `Fix ...`, `Phase 3: ...`).
- PRs should include: summary, test commands run, linked issue/PRD item, and UI screenshots for visual changes.
- If a change affects phase tracking, update `docs/PRD.md`, `TASKS.md`, and `docs/development-progress.yaml`.

## Security & Configuration Tips
- Keep secrets in `.env.local` and never commit API keys.
- Required variables include `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, and `GEMINI_API_KEY`.

## Agent-Specific Notes
- See `CLAUDE.md` for the Ralph Loop workflow, phase boundaries, and skill references.
