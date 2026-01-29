---
name: gemini-ai
description: Gemini API integration for generating pedagogically-grounded game questions from lesson content
---

# Gemini AI

Handles AI-powered question generation — the core differentiator of LessonPlay. Gemini processes lesson content + learning objectives to produce structured, pedagogically-sound game questions.

## Overview

- **Input**: Lesson text content + learning objective + objective type
- **Output**: 8-10 structured questions (multiple_choice, ordering, categorization)
- **Key**: Questions test understanding, not recall. Distractors based on misconceptions.
- **Format**: Structured JSON output for reliable parsing

## When to Use This Skill

- Building or modifying the question generation pipeline
- Engineering or iterating on the AI prompt
- Parsing and validating Gemini's structured output
- Handling generation errors or retries
- Mapping objective types to question formats

## Key Concepts

### Objective Type → Question Format Mapping

| Objective Type | Preferred Question Types |
|----------------|------------------------|
| Understand | Multiple choice (concept questions) |
| Explain | Multiple choice (why/how questions) |
| Apply | Multiple choice (scenario-based) |
| Distinguish | Categorization (sort into groups) |
| Perform | Ordering (sequence steps) |
| Analyze | Multiple choice + categorization |

### Prompt Engineering Principles

1. **Learning objective context** — AI knows what students should learn, not just the content
2. **Objective type guidance** — Shapes question format and depth
3. **Misconception awareness** — Distractors reflect common student errors
4. **Explanation generation** — Every question includes why the answer is correct
5. **Structured output** — JSON schema enforced for reliable parsing

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
