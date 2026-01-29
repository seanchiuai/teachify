# LessonPlay — Design Document

## Overview

LessonPlay transforms lesson materials into **AI-generated interactive games**. Unlike template-based quiz tools, Gemini generates complete, unique game experiences as HTML/CSS/JavaScript — custom mechanics, narratives, and visuals tailored to each lesson's content.

**Core Innovation:** Every game is procedurally generated code, not a template fill-in. A French Revolution lesson might become an escape room; a photosynthesis lesson might become a factory simulation. The AI decides the game format.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           GENERATION TIME                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Teacher uploads content + objective                                    │
│                    ↓                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Gemini 2.0 Flash                            │   │
│  │                                                                  │   │
│  │  Input: Lesson content, learning objective, objective type       │   │
│  │  Output: Complete HTML/CSS/JS game file                          │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                    ↓                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Code Validator                                │   │
│  │                                                                  │   │
│  │  • Static analysis (no forbidden APIs)                           │   │
│  │  • Syntax validation                                             │   │
│  │  • SDK usage verification                                        │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                    ↓                                                    │
│  Store validated game code in Convex                                    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                            PLAY TIME                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Parent App (Next.js)                          │   │
│  │                                                                  │   │
│  │  • Convex client (real-time subscriptions)                       │   │
│  │  • Feedback overlay                                              │   │
│  │  • Sound player                                                  │   │
│  │  • PostMessage bridge                                            │   │
│  │                                                                  │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │              Sandboxed iframe (game runs here)            │  │   │
│  │  │                                                           │  │   │
│  │  │  • Generated HTML/CSS/JS                                  │  │   │
│  │  │  • SDK injected (communicates via postMessage)            │  │   │
│  │  │  • No network access, no storage access                   │  │   │
│  │  │                                                           │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                          ↕ postMessage                           │   │
│  │                                                                  │   │
│  │  Bridge receives SDK calls → Convex mutations/queries            │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## User Flow

```
Teacher: Homepage → Upload Content → Set Objective → Generate Game → Preview → Host
Student: /play → Enter Code + Name → Lobby → Play Generated Game → Leaderboard → Results
```

---

## Page Layouts

### Homepage (Teacher Upload)

```
┌────────────────────────────────────────────────────────────────────┐
│  LOGO  LessonPlay                                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │         📄  Drag & drop your lesson materials here          │ │
│  │             PDF, PPTX, DOCX                                  │ │
│  │                                                              │ │
│  │         ─── or paste text below ───                          │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Paste or type lesson content here...                        │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  What should students learn from this?                             │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  e.g. "Understand the causes of the French Revolution"       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Objective Type:                                                   │
│  [Understand] [Explain] [Apply] [Distinguish] [Perform] [Analyze] │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   ✨ Generate Game                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Game Generation (Loading State)

```
┌────────────────────────────────────────────────────────────────────┐
│  LOGO  LessonPlay                                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                                                                    │
│                    ✨ Generating Your Game ✨                      │
│                                                                    │
│                    ┌────────────────────┐                          │
│                    │  ████████░░░░░░░░  │                          │
│                    └────────────────────┘                          │
│                                                                    │
│                    Analyzing lesson content...                     │
│                    Designing game mechanics...                     │
│                    Writing game code...                            │
│                    Validating...                                   │
│                                                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Game Preview (Teacher)

