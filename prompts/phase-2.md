# Phase 2: AI Game Generation (Two-Step Pipeline)

Build US-003 from `docs/PRD.md`.

## Prerequisite

- Phase 1 complete:
  - File parsing action works (PDF/PPTX/DOCX → text)
  - Game records can be created in Convex
  - Homepage form submits and creates game with content

## Reference Documents

- Skills: `gemini-ai/`, `convex/`
- Design: `docs/design.md`
- API Contracts: `docs/api-contracts.md`
- Architecture: "Architecture: AI-Generated HTML Games" section in `docs/PRD.md`

---

## Checkpoint 2.1: Gemini API Connection

**Goal:** Verify Gemini API connectivity from Convex action

**Files to create:**
```
convex/actions/generateGame.ts (initial setup)
lib/gemini.ts (optional client helper)
```

**Environment setup:**
- `GEMINI_API_KEY` in `.env.local` and Convex dashboard

**Test call:**
```typescript
// Simple test: send "Hello" and get response
const response = await gemini.generateContent("Hello, respond with 'API working'");
```

**Test:**
- Run action from Convex dashboard
- Response received without auth errors

**Exit criteria:**
- [ ] Gemini API key configured in Convex
- [ ] Test action returns response
- [ ] Error handling for rate limits/failures

---

## Checkpoint 2.2: Question Generation (Step 1)

**Goal:** Generate structured questions from content

**Prompt requirements:**
- Input: content text, learning objective, objective type
- Output: JSON array of 8-10 questions
- Question types: multiple_choice, ordering, categorization

**Question schema:**
```typescript
interface Question {
  type: "multiple_choice" | "ordering" | "categorization";
  question: string;
  options: string[];
  correct: string | string[];  // single answer or ordered/grouped
  explanation: string;
  misconception: string;  // common wrong thinking to address
}
```

**Prompt design:**
- Include objective type mapping to question characteristics
- Request pedagogically-grounded questions (test understanding, not recall)
- Use structured output / JSON mode if available

**Test:**
- Input: Cell biology content + "Understand cell organelles" + "understand"
- Output: 8-10 questions in correct JSON format

**Exit criteria:**
- [ ] Questions are JSON-parseable
- [ ] Questions match requested objective type style
- [ ] Each question has all required fields
- [ ] Questions test understanding, not just recall
- [ ] Mix of question types generated

---

## Checkpoint 2.3: HTML Game Generation (Step 2)

**Goal:** Generate self-contained HTML game from questions

**HTML requirements:**
- Self-contained (inline CSS, inline JS)
- No external dependencies (no CDN links, no external URLs)
- Mobile-responsive (viewport meta, relative units, 44px+ touch targets)
- Implements postMessage protocol

**PostMessage protocol (iframe → parent):**
```javascript
// Must be present in generated HTML
port.postMessage({ type: 'GAME_READY' });
port.postMessage({ type: 'ANSWER_SUBMITTED', questionIndex, answer, timeMs });
port.postMessage({ type: 'GAME_OVER', finalScore });
port.postMessage({ type: 'ERROR', message });
```

**PostMessage protocol (parent → iframe):**
```javascript
// HTML must handle these messages
// START_GAME { questions }
// NEXT_QUESTION { questionIndex }
// TIME_UP {}
// END_GAME {}
```

**Prompt design:**
- Provide questions JSON as input
- Specify game style (can vary: quiz wheel, flashcards, drag-drop, etc.)
- Mandate postMessage protocol implementation
- Mandate no external URLs

**Test:**
- Input: Questions from Step 1
- Output: Valid HTML that includes postMessage code

**Exit criteria:**
- [ ] HTML is syntactically valid
- [ ] CSS is inline (no external stylesheets)
- [ ] JS is inline (no external scripts)
- [ ] viewport meta tag present
- [ ] postMessage handler code present
- [ ] No external URLs in HTML

---

## Checkpoint 2.4: HTML Validation

**Goal:** Validate generated HTML before storage

**Validation checks:**
```typescript
function validateGameHtml(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Must have postMessage
  if (!html.includes('postMessage') && !html.includes('MessageChannel')) {
    errors.push('Missing postMessage/MessageChannel code');
  }

  // No external URLs (src=, href= to other domains)
  const externalUrlPattern = /(src|href)=["'](https?:\/\/)/gi;
  if (externalUrlPattern.test(html)) {
    errors.push('Contains external URLs');
  }

  // Must have viewport meta
  if (!html.includes('viewport')) {
    errors.push('Missing viewport meta tag');
  }

  return { valid: errors.length === 0, errors };
}
```

**On validation failure:**
- Log the specific errors
- Retry generation (up to 2 retries)
- If still fails, return error to user

**Test:**
- Valid HTML passes
- HTML with external URL fails
- HTML without postMessage fails

**Exit criteria:**
- [ ] Validation function implemented
- [ ] External URLs detected and rejected
- [ ] Missing postMessage detected
- [ ] Retry logic works
- [ ] Clear error message on persistent failure

---

## Checkpoint 2.5: Full Generation Pipeline

**Goal:** Complete flow from form submission to stored game

**Pipeline flow:**
1. User submits form (content, objective, type)
2. Game record created with `state: "generating"`
3. Step 1: Generate questions → store in `questions` field
4. Step 2: Generate HTML game → store in `gameHtml` field
5. Validate HTML
6. Update game `state: "lobby"`
7. User sees game ready (or error with retry option)

**Files to update:**
```
convex/actions/generateGame.ts (complete pipeline)
convex/games.ts (update game state mutations)
app/host/[code]/page.tsx (show generation progress)
```

**Generation progress UI:**
- Show "Generating questions..." during Step 1
- Show "Building game..." during Step 2
- Show "Validating..." during validation
- Show error with "Retry" button on failure

**Test:**
- Submit form → game generates → redirects to host view
- Game record has questions array populated
- Game record has gameHtml populated
- Generation completes in under 30 seconds

**Exit criteria:**
- [ ] Full pipeline works end-to-end
- [ ] Questions stored in game record
- [ ] gameHtml stored in game record
- [ ] Game state updates correctly
- [ ] Generation under 30 seconds
- [ ] Error handling with retry option
- [ ] Progress feedback shown to user

---

## Test Scenarios

1. **Happy path - short content**
   - Submit 200 words of text
   - Questions generated (check variety)
   - HTML game generated
   - Game ready in lobby state

2. **Happy path - long content**
   - Submit 2000+ words
   - Questions focus on key concepts
   - Generation still completes

3. **Objective type variation**
   - Test with "understand" → conceptual questions
   - Test with "apply" → scenario-based questions
   - Test with "analyze" → comparison questions

4. **Generation failure recovery**
   - Simulate API timeout → retry works
   - Simulate invalid HTML → retry regenerates

5. **Validation edge cases**
   - HTML with data: URLs (should be allowed)
   - HTML with inline SVG (should be allowed)
   - HTML with script src="https://..." (should fail)

---

## Exit Criteria Summary

When ALL checkpoints pass:
- [ ] 2.1: Gemini API connected and working
- [ ] 2.2: Question generation produces valid JSON
- [ ] 2.3: HTML generation produces self-contained games
- [ ] 2.4: HTML validation catches security issues
- [ ] 2.5: Full pipeline from submit to ready game
- [ ] US-003 acceptance criteria in PRD.md checked off
- [ ] Typecheck passes (`npm run build`)
- [ ] All test scenarios verified in browser

---

If you can't complete an acceptance criterion without human assistance, skip that part but report what still needs to be done. When ALL acceptance criteria are met and tested:

<promise>PHASE 2 COMPLETE</promise>
