# LessonPlay — Design Document

## Overview

Clean, classroom-friendly UI focused on two experiences: teacher (upload + host) and student (join + play). Large text, bold colors, minimal chrome. Designed to be projected on a classroom screen (host view) and used on student devices (phones/tablets).

---

## User Flow

```
Teacher: Homepage → Upload Content → Set Objective → Generate Game → Host View → Monitor → Results
Student: /play → Enter Code + Name → Lobby → Answer Questions → Feedback → Leaderboard → Final Results
```

---

## Page Layouts

### Homepage (Teacher Upload)

```
┌────────────────────────────────────────────────────────────────────┐
│  LOGO  LessonPlay                                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │         📄  Drag & drop your lesson materials here           │  │
│  │             PDF, PPTX, DOCX                                  │  │
│  │                                                              │  │
│  │         ─── or paste text below ───                          │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Paste or type lesson content here...                        │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  What should students learn from this?                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  e.g. "Understand the causes of the French Revolution"       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Objective Type:                                                   │
│  [Understand] [Explain] [Apply] [Distinguish] [Perform] [Analyze] │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   ✨ Generate Game                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Host View (/host/[code])

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│          Join at lessonplay.app/play                                │
│                                                                    │
│              ┌─────────────────┐                                   │
│              │   A B 3 X 7 K   │  ← Large game code               │
│              └─────────────────┘                                   │
│                                                                    │
│  Players (4):                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                              │
│  │ Alex │ │ Maya │ │ Zara │ │ Jake │  ← Animated join              │
│  └──────┘ └──────┘ └──────┘ └──────┘                              │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    ▶ Start Game                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ── During Game ──                                                 │
│  Q3/10: "Why can't a cell survive without mitochondria?"           │
│  Responses: 12/15  |  Timer: 0:23  |  Correct: 67%                │
│                                                                    │
│  [Next Question]  [Show Results]                                   │
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
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                                   │
│  │  │ │  │ │  │ │  │ │  │ │  │  ← 6 individual inputs             │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘                                   │
│                                                                    │
│  Your Name:                                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Join Game                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Student Game View (/play/[code])

The game view has two layers: the parent app (timer, leaderboard, score) and the iframe (AI-generated game).

```
┌────────────────────────────────────────────────────────────────────┐
│  Score: 3,100                                   ⏱ 0:23            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │          AI-Generated Game (sandboxed iframe)                │  │
│  │                                                              │  │
│  │    Each game is unique — the AI generates the entire         │  │
│  │    game UI, interactions, and animations as HTML/CSS/JS.     │  │
│  │    Could be a quiz wheel, drag-and-drop, word puzzle,        │  │
│  │    flashcard flip, matching game, etc.                       │  │
│  │                                                              │  │
│  │    Communicates answers back to parent via MessageChannel.   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ── Between Questions (shown by parent, not iframe) ──             │
│  ✅ Correct! +850 pts                                              │
│  Mitochondria produce ATP, the cell's energy currency.             │
│                                                                    │
│  ── Leaderboard ──                                                 │
│  1. Maya    4,200                                                  │
│  2. Alex    3,850                                                  │
│  3. You     3,100                                                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Key:** The iframe renders the interactive game. The parent app handles timer, scoring, leaderboard, and feedback overlays outside the iframe.

### Results View (Host — Post-Game)

```
┌────────────────────────────────────────────────────────────────────┐
│  Game Results                                                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Overall: 72% correct  |  15 players  |  10 questions              │
│                                                                    │
│  Q1  ████████████████████░░░░  82%  ✓                              │
│  Q2  ██████████████████░░░░░░  73%  ✓                              │
│  Q3  ████████████░░░░░░░░░░░░  48%  ⚠ Misconception: students     │
│                                        confuse ATP with DNA         │
│  Q4  ██████████████████████░░  91%  ✓                              │
│  ...                                                               │
│                                                                    │
│  Comprehension Gaps:                                               │
│  • Q3, Q7: Students struggle with energy vs. genetic processes     │
│  • Q9: Ordering confusion — steps 3 and 4 frequently swapped      │
│                                                                    │
│  Leaderboard:                                                      │
│  1. Maya     4,200                                                 │
│  2. Alex     3,850                                                 │
│  3. Zara     3,100                                                 │
│  ...                                                               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── ConvexProvider
└── Router
    ├── / → HomePage
    │   ├── FileUploadZone (drag-and-drop)
    │   ├── TextContentInput (textarea)
    │   ├── ObjectiveInput (text field)
    │   ├── ObjectiveTypeSelector (6 buttons)
    │   └── GenerateButton (with loading spinner)
    ├── /host/[code] → HostView
    │   ├── GameCodeDisplay
    │   ├── PlayerList (real-time)
    │   ├── LobbyControls (Start Game)
    │   ├── QuestionDisplay (current question + stats)
    │   ├── HostControls (Next Question, Show Results)
    │   └── ResultsDashboard (per-question analytics)
    ├── /play → JoinPage
    │   ├── GameCodeInput (6-char)
    │   ├── NameInput
    │   └── JoinButton
    └── /play/[code] → StudentGameView
        ├── LobbyWaiting
        ├── GameIframe (sandboxed, renders AI-generated HTML game)
        │   └── Uses MessageChannel for parent ↔ iframe communication
        ├── TimerDisplay (authoritative timer in parent)
        ├── ScoreDisplay (current score)
        ├── FeedbackOverlay (correct/wrong + explanation, shown by parent)
        ├── Leaderboard (between questions, shown by parent)
        └── FinalResults
```

**Note:** Individual question type components (MultipleChoiceQuestion, OrderingQuestion, CategorizationQuestion) are no longer needed — the AI generates the entire game UI inside the iframe. The parent app only renders the wrapper (timer, score, leaderboard, feedback).

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
--color-border: #DFE6E9;      /* Subtle borders */

--color-text: #2D3436;         /* Near-black text */
--color-text-muted: #636E72;   /* Secondary text */

/* Answer option colors (Kahoot-style) */
--color-option-a: #E74C3C;     /* Red */
--color-option-b: #3498DB;     /* Blue */
--color-option-c: #F39C12;     /* Orange */
--color-option-d: #27AE60;     /* Green */
```

### Component Styling

Using shadcn/ui components with Tailwind. Large touch targets for student mobile use. Bold answer option colors for classroom projection visibility. Prefer utility classes over custom CSS.

---

## Responsive Behavior

### Desktop (> 1024px)
- Full layout, host view optimized for projection
- Side-by-side answer options in 2x2 grid

### Tablet (768px - 1024px)
- Same as desktop, slightly condensed
- Student view works well at this size

### Mobile (< 768px)
- Student-focused: stacked answer options, large tap targets
- Host view scrollable but not primary use case on mobile
- Game code input fills width

---

## States

### Loading States
- "Generate Game" button shows spinner + "Generating game..." text (two-step: questions then HTML)
- Skeleton cards while game data loads
- Pulsing dots in lobby while waiting for game start
- iframe shows loading indicator until GAME_READY message received

### Error States
- File upload: "Unsupported file type" inline error
- AI generation: "Failed to generate questions. Try again." with retry button
- Game join: "Game not found" or "Game already started" messages

### Empty States
- No players in lobby: "Waiting for students to join..."
- No answers yet: "Waiting for responses..."

---

## Incomplete / TBD

- [ ] Animations for player join and answer feedback
- [ ] Sound effects toggle for classroom use
- [ ] Dark mode for host view (projector-friendly option)

---

**Document Version:** 1.0
**Updated:** January 29, 2025
