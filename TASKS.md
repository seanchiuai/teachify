# Tasks — LessonPlay

## Active

None — all phases complete.

## Complete

### Planning (Jan 29, 2025)
- [x] Define MVP scope and architecture
- [x] Write PRD with user stories
- [x] Create development phases
- [x] Set up skills directory

### Architecture Update (Jan 29, 2025)
- [x] Redesign architecture: AI-generated HTML games in sandboxed iframes
- [x] Update PRD with iframe sandbox architecture and postMessage protocol
- [x] Update design doc with GameIframe component hierarchy
- [x] Update Convex schema to include gameHtml field
- [x] Update Gemini AI skill for two-step pipeline (questions + HTML game)
- [x] Update game-engine skill with iframe communication and MessageChannel
- [x] Update UI components skill (parent wrapper only, game UI is AI-generated)
- [x] Update tasks and phase prompts

### Phase 1: Project Setup & Upload (Jan 30, 2025)
- [x] Initialize Next.js 14 App Router with TypeScript
- [x] Set up Convex backend and connect to Next.js
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Create Convex schema for games, players, answers tables (with gameHtml field)
- [x] Build homepage with drag-and-drop file upload zone
- [x] Implement file parsing (PDF, PPTX, DOCX, plain text)
- [x] Build learning objective input + objective type selector (6 types)
- [x] Store uploaded content in Convex file storage
- [x] Build "Generate Game" button with loading state

### Phase 2: AI Game Generation (Jan 30, 2025)
- [x] Integrate Gemini API with Convex action
- [x] Engineer prompt for structured question generation (JSON)
- [x] Implement structured JSON output parsing (multiple_choice, ordering, categorization)
- [x] Generate 8-10 questions per game with explanations and misconception tags
- [x] Engineer prompt for HTML game generation from questions
- [x] Generate self-contained HTML game (inline CSS/JS, no external deps)
- [x] HTML game implements postMessage protocol (GAME_READY, ANSWER_SUBMITTED, GAME_OVER)
- [x] HTML game is mobile-responsive (viewport meta, relative units, pointer events)
- [x] Validate generated HTML (postMessage code present, no external URLs)
- [x] Generate unique 6-character game code
- [x] Store generated game with questions + gameHtml in Convex

### Phase 3: Real-time Game Engine (Jan 30, 2025)
- [x] Build game state machine (lobby → playing → question → results → complete)
- [x] Create host view (/host/[code]) with game code display and player list
- [x] Create student join page (/play) with code + name inputs
- [x] Create student game view (/play/[code])
- [x] Build GameIframe component (sandbox="allow-scripts", srcdoc, key={gameId})
- [x] Implement MessageChannel handshake (parent transfers port to iframe)
- [x] Handle iframe messages: GAME_READY, ANSWER_SUBMITTED, GAME_OVER, ERROR
- [x] Send parent messages to iframe: START_GAME, NEXT_QUESTION, TIME_UP, END_GAME
- [x] Implement authoritative timer in parent (iframe shows visual timer only)
- [x] Implement Convex real-time subscriptions for game state sync
- [x] Build lobby with join animations and real-time player list
- [x] Implement "Start Game" control for host (enabled when 1+ players)
- [x] Build question progression: Next Question / Show Results controls
- [x] Implement answer submission: iframe → parent → Convex (server-side validation)

### Phase 4: Leaderboard & Analytics (Jan 30, 2025)
- [x] Build leaderboard between questions and final results
- [x] Build per-question analytics (% correct, common wrong answers)
- [x] Show comprehension gap insights on host results view
- [x] Build feedback overlay in parent (correct/wrong + explanation, shown outside iframe)
- [x] Score calculation: correctness + speed bonus (server-side in Convex)

### Phase 5: Polish & Demo Prep (Jan 30, 2025)
- [x] End-to-end testing: upload → generate → play → results
- [x] Basic edge cases (duplicate names, short content, iframe timeout, file size)
- [x] Input validation (name length, empty name)
- [x] Add loading/error/empty states throughout
- [x] Handle iframe load timeout (show retry option)
- [x] TypeScript compiles without errors

### Phase 5: Incomplete Items
- [ ] Test with 5+ simultaneous players
- [ ] Demo preparation with sample content
- [ ] Edge cases NOT verified (see docs/edge-cases.md):
  - [ ] Corrupted/empty/scanned files
  - [ ] AI timeouts and rate limits
  - [ ] Student joins after game started
  - [ ] Student/host disconnect handling
  - [ ] XSS protection verification
  - [ ] Concurrent answer submission
  - [ ] MessageChannel failure handling
