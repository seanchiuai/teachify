# Gemini AI Reference

Prompt templates and API patterns for LessonPlay question generation.

## SDK Setup

Install the official Google Generative AI SDK:
```bash
npm install @google/genai
```

## Gemini API Call (Using @google/genai SDK)

```typescript
import { GoogleGenAI } from "@google/genai";

async function generateQuestions(
  content: string,
  objective: string,
  objectiveType: string,
  apiKey: string
) {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: buildPrompt(content, objective, objectiveType),
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            question: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            correct: { type: "string" },
            explanation: { type: "string" },
            misconception: { type: "string" },
          },
          required: ["type", "question", "options", "correct", "explanation", "misconception"],
        },
      },
      systemInstruction: "You are a pedagogical expert generating classroom game questions. Generate questions that test understanding, not recall. Wrong answers must reflect common student misconceptions.",
    },
  });

  // response.text is a string (property, not method)
  return JSON.parse(response.text);
}
```

**Key SDK details (verified from docs):**
- Import: `import { GoogleGenAI } from "@google/genai"`
- Constructor: `new GoogleGenAI({ apiKey })`
- Method: `ai.models.generateContent({ model, contents, config })`
- `config.responseMimeType`: `"application/json"` for structured JSON output
- `config.responseSchema`: JSON Schema object defining the expected output structure
- `config.systemInstruction`: String or object with `parts` array
- Response: `response.text` (property, NOT a method call — no parentheses)

## Prompt Template

```typescript
function buildPrompt(content: string, objective: string, objectiveType: string): string {
  return `LEARNING OBJECTIVE: ${objective}
OBJECTIVE TYPE: ${objectiveType}

LESSON CONTENT:
${content}

Generate 8-10 questions that test whether students achieved the learning objective.

RULES:
- Mix question types based on the objective type
- For "understand"/"explain"/"apply"/"analyze": prefer multiple_choice
- For "distinguish": prefer categorization
- For "perform": prefer ordering
- Questions must test UNDERSTANDING, not surface recall
- Wrong answers (distractors) must reflect common student MISCONCEPTIONS
- Each question must include an explanation of why the correct answer is right
- Each question must identify what misconception a wrong answer catches
- For multiple_choice: "correct" is a single string matching one of "options"
- For ordering: "correct" is a JSON string of the correct order
- For categorization: "correct" is a JSON string of the grouped items`;
}
```

## Using Gemini in a Convex Action

Actions are required for external API calls. Use `internal` mutations to write results back to the database:

```typescript
// convex/generate.ts
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";

export const generateGame = action({
  args: {
    content: v.string(),
    objective: v.string(),
    objectiveType: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: buildPrompt(args.content, args.objective, args.objectiveType),
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a pedagogical expert...",
      },
    });

    const questions = JSON.parse(response.text);
    const code = generateGameCode();

    // Use internal mutation to write to DB from an action
    const gameId = await ctx.runMutation(internal.games.create, {
      code,
      content: args.content,
      objective: args.objective,
      objectiveType: args.objectiveType,
      questions,
    });

    return { gameId, code };
  },
});
```

**Important Convex action rules (from docs):**
- Actions CAN call external APIs (fetch, SDKs)
- Actions CANNOT directly read/write the database
- Use `ctx.runMutation(internal.xxx.yyy, args)` to write data
- Use `ctx.runQuery(internal.xxx.yyy, args)` to read data
- Always use `internal` (not `api`) for calling functions from actions for security

## Response Parsing

```typescript
interface Question {
  type: "multiple_choice" | "ordering" | "categorization";
  question: string;
  options: string[];
  correct: string | string[];
  explanation: string;
  misconception: string;
}

function parseQuestions(raw: string): Question[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Expected array");
  if (parsed.length < 5) throw new Error("Too few questions");

  return parsed.map((q: any) => ({
    type: q.type,
    question: q.question,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    misconception: q.misconception,
  }));
}
```

## Error Handling

```typescript
async function generateWithRetry(
  content: string,
  objective: string,
  objectiveType: string,
  apiKey: string,
  maxRetries = 2
): Promise<Question[]> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const questions = await generateQuestions(content, objective, objectiveType, apiKey);
      return parseQuestions(JSON.stringify(questions));
    } catch (error) {
      if (i === maxRetries) throw error;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error("Generation failed after retries");
}
```

## Game Code Generation

```typescript
function generateGameCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/0/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```
