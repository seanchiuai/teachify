# LessonPlay Edge Cases Checklist

This document defines all edge cases that must be handled before Phase 5 completion. Use this as a testing checklist.

---

## Upload Edge Cases

### File Size
- [x] **File > 10MB**
  - Trigger: Upload PDF larger than 10MB
  - Expected: Show "File too large (max 10MB)" error
  - File NOT uploaded to storage
  - Form remains usable

### File Corruption
- [ ] **Corrupted PDF**
  - Trigger: Upload intentionally corrupted PDF
  - Expected: Show "Unable to read file. Please try a different file." error
  - No crash, no unhandled exception
  - User can try again

- [ ] **Corrupted PPTX/DOCX**
  - Trigger: Upload invalid Office file (rename .txt to .pptx)
  - Expected: Same behavior as corrupted PDF

### Empty Content
- [ ] **Empty file**
  - Trigger: Upload valid PDF with no text (blank pages)
  - Expected: Show "File appears to be empty or contains no extractable text"
  - Allow retry with different file

- [x] **Content < 50 words**
  - Trigger: Paste very short text (20 words)
  - Expected: Show warning "Content may be too short for quality questions"
  - Allow user to proceed anyway (warning, not blocker)

### Non-Text Content
- [ ] **Scanned PDF (image-only)**
  - Trigger: Upload PDF that's actually scanned images
  - Expected: Show "Unable to extract text. Try a text-based document."
  - Suggest alternatives

- [ ] **Password-protected PDF**
  - Trigger: Upload encrypted/password-protected PDF
  - Expected: Show "This file is password protected"

### Input Conflicts
- [ ] **Mixed input (file + text)**
  - Trigger: Upload file, then also type in text area
  - Expected: Show clear indicator which will be used (file takes precedence)
  - OR clear text area when file uploaded

### File Types
- [x] **Unsupported file type**
  - Trigger: Upload .exe, .jpg, .mp3, etc.
  - Expected: Show "Unsupported file type. Please use PDF, PPTX, or DOCX"
  - File NOT uploaded

---

## Generation Edge Cases

### Timeouts
- [ ] **AI timeout (>30s for one step)**
  - Trigger: Slow Gemini response
  - Expected: After 30s, show "Taking longer than expected..."
  - At 60s, show "Generation timed out" with "Retry" button

- [ ] **Total generation >60s**
  - Trigger: Both steps take 40s each
  - Expected: Handle gracefully, eventually succeed or offer retry

### Invalid Output
- [ ] **Invalid HTML generated**
  - Trigger: Gemini returns malformed HTML
  - Expected: Auto-retry up to 2 times
  - If still failing, show error with "Try Again" button

- [ ] **External URL in HTML**
  - Trigger: Generated HTML includes `src="https://cdn.example.com/..."`
  - Expected: Validation catches this
  - Auto-regenerate with stricter prompt
  - Log for debugging

- [ ] **Missing postMessage in HTML**
  - Trigger: Generated HTML doesn't implement protocol
  - Expected: Validation catches this
  - Auto-regenerate
  - Log for debugging

- [ ] **Invalid JSON from question generation**
  - Trigger: Gemini returns non-JSON or malformed JSON
  - Expected: Parse error caught
  - Auto-retry with clearer prompt

### Rate Limits
- [ ] **Gemini API rate limit**
  - Trigger: Too many requests
  - Expected: Queue request, show "Please wait..."
  - Retry with backoff

- [ ] **Gemini API quota exceeded**
  - Trigger: Daily quota hit
  - Expected: Show "Service temporarily unavailable. Please try again later."

### Content Issues
- [ ] **Content too long (>10k words)**
  - Trigger: Paste 15,000 words
  - Expected: Either truncate with warning, or show "Content too long (max 10,000 words)"

- [ ] **Content in unsupported language**
  - Trigger: Paste content in non-English
  - Expected: Questions may still generate (Gemini is multilingual)
  - Acceptable behavior

- [ ] **Inappropriate content**
  - Trigger: Content that Gemini refuses
  - Expected: Show "Unable to generate questions from this content"
  - Don't expose Gemini's error message directly

---

## Gameplay Edge Cases

### Join Timing
- [ ] **Student joins after game started**
  - Trigger: Try to join when game state is "playing" or "question"
  - Expected: Show "Game in progress. Please wait for the next game."
  - Optionally show "Watch" mode

- [ ] **Student joins during results**
  - Trigger: Join when game state is "results"
  - Expected: Same as above OR allow join for next question

### Connection Issues
- [ ] **Student disconnects mid-game**
  - Trigger: Close tab, network failure
  - Expected: Answers already submitted are preserved
  - Can rejoin with same name (if implemented)
  - Score preserved

