# PRD: LessonPlay MVP

## Introduction

LessonPlay is a web app that enables teachers to instantly transform lesson materials into interactive classroom games. Teachers upload content (PDFs, slides, documents, or plain text) along with learning objectives, and AI generates a unique, playable HTML game — complete with questions, UI, and game mechanics — rendered in a sandboxed iframe.

**Target Users:** K-12 and university teachers who want to create engaging, learning-focused classroom activities quickly.

**Core Value:** Reduce teacher game-creation time from 30+ minutes to under 2 minutes while generating unique games every time that test understanding — not just recall.

---

## Goals

- Reduce teacher preparation time from 30+ minutes to under 2 minutes
- Generate questions that test understanding, not just recall, matched to objective types
- Provide actionable per-question analytics showing student comprehension gaps

---

## User Stories

### US-001: Upload Lesson Content
**Description:** As a teacher, I want to upload my lesson materials (PDF, PPTX, DOCX, or paste text) so that the system can generate game questions from my actual content.

**Acceptance Criteria:**
- [x] Drag-and-drop file upload zone accepts PDF, PPTX, DOCX
- [x] Text area allows pasting or typing content directly
- [x] Uploaded files are stored in Convex file storage
- [x] File content is extracted/parsed into text for AI processing
- [x] Typecheck passes
- [x] Verify in browser

### US-002: Define Learning Objectives
**Description:** As a teacher, I want to specify what students should learn and select an objective type so that generated questions match my pedagogical goals.

**Acceptance Criteria:**
- [x] Input field for free-text learning objective ("What should students be able to do?")
- [x] Objective type selector with 6 options: Understand, Explain, Apply, Distinguish, Perform, Analyze
- [ ] Selected objective type influences AI question generation
- [x] Typecheck passes
- [x] Verify in browser

### US-003: Generate Game via AI
**Description:** As a teacher, I want the system to generate a unique, playable HTML game from my content so that I get a ready-to-play interactive experience in seconds.

**Acceptance Criteria:**
- [ ] Gemini API processes uploaded content + objective + objective type
- [ ] Step 1: Generates 8-10 questions as structured JSON (questions include: type, question text, options, correct answer(s), explanation, misconception)
- [ ] Step 2: Generates a self-contained HTML game (inline CSS + JS, no external dependencies) using the questions
- [ ] Generated HTML implements the postMessage communication protocol (GAME_READY, ANSWER_SUBMITTED, GAME_OVER)
- [ ] Generated HTML is mobile-responsive (viewport meta, relative units, pointer events, 44px+ touch targets)
- [ ] HTML is validated before storage (contains postMessage code, no external URLs)
- [ ] Unique 6-character game code generated
- [ ] Game stored in Convex with questions + HTML string
- [ ] Generation completes in under 30 seconds
- [ ] Typecheck passes
- [ ] Verify in browser

### US-004: Host a Game Session
**Description:** As a teacher, I want to host a live game session so that I can control question flow and monitor student responses in real-time.

**Acceptance Criteria:**
- [ ] Host view at /host/[code] shows large game code
- [ ] Real-time player list updates as students join
- [ ] "Start Game" button enabled when 1+ players joined
- [ ] Host controls: Next Question, Show Results
- [ ] Live response count and % correct per question
- [ ] Typecheck passes
- [ ] Verify in browser

### US-005: Join and Play a Game
**Description:** As a student, I want to join a game by code and play an AI-generated interactive game so that I can participate without creating an account.