```
┌────────────────────────────────────────────────────────────────────┐
│  LOGO  LessonPlay                              [Regenerate] [Host] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Game Preview                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │   ┌────────────────────────────────────────────────────┐    │ │
│  │   │                                                    │    │ │
│  │   │         [Live preview of generated game]           │    │ │
│  │   │                                                    │    │ │
│  │   │         Teacher can play through to test           │    │ │
│  │   │                                                    │    │ │
│  │   └────────────────────────────────────────────────────┘    │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ⚡ AI-generated game • ~3-5 min play time • 5 knowledge checks   │
│                                                                    │
│  Don't like this game? [🔄 Generate Different Version]            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Host View (/host/[code])

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│          Join at lessonplay.app/play                               │
│                                                                    │
│              ┌─────────────────┐                                   │
│              │   A B 3 X 7 K   │  ← Large game code                │
│              └─────────────────┘                                   │
│                                                                    │
│  Players (4):                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                              │
│  │ Alex │ │ Maya │ │ Zara │ │ Jake │  ← Animated join              │
│  └──────┘ └──────┘ └──────┘ └──────┘                              │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    ▶ Start Game                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ── During Game ──                                                 │
│                                                                    │
│  Live Leaderboard:                                                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  🥇 Maya     1,250                                           │ │
│  │  🥈 Alex       980                                           │ │
│  │  🥉 Zara       870                                           │ │
│  │  4. Jake       650                                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Players completed: 2/4                                            │
│                                                                    │
│  [End Game Early]                                                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Student Join (/play)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                       LessonPlay                                   │
│                                                                    │
│  Game Code:                                                        │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                                    │
│  │  │ │  │ │  │ │  │ │  │ │  │  ← 6 individual inputs              │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘                                    │
│                                                                    │
│  Your Name:                                                        │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Join Game                                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Student Lobby (/play/[code] — waiting)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                    Waiting for game to start...                    │
│                                                                    │
│                         ● ● ●                                      │
│                      (pulsing dots)                                │
│                                                                    │
│  Players joined:                                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                              │
│  │ You  │ │ Maya │ │ Zara │ │ Jake │                              │
│  └──────┘ └──────┘ └──────┘ └──────┘                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Student Game View (/play/[code] — playing)

The game view renders the AI-generated HTML inside a sandboxed iframe. The parent app provides:
- Feedback overlay (floats above iframe)
- Sound effects
- Leaderboard sidebar (optional)

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │                                                              │ │
│  │           [AI-Generated Game Renders Here]                   │ │
│  │                                                              │ │
│  │           Could be anything:                                 │ │
│  │           • Escape room puzzle                               │ │
│  │           • Resource management sim                          │ │
│  │           • Narrative adventure                              │ │
│  │           • Pattern matching challenge                       │ │
│  │           • Timeline builder                                 │ │
│  │           • Mystery investigation                            │ │
│  │                                                              │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ✅ Correct! +50 pts                                       │   │
│  │  The Bastille was a symbol of royal authority.             │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ↑ Feedback overlay (appears on sdk.showFeedback calls)           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Results View (Host — Post-Game)

```
┌────────────────────────────────────────────────────────────────────┐
│  Game Results                                                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Final Leaderboard:                                                │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  🥇 Maya     1,850                                           │ │
│  │  🥈 Alex     1,420                                           │ │
│  │  🥉 Zara     1,180                                           │ │
│  │  4. Jake       950                                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Knowledge Check Results:                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  bastille_question     ████████████████░░░░  75% correct     │ │
│  │  bread_prices          ████████████████████  92% correct     │ │
│  │  royal_debt            ██████████████░░░░░░  68% correct     │ │
│  │  timeline_order        ████████░░░░░░░░░░░░  42% correct  ⚠  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ⚠ Students struggled with: Ordering revolutionary events         │
│                                                                    │
│  [Play Again] [New Game]                                           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Game SDK Specification

Generated games communicate with the parent app via a JavaScript SDK injected into the iframe. All methods use postMessage under the hood.

### SDK Methods

