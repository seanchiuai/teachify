# Product Requirements Document
# LessonPlay
## Transform Lesson Materials into Interactive Learning Games

**Version:** 1.0  
**Date:** January 29, 2025  
**Author:** Sean  
**Status:** Draft - Hackathon MVP

## Executive Summary

LessonPlay is a web application that enables teachers to instantly transform their lesson materials into interactive classroom games. Teachers upload content (PDFs, slides, documents, or plain text) along with their learning objectives, and the system uses AI to generate pedagogically-grounded activities that reinforce actual learning outcomes rather than surface-level trivia.

The key differentiator is that LessonPlay matches game mechanics to learning objective types. Conceptual understanding gets different activities than procedural knowledge. The result is engagement that serves learning, not engagement for its own sake.

## Problem Statement

Existing classroom game tools like Kahoot, Quizizz, and Blooket are fundamentally trivia engines. Teachers manually write questions, and the games are engagement wrappers around basic recall. This creates several problems:

- **Time-intensive:** Teachers spend significant time manually creating questions from their materials
- **Shallow assessment:** Most questions test recall rather than understanding or application
- **One-size-fits-all:** Same game mechanics regardless of what type of knowledge is being taught
- **No misconception handling:** Wrong answers don't inform teaching; they're just wrong

## Goals and Objectives

### Primary Goals

- Reduce teacher preparation time from 30+ minutes to under 2 minutes
- Generate questions that test understanding, not just recall
- Match game mechanics to learning objective types
- Provide actionable insights on student comprehension

### Success Metrics (Hackathon Demo)

- Complete flow from upload to gameplay in under 60 seconds
- Support 5+ simultaneous players with real-time sync
- Generate questions that judges recognize as "better than typical quiz questions"
- Display per-question analytics showing comprehension gaps

## User Flow

### Teacher Flow

- **Land on homepage** — Clean interface with upload area prominently displayed
- **Upload content** — Drag and drop PDF/PPTX/DOCX, paste text, or enter YouTube URL
- **Define learning objective** — Answer: "What should students be able to do after this lesson?"
- **Select objective type** — Choose from: Understand, Explain, Apply, Distinguish, Perform, Analyze
- **Generate game** — AI processes content and creates questions (10-15 seconds)
- **Receive game code** — 6-character code displayed, redirected to host view
- **Monitor lobby** — See students joining in real-time
- **Start game** — Control question progression, see live responses
- **Review results** — Per-question breakdown showing where students struggled

### Student Flow

- **Navigate to /play** — Or direct link with code
- **Enter game code** — 6-character code from teacher
- **Choose display name** — No account required
- **Wait in lobby** — See other players joining
- **Answer questions** — Tap/click responses within time limit
- **See feedback** — Immediate correct/incorrect with explanation
- **View leaderboard** — Rankings between questions and at end

## Learning Objectives Framework

The teacher selects an objective type, which determines the game mechanics used. This is the core innovation: matching activities to learning goals.

| Objective Type | Teacher Prompt | Best Game Formats |
|----------------|----------------|-------------------|
| Understand | "Students should understand that..." | Concept Connections, Misconception Battles |
| Explain | "Students should be able to explain..." | Build the Explanation, Peer Teaching |
| Apply | "Students should be able to apply..." | Scenario Solver, Real-World Match |
| Distinguish | "Students should distinguish between..." | Category Challenges, Side-by-Side Compare |
| Perform | "Students should be able to perform..." | Process Sequencing, Error Hunt |
| Analyze | "Students should be able to analyze..." | Debate Prep, Evidence Evaluation |

## Game Types (MVP Scope)

For the hackathon MVP, we implement three question types that cover the most common use cases:

### 1. Multiple Choice

Four options, one correct. But questions are designed to test understanding, not recall. Distractors are based on common misconceptions, not random wrong answers.

**Example:** Instead of "What is the powerhouse of the cell?" → "Why can't a cell survive if its mitochondria stop functioning?"

### 2. Ordering/Sequencing

Students drag items into the correct order. Tests procedural knowledge and cause-effect understanding.

**Example:** "Arrange the steps of photosynthesis in order" or "Order these historical events chronologically"

### 3. Categorization

