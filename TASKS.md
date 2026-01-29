# Tasks — LessonPlay

## Active

- [ ] Set up Next.js 14 + Convex + Tailwind + shadcn/ui project
- [ ] Define Convex schema (games, players, answers)

## Backlog

### Phase 1: Project Setup & Upload
- [ ] Initialize Next.js 14 App Router with TypeScript
- [ ] Set up Convex backend and connect to Next.js
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Create Convex schema for games, players, answers tables
- [ ] Build homepage with drag-and-drop file upload zone
- [ ] Implement file parsing (PDF, PPTX, DOCX, plain text)
- [ ] Build learning objective input + objective type selector (6 types)
- [ ] Store uploaded content in Convex file storage
- [ ] Build "Generate Game" button with loading state

### Phase 2: AI Question Generation
- [ ] Integrate Gemini API with Convex action
- [ ] Engineer prompt: learning objective context + objective type + misconception awareness
- [ ] Implement structured JSON output parsing (multiple_choice, ordering, categorization)
- [ ] Generate 8-10 questions per game with explanations and misconception tags
- [ ] Generate unique 6-character game code
- [ ] Store generated game with questions in Convex

### Phase 3: Real-time Game Engine
- [ ] Build game state machine (lobby → playing → question → results → complete)
- [ ] Create host view (/host/[code]) with game code display and player list
- [ ] Create student join page (/play) with code + name inputs
- [ ] Create student game view (/play/[code])
- [ ] Implement Convex real-time subscriptions for game state sync
- [ ] Build lobby with join animations and real-time player list
- [ ] Implement "Start Game" control for host (enabled when 1+ players)
- [ ] Build question progression: Next Question / Show Results controls
- [ ] Implement answer submission with time tracking

### Phase 4: Game UI & Leaderboard
- [ ] Build multiple choice question UI
- [ ] Build ordering/sequencing question UI (drag to reorder)
- [ ] Build categorization question UI (sort into groups)
- [ ] Implement timer countdown per question
- [ ] Show immediate feedback (correct/wrong + explanation)
- [ ] Build leaderboard between questions and final results
- [ ] Build per-question analytics (% correct, common wrong answers)
- [ ] Show comprehension gap insights on host results view

### Phase 5: Polish & Demo Prep
- [ ] End-to-end testing: upload → generate → play → results
- [ ] Test with 5+ simultaneous players
- [ ] Ensure complete flow under 60 seconds
- [ ] Add loading/error/empty states throughout
- [ ] Mobile-responsive student game view
- [ ] Edge case handling (disconnects, late joins, empty inputs)
- [ ] Demo preparation with sample content

## Complete

### Planning (Jan 29, 2025)
- [x] Define MVP scope and architecture
- [x] Write PRD with user stories
- [x] Create development phases
- [x] Set up skills directory