```typescript
interface LessonPlaySDK {
  // ============ SCORING ============

  /**
   * Add or subtract points from player's score
   * @param points - Positive or negative integer
   * @param reason - Optional reason for analytics
   */
  addPoints(points: number, reason?: string): Promise<{ newScore: number }>;

  /**
   * Get current player's score
   */
  getMyScore(): Promise<number>;

  // ============ ANSWERS & KNOWLEDGE CHECKS ============

  /**
   * Check an answer and record it for analytics
   * @param questionKey - Unique identifier for this question (for analytics)
   * @param answer - Player's answer
   * @param correctAnswers - Array of acceptable answers
   * @param fuzzyMatch - If true, checks if answer contains any correct answer
   * @returns Whether the answer was correct
   */
  checkAnswer(
    questionKey: string,
    answer: string,
    correctAnswers: string[],
    fuzzyMatch?: boolean
  ): Promise<boolean>;

  /**
   * Record an answer without checking (for custom validation)
   */
  recordAnswer(
    questionKey: string,
    answer: string,
    isCorrect: boolean,
    metadata?: object
  ): Promise<void>;

  // ============ GAME STATE PERSISTENCE ============

  /**
   * Save arbitrary game state (persists across refreshes)
   */
  saveState(key: string, value: any): Promise<void>;

  /**
   * Get a saved state value
   */
  getState(key: string): Promise<any>;

  /**
   * Get all saved state
   */
  getAllState(): Promise<Record<string, any>>;

  // ============ REAL-TIME UPDATES ============

  /**
   * Subscribe to leaderboard changes
   */
  onLeaderboardUpdate(callback: (entries: LeaderboardEntry[]) => void): void;

  /**
   * Subscribe to player list changes
   */
  onPlayersUpdate(callback: (players: Player[]) => void): void;

  // ============ PLAYER INFO ============

  /**
   * Get current player info
   */
  getMe(): Promise<{ id: string; name: string; score: number }>;

  /**
   * Get all players in the game
   */
  getPlayers(): Promise<Player[]>;

  // ============ GAME FLOW ============

  /**
   * Signal that player has completed the game
   */
  endGame(): Promise<void>;

  // ============ UI HELPERS ============

  /**
   * Show a feedback toast overlay (rendered by parent app)
   * @param type - 'success' | 'error' | 'info'
   * @param message - Message to display
   * @param duration - How long to show (ms), default 2000
   */
  showFeedback(type: 'success' | 'error' | 'info', message: string, duration?: number): void;

  /**
   * Play a sound effect
   * @param sound - Predefined sound name
   */
  playSound(sound: 'correct' | 'wrong' | 'tick' | 'click' | 'victory' | 'dramatic'): void;

  /**
   * Start a countdown timer (rendered by parent app)
   * @param seconds - Duration
   * @param onComplete - Callback when timer ends
   */
  startTimer(seconds: number, onComplete: () => void): void;

  /**
   * Stop the current timer
   */
  stopTimer(): void;
}

interface LeaderboardEntry {
  name: string;
  score: number;
}

interface Player {
  id: string;
  name: string;
  score: number;
}
```

### SDK Implementation (Injected into iframe)

```javascript
class LessonPlaySDK {
  constructor() {
    this.pendingCalls = new Map();
    this.subscriptions = new Map();

    window.addEventListener('message', (e) => {
      // Handle responses to SDK calls
      if (e.data.responseId) {
        const resolve = this.pendingCalls.get(e.data.responseId);
        if (resolve) {
          resolve(e.data.result);
          this.pendingCalls.delete(e.data.responseId);
        }
      }
      // Handle subscription updates
      if (e.data.subscription) {
        const callback = this.subscriptions.get(e.data.subscription);
        if (callback) callback(e.data.value);
      }
      // Handle timer complete
      if (e.data.type === 'TIMER_COMPLETE') {
        if (this.timerCallback) this.timerCallback();
      }
    });
  }

  _call(method, params = {}) {
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      this.pendingCalls.set(id, resolve);
      parent.postMessage({ type: 'SDK_CALL', method, params, id }, '*');
    });
  }

  _subscribe(channel, callback) {
    this.subscriptions.set(channel, callback);
    parent.postMessage({ type: 'SUBSCRIBE', channel }, '*');
  }

  // Scoring
  addPoints(points, reason = '') {
    return this._call('addPoints', { points, reason });
  }

  getMyScore() {
    return this._call('getMyScore');
  }

  // Answers
  async checkAnswer(questionKey, answer, correctAnswers, fuzzyMatch = false) {
    const isCorrect = fuzzyMatch
      ? correctAnswers.some(c => answer.toLowerCase().includes(c.toLowerCase()))
      : correctAnswers.map(c => c.toLowerCase()).includes(answer.toLowerCase());

    await this._call('recordAnswer', { questionKey, answer, isCorrect });
    return isCorrect;
  }

  recordAnswer(questionKey, answer, isCorrect, metadata = {}) {
    return this._call('recordAnswer', { questionKey, answer, isCorrect, metadata });
  }

  // State
  saveState(key, value) {
    return this._call('saveState', { key, value });
  }

  getState(key) {
    return this._call('getState', { key });
  }

  getAllState() {
    return this._call('getAllState');
  }

  // Real-time
  onLeaderboardUpdate(callback) {
    this._subscribe('leaderboard', callback);
  }

  onPlayersUpdate(callback) {
    this._subscribe('players', callback);
  }

  // Player info
  getMe() {
    return this._call('getMe');
  }

  getPlayers() {
    return this._call('getPlayers');
  }

  // Game flow
  endGame() {
    return this._call('endGame');
  }

  // UI helpers (fire-and-forget)
  showFeedback(type, message, duration = 2000) {
    parent.postMessage({ type: 'SHOW_FEEDBACK', feedbackType: type, message, duration }, '*');
  }

  playSound(sound) {
    parent.postMessage({ type: 'PLAY_SOUND', sound }, '*');
  }

  startTimer(seconds, onComplete) {
    this.timerCallback = onComplete;
    parent.postMessage({ type: 'START_TIMER', seconds }, '*');
  }

  stopTimer() {
    parent.postMessage({ type: 'STOP_TIMER' }, '*');
  }
}

window.sdk = new LessonPlaySDK();
```

