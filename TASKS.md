# Tasks — LessonPlay

## Active

- [ ] Set up Next.js 14 + Convex + Tailwind + shadcn/ui project
- [ ] Define Convex schema (games, players, answers — including gameHtml field)

## Backlog

### Phase 1: Project Setup & Upload
- [ ] Initialize Next.js 14 App Router with TypeScript
- [ ] Set up Convex backend and connect to Next.js
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Create Convex schema for games, players, answers tables (with gameHtml field)
- [ ] Build homepage with drag-and-drop file upload zone
- [ ] Implement file parsing (PDF, PPTX, DOCX, plain text)
- [ ] Build learning objective input + objective type selector (6 types)
- [ ] Store uploaded content in Convex file storage
- [ ] Build "Generate Game" button with loading state

### Phase 2: AI Game Generation (Two-Step Pipeline)
- [ ] Integrate Gemini API with Convex action
- [ ] Step 1: Engineer prompt for structured question generation (JSON)
- [ ] Implement structured JSON output parsing (multiple_choice, ordering, categorization)
- [ ] Generate 8-10 questions per game with explanations and misconception tags
- [ ] Step 2: Engineer prompt for HTML game generation from questions
- [ ] Generate self-contained HTML game (inline CSS/JS, no external deps)
- [ ] HTML game implements postMessage protocol (GAME_READY, ANSWER_SUBMITTED, GAME_OVER)
- [ ] HTML game is mobile-responsive (viewport meta, relative units, pointer events)
- [ ] Validate generated HTML (postMessage code present, no external URLs)
- [ ] Generate unique 6-character game code
- [ ] Store generated game with questions + gameHtml in Convex

### Phase 3: Real-time Game Engine + Iframe Rendering
- [ ] Build game state machine (lobby → playing → question → results → complete)
- [ ] Create host view (/host/[code]) with game code display and player list
- [ ] Create student join page (/play) with code + name inputs
- [ ] Create student game view (/play/[code])
- [ ] Build GameIframe component (sandbox="allow-scripts", srcdoc, key={gameId})
- [ ] Implement MessageChannel handshake (parent transfers port to iframe)
- [ ] Handle iframe messages: GAME_READY, ANSWER_SUBMITTED, GAME_OVER, ERROR
- [ ] Send parent messages to iframe: START_GAME, NEXT_QUESTION, TIME_UP, END_GAME
- [ ] Implement authoritative timer in parent (iframe shows visual timer only)
- [ ] Implement Convex real-time subscriptions for game state sync
- [ ] Build lobby with join animations and real-time player list
- [ ] Implement "Start Game" control for host (enabled when 1+ players)
- [ ] Build question progression: Next Question / Show Results controls
- [ ] Implement answer submission: iframe → parent → Convex (server-side validation)

### Phase 4: Leaderboard & Analytics
- [ ] Build leaderboard between questions and final results
- [ ] Build per-question analytics (% correct, common wrong answers)
- [ ] Show comprehension gap insights on host results view
- [ ] Build feedback overlay in parent (correct/wrong + explanation, shown outside iframe)
- [ ] Score calculation: correctness + speed bonus (server-side in Convex)

### Phase 5: Polish & Demo Prep
- [ ] End-to-end testing: upload → generate → play → results
- [ ] Test with 5+ simultaneous players
- [ ] Ensure complete flow under 60 seconds
- [ ] Add loading/error/empty states throughout
- [ ] Handle iframe errors gracefully (show retry/regenerate option)
- [ ] Mobile-responsive student game view (iframe + parent wrapper)
- [ ] Edge case handling (disconnects, late joins, empty inputs, iframe crash)
- [ ] Demo preparation with sample content

## Complete

### Planning (Jan 29, 2025)
- [x] Define MVP scope and architecture
- [x] Write PRD with user stories
- [x] Create development phases
- [x] Set up skills directory

### Architecture Update (Jan 29, 2026)
- [x] Redesign architecture: AI-generated HTML games in sandboxed iframes
- [x] Update PRD with iframe sandbox architecture and postMessage protocol
- [x] Update design doc with GameIframe component hierarchy
- [x] Update Convex schema to include gameHtml field
- [x] Update Gemini AI skill for two-step pipeline (questions + HTML game)
- [x] Update game-engine skill with iframe communication and MessageChannel
- [x] Update UI components skill (parent wrapper only, game UI is AI-generated)
- [x] Update tasks and phase prompts
