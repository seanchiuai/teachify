# LessonPlay (Teachify) - Project Context

## Project Overview
LessonPlay is a real-time interactive learning platform that transforms lesson materials into engaging classroom games. Teachers upload content (PDFs, text), define learning objectives, and the system uses AI (Gemini) to generate pedagogically sound questions. Students join via a game code to play in real-time.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Backend & Database**: Convex (Realtime, Functions, Storage)
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (`@google/genai`)
- **Testing**: Playwright
- **Language**: TypeScript

## Architecture
- **Frontend (`app/`)**:
  - `app/page.tsx`: Landing page & File upload.
  - `app/host/[code]/`: Teacher's game control view.
  - `app/play/`: Student join & game view.
- **Backend (`convex/`)**:
  - `schema.ts`: Database schema definition (games, players, answers).
  - `generate.ts`: AI interaction for question generation.
  - `games.ts`: Game session management.
- **Game Engine (`lib/engine/`)**:
  - Contains core game logic, state management, and rendering systems.

## Development Workflow

### Prerequisites
- Node.js & npm
- Convex account & configured project
- Environment variables: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `GEMINI_API_KEY`

### Key Commands
- **Start Development Server**:
  ```bash
  npm run dev
  ```
  Runs Next.js (port 3000) and Convex dev server concurrently.

- **Run Tests**:
  ```bash
  npx playwright test
  ```
  *Note: No unit-test runner is currently configured.*

- **Linting**:
  ```bash
  npm run lint
  ```

## Conventions & Guidelines

### Coding Style
- **Components**: `PascalCase.tsx` (e.g., `FileUploadZone.tsx`).
- **Convex Functions**: `camelCase` (e.g., `createGame`, `joinGame`).
- **Formatting**: 2-space indentation, double quotes, semicolons.

### State Management
- Uses Convex for real-time state synchronization between host and players.

### AI Generation
- Prompts are structured to generate JSON output conforming to specific question types (Multiple Choice, Ordering, Categorization).

### Project Structure
- `convex/`: Backend functions and schema.
- `app/`: Next.js App Router pages.
- `components/`: Reusable UI components. `components/ui/` is for shared primitives.
- `lib/`: Utility functions and game engine logic.
- `docs/`: Project documentation (PRD, Design) and progress tracking.
- `tests/`: Playwright E2E specs.