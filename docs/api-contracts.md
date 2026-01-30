# LessonPlay API Contracts

This document defines the TypeScript interfaces, component props, and Convex function signatures for all phases.

---

## Data Types

### Core Types

```typescript
// Objective types for pedagogical question generation
type ObjectiveType =
  | 'understand'   // Conceptual understanding questions
  | 'explain'      // Explain concepts in own words
  | 'apply'        // Apply knowledge to scenarios
  | 'distinguish'  // Compare and contrast
  | 'perform'      // Step-by-step procedures
  | 'analyze';     // Break down complex ideas

// Game states in order of progression
type GameState =
  | 'generating'   // AI generating questions + HTML
  | 'lobby'        // Waiting for players
  | 'playing'      // Game active, questions in progress
  | 'question'     // Currently showing a question
  | 'results'      // Showing results between questions
  | 'complete';    // Game finished

// Question types supported
type QuestionType =
  | 'multiple_choice'   // Single correct answer
  | 'ordering'          // Arrange items in order
  | 'categorization';   // Group items into categories
```

### Database Schema (Convex)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    code: v.string(),           // 6-char unique game code
    topic: v.string(),          // Brief topic summary
    objective: v.string(),      // Teacher's learning objective
    objectiveType: v.union(
      v.literal("understand"),
      v.literal("explain"),
      v.literal("apply"),
      v.literal("distinguish"),
      v.literal("perform"),
      v.literal("analyze")
    ),
    content: v.string(),        // Full lesson content text
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
    gameHtml: v.string(),       // AI-generated self-contained HTML
    state: v.union(
      v.literal("generating"),
      v.literal("lobby"),
      v.literal("playing"),
      v.literal("question"),
      v.literal("results"),
      v.literal("complete")
    ),
    currentQuestion: v.number(), // 0-indexed current question
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
    score: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_player", ["playerId"])
    .index("by_game_question", ["gameId", "questionIndex"]),
});
```

### TypeScript Interfaces

```typescript
// Types derived from schema (for frontend use)

interface Game {
  _id: Id<"games">;
  _creationTime: number;
  code: string;
  topic: string;
  objective: string;
  objectiveType: ObjectiveType;
  content: string;
  questions: Question[];
  gameHtml: string;
  state: GameState;
  currentQuestion: number;
  fileId?: Id<"_storage">;
}

interface Question {
  type: QuestionType;
  question: string;
  options: string[];
  correct: string | string[];
  explanation: string;
  misconception: string;
}

interface Player {
  _id: Id<"players">;
  _creationTime: number;
  gameId: Id<"games">;
  name: string;
  score: number;
}

interface Answer {
  _id: Id<"answers">;
  _creationTime: number;
  gameId: Id<"games">;
  playerId: Id<"players">;
  questionIndex: number;
  answer: string | string[];
  correct: boolean;
  timeMs: number;
  score: number;
}
```

---

## Convex Functions

### Games (convex/games.ts)

```typescript
// Create a new game
export const createGame = mutation({
  args: {
    content: v.string(),
    objective: v.string(),
    objectiveType: v.union(
      v.literal("understand"),
      v.literal("explain"),
      v.literal("apply"),
      v.literal("distinguish"),
      v.literal("perform"),
      v.literal("analyze")
    ),
    fileId: v.optional(v.id("_storage")),
  },
  returns: v.object({ code: v.string(), gameId: v.id("games") }),
  handler: async (ctx, args) => { /* ... */ },
});

// Get game by code
export const getGameByCode = query({
  args: { code: v.string() },
  returns: v.union(v.null(), /* Game schema */),
  handler: async (ctx, { code }) => { /* ... */ },
});

// Update game with generated content
export const updateGameContent = mutation({
  args: {
    gameId: v.id("games"),
    questions: v.array(/* Question schema */),
    gameHtml: v.string(),
    state: v.literal("lobby"),
  },
  handler: async (ctx, args) => { /* ... */ },
});

// Start game (lobby → playing)
export const startGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => { /* ... */ },
});

// Advance to next question
export const nextQuestion = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => { /* ... */ },
});

// End game
export const endGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => { /* ... */ },
});
```

### Players (convex/players.ts)

```typescript
// Join a game
export const joinGame = mutation({
  args: {
    code: v.string(),
    name: v.string(),
  },
  returns: v.object({
    playerId: v.id("players"),
    gameId: v.id("games"),
  }),
  handler: async (ctx, { code, name }) => { /* ... */ },
});

// Get players for a game
export const getPlayers = query({
  args: { gameId: v.id("games") },
  returns: v.array(/* Player schema */),
  handler: async (ctx, { gameId }) => { /* ... */ },
});

