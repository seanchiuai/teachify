# Gemini AI Reference

Prompt templates and API patterns for LessonPlay question generation.

## Gemini API Call

```typescript
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function generateQuestions(
  content: string,
  objective: string,
  objectiveType: string,
  apiKey: string
) {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: buildPrompt(content, objective, objectiveType),
        }],
      }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}
```

## System Prompt Template

```typescript
function buildPrompt(content: string, objective: string, objectiveType: string): string {
  return `You are generating an interactive classroom game from lesson materials.

LEARNING OBJECTIVE: ${objective}
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

Return a JSON array of question objects with this exact schema:

[
  {
    "type": "multiple_choice",
    "question": "Question text here",
    "options": ["A", "B", "C", "D"],
    "correct": "B",
    "explanation": "Why B is correct...",
    "misconception": "Students who choose A typically confuse X with Y"
  },
  {
    "type": "ordering",
    "question": "Arrange these steps in the correct order",
    "options": ["Step C", "Step A", "Step D", "Step B"],
    "correct": ["Step A", "Step B", "Step C", "Step D"],
    "explanation": "The correct sequence is...",
    "misconception": "Students often confuse step 2 and 3 because..."
  },
  {
    "type": "categorization",
    "question": "Sort these items into Group X vs Group Y",
    "options": ["Item1", "Item2", "Item3", "Item4", "Item5", "Item6"],
    "correct": [["Item1", "Item3", "Item5"], ["Item2", "Item4", "Item6"]],
    "explanation": "Group X items share the property of...",
    "misconception": "Item2 is commonly misplaced because..."
  }
]

Return ONLY the JSON array, no other text.`;
}
```

## Response Parsing

```typescript
interface Question {
  type: "multiple_choice" | "ordering" | "categorization";
  question: string;
  options: string[];
  correct: string | string[] | string[][];
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
// Retry on failure with exponential backoff
async function generateWithRetry(
  content: string,
  objective: string,
  objectiveType: string,
  apiKey: string,
  maxRetries = 2
): Promise<Question[]> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await generateQuestions(content, objective, objectiveType, apiKey);
      return parseQuestions(JSON.stringify(result));
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
