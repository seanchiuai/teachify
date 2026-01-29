---
name: gemini-ai
description: Gemini API integration for generating pedagogically-grounded game questions from lesson content
---

# Gemini AI

Handles the two-step AI generation pipeline — the core differentiator of LessonPlay. Gemini processes lesson content + learning objectives to produce (1) structured questions and (2) a self-contained HTML game that runs in a sandboxed iframe.

## Overview

- **SDK**: `@google/genai` npm package (`GoogleGenAI` class)
- **Input**: Lesson text content + learning objective + objective type
- **Step 1 Output**: 8-10 structured questions as JSON (for scoring/analytics)
- **Step 2 Output**: Self-contained HTML game (inline CSS/JS, no external deps) that renders the questions
- **Key**: Questions test understanding, not recall. Games are unique every time.
- **Format**: Step 1 uses structured JSON output; Step 2 uses plain text (HTML string)

## When to Use This Skill

- Building or modifying the two-step generation pipeline
- Engineering or iterating on the question generation prompt
- Engineering or iterating on the HTML game generation prompt
- Parsing and validating Gemini's structured output
- Validating generated HTML (postMessage protocol, no external URLs)
- Handling generation errors or retries
- Mapping objective types to question/game formats

## Key Concepts

### SDK Usage

```typescript
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({ model, contents, config });
const text = response.text; // property, NOT a method
```

### Structured Output

Use `config.responseMimeType: "application/json"` and `config.responseSchema` to enforce JSON structure. The SDK handles schema validation — no need to manually parse or hope for correct formatting.

### Objective Type → Question Format Mapping

| Objective Type | Preferred Question Types |
|----------------|------------------------|
| Understand | Multiple choice (concept questions) |
| Explain | Multiple choice (why/how questions) |
| Apply | Multiple choice (scenario-based) |
| Distinguish | Categorization (sort into groups) |
| Perform | Ordering (sequence steps) |
| Analyze | Multiple choice + categorization |

### Calling from Convex

Gemini calls MUST happen in a Convex **action** (not query or mutation). Use `ctx.runMutation(internal.xxx.yyy, args)` to store results in the database.

### Question Quality Markers

- Tests understanding over recall
- Wrong answers are plausible misconceptions, not random
- Explanation teaches, not just confirms
- Question maps to the stated learning objective

### HTML Game Generation Requirements

The generated HTML must:
- Be a complete `<!DOCTYPE html>` document with inline `<style>` and `<script>`
- Include `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Use no external dependencies (no CDN scripts, no external CSS, no images via URL)
- Implement the postMessage communication protocol (GAME_READY, ANSWER_SUBMITTED, GAME_OVER)
- Use CSS relative units (%, vh, vw, rem) and pointer events (not click-only)
- Have touch targets >= 44px
- Not use localStorage, sessionStorage, fetch, or XMLHttpRequest (sandbox blocks these)

### HTML Validation

Before storing, validate:
- Contains `postMessage` or `port.postMessage` code
- No external `src=` or `href=` pointing to other domains
- Contains the question data
- Is structurally valid HTML

## Related Files

- `convex/generate.ts` — Gemini API action (two-step: questions + HTML game)
- `docs/PRD.md` — Architecture and AI generation sections

## Reference Files

- [reference.md](reference.md) — Prompt templates, API examples, HTML generation