Students sort items into 2-3 groups. Tests ability to distinguish and classify.

**Example:** "Sort these into Renewable vs Non-Renewable energy sources" or "Categorize as Reactants vs Products"

## Technical Architecture

### Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 | Single app for teacher and student views |
| Backend | Next.js API Routes | Game creation, answer submission |
| Database | Convex | Game sessions, players, answers |
| Real-time | Convex Realtime | Game state sync, presence |
| File Storage | Convex Storage | Uploaded lesson materials | 
| AI | Gemini API | Content analysis, question generation |

### Data Model

- **games** — Stores game sessions with generated questions  
  Fields: `id`, `code` (6-char), `topic`, `objective`, `objective_type`, `content`, `questions` (JSONB), `state`, `current_question`, `created_at`

- **players** — Players in each game  
  Fields: `id`, `game_id`, `name`, `score`, `joined_at`

- **answers** — Individual answer submissions  
  Fields: `id`, `game_id`, `player_id`, `question_index`, `answer` (JSONB), `correct`, `time_ms`, `created_at`

## AI Prompt Strategy

The quality of generated questions is the core differentiator. The prompt must be carefully engineered to produce pedagogically sound content.

### Key Prompt Elements

- **Learning objective context:** The AI knows what the teacher wants students to learn, not just the content
- **Objective type:** Guides question format (understanding vs. application vs. analysis)
- **Misconception awareness:** Distractors are based on common student errors, not random
- **Explanation generation:** Each question includes why the answer is correct
- **Structured output:** JSON format for reliable parsing

### Output Schema

Each question object contains: `type` (multiple_choice | ordering | categorization), `question` text, `options` array, `correct` answer(s), `explanation`, and `misconception` field identifying what wrong thinking this question catches.

## Screen Specifications

### Homepage (Teacher Upload)

- Large drag-and-drop zone for file upload
- Text area for paste/type content
- Input field: "What should students learn from this?"
- Objective type selector (6 buttons or dropdown)
- "Generate Game" button with loading state

### Host View (/host/[code])

- Large game code display for students to see
- Player list with join animations
- "Start Game" button (enabled when 1+ players)
- During game: current question, response count, timer
- "Next Question" / "Show Results" controls
- Live analytics: % correct per question

### Student Join (/play)

- Game code input (6 characters)
- Display name input
- "Join Game" button

### Student Game View (/play/[code])

- Waiting screen in lobby state
- Question display with answer options
- Timer countdown
- Immediate feedback (correct/wrong + explanation)
- Leaderboard between questions
- Final results screen

## Development Timeline (Hackathon)

- **Hours 1-2:** Convex setup, database schema, basic Next.js routes, file upload
- **Hours 3-4:** Gemini API integration, prompt engineering, question generation
- **Hours 5-6:** Real-time sync with Convex, game state machine, lobby system
- **Hours 7-8:** Student UI, teacher controls, leaderboard, answer submission
- **Hours 9-10:** Polish, edge cases, demo preparation, bug fixes

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI generates poor questions | Demo fails to impress | Extensive prompt iteration; have backup pre-generated games |
| Real-time sync issues | Laggy/broken gameplay | Test with multiple devices early; have fallback polling mode |
| File parsing fails | Can't demo with real content | Support plain text paste as reliable fallback |
| Slow AI response | Awkward wait during demo | Show engaging loading state; pre-warm with sample content |

## Future Scope (Post-Hackathon)

- Teacher accounts: Save games, track classes over time
- Student progress tracking: Individual learning analytics across sessions
- Adaptive difficulty: Questions adjust based on student performance
- More game types: Debate prep, peer teaching, scenario solvers
- Misconception database: Learn from aggregate wrong answers to improve questions
- LMS integrations: Google Classroom, Canvas, Schoology
- Mobile app: Native iOS/Android for smoother student experience

## Appendix: Example AI Prompt

System prompt for question generation:

> You are generating an interactive classroom game from lesson materials. The teacher has specified a learning objective and objective type. Generate 8-10 questions that test whether students achieved the learning objective. Mix question types based on the objective type. For each question, provide: type, question text, options, correct answer(s), explanation, and the misconception this question catches. Prioritize questions that test UNDERSTANDING over recall. Return JSON only.