---

## Security Model

### Layer 1: Code Validation (Before Storage)

```typescript
function validateGeneratedCode(code: string): ValidationResult {
  const forbidden = [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bdocument\.cookie\b/,
    /\bwindow\.open\b/,
    /\beval\s*\(/,
    /\bFunction\s*\(/,
    /\bnew\s+Function\b/,
    /\bimport\s*\(/,
    /\bimportScripts\b/,
    /\bWebSocket\b/,
    /\bWorker\b/,
    /\bSharedWorker\b/,
    /\bServiceWorker\b/,
    /\bindexedDB\b/,
    /\bpostMessage\s*\([^)]*,\s*['"][^'"]+['"]\)/, // postMessage to specific origins
  ];

  for (const pattern of forbidden) {
    if (pattern.test(code)) {
      return { valid: false, reason: `Forbidden pattern: ${pattern}` };
    }
  }

  // Must use sdk.* for external communication
  if (!code.includes('sdk.')) {
    return { valid: false, reason: 'Game must use SDK for functionality' };
  }

  return { valid: true };
}
```

### Layer 2: Sandboxed iframe (At Runtime)

```html
<iframe
  srcDoc={gameHTML}
  sandbox="allow-scripts"
  <!-- NO allow-same-origin, NO allow-forms, NO allow-popups -->
  style="width: 100%; height: 100%; border: none;"
/>
```

The `sandbox="allow-scripts"` without `allow-same-origin`:
- Prevents access to parent's cookies/storage
- Prevents access to parent's DOM
- Only allows postMessage communication

### Layer 3: Content Security Policy

```html
<!-- Injected into generated game HTML -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  script-src 'unsafe-inline';
  style-src 'unsafe-inline';
  img-src data: blob:;
">
```

---

## Component Hierarchy

```
App
├── ConvexProvider
└── Router
    ├── / → HomePage
    │   ├── FileUploadZone
    │   ├── TextContentInput
    │   ├── ObjectiveInput
    │   ├── ObjectiveTypeSelector
    │   └── GenerateButton
    │
    ├── /preview/[gameId] → GamePreview
    │   ├── GameRunner (iframe sandbox)
    │   ├── RegenerateButton
    │   └── HostButton
    │
    ├── /host/[code] → HostView
    │   ├── GameCodeDisplay
    │   ├── PlayerList (real-time)
    │   ├── LobbyControls
    │   ├── LiveLeaderboard
    │   └── GameControls
    │
    ├── /play → JoinPage
    │   ├── GameCodeInput
    │   ├── NameInput
    │   └── JoinButton
    │
    └── /play/[code] → StudentGameView
        ├── LobbyWaiting
        ├── GameRunner (iframe sandbox)
        │   └── [AI-generated game]
        ├── FeedbackOverlay
        ├── TimerDisplay
        ├── SoundPlayer
        └── LeaderboardSidebar (optional)

Shared Components:
├── GameRunner
│   ├── Sandbox iframe
│   ├── PostMessage bridge
│   └── SDK injection
├── FeedbackOverlay
├── LeaderboardDisplay
└── SoundPlayer
```

---

## Data Model

### Convex Schema

```typescript
// schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    code: v.string(),                    // 6-char join code
    content: v.string(),                 // Original lesson content
    objective: v.string(),               // Learning objective
    objectiveType: v.union(
      v.literal("understand"),
      v.literal("explain"),
      v.literal("apply"),
      v.literal("distinguish"),
      v.literal("perform"),
      v.literal("analyze")
    ),
    generatedCode: v.string(),           // The AI-generated HTML/CSS/JS
    status: v.union(
      v.literal("generating"),
      v.literal("ready"),
      v.literal("lobby"),
      v.literal("playing"),
      v.literal("complete")
    ),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"]),

  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    score: v.number(),
    isFinished: v.boolean(),
    joinedAt: v.number(),
    finishedAt: v.optional(v.number()),
  })
    .index("by_game", ["gameId"])
    .index("by_game_score", ["gameId", "score"]),

  playerState: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    state: v.any(),                      // Arbitrary game state per player
  })
    .index("by_player_game", ["playerId", "gameId"]),

  answers: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    questionKey: v.string(),             // Identifier for the knowledge check
    answer: v.string(),
    isCorrect: v.boolean(),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_question", ["gameId", "questionKey"])
    .index("by_player", ["playerId"]),

  scoreEvents: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    points: v.number(),
    reason: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_player", ["playerId"]),
});
```