// Get leaderboard (sorted by score)
export const getLeaderboard = query({
  args: { gameId: v.id("games") },
  returns: v.array(v.object({
    playerId: v.id("players"),
    name: v.string(),
    score: v.number(),
    rank: v.number(),
  })),
  handler: async (ctx, { gameId }) => { /* ... */ },
});
```

### Answers (convex/answers.ts)

```typescript
// Submit an answer
export const submitAnswer = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    questionIndex: v.number(),
    answer: v.union(v.string(), v.array(v.string())),
    timeMs: v.number(),
  },
  returns: v.object({
    correct: v.boolean(),
    score: v.number(),
  }),
  handler: async (ctx, args) => { /* ... */ },
});

// Get answer count for current question
export const getAnswerCount = query({
  args: {
    gameId: v.id("games"),
    questionIndex: v.number(),
  },
  returns: v.object({
    total: v.number(),
    correct: v.number(),
  }),
  handler: async (ctx, args) => { /* ... */ },
});
```

### Analytics (convex/analytics.ts)

```typescript
// Get game analytics for results dashboard
export const getGameAnalytics = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    overall: v.object({
      totalPlayers: v.number(),
      avgScore: v.number(),
      questionsAnswered: v.number(),
    }),
    perQuestion: v.array(v.object({
      questionIndex: v.number(),
      question: v.string(),
      correctPercent: v.number(),
      commonWrongAnswers: v.array(v.object({
        answer: v.string(),
        count: v.number(),
      })),
      misconception: v.string(),
    })),
  }),
  handler: async (ctx, { gameId }) => { /* ... */ },
});
```

### Files (convex/files.ts)

```typescript
// Generate upload URL
export const generateUploadUrl = mutation({
  returns: v.string(),
  handler: async (ctx) => { /* ... */ },
});
```

### Actions (convex/actions/)

```typescript
// Parse uploaded file (convex/actions/parseFile.ts)
export const parseFile = action({
  args: { fileId: v.id("_storage") },
  returns: v.object({
    text: v.string(),
    pageCount: v.optional(v.number()),
  }),
  handler: async (ctx, { fileId }) => { /* ... */ },
});

// Generate game (convex/actions/generateGame.ts)
export const generateGame = action({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => { /* ... */ },
});
```

---

## Component Props

### Phase 1 Components

```typescript
// components/FileUploadZone.tsx
interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onTextPaste?: (text: string) => void;
  acceptedTypes?: string[];  // Default: ['.pdf', '.pptx', '.docx']
  maxSizeMB?: number;        // Default: 10
  disabled?: boolean;
}

// components/TextContentInput.tsx
interface TextContentInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minLength?: number;  // Show warning if below
}

// components/ObjectiveInput.tsx
interface ObjectiveInputProps {
  value: string;
  onChange: (objective: string) => void;
  placeholder?: string;
}

// components/ObjectiveTypeSelector.tsx
interface ObjectiveTypeSelectorProps {
  value: ObjectiveType;
  onChange: (type: ObjectiveType) => void;
}

// components/GenerateButton.tsx
interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  loadingText?: string;  // "Generating..."
}
```

### Phase 3 Components

```typescript
// components/GameCodeDisplay.tsx
interface GameCodeDisplayProps {
  code: string;
  joinUrl?: string;  // Default: "lessonplay.app/play"
}

// components/PlayerList.tsx
interface PlayerListProps {
  players: Player[];
  maxDisplay?: number;  // Show "+N more" if exceeded
}

// components/LobbyControls.tsx
interface LobbyControlsProps {
  playerCount: number;
  onStartGame: () => void;
  loading?: boolean;
}

// components/GameCodeInput.tsx
interface GameCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;  // Called when 6 chars entered
  error?: string;
}

// components/LobbyWaiting.tsx
interface LobbyWaitingProps {
  players: Player[];
  gameCode: string;
}

// components/GameIframe.tsx
interface GameIframeProps {
  html: string;
  gameId: string;
  onReady: () => void;
  onAnswer: (data: AnswerData) => void;
  onError: (message: string) => void;
}

interface AnswerData {
  questionIndex: number;
  answer: string | string[];
  timeMs: number;
}

// components/TimerDisplay.tsx
interface TimerDisplayProps {
  seconds: number;
  total: number;  // For progress bar
  warning?: number;  // Show warning color when below
}

// components/HostControls.tsx
interface HostControlsProps {
  currentQuestion: number;
  totalQuestions: number;
  responseCount: number;
  totalPlayers: number;
  correctPercent?: number;
  onNextQuestion: () => void;
  onShowResults: () => void;
  onEndGame: () => void;
}

