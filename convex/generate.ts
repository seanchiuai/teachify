"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";

interface Question {
  type: "multiple_choice" | "ordering" | "categorization";
  question: string;
  options: string[];
  correct: string | string[];
  explanation: string;
  misconception: string;
}

const questionSchema = {
  type: "array" as const,
  items: {
    type: "object" as const,
    properties: {
      type: { type: "string" as const },
      question: { type: "string" as const },
      options: { type: "array" as const, items: { type: "string" as const } },
      correct: { type: "string" as const },
      explanation: { type: "string" as const },
      misconception: { type: "string" as const },
    },
    required: ["type", "question", "options", "correct", "explanation", "misconception"],
  },
};

function buildQuestionPrompt(content: string, objective: string, objectiveType: string): string {
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
- For ordering: "correct" is a JSON string of the correct order array
- For categorization: "correct" is a JSON string of the grouped items object`;
}

function buildGameHtmlPrompt(questions: Question[], objectiveType: string): string {
  return `Generate a COMPLETE, SELF-CONTAINED HTML file for an interactive educational quiz game.

QUESTIONS DATA:
${JSON.stringify(questions, null, 2)}

OBJECTIVE TYPE: ${objectiveType}

REQUIREMENTS:
- Complete HTML5 document with <!DOCTYPE html>
- Include <meta name="viewport" content="width=device-width, initial-scale=1.0">
- All CSS inline in <style> tags
- All JavaScript inline in <script> tags
- Mobile-responsive (relative units: %, vh, vw, rem — never fixed pixel widths for containers)
- Buttons/touch targets must be at least 44x44px
- Use pointer events (pointerdown/pointerup) instead of click-only for touch support
- Text must be readable without zooming (minimum 16px base font)
- Use vibrant colors and smooth CSS animations for engagement
- Game elements must fit within the viewport without scrolling

GAME MECHANICS:
- Show one question at a time
- Display 4 answer options as large tappable buttons
- Show progress indicator (question X of Y)
- After answering, briefly show correct/incorrect feedback
- Track score internally
- At the end, show final score

COMMUNICATION PROTOCOL (MANDATORY):
On load, listen for parent message to receive MessageChannel port:
window.addEventListener('message', (e) => {
  if (e.data?.type === 'INIT_PORT') {
    const port = e.ports[0];
    port.postMessage({ type: 'GAME_READY' });
    // Store port globally and use for all further communication
  }
}, { once: true });

Send these messages via the port:
- { type: 'GAME_READY' } — when game is loaded and ready
- { type: 'ANSWER_SUBMITTED', payload: { questionIndex: number, answer: string, timeMs: number } } — when player answers
- { type: 'GAME_OVER', payload: { finalScore: number } } — when all questions completed

Listen for these messages from parent via the port:
- { type: 'START_GAME' } — begin showing questions
- { type: 'NEXT_QUESTION', payload: { questionIndex: number } } — advance to next question
- { type: 'TIME_UP' } — timer expired for current question
- { type: 'END_GAME' } — force end the game

CONSTRAINTS:
- NO external scripts, stylesheets, fonts, or images (no CDN links, no URLs)
- NO localStorage or sessionStorage (sandbox blocks it)
- NO fetch/XMLHttpRequest (sandbox blocks network)
- Use CSS gradients and shapes instead of images
- Use system fonts or CSS-safe web fonts
- Code must be COMPLETE and FUNCTIONAL — no placeholders, no "..." omissions
- Output ONLY the raw HTML document — no markdown code fences, no explanation text before or after`;
}

function validateGameHtml(html: string): void {
  if (!html.includes("postMessage") && !html.includes("port.postMessage")) {
    throw new Error("Generated HTML missing postMessage communication");
  }
  const externalUrlPattern = /(?:src|href)\s*=\s*["']https?:\/\//i;
  if (externalUrlPattern.test(html)) {
    throw new Error("Generated HTML contains external URLs");
  }
  if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
    throw new Error("Generated HTML is not a valid HTML document");
  }
}

function generateGameCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function extractTopic(content: string): string {
  const firstLine = content.split("\n")[0].trim();
  return firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;
}

export const generateGame = action({
  args: {
    content: v.string(),
    objective: v.string(),
    objectiveType: v.union(
      v.literal("understand"),
      v.literal("explain"),
      v.literal("apply"),
      v.literal("distinguish"),
      v.literal("perform"),
      v.literal("analyze")
    ),
    fileId: v.optional(v.id("_storage")),
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
        systemInstruction:
          "You are a pedagogical expert generating classroom game questions. Generate questions that test understanding, not recall. Wrong answers must reflect common student misconceptions.",
      },
    });
    const questionsText = questionsResponse.text;
    if (!questionsText) throw new Error("Empty response from question generation");
    const questions: Question[] = JSON.parse(questionsText);

    if (!Array.isArray(questions) || questions.length < 5) {
      throw new Error("Failed to generate enough questions");
    }

    // Step 2: Generate self-contained HTML game
    const htmlResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: buildGameHtmlPrompt(questions, args.objectiveType),
      config: {
        systemInstruction:
          "You are a game developer creating interactive educational games. Generate a single self-contained HTML document. Output ONLY the HTML — no markdown, no code fences, no explanation.",
      },
    });
    let gameHtml = htmlResponse.text;
    if (!gameHtml) throw new Error("Empty response from HTML generation");

    // Strip markdown code fences if present
    if (gameHtml.startsWith("```")) {
      gameHtml = gameHtml.replace(/^```html?\n?/, "").replace(/\n?```$/, "");
    }

    validateGameHtml(gameHtml);

    const code = generateGameCode();
    const topic = extractTopic(args.content);

    await ctx.runMutation(internal.games.create, {
      code,
      topic,
      content: args.content,
      objective: args.objective,
      objectiveType: args.objectiveType,
      questions,
      gameHtml,
      fileId: args.fileId,
    });

    return { code };
  },
});