**Acceptance Criteria:**
- [ ] /play page with game code input (6 characters) and display name
- [ ] No account required to join
- [ ] Lobby waiting screen shows other players joining
- [ ] Game renders in a sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`)
- [ ] Parent communicates with iframe via MessageChannel (not raw postMessage)
- [ ] Answers flow from iframe → parent → Convex for validation and scoring
- [ ] Timer runs in parent app (authoritative), iframe shows visual timer only
- [ ] Typecheck passes
- [ ] Verify in browser

### US-006: Real-time Game Sync
**Description:** As a player, I want the game state to sync in real-time so that all participants see questions and results simultaneously.

**Acceptance Criteria:**
- [ ] Convex real-time subscriptions sync game state across all clients
- [ ] Game state machine: lobby → playing → question → results → complete
- [ ] Player joins reflected instantly on host and other players
- [ ] Answer submissions update host view in real-time
- [ ] Supports 5+ simultaneous players
- [ ] Typecheck passes
- [ ] Verify in browser

### US-007: View Game Results
**Description:** As a teacher, I want to see per-question analytics after the game so that I can identify where students struggled.

**Acceptance Criteria:**
- [ ] Per-question breakdown: % correct, common wrong answers
- [ ] Misconception tags shown for frequently missed questions
- [ ] Overall class performance summary
- [ ] Typecheck passes
- [ ] Verify in browser

### US-008: Leaderboard
**Description:** As a student, I want to see my ranking during and after the game so that I stay motivated and engaged.

**Acceptance Criteria:**
- [ ] Leaderboard shown between questions (top players)
- [ ] Final leaderboard at game end with full rankings
- [ ] Score based on correctness and speed
- [ ] Typecheck passes
- [ ] Verify in browser

---

## Functional Requirements

### Content Upload
- FR-1: Accept PDF, PPTX, DOCX file uploads via drag-and-drop
- FR-2: Accept pasted/typed text as alternative input
- FR-3: Parse uploaded files to extract text content
- FR-4: Store files in Convex file storage

### AI Question Generation
- FR-5: Send content + objective + type to Gemini API
- FR-6: Step 1: Generate 8-10 questions with structured JSON output
- FR-7: Support 3 question types: multiple_choice, ordering, categorization
- FR-8: Include explanation and misconception fields per question
- FR-9: Step 2: Generate a self-contained HTML game from questions (inline CSS/JS, no external deps)
- FR-10: Generated HTML must implement postMessage protocol (GAME_READY, ANSWER_SUBMITTED, GAME_OVER)
- FR-11: Validate generated HTML before storage (has postMessage, no external URLs)

### Game Rendering (Sandboxed Iframe)
- FR-12: Render generated HTML in `<iframe srcdoc={html} sandbox="allow-scripts" />`
- FR-13: Never use `allow-same-origin` with `allow-scripts` (security)
- FR-14: Establish private MessageChannel between parent and iframe
- FR-15: Parent app owns game state — iframe is a rendering engine only
- FR-16: Timer runs in parent (authoritative), iframe shows visual countdown
- FR-17: Use `key={gameId}` on iframe to avoid Firefox caching bugs

### Game Engine
- FR-18: Generate unique 6-character game codes
- FR-19: Manage game state machine (lobby → playing → question → results → complete)
- FR-20: Real-time sync via Convex subscriptions
- FR-21: Track answer submissions with timing data
- FR-22: Parent validates answers from iframe postMessage and writes scores to Convex

### Results & Analytics
- FR-23: Calculate scores based on correctness and speed
- FR-24: Display per-question analytics for teacher
- FR-25: Show leaderboard between questions and at game end

---

## Non-Goals (Out of Scope for MVP)

- **Teacher Accounts:** No login/signup — anonymous game creation for hackathon
- **Student Progress Tracking:** No cross-session analytics
- **Adaptive Difficulty:** Questions don't adjust mid-game
- **YouTube URL Input:** Text/file upload only for MVP
- **LMS Integrations:** No Google Classroom, Canvas, etc.

---

## Architecture: AI-Generated HTML Games

### Overview

Instead of pre-built game templates, LessonPlay generates a unique HTML game every time using Gemini. The generated game is a self-contained HTML file (inline CSS + JS) rendered in a sandboxed iframe. The parent Next.js app owns all game state; the iframe is a dumb renderer.

### Two-Step Generation Pipeline

1. **Generate Questions** — Gemini produces structured JSON (questions, answers, explanations, misconceptions). This is used for server-side scoring and analytics.
2. **Generate HTML Game** — Gemini takes the questions + game config and produces a complete, playable HTML document. This runs in the student's browser.

### Iframe Sandbox Architecture

```
Parent (Next.js + Convex)          Iframe (AI-generated HTML)
┌─────────────────────────┐        ┌─────────────────────────┐
│ Game state machine       │        │ Renders questions        │
│ Timer (authoritative)    │◄──────►│ Captures user input      │
│ Score validation         │  Msg   │ Plays animations         │
│ Convex real-time sync    │ Channel│ Shows visual timer       │
│ Leaderboard              │        │ Visual feedback           │
└─────────────────────────┘        └─────────────────────────┘
```

### PostMessage Protocol

Communication via MessageChannel (not raw postMessage with wildcard origin):

```
Parent → Iframe:
  INIT_PORT        — transfer MessageChannel port
  START_GAME       — begin with question data
  NEXT_QUESTION    — advance to next question
  TIME_UP          — timer expired
  END_GAME         — game over