- [ ] **Host closes browser mid-game**
  - Trigger: Close host tab during active game
  - Expected: Students see "Host disconnected"
  - Game pauses (doesn't end)
  - Host can reopen /host/[code] to resume

- [ ] **Network reconnection**
  - Trigger: Temporary network loss
  - Expected: Convex automatically reconnects
  - No manual refresh needed

### Player Names
- [x] **2 players with same name**
  - Trigger: Both type "Alex" and join
  - Expected: Auto-suffix: "Alex", "Alex (2)"
  - Both can play independently

- [x] **Very long player name**
  - Trigger: Name with 100+ characters
  - Expected: Truncate to 20 chars, or reject with error

- [x] **Empty player name**
  - Trigger: Submit with blank name
  - Expected: Validation error "Please enter your name"

- [ ] **Special characters in name**
  - Trigger: Name with emoji or HTML tags
  - Expected: Sanitize (strip HTML), allow emoji

### Answer Submission
- [ ] **Player submits after timer expires**
  - Trigger: Network delay causes answer to arrive after TIME_UP
  - Expected: Answer rejected, player scores 0 for that question
  - Show "Time's up!" feedback

- [x] **Player submits multiple times**
  - Trigger: Double-click answer button
  - Expected: First answer counts, subsequent ignored
  - No duplicate entries in answers table

- [x] **Player answers out of order**
  - Trigger: Somehow submit answer for wrong questionIndex
  - Expected: Server validates questionIndex matches currentQuestion
  - Reject invalid submissions

### Host Controls
- [x] **Start Game with 0 players**
  - Trigger: Click Start Game when no one joined
  - Expected: Button disabled (prevented in UI)
  - If somehow triggered, show error

- [x] **Next Question at last question**
  - Trigger: Click Next Question on Q10/10
  - Expected: Transitions to "complete" state instead

- [ ] **Double-click Start Game**
  - Trigger: Click Start twice rapidly
  - Expected: Idempotent, only starts once

---

## Iframe Edge Cases

### Loading Failures
- [x] **Iframe never loads**
  - Trigger: HTML has syntax error preventing load
  - Expected: After 10s with no GAME_READY, show error overlay
  - Offer "Reload" or "Regenerate Game" button

- [ ] **Iframe JS error**
  - Trigger: Runtime error in generated JS
  - Expected: Parent catches error (if reported via ERROR message)
  - Show "Game encountered an error" overlay
  - Offer retry

- [ ] **Iframe infinite loop**
  - Trigger: Generated JS has while(true)
  - Expected: Detect via timeout (no GAME_READY in 10s)
  - Show error, offer regenerate

### MessageChannel Issues
- [ ] **MessageChannel transfer fails**
  - Trigger: Port transfer rejected
  - Expected: Show error state
  - Offer page reload

- [ ] **Iframe ignores messages**
  - Trigger: HTML doesn't implement message handler
  - Expected: Parent detects lack of response
  - Show error after timeout

- [ ] **Malformed messages from iframe**
  - Trigger: Iframe sends invalid message format
  - Expected: Parent validates message structure
  - Ignore invalid messages, log for debugging

### Content Rendering
- [ ] **HTML too large**
  - Trigger: Generated HTML is 1MB+
  - Expected: Either works (browsers handle it)
  - Or validation rejects and regenerates smaller

- [ ] **CSS conflicts**
  - Trigger: Generated CSS affects parent (shouldn't happen with sandbox)
  - Expected: Sandbox prevents this
  - Verify parent styling unaffected

---

## Data Integrity Edge Cases

### Concurrent Operations
- [ ] **Two players submit simultaneously**
  - Trigger: Both click at exact same time
  - Expected: Both answers recorded correctly
  - No race condition in score calculation

- [ ] **Player joins while game starting**
  - Trigger: Join request arrives as host clicks Start
  - Expected: Player either joins (if before cutoff) or gets "game started" error
  - No inconsistent state

### State Transitions
- [ ] **Invalid state transition**
  - Trigger: Attempt to go from "lobby" directly to "results"
  - Expected: Server rejects invalid transition
  - State machine enforced server-side

- [ ] **Stale state in client**
  - Trigger: Client has old state, sends outdated request
  - Expected: Server validates against current state
  - Client receives updated state via subscription

---

## Security Edge Cases

- [ ] **XSS in player name**
  - Trigger: Name like `<script>alert('xss')</script>`
  - Expected: HTML escaped in display
  - No script execution

- [ ] **XSS in content**
  - Trigger: Lesson content with script tags
  - Expected: Treated as text, not HTML
  - Passed to Gemini as string

- [ ] **Malicious generated HTML**
  - Trigger: Gemini generates JS that tries to access parent
  - Expected: Sandbox prevents cross-origin access
  - No data leakage possible

---

## Verification Process

For Phase 5, go through each checkbox:

1. **Identify** - Find the edge case in the checklist
2. **Reproduce** - Trigger the condition manually
3. **Verify** - Confirm expected behavior occurs
4. **Check** - Mark the checkbox when verified

If a case fails:
1. Note the actual behavior
2. Create a fix
3. Re-test
4. Then check the box

---

**Last Updated:** 2025-01-30
**Verified By:** Phase 5 Polish
