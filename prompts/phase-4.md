# Phase 4: Leaderboard & Analytics

Build US-007, US-008 from `docs/PRD.md`.

## Prerequisite

- Phase 3 complete:
  - Answers stored in Convex with `correct` boolean and `timeMs`
  - Game state machine working (lobby → question → results → complete)
  - Players table populated
  - Real-time sync working

## Reference Documents

- Skills: `ui-components/`, `game-engine/`, `convex/`
- Design: `docs/design.md`
- API Contracts: `docs/api-contracts.md`

---

## Checkpoint 4.1: Score Calculation

**Goal:** Calculate scores based on correctness and speed

**Scoring formula:**
```typescript
// Base score for correct answer
const BASE_CORRECT = 1000;

// Time bonus (faster = more points)
// Max bonus at 0ms, no bonus at 30000ms (30 seconds)
const TIME_LIMIT_MS = 30000;
const MAX_TIME_BONUS = 500;

function calculateScore(correct: boolean, timeMs: number): number {
  if (!correct) return 0;

  const timeBonus = Math.max(0,
    Math.round(MAX_TIME_BONUS * (1 - timeMs / TIME_LIMIT_MS))
  );

  return BASE_CORRECT + timeBonus;
}

// Examples:
// Correct in 2s → 1000 + 467 = 1467 points
// Correct in 15s → 1000 + 250 = 1250 points
// Correct in 30s → 1000 + 0 = 1000 points
// Wrong → 0 points
```

**Files to create/update:**
```
convex/scoring.ts
convex/answers.ts (add score field)
```

**Convex mutation update:**
```typescript
// submitAnswer mutation now calculates and stores score
// Input: { playerId, gameId, questionIndex, answer, timeMs }
// Process: validate answer, calculate score, store
// Updates: player.score (cumulative)
```

**Test:**
- Submit correct answer in 5s → ~1400 points
- Submit correct answer in 25s → ~1100 points
- Submit wrong answer → 0 points
- Player total score accumulates correctly

**Exit criteria:**
- [ ] Score calculated on answer submission
- [ ] Time bonus rewards faster answers
- [ ] Wrong answers score 0
- [ ] Player.score updated cumulatively
- [ ] Score stored in answers table

---

## Checkpoint 4.2: Leaderboard Component

**Goal:** Show rankings between questions

**Files to create:**
```
components/Leaderboard.tsx
convex/leaderboard.ts
```

**Leaderboard props:**
```typescript
interface LeaderboardProps {
  gameId: Id<"games">;
  currentPlayerId?: Id<"players">;  // Highlight current player
  showAll?: boolean;  // false = top 5, true = all players
}
```

**Leaderboard query:**
```typescript
// getLeaderboard query
// Input: { gameId }
// Output: { playerId, name, score, rank }[]
// Sorted by score descending
```

**Display:**
- Gold/silver/bronze icons for top 3
- Highlight current player row
- Animate position changes
- Show +/- rank movement if possible

**When shown:**
- After each question (between questions)
- At game end (full leaderboard)

**Test:**
- 3 players with different scores
- Leaderboard shows correct order
- Current player highlighted
- Top 3 have special styling

**Exit criteria:**
- [ ] Players sorted by score
- [ ] Top 3 visually distinguished
- [ ] Current player highlighted
- [ ] Works with 1-20+ players
- [ ] Updates in real-time

---

## Checkpoint 4.3: Feedback Overlay

**Goal:** Show correct/wrong feedback after each answer

**Files to create:**
```
components/FeedbackOverlay.tsx
```

**FeedbackOverlay props:**
```typescript
interface FeedbackOverlayProps {
  correct: boolean;
  points: number;
  explanation: string;
  onContinue: () => void;
}
```

**Display states:**
1. **Correct answer:**
   - Green background/border
   - Checkmark icon
   - "+850 pts" with animation
   - Explanation text

2. **Wrong answer:**
   - Red background/border
   - X icon
   - "The correct answer was: [answer]"
   - Explanation text

**Timing:**
- Shown immediately after answer submission
- Auto-dismiss after 5 seconds OR when host advances
- Manual dismiss with "Continue" button

**Test:**
- Answer correctly → green overlay with points
- Answer wrong → red overlay with correct answer
- Overlay shows explanation from question data