---

## AI Generation

### Prompt Strategy

```typescript
const systemPrompt = `You are a creative educational game developer. Your task is to generate a complete, playable HTML/CSS/JavaScript game based on lesson content.

IMPORTANT RULES:
1. Create a UNIQUE, ORIGINAL game experience — not a quiz, not flashcards
2. The game mechanics should naturally incorporate the learning content
3. Include 3-5 knowledge checkpoints that test the learning objective
4. Use the SDK for all scoring, persistence, and feedback
5. Game should take 3-5 minutes to complete
6. Make it visually polished and engaging

AVAILABLE SDK METHODS:
- sdk.addPoints(points, reason) — Add/subtract points
- sdk.checkAnswer(questionKey, answer, correctAnswers, fuzzyMatch) — Check and record answer
- sdk.saveState(key, value) / sdk.getState(key) / sdk.getAllState() — Persist game state
- sdk.showFeedback(type, message, duration) — Show success/error/info toast
- sdk.playSound(sound) — Play 'correct'|'wrong'|'tick'|'click'|'victory'|'dramatic'
- sdk.startTimer(seconds, onComplete) / sdk.stopTimer() — Countdown timer
- sdk.endGame() — Signal game completion
- sdk.onLeaderboardUpdate(callback) — Subscribe to leaderboard
- sdk.getMe() — Get current player info

GAME IDEAS (pick one or invent your own):
- Escape room: solve puzzles using lesson knowledge to unlock doors
- Factory/simulation: manage a process related to the content
- Investigation: gather clues, interview witnesses, solve a mystery
- Journey/quest: navigate a map, overcome obstacles with knowledge
- Building: construct something by correctly answering questions
- Timeline: place events in order, uncover a story
- Survival: make choices to survive, wrong answers have consequences

TECHNICAL REQUIREMENTS:
- Output a single HTML file with embedded <style> and <script> tags
- Use modern CSS (flexbox, grid, transitions, animations)
- Initialize game state on load, handle async SDK calls properly
- Subscribe to leaderboard updates for multiplayer awareness
- Call sdk.endGame() when player completes the game

FORBIDDEN (code will be rejected):
- fetch, XMLHttpRequest, WebSocket — no network calls
- localStorage, sessionStorage, cookies — use sdk.saveState instead
- eval, Function constructor — no dynamic code execution
- External scripts or stylesheets — everything must be inline
- window.open, popups — no new windows
- document.cookie — no cookie access

OUTPUT FORMAT:
Return ONLY the HTML code. No markdown, no explanation, no code blocks.
Start with <!DOCTYPE html> and end with </html>.`;

const userPrompt = `
LESSON CONTENT:
${content}

LEARNING OBJECTIVE:
${objective}

OBJECTIVE TYPE: ${objectiveType}

Generate a creative, unique game that teaches this content through gameplay.
The game should feel like a real game, not an educational quiz with decoration.
`;
```

### Example Generated Game

