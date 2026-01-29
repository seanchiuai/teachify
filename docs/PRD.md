# PRD: LessonPlay MVP

## Introduction

LessonPlay is a web app that enables teachers to instantly transform lesson materials into interactive classroom games. Teachers upload content (PDFs, slides, documents, or plain text) along with learning objectives, and AI generates pedagogically-grounded activities that match game mechanics to learning objective types.

**Target Users:** K-12 and university teachers who want to create engaging, learning-focused classroom activities quickly.

**Core Value:** Reduce teacher game-creation time from 30+ minutes to under 2 minutes while generating questions that test understanding — not just recall.

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
- [ ] Drag-and-drop file upload zone accepts PDF, PPTX, DOCX
- [ ] Text area allows pasting or typing content directly
- [ ] Uploaded files are stored in Convex file storage
- [ ] File content is extracted/parsed into text for AI processing
- [ ] Typecheck passes
- [ ] Verify in browser

### US-002: Define Learning Objectives
**Description:** As a teacher, I want to specify what students should learn and select an objective type so that generated questions match my pedagogical goals.

**Acceptance Criteria:**
- [ ] Input field for free-text learning objective ("What should students be able to do?")
- [ ] Objective type selector with 6 options: Understand, Explain, Apply, Distinguish, Perform, Analyze
- [ ] Selected objective type influences AI question generation
- [ ] Typecheck passes
- [ ] Verify in browser

### US-003: Generate Game via AI
**Description:** As a teacher, I want the system to generate 8-10 pedagogically-grounded questions from my content so that I get a ready-to-play game in seconds.

**Acceptance Criteria:**
- [ ] Gemini API processes uploaded content + objective + objective type
- [ ] Returns 8-10 questions as structured JSON
- [ ] Questions include: type, question text, options, correct answer(s), explanation, misconception
- [ ] Mix of question types (multiple_choice, ordering, categorization) based on objective type
- [ ] Unique 6-character game code generated
- [ ] Game stored in Convex with questions
- [ ] Generation completes in under 15 seconds
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
**Description:** As a student, I want to join a game by code and answer questions so that I can participate without creating an account.

**Acceptance Criteria:**
- [ ] /play page with game code input (6 characters) and display name
- [ ] No account required to join
- [ ] Lobby waiting screen shows other players joining
- [ ] Questions display with answer options and timer
- [ ] Immediate feedback: correct/wrong with explanation
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
- FR-6: Generate 8-10 questions with structured JSON output
- FR-7: Support 3 question types: multiple_choice, ordering, categorization
- FR-8: Include explanation and misconception fields per question

### Game Engine
- FR-9: Generate unique 6-character game codes
- FR-10: Manage game state machine (lobby → playing → question → results → complete)
- FR-11: Real-time sync via Convex subscriptions
- FR-12: Track answer submissions with timing data

### Results & Analytics
- FR-13: Calculate scores based on correctness and speed
- FR-14: Display per-question analytics for teacher
- FR-15: Show leaderboard between questions and at game end

---

## Non-Goals (Out of Scope for MVP)

- **Teacher Accounts:** No login/signup — anonymous game creation for hackathon
- **Student Progress Tracking:** No cross-session analytics
- **Adaptive Difficulty:** Questions don't adjust mid-game
- **YouTube URL Input:** Text/file upload only for MVP
- **LMS Integrations:** No Google Classroom, Canvas, etc.

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
interface Game {
  code: string;              // 6-char unique code
  topic: string;             // extracted/pasted content summary
  objective: string;         // teacher's learning objective
  objectiveType: "understand" | "explain" | "apply" | "distinguish" | "perform" | "analyze";
  content: string;           // full extracted text
  questions: Question[];     // generated questions (JSON)
  state: "lobby" | "playing" | "question" | "results" | "complete";
  currentQuestion: number;   // index of active question
  createdAt: number;
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
interface Player {
  gameId: Id<"games">;
  name: string;
  score: number;
  joinedAt: number;
}

// answers table
interface Answer {
  gameId: Id<"games">;
  playerId: Id<"players">;
  questionIndex: number;
  answer: string | string[];   // player's response
  correct: boolean;
  timeMs: number;              // response time
  createdAt: number;
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
