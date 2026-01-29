---
name: gemini-ai
description: Gemini API integration for generating pedagogically-grounded game questions from lesson content
---

# Gemini AI

Handles AI-powered question generation — the core differentiator of LessonPlay. Gemini processes lesson content + learning objectives to produce structured, pedagogically-sound game questions.

## Overview

- **SDK**: `@google/genai` npm package (`GoogleGenAI` class)
- **Input**: Lesson text content + learning objective + objective type
- **Output**: 8-10 structured questions (multiple_choice, ordering, categorization)
- **Key**: Questions test understanding, not recall. Distractors based on misconceptions.
- **Format**: Structured JSON output via `responseMimeType` + `responseSchema`

## When to Use This Skill

- Building or modifying the question generation pipeline
- Engineering or iterating on the AI prompt
- Parsing and validating Gemini's structured output
- Handling generation errors or retries
- Mapping objective types to question formats

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

## Related Files

- `convex/generate.ts` — Gemini API action
- `docs/PRD.md` — AI prompt strategy section

## Reference Files

- [reference.md](reference.md) — Prompt templates and API examples