Input: French Revolution lesson, "Understand the causes and key events"

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:;">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #f0e6d3;
      min-height: 100vh;
      overflow-x: hidden;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    h1 {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }

    .narrative {
      background: rgba(0,0,0,0.3);
      border-left: 4px solid #d4a574;
      padding: 1rem;
      margin: 1rem 0;
      font-style: italic;
      line-height: 1.6;
    }

    .torch-container {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin: 2rem 0;
    }

    .torch {
      font-size: 4rem;
      cursor: pointer;
      opacity: 0.3;
      transition: all 0.3s ease;
      filter: grayscale(100%);
    }

    .torch.lit {
      opacity: 1;
      filter: grayscale(0%) drop-shadow(0 0 20px #ff6b35);
      animation: flicker 0.5s infinite alternate;
    }

    @keyframes flicker {
      from { transform: scale(1) rotate(-2deg); }
      to { transform: scale(1.05) rotate(2deg); }
    }

    .evidence-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin: 1rem 0;
    }

    .evidence-card {
      background: rgba(255,255,255,0.1);
      border: 2px solid #d4a574;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .evidence-card:hover {
      background: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }

    .evidence-card.collected {
      border-color: #4ade80;
      background: rgba(74,222,128,0.2);
    }

    .evidence-card.wrong {
      border-color: #ef4444;
      background: rgba(239,68,68,0.2);
    }

    .evidence-card h3 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .evidence-card p {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .quiz-section {
      background: rgba(0,0,0,0.4);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1.5rem 0;
    }

    .quiz-section input {
      width: 100%;
      padding: 0.75rem;
      font-size: 1rem;
      border: 2px solid #d4a574;
      border-radius: 4px;
      background: rgba(0,0,0,0.3);
      color: #f0e6d3;
      margin: 0.5rem 0;
    }

    .quiz-section input:focus {
      outline: none;
      border-color: #fbbf24;
    }

    button {
      background: linear-gradient(135deg, #d4a574, #b8860b);
      color: #1a1a2e;
      border: none;
      padding: 0.75rem 2rem;
      font-size: 1rem;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(212,165,116,0.4);
    }

    .leaderboard {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      border-radius: 8px;
      padding: 1rem;
      min-width: 150px;
    }

    .leaderboard h4 {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      color: #d4a574;
    }

    .leaderboard-entry {
      font-size: 0.85rem;
      padding: 0.25rem 0;
    }

    .phase-complete {
      text-align: center;
      padding: 3rem;
    }

    .phase-complete h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div id="game"></div>
  </div>
  <div id="leaderboard" class="leaderboard">
    <h4>🏆 Leaderboard</h4>
    <div id="leaderboard-entries"></div>
  </div>

  <script>
    // Game State
    let state = {
      phase: 'intro',
      torchesLit: [],
      evidence: [],
      quizzesPassed: []
    };

    // Initialize
    async function init() {
      // Load saved state if any
      const saved = await sdk.getAllState();
      if (saved && saved.phase) {
        state = { ...state, ...saved };
      }

      // Subscribe to leaderboard
      sdk.onLeaderboardUpdate(renderLeaderboard);

      render();
    }

    function renderLeaderboard(entries) {
      const container = document.getElementById('leaderboard-entries');
      container.innerHTML = entries.slice(0, 5).map((e, i) => `
        <div class="leaderboard-entry">
          ${['🥇','🥈','🥉','4.','5.'][i]} ${e.name}: ${e.score}
        </div>
      `).join('');
    }

    async function saveAndRender() {
      await sdk.saveState('phase', state.phase);
      await sdk.saveState('torchesLit', state.torchesLit);
      await sdk.saveState('evidence', state.evidence);
      await sdk.saveState('quizzesPassed', state.quizzesPassed);
      render();
    }

    function render() {
      const game = document.getElementById('game');

      if (state.phase === 'intro') {
        game.innerHTML = `
          <h1>🕯️ The Revolutionary's Secret 🕯️</h1>
          <div class="narrative">
            Paris, 1793. You've discovered a hidden chamber beneath the Bastille ruins.
            Ancient documents lie scattered in the darkness. Light the torches to reveal
            what really sparked the Revolution...
          </div>
          <div class="torch-container">
            ${[0,1,2].map(i => `
              <span class="torch ${state.torchesLit.includes(i) ? 'lit' : ''}"
                    onclick="lightTorch(${i})">🔥</span>
            `).join('')}
          </div>
          <p style="text-align: center; opacity: 0.7;">Click the torches to illuminate the chamber</p>
        `;
      }

      else if (state.phase === 'evidence') {
        game.innerHTML = `
          <h1>📜 Gather the Evidence 📜</h1>
          <div class="narrative">
            The chamber is illuminated! Before you lie documents that reveal the true
            causes of the Revolution. Select the evidence that proves what drove the
            people to revolt. Choose wisely — not all documents are relevant.
          </div>
          <div class="evidence-grid">
            <div class="evidence-card ${state.evidence.includes('bread') ? 'collected' : ''}"
                 onclick="collectEvidence('bread')">
              <h3>📋 Bread Price Records</h3>
              <p>Official documents showing the cost of bread doubled in 1789, causing widespread hunger.</p>
            </div>
            <div class="evidence-card ${state.evidence.includes('debt') ? 'collected' : ''}"
                 onclick="collectEvidence('debt')">
              <h3>💰 Royal Debt Ledger</h3>
              <p>Accounts revealing France's massive debt from wars and extravagant spending.</p>
            </div>
            <div class="evidence-card ${state.evidence.includes('weather') ? 'wrong' : ''}"
                 onclick="collectEvidence('weather')">
              <h3>🌧️ Weather Almanac</h3>
              <p>Rainfall patterns and temperature records from the 1780s.</p>
            </div>
            <div class="evidence-card ${state.evidence.includes('theater') ? 'wrong' : ''}"
                 onclick="collectEvidence('theater')">
              <h3>🎭 Theater Programs</h3>
              <p>Entertainment schedules from the Palace of Versailles.</p>
            </div>
          </div>
          ${state.evidence.filter(e => ['bread', 'debt'].includes(e)).length >= 2 ? `
            <div class="quiz-section">
              <p><strong>The evidence points to a pivotal day.</strong> On July 14, 1789,
              an angry mob stormed a fortress-prison that symbolized royal tyranny.
              What was its name?</p>
              <input type="text" id="bastille-answer" placeholder="Enter the name...">
              <button onclick="checkBastille()">Submit</button>
            </div>
          ` : `
            <p style="text-align: center; margin-top: 1rem; opacity: 0.7;">
              Find the 2 key pieces of evidence to proceed...
            </p>
          `}
        `;
      }

      else if (state.phase === 'timeline') {
        game.innerHTML = `
          <h1>⏳ The Path to Revolution ⏳</h1>
          <div class="narrative">
            You've proven your understanding of the causes. Now, demonstrate that you
            know how events unfolded. Answer these questions about the Revolution's
            key moments.
          </div>
          <div class="quiz-section">
            <p><strong>Question 1:</strong> Which social class made up 97% of France's
            population but had almost no political power?</p>
            <input type="text" id="estate-answer" placeholder="The _____ Estate">
            <button onclick="checkEstate()">Submit</button>
          </div>
        `;
      }

      else if (state.phase === 'final') {
        game.innerHTML = `
          <h1>👑 The Final Question 👑</h1>
          <div class="narrative">
            You've uncovered the truth. One final question remains: Who was the radical
            leader known for his role in the Reign of Terror, eventually executed by
            the same method he used on others?
          </div>
          <div class="quiz-section">
            <input type="text" id="robespierre-answer" placeholder="Enter the name...">
            <button onclick="checkRobespierre()">Submit</button>
          </div>
        `;
      }

      else if (state.phase === 'complete') {
        game.innerHTML = `
          <div class="phase-complete">
            <h1>🏛️ Liberté, Égalité, Fraternité 🏛️</h1>
            <div class="narrative">
              You have uncovered the secrets of the Revolution. The causes — economic
              hardship, royal excess, and social inequality — led to one of history's
              most transformative events. The people's cry for liberty echoes still.
            </div>
            <p style="margin-top: 2rem; font-size: 1.2rem;">
              🎉 Congratulations! You've completed the game! 🎉
            </p>
          </div>
        `;
      }
    }

    // Game Actions
    async function lightTorch(index) {
      if (state.torchesLit.includes(index)) return;

      state.torchesLit.push(index);
      await sdk.addPoints(10, 'Lit torch ' + (index + 1));
      sdk.playSound('dramatic');

      if (state.torchesLit.length >= 3) {
        state.phase = 'evidence';
        sdk.showFeedback('success', 'The chamber is revealed!', 2000);
      }

      await saveAndRender();
    }

    async function collectEvidence(type) {
      if (state.evidence.includes(type)) return;

      const correct = ['bread', 'debt'];

      if (correct.includes(type)) {
        state.evidence.push(type);
        await sdk.addPoints(50, 'Collected evidence: ' + type);
        sdk.showFeedback('success', 'Critical evidence collected!');
        sdk.playSound('correct');
      } else {
        state.evidence.push(type);
        await sdk.addPoints(-20, 'Wrong evidence: ' + type);
        sdk.showFeedback('error', 'This document isn\'t relevant to the Revolution\'s causes.');
        sdk.playSound('wrong');
      }

      await saveAndRender();
    }

    async function checkBastille() {
      const answer = document.getElementById('bastille-answer').value;
      const correct = await sdk.checkAnswer('bastille', answer, ['bastille', 'the bastille'], true);

      if (correct) {
        await sdk.addPoints(100, 'Correct: Bastille');
        sdk.showFeedback('success', 'The Bastille! Its fall marked the Revolution\'s beginning.');
        sdk.playSound('victory');
        state.phase = 'timeline';
        state.quizzesPassed.push('bastille');
        await saveAndRender();
      } else {
        sdk.showFeedback('error', 'Not quite. Think about the famous prison in Paris...');
        sdk.playSound('wrong');
      }
    }

    async function checkEstate() {
      const answer = document.getElementById('estate-answer').value;
      const correct = await sdk.checkAnswer('estate', answer, ['third', '3rd', 'third estate'], true);

      if (correct) {
        await sdk.addPoints(100, 'Correct: Third Estate');
        sdk.showFeedback('success', 'The Third Estate — commoners who sparked the Revolution!');
        sdk.playSound('correct');
        state.phase = 'final';
        state.quizzesPassed.push('estate');
        await saveAndRender();
      } else {
        sdk.showFeedback('error', 'Remember: France had three estates. Which one was the common people?');
        sdk.playSound('wrong');
      }
    }

    async function checkRobespierre() {
      const answer = document.getElementById('robespierre-answer').value;
      const correct = await sdk.checkAnswer('robespierre', answer, ['robespierre', 'maximilien robespierre'], true);

      if (correct) {
        await sdk.addPoints(150, 'Correct: Robespierre');
        sdk.showFeedback('success', 'Robespierre — the architect of the Terror, consumed by his own creation.');
        sdk.playSound('victory');
        state.phase = 'complete';
        state.quizzesPassed.push('robespierre');
        await saveAndRender();

        // End the game
        setTimeout(() => sdk.endGame(), 3000);
      } else {
        sdk.showFeedback('error', 'This leader\'s name is synonymous with the Reign of Terror...');
        sdk.playSound('wrong');
      }
    }

    // Start
    init();
  </script>
</body>
</html>
```

---

## Styling

### Design Tokens

```css
/* Colors — vibrant classroom palette */
--color-primary: #6C5CE7;      /* Purple — brand, buttons */
--color-success: #00B894;      /* Green — correct answers */
--color-warning: #FDCB6E;      /* Yellow — timer warning */
--color-error: #E17055;        /* Red-orange — wrong answers */

--color-bg: #F8F9FA;           /* Light gray background */
--color-surface: #FFFFFF;      /* Card backgrounds */
--color-border: #DFE6E9;       /* Subtle borders */

--color-text: #2D3436;         /* Near-black text */
--color-text-muted: #636E72;   /* Secondary text */
```

### Component Styling

Parent app components (not generated games) use shadcn/ui with Tailwind. Generated games have full CSS freedom within their sandbox.

---

## Responsive Behavior

### Desktop (> 1024px)
- Full layout, host view optimized for projection
- Game preview side-by-side with controls

### Tablet (768px - 1024px)
- Same as desktop, slightly condensed
- Student game view works well at this size

### Mobile (< 768px)
- Student-focused: game fills screen
- Host view scrollable but not primary use case
- Game code input fills width

---

## States

### Generation States
- "Generate Game" button shows spinner + "Generating..." text
- Progress indicators: Analyzing → Designing → Writing → Validating
- On failure: "Generation failed. Try again." with retry button

### Game States
- **generating** — AI is writing the game
- **ready** — Game created, teacher can preview
- **lobby** — Players joining, waiting for host to start
- **playing** — Game in progress
- **complete** — Game finished, results available

### Error States
- File upload: "Unsupported file type" inline error
- AI generation: "Failed to generate game. Try again." with retry
- Game validation failed: "Generated game was invalid. Regenerating..."
- Game join: "Game not found" or "Game already finished"
- Iframe error: Fallback UI with "Game encountered an error"

### Empty States
- No players in lobby: "Waiting for students to join..."
- No scores yet: "Game in progress..."

---

## Future Enhancements

- [ ] Multiplayer sync (players see each other's progress)
- [ ] Custom sound uploads for generated games
- [ ] Image generation for game visuals
- [ ] Teacher editing of generated code
- [ ] Game templates marketplace
- [ ] Difficulty settings passed to AI

---

**Document Version:** 2.0
**Updated:** January 2025
**Architecture:** AI-Generated HTML/CSS/JS Games with Convex Backend
