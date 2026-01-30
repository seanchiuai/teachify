# Phase 5: Polish & Demo Prep

Verify ALL user stories (US-001 through US-008) from `docs/PRD.md`.

## Prerequisite

- Phase 4 complete:
  - All user stories implemented (US-001 through US-008)
  - Full game flow working end-to-end
  - Leaderboard and analytics functional

## Reference Documents

- Skills: `convex/`, `game-engine/`, `ui-components/`
- Design: `docs/design.md`
- Edge Cases: `docs/edge-cases.md` (detailed checklist)

---

## Checkpoint 5.1: Edge Case Handling

**Goal:** Handle all edge cases defined in `docs/edge-cases.md`

### Upload Edge Cases

| Case | Expected Behavior | Status |
|------|-------------------|--------|
| File > 10MB | Show "File too large (max 10MB)" error | [ ] |
| Corrupted PDF | Show "Unable to read file" error, no crash | [ ] |
| Empty file | Show "File appears to be empty" warning | [ ] |
| Content < 50 words | Show "Content may be too short" warning (allow proceed) | [ ] |
| Non-text PDF (scanned) | Show "Unable to extract text" error | [ ] |
| Mixed input (file + text) | File takes precedence, show indicator | [ ] |

### Generation Edge Cases

| Case | Expected Behavior | Status |
|------|-------------------|--------|
| AI timeout (>30s) | Show "Taking longer than expected..." then retry button | [ ] |
| Invalid HTML generated | Auto-retry up to 2x, then show error with manual retry | [ ] |
| External URL in HTML | Caught by validation, regenerate | [ ] |
| Missing postMessage in HTML | Caught by validation, regenerate | [ ] |
| API rate limit | Queue request, show waiting message | [ ] |
| Content too long (>10k words) | Truncate with warning, or show error | [ ] |

### Gameplay Edge Cases

