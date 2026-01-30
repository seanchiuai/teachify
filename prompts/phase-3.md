# Phase 3: Real-time Game Engine + Iframe Rendering

Build US-004, US-005, US-006 from `docs/PRD.md`.

## Prerequisite

- Phase 2 complete:
  - `gameHtml` field populated with AI-generated HTML
  - `questions` array populated with structured JSON
  - Games in `lobby` state after generation

## Reference Documents

- Skills: `convex/`, `game-engine/`, `ui-components/`
- Design: `docs/design.md`
- API Contracts: `docs/api-contracts.md`
- Architecture: "Architecture: AI-Generated HTML Games" section in `docs/PRD.md`

---

## Checkpoint 3.1: Host Lobby View

**Goal:** Host can see game code and waiting players

**Files to create:**
```
app/host/[code]/page.tsx (complete implementation)
components/GameCodeDisplay.tsx
components/PlayerList.tsx
components/LobbyControls.tsx
```

**GameCodeDisplay props:**
```typescript
interface GameCodeDisplayProps {
  code: string;  // 6-char code
  joinUrl: string;  // e.g., "lessonplay.app/play"
}
```

**PlayerList behavior:**
- Real-time updates via Convex subscription
- Animated join effect when new player appears
- Shows player names in cards/chips

**LobbyControls:**
- "Start Game" button (disabled until 1+ players)
- Player count display

**Test:**
- Navigate to /host/ABC123
- See large game code displayed
- See "Join at lessonplay.app/play" instruction
- "Start Game" disabled with 0 players

**Exit criteria:**
- [ ] Game code displayed prominently
- [ ] Join URL displayed
- [ ] Player list shows real-time updates
- [ ] Start Game disabled until players > 0
- [ ] Start Game enabled when players join

---

## Checkpoint 3.2: Student Join Flow

**Goal:** Students can join game by code

**Files to create:**
```
app/play/page.tsx
app/play/[code]/page.tsx
components/GameCodeInput.tsx
components/NameInput.tsx
components/LobbyWaiting.tsx
convex/players.ts
```

**GameCodeInput:**
- 6 individual character inputs
- Auto-advance on input
- Auto-submit when all 6 filled
- Case-insensitive (normalize to uppercase)

**Player creation flow:**
1. Enter 6-char code + display name
2. Validate game exists and is in lobby state
3. Create player record in Convex
4. Redirect to /play/[code]
5. Show lobby waiting screen

**LobbyWaiting:**
- "Waiting for host to start..."
- Show other players who have joined
- Pulsing animation

**Convex functions:**
```typescript
// joinGame mutation
// Input: { code: string, name: string }
// Output: { playerId: Id<"players">, gameId: Id<"games"> }
// Validates game exists and is in lobby state

// getPlayers query
// Input: { gameId: Id<"games"> }
// Output: Player[]
```

**Test:**
- Go to /play
- Enter code ABC123 + name "Alex"
- Click Join → player created, redirected to /play/ABC123
- See "Waiting for host..." screen

**Exit criteria:**
- [ ] Code input validates 6 characters
- [ ] Invalid code shows "Game not found" error
- [ ] Game not in lobby shows "Game already started" error
- [ ] Player created in Convex
- [ ] Player appears in host view instantly
- [ ] Lobby waiting screen shows other players

---

## Checkpoint 3.3: Real-time Sync

**Goal:** All clients stay in sync via Convex subscriptions

**Subscriptions needed:**
```typescript
// Host subscribes to:
useQuery(api.games.getGameByCode, { code });
useQuery(api.players.getPlayers, { gameId });

// Student subscribes to:
useQuery(api.games.getGameByCode, { code });
useQuery(api.players.getPlayers, { gameId });
```

**Test scenarios:**
1. Open host in browser 1
2. Join as student in browser 2
3. Player appears in host view < 1 second
4. Join as another student in browser 3
5. Both host and browser 2 see new player

**Exit criteria:**
- [ ] Player join reflected < 1 second
- [ ] Game state changes reflected instantly
- [ ] Works with 5+ concurrent connections
- [ ] No stale data shown

---

## Checkpoint 3.4: GameIframe Component

**Goal:** Render AI-generated HTML in secure sandbox

**Files to create:**
```
components/GameIframe.tsx
lib/messageChannel.ts
```

**GameIframe props:**
```typescript
interface GameIframeProps {
  html: string;
  gameId: string;
  onReady: () => void;
  onAnswer: (data: { questionIndex: number; answer: string | string[]; timeMs: number }) => void;
  onError: (message: string) => void;
}
```

**Iframe setup:**
```tsx
<iframe
  key={gameId}  // Prevent Firefox caching bugs
  srcDoc={html}
  sandbox="allow-scripts"  // NEVER add allow-same-origin
  style={{ width: '100%', height: '100%', border: 'none' }}
/>
```

