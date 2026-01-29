# Gemini AI Reference

Two-step generation pipeline: (1) structured questions, (2) self-contained HTML game.

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

## Using Gemini in a Convex Action (Two-Step Pipeline)

Actions are required for external API calls. The generation is two steps: (1) generate questions as JSON, (2) generate an HTML game from those questions.

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

    // Step 1: Generate structured questions
    const questionsResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: buildQuestionPrompt(args.content, args.objective, args.objectiveType),
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        systemInstruction: "You are a pedagogical expert generating classroom game questions. Generate questions that test understanding, not recall. Wrong answers must reflect common student misconceptions.",
      },
    });
    const questions = JSON.parse(questionsResponse.text);

    // Step 2: Generate self-contained HTML game
    const htmlResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: buildGameHtmlPrompt(questions, args.objectiveType),
      config: {
        systemInstruction: "You are a game developer. Generate a single self-contained HTML document for an interactive educational game. Output ONLY the HTML — no markdown, no code fences, no explanation.",
      },
    });
    const gameHtml = htmlResponse.text;

    // Validate the HTML
    validateGameHtml(gameHtml);

    const code = generateGameCode();

    const gameId = await ctx.runMutation(internal.games.create, {
      code,
      content: args.content,
      objective: args.objective,
      objectiveType: args.objectiveType,
      questions,
      gameHtml,
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

## Step 2: HTML Game Generation Prompt

```typescript
function buildGameHtmlPrompt(questions: Question[], objectiveType: string): string {
  return `Generate a COMPLETE, SELF-CONTAINED HTML file for an interactive educational game.

QUESTIONS DATA:
${JSON.stringify(questions, null, 2)}

OBJECTIVE TYPE: ${objectiveType}

REQUIREMENTS:
- Complete HTML5 document with <!DOCTYPE html>
- Include <meta name="viewport" content="width=device-width, initial-scale=1.0">
- All CSS inline in <style> tags
- All JavaScript inline in <script> tags
- Mobile-responsive (relative units: %, vh, vw, rem — never fixed pixel widths)
- Buttons/touch targets must be at least 44x44px
- Use pointer events (pointerdown) instead of click-only for touch support
- Text must be readable without zooming (minimum 16px base font)
- Use vibrant colors and smooth CSS animations for engagement
- Game elements must fit within the viewport without scrolling

COMMUNICATION PROTOCOL (MANDATORY):
On load, listen for parent message to receive MessageChannel port:
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'INIT_PORT') {
      const port = e.ports[0];
      port.postMessage({ type: 'GAME_READY' });
      // Use port for all further communication
    }
  }, { once: true });

Send these messages via the port:
- { type: 'GAME_READY' } — when game is loaded
- { type: 'ANSWER_SUBMITTED', payload: { questionIndex: number, answer: string, timeMs: number } } — when player answers
- { type: 'GAME_OVER', payload: { finalScore: number } } — when all questions done

Listen for these messages from parent via the port:
- { type: 'START_GAME' } — begin the game
- { type: 'NEXT_QUESTION', payload: { questionIndex: number } } — advance
- { type: 'TIME_UP' } — timer expired for current question
- { type: 'END_GAME' } — force end

CONSTRAINTS:
- NO external scripts, stylesheets, or images (no CDN, no URLs)
- NO localStorage or sessionStorage (sandbox blocks it)
- NO fetch/XMLHttpRequest (sandbox blocks network)
- Use CSS animations and gradients instead of images
- Code must be COMPLETE and FUNCTIONAL — no placeholders, no omissions
- Output ONLY the HTML document — no markdown fences, no explanation text`;
}
```

## HTML Validation

```typescript
function validateGameHtml(html: string): void {
  if (!html.includes('postMessage') && !html.includes('port.postMessage')) {
    throw new Error("Generated HTML missing postMessage communication");
  }
  // Check for external resource loading
  const externalUrlPattern = /(?:src|href)\s*=\s*["']https?:\/\//i;
  if (externalUrlPattern.test(html)) {
    throw new Error("Generated HTML contains external URLs");
  }
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    throw new Error("Generated HTML is not a valid HTML document");
  }
}
```

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