Iframe → Parent:
  GAME_READY       — loaded and waiting
  ANSWER_SUBMITTED — { questionIndex, answer, timeMs }
  GAME_OVER        — { finalScore }
  ERROR            — something broke
```

### Security

- `sandbox="allow-scripts"` only — never add `allow-same-origin`
- No external resource loading (no `src=`/`href=` to other domains)
- No localStorage/sessionStorage (blocked by sandbox)
- Validate HTML before injection (check for postMessage code, no external URLs)

---

## Technical Considerations

### Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** Convex
- **Auth:** None (MVP — anonymous)
- **UI:** Tailwind CSS + shadcn/ui
- **AI:** Gemini API
- **Deployment:** Vercel

### Data Schema
```typescript
// games table
// Convex auto-adds _id: Id<"games"> and _creationTime: number
interface Game {
  code: string;              // 6-char unique code
  topic: string;             // extracted/pasted content summary
  objective: string;         // teacher's learning objective
  objectiveType: "understand" | "explain" | "apply" | "distinguish" | "perform" | "analyze";
  content: string;           // full extracted text
  questions: Question[];     // generated questions (JSON) — used for scoring/analytics
  gameHtml: string;          // AI-generated self-contained HTML game (rendered in sandboxed iframe)
  state: "lobby" | "playing" | "question" | "results" | "complete";
  currentQuestion: number;   // index of active question
  fileId?: Id<"_storage">;   // optional uploaded file reference
}

interface Question {
  type: "multiple_choice" | "ordering" | "categorization";
  question: string;
  options: string[];
  correct: string | string[];  // single answer or ordered/grouped answers
  explanation: string;
  misconception: string;
}

// players table
// Convex auto-adds _id: Id<"players"> and _creationTime: number
interface Player {
  gameId: Id<"games">;
  name: string;
  score: number;
}

// answers table
// Convex auto-adds _id: Id<"answers"> and _creationTime: number
interface Answer {
  gameId: Id<"games">;
  playerId: Id<"players">;
  questionIndex: number;
  answer: string | string[];   // player's response
  correct: boolean;
  timeMs: number;              // response time
}
```

---

## Success Metrics

- Complete flow from upload to gameplay in under 60 seconds
- Support 5+ simultaneous players with real-time sync
- Generate questions that are recognizably better than basic recall quizzes
- Display per-question analytics showing comprehension gaps

---

## Open Questions

1. Should we support YouTube URL input in MVP or defer?
2. What's the optimal timer duration per question type?

<!--
## Resolved Questions

1. **Auth approach:** No auth for MVP — anonymous game creation and play
2. **Database:** Convex chosen for built-in real-time sync and file storage
-->