// components/StudentGameView.tsx
interface StudentGameViewProps {
  game: Game;
  player: Player;
  onAnswer: (answer: string | string[]) => void;
}
```

### Phase 4 Components

```typescript
// components/Leaderboard.tsx
interface LeaderboardProps {
  gameId: Id<"games">;
  currentPlayerId?: Id<"players">;
  showAll?: boolean;  // false = top 5
  animated?: boolean;
}

// components/FeedbackOverlay.tsx
interface FeedbackOverlayProps {
  correct: boolean;
  points: number;
  explanation: string;
  correctAnswer?: string;  // Show if wrong
  onContinue: () => void;
  autoDismissMs?: number;  // Default: 5000
}

// components/ResultsDashboard.tsx
interface ResultsDashboardProps {
  gameId: Id<"games">;
}

// components/QuestionAnalytics.tsx
interface QuestionAnalyticsProps {
  questionIndex: number;
  question: string;
  correctPercent: number;
  commonWrongAnswers: { answer: string; count: number }[];
  misconception: string;
  expanded?: boolean;
}

// components/FinalResults.tsx
interface FinalResultsProps {
  gameId: Id<"games">;
  playerId?: Id<"players">;  // If student view
  isHost: boolean;
  onPlayAgain?: () => void;
  onNewGame?: () => void;
}
```

---

## MessageChannel Protocol

### Message Types (Parent → Iframe)

```typescript
// Initialize port transfer
interface InitPortMessage {
  type: 'INIT_PORT';
}

// Start the game
interface StartGameMessage {
  type: 'START_GAME';
  questions: Question[];
  timePerQuestion: number;  // seconds
}

// Move to next question
interface NextQuestionMessage {
  type: 'NEXT_QUESTION';
  questionIndex: number;
}

// Timer expired
interface TimeUpMessage {
  type: 'TIME_UP';
}

// End the game
interface EndGameMessage {
  type: 'END_GAME';
}

type ParentToIframeMessage =
  | InitPortMessage
  | StartGameMessage
  | NextQuestionMessage
  | TimeUpMessage
  | EndGameMessage;
```

### Message Types (Iframe → Parent)

```typescript
// Game ready to receive commands
interface GameReadyMessage {
  type: 'GAME_READY';
}

// Player submitted an answer
interface AnswerSubmittedMessage {
  type: 'ANSWER_SUBMITTED';
  questionIndex: number;
  answer: string | string[];
  timeMs: number;
}

// Game finished (from iframe's perspective)
interface GameOverMessage {
  type: 'GAME_OVER';
  finalScore: number;
}

// Error occurred in iframe
interface ErrorMessage {
  type: 'ERROR';
  message: string;
}

type IframeToParentMessage =
  | GameReadyMessage
  | AnswerSubmittedMessage
  | GameOverMessage
  | ErrorMessage;
```

---

## Utility Functions

### Scoring (lib/scoring.ts)

```typescript
const BASE_CORRECT = 1000;
const MAX_TIME_BONUS = 500;
const TIME_LIMIT_MS = 30000;

export function calculateScore(correct: boolean, timeMs: number): number {
  if (!correct) return 0;

  const timeBonus = Math.max(0,
    Math.round(MAX_TIME_BONUS * (1 - timeMs / TIME_LIMIT_MS))
  );

  return BASE_CORRECT + timeBonus;
}
```

### Game Code Generation (lib/gameCode.ts)

```typescript
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // No I, O, 0, 1

export function generateGameCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
```

### HTML Validation (lib/validateHtml.ts)

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGameHtml(html: string): ValidationResult {
  const errors: string[] = [];

  // Must have postMessage/MessageChannel
  if (!html.includes('postMessage') && !html.includes('MessageChannel')) {
    errors.push('Missing postMessage/MessageChannel code');
  }

  // No external URLs
  const externalUrlPattern = /(src|href)=["'](https?:\/\/)/gi;
  if (externalUrlPattern.test(html)) {
    errors.push('Contains external URLs');
  }

  // Must have viewport meta
  if (!html.includes('viewport')) {
    errors.push('Missing viewport meta tag');
  }

  return { valid: errors.length === 0, errors };
}
```

---

## Route Structure

```
/                       → HomePage (upload + generate)
/host/[code]           → HostView (lobby + game control)
/host/[code]/results   → ResultsDashboard (analytics)
/play                  → JoinPage (enter code + name)
/play/[code]           → StudentGameView (lobby + game)
```

---

**Document Version:** 1.0
**Last Updated:** January 30, 2025