**MessageChannel setup:**
1. Create MessageChannel in parent
2. On iframe load, transfer port2 to iframe via postMessage
3. Communicate via port1 (parent) ↔ port2 (iframe)

**Message handling:**
```typescript
// Parent receives from iframe:
port.onmessage = (e) => {
  switch (e.data.type) {
    case 'GAME_READY': onReady(); break;
    case 'ANSWER_SUBMITTED': onAnswer(e.data); break;
    case 'ERROR': onError(e.data.message); break;
  }
};

// Parent sends to iframe:
port.postMessage({ type: 'START_GAME', questions });
port.postMessage({ type: 'NEXT_QUESTION', questionIndex });
port.postMessage({ type: 'TIME_UP' });
port.postMessage({ type: 'END_GAME' });
```

**Test:**
- Load page with gameHtml
- Iframe renders content
- GAME_READY message received
- Send START_GAME → game responds

**Exit criteria:**
- [ ] Iframe renders AI-generated HTML
- [ ] sandbox="allow-scripts" only (no allow-same-origin)
- [ ] MessageChannel established
- [ ] GAME_READY received from iframe
- [ ] Parent can send messages to iframe
- [ ] key={gameId} prevents caching issues

---

## Checkpoint 3.5: Game Flow

**Goal:** Complete game loop from start to answers

**Game state machine:**
```
lobby → playing → question → results → complete
                     ↑          |
                     +----------+
                   (next question)
```

**Files to create/update:**
```
convex/games.ts (state transition mutations)
components/HostControls.tsx
components/StudentGameView.tsx
components/TimerDisplay.tsx
```

**Host controls during game:**
- Current question number (Q3/10)
- Response count and % correct
- Timer display
- "Next Question" button
- "Show Results" button

**Student view during game:**
- Timer display (authoritative from parent)
- Score display
- GameIframe with game

**Timer implementation:**
- Timer runs in parent app (authoritative)
- Timer value synced to Convex for host to see
- TIME_UP sent to iframe when timer expires

**Answer flow:**
1. Student answers in iframe
2. Iframe sends ANSWER_SUBMITTED via MessageChannel
3. Parent validates answer against questions JSON
4. Parent writes answer to Convex (correct: boolean, timeMs)
5. Score updated

**Convex mutations:**
```typescript
// startGame - transitions lobby → playing → question
// submitAnswer - validates and stores answer
// nextQuestion - advances currentQuestion
// endGame - transitions to complete
```

**Test:**
- Host clicks Start Game → game enters "playing" state
- Student iframe loads → shows GAME_READY
- Student answers → answer stored in Convex
- Host sees response count increase
- Timer expires → TIME_UP sent to iframe

**Exit criteria:**
- [ ] Start Game transitions state correctly
- [ ] Timer runs in parent (not iframe)
- [ ] Answers validated server-side
- [ ] Answers stored with timeMs
- [ ] Response count updates in real-time
- [ ] Next Question advances game
- [ ] End Game shows final state

---

## Test Scenarios

1. **Lobby join flow**
   - Create game with code ABC123
   - Navigate to /play, enter ABC123 + "Student1"
   - Verify player appears in host view
   - Repeat with "Student2" → both visible

2. **Real-time sync**
   - Open host view in browser 1
   - Join as student in browser 2
   - Verify player count updates instantly (<1s)

3. **Game start**
   - Host clicks "Start Game"
   - Student sees iframe load
   - Iframe sends GAME_READY message
   - Game proceeds

4. **Answer submission**
   - Student answers in iframe
   - Host sees response count increase
   - Answer stored in Convex with timeMs

5. **Timer expiry**
   - Let timer reach 0
   - Verify TIME_UP sent to iframe
   - Verify can proceed to next question

6. **Multiple players**
   - 5 students join
   - All receive game updates
   - All can submit answers
   - No race conditions

---

## Exit Criteria Summary

When ALL checkpoints pass:
- [ ] 3.1: Host lobby shows code and players
- [ ] 3.2: Students can join by code
- [ ] 3.3: Real-time sync works with 5+ players
- [ ] 3.4: GameIframe renders and communicates
- [ ] 3.5: Full game flow works (start → answers → end)
- [ ] US-004 acceptance criteria in PRD.md checked off
- [ ] US-005 acceptance criteria in PRD.md checked off
- [ ] US-006 acceptance criteria in PRD.md checked off
- [ ] Typecheck passes (`npm run build`)
- [ ] All test scenarios verified in browser

---

If you can't complete an acceptance criterion without human assistance, skip that part but report what still needs to be done. When ALL acceptance criteria are met and tested:

<promise>PHASE 3 COMPLETE</promise>