**Exit criteria:**
- [ ] Correct answers show green with points
- [ ] Wrong answers show red with correct answer
- [ ] Explanation displayed
- [ ] Dismisses automatically or manually
- [ ] Doesn't block next question

---

## Checkpoint 4.4: Results Dashboard

**Goal:** Per-question analytics for teacher

**Files to create:**
```
components/ResultsDashboard.tsx
components/QuestionAnalytics.tsx
convex/analytics.ts
```

**Analytics query:**
```typescript
// getGameAnalytics query
// Input: { gameId }
// Output: {
//   overall: { totalPlayers, avgScore, questionsAnswered },
//   perQuestion: [{
//     questionIndex: number,
//     question: string,
//     correctPercent: number,
//     commonWrongAnswers: { answer: string, count: number }[],
//     misconception: string  // from question data
//   }]
// }
```

**Dashboard layout:**
```
Overall: 72% correct | 15 players | 10 questions

Q1  ████████████████░░░░  82%  ✓
Q2  ██████████████░░░░░░  73%  ✓
Q3  ████████░░░░░░░░░░░░  48%  ⚠ Misconception: [text]
Q4  ██████████████████░░  91%  ✓
...

Comprehension Gaps:
• Q3, Q7: Students struggle with [topic]
• Q9: Ordering confusion — steps frequently swapped
```

**Visual indicators:**
- Progress bars for % correct
- Warning icon for < 60% correct
- Misconception tags for struggled questions
- Comprehension gap summary

**Test:**
- Play game with varied answers
- Dashboard shows accurate percentages
- Wrong answers aggregated correctly
- Misconceptions shown for low-scoring questions

**Exit criteria:**
- [ ] Overall stats accurate
- [ ] Per-question % correct displayed
- [ ] Common wrong answers listed
- [ ] Misconceptions shown
- [ ] Visual indicators for struggling questions

---

## Checkpoint 4.5: Final Leaderboard

**Goal:** Game-end experience with full rankings

**Files to create/update:**
```
components/FinalResults.tsx
app/host/[code]/results/page.tsx (optional separate page)
```

**Final results content:**
- Winner celebration (confetti?)
- Full leaderboard (all players)
- "Play Again" button (creates new game with same content)
- "Download Results" button (CSV export)

**Student final view:**
- Their final rank and score
- "You placed #3 out of 15!"
- Comparison to class average

**Host final view:**
- Full leaderboard
- Link to analytics dashboard
- "New Game" button

**Test:**
- Complete a game
- Final leaderboard shows all players
- Winner has special treatment
- Can navigate to analytics

**Exit criteria:**
- [ ] All players shown with final scores
- [ ] Winner highlighted
- [ ] Students see their rank
- [ ] Host can access analytics
- [ ] "Play Again" works

---

## Test Scenarios

1. **Score calculation accuracy**
   - Player A answers in 3s (correct) → ~1450 pts
   - Player B answers in 20s (correct) → ~1150 pts
   - Player C answers wrong → 0 pts
   - Leaderboard: A > B > C

2. **Leaderboard updates**
   - After Q1: A leads
   - After Q2: B overtakes A
   - Leaderboard reflects new order immediately

3. **Feedback display**
   - Correct answer → green, points, explanation
   - Wrong answer → red, correct answer shown

4. **Analytics accuracy**
   - 15 players, 10 questions
   - Q3 only 40% correct → flagged
   - Common wrong answer identified

5. **Final results**
   - Game completes
   - All players see final standings
   - Host sees analytics dashboard

6. **Edge cases**
   - Tie scores → same rank, alphabetical name sort
   - Single player game → still shows leaderboard
   - All wrong answers → 0% shown, not error

---

## Exit Criteria Summary

When ALL checkpoints pass:
- [ ] 4.1: Score calculation with time bonus
- [ ] 4.2: Leaderboard component working
- [ ] 4.3: Feedback overlay for correct/wrong
- [ ] 4.4: Results dashboard with analytics
- [ ] 4.5: Final leaderboard and results
- [ ] US-007 acceptance criteria in PRD.md checked off
- [ ] US-008 acceptance criteria in PRD.md checked off
- [ ] Typecheck passes (`npm run build`)
- [ ] All test scenarios verified in browser

---

If you can't complete an acceptance criterion without human assistance, skip that part but report what still needs to be done. When ALL acceptance criteria are met and tested:

<promise>PHASE 4 COMPLETE</promise>