| Case | Expected Behavior | Status |
|------|-------------------|--------|
| Student joins after game started | Show "Game in progress, wait for next game" | [ ] |
| Student disconnects mid-game | Answers preserved, can rejoin same name | [ ] |
| Host closes browser | Game pauses, students see "Host disconnected" | [ ] |
| 2 players with same name | Auto-suffix: "Alex", "Alex (2)" | [ ] |
| Player submits after timer | Answer rejected, 0 points | [ ] |
| Player submits twice | First answer counts, second ignored | [ ] |
| No players when Start clicked | Button disabled (shouldn't happen) | [ ] |

### Iframe Edge Cases

| Case | Expected Behavior | Status |
|------|-------------------|--------|
| Iframe JS error | Parent shows "Game error" overlay with retry | [ ] |
| Iframe infinite loop | Detect via timeout (no GAME_READY in 10s), offer regenerate | [ ] |
| MessageChannel fails | Fallback error state, offer reload | [ ] |
| Iframe never sends GAME_READY | Timeout after 10s, show error | [ ] |

**Test each case manually and check off in `docs/edge-cases.md`**

---

## Checkpoint 5.2: Performance Verification

**Goal:** Meet performance success metrics

**Metrics to verify:**

| Metric | Target | How to Test |
|--------|--------|-------------|
| Generation time | < 60 seconds | Time from form submit to game ready |
| Question generation | < 20 seconds | Time for Step 1 (Gemini questions) |
| HTML generation | < 20 seconds | Time for Step 2 (Gemini HTML) |
| Page load | < 3 seconds | Lighthouse or manual |
| Real-time sync | < 1 second | Player join latency |

**Performance checklist:**
- [ ] Generation < 60s with 500 words content
- [ ] Generation < 60s with 2000 words content
- [ ] Host page loads < 3s
- [ ] Student page loads < 3s
- [ ] Player join visible < 1s
- [ ] Answer submission reflected < 1s

**If slow:**
- Check Convex action logs for bottlenecks
- Consider streaming responses
- Optimize HTML size

---

## Checkpoint 5.3: Multi-Player Testing

**Goal:** Verify 5+ simultaneous players work correctly

**Test scenario:**
1. Create a game
2. Open 5 browser tabs/incognito windows
3. Join as 5 different players
4. Host starts game
5. All 5 answer questions
6. Verify no race conditions

**Checklist:**
- [ ] 5 players can join simultaneously
- [ ] All players see each other in lobby
- [ ] Game starts for all players at once
- [ ] All players receive questions
- [ ] All answers recorded correctly
- [ ] Leaderboard accurate for all players
- [ ] No duplicate answers created
- [ ] No missing answers
- [ ] Final results show all 5 players

**Stress test (optional):**
- [ ] 10 players works
- [ ] 20 players works

---

## Checkpoint 5.4: Mobile Responsiveness

**Goal:** Student view works well on mobile devices

**Test devices (or emulation):**
- iPhone SE (375px)
- iPhone 14 (390px)
- Android mid-range (360px)
- iPad Mini (768px)

**Student view checklist:**
- [ ] /play page - code input usable, name input visible
- [ ] Lobby waiting - text readable, no overflow
- [ ] Game iframe - fills screen appropriately
- [ ] Timer visible while playing
- [ ] Answer buttons have 44px+ touch targets
- [ ] Feedback overlay readable
- [ ] Leaderboard scrollable if needed
- [ ] Final results page works

**Host view (lower priority, usually projected):**
- [ ] Works at 1024px+ (projection)
- [ ] Acceptable at tablet size

**CSS checklist:**
- [ ] viewport meta tag present in all pages
- [ ] No horizontal scroll on mobile
- [ ] Text readable without zoom
- [ ] Buttons large enough to tap

---

## Checkpoint 5.5: Demo Preparation

**Goal:** Ready for demo with sample content

**Sample content to prepare:**
1. **Biology lesson** - Cell structure (good for science classes)
2. **History lesson** - French Revolution (good for humanities)
3. **Math lesson** - Fractions (good for elementary)

**For each sample:**
- Pre-written content (200-500 words)
- Learning objective
- Objective type
- Pre-generated game ready to demo

**Demo script:**
1. Show homepage (clean, professional)
2. Paste biology content
3. Enter objective
4. Click Generate (show progress)
5. Show host view with game code
6. Demo joining as student (use second device/tab)
7. Play through 2-3 questions
8. Show leaderboard
9. Show analytics dashboard

**Demo readiness checklist:**
- [ ] Sample content prepared (3 topics)
- [ ] At least 1 pre-generated game ready
- [ ] Demo script practiced
- [ ] Works on demo devices (laptop + phone)
- [ ] Stable internet tested
- [ ] Fallback plan if AI generation slow

---

## Final Verification

### User Story Acceptance Check

Go through each US in PRD.md and verify ALL acceptance criteria:

**US-001: Upload Lesson Content**
- [ ] All acceptance criteria checked off in PRD.md

**US-002: Define Learning Objectives**
- [ ] All acceptance criteria checked off in PRD.md

**US-003: Generate Game via AI**
- [ ] All acceptance criteria checked off in PRD.md

**US-004: Host a Game Session**
- [ ] All acceptance criteria checked off in PRD.md

**US-005: Join and Play a Game**
- [ ] All acceptance criteria checked off in PRD.md

**US-006: Real-time Game Sync**
- [ ] All acceptance criteria checked off in PRD.md

**US-007: View Game Results**
- [ ] All acceptance criteria checked off in PRD.md

**US-008: Leaderboard**
- [ ] All acceptance criteria checked off in PRD.md

### Success Metrics Check

From PRD.md:
- [ ] Complete flow from upload to gameplay in under 60 seconds
- [ ] Support 5+ simultaneous players with real-time sync
- [ ] Generate questions that are recognizably better than basic recall quizzes
- [ ] Display per-question analytics showing comprehension gaps

---

## Test Scenarios

1. **Full happy path**
   - Upload content → Generate → Host → 3 students join → Play → Results
   - Everything works smoothly

2. **Error recovery**
   - Simulate slow generation → retry works
   - Simulate network disconnect → reconnects
   - Invalid game code → error shown

3. **Mobile experience**
   - Join game on phone
   - Play through all questions
   - See final results

4. **Demo dry run**
   - Run through demo script
   - No unexpected errors
   - Timing is reasonable

---

## Exit Criteria Summary

When ALL checkpoints pass:
- [ ] 5.1: All edge cases in docs/edge-cases.md handled
- [ ] 5.2: Performance meets targets (<60s generation, <1s sync)
- [ ] 5.3: 5+ players tested successfully
- [ ] 5.4: Mobile responsive (student view)
- [ ] 5.5: Demo content ready, script practiced
- [ ] ALL user stories (US-001 to US-008) verified
- [ ] ALL success metrics from PRD met
- [ ] Typecheck passes (`npm run build`)
- [ ] Production build works (`npm run start`)

---

If you can't complete an acceptance criterion without human assistance, skip that part but report what still needs to be done. When ALL acceptance criteria are met and tested:

<promise>PHASE 5 COMPLETE</promise>
<promise>MVP READY FOR DEMO</promise>
