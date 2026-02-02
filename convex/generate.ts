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

interface EngineQuestion {
  id: string;
  type: "multiple_choice" | "ordering" | "categorization" | "true_false";
  question: string;
  options: string[];
  correct: string | string[];
  explanation: string;
  misconception: string;
  difficulty?: number;
  points?: number;
}

// Game spec types for the composable engine
interface GameSpecification {
  title: string;
  narrative: string;
  genre: "economic" | "combat" | "spatial" | "social" | "racing" | "puzzle";
  subGenres: string[];
  theme: {
    style: string;
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    mood: string;
  };
  world: {
    type: "grid" | "zones" | "track" | "freeform";
    size: { width: number; height: number };
    features: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
    }>;
    zones?: Array<{
      id: string;
      name: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      color?: string;
    }>;
  };
  players: {
    hasAvatar: boolean;
    avatarStyle: string;
    startingResources: Record<string, number>;
    startingHealth?: number;
    maxHealth?: number;
    abilities: Array<{
      id: string;
      name: string;
      description: string;
      cooldown: number;
      effects: Array<{ type: string; amount?: number }>;
    }>;
  };
  mechanics: {
    economy?: {
      currencies: string[];
      startingAmounts: Record<string, number>;
      tradingEnabled: boolean;
      stealingEnabled: boolean;
      earnRates: {
        perCorrectAnswer?: Record<string, number>;
      };
    };
    combat?: {
      maxHealth: number;
      startingHealth: number;
      damagePerAttack: number;
      damagePerIncorrect?: number;
      healPerCorrect?: number;
      respawnEnabled: boolean;
      friendlyFire: boolean;
    };
    movement?: {
      type: string;
      movementPerTurn?: number;
      movementPerCorrect?: number;
      canPassThrough: boolean;
      captureEnabled: boolean;
      influencePerCorrect?: number;
      influenceToCapture?: number;
    };
    timer?: {
      questionDuration: number;
      gameDuration?: number;
    };
  };
  scoring: {
    basePoints: number;
    timeBonus: number;
    streakMultiplier: number;
    maxStreak: number;
  };
  questionIntegration: {
    trigger: "timed" | "action" | "zone" | "combat" | "turn";
    interval?: number;
    onCorrect: Array<{ type: string; amount?: number; resource?: string; currency?: string }>;
    onIncorrect: Array<{ type: string; amount?: number }>;
    displayStyle: "modal" | "inline" | "challenge";
    allowSkip: boolean;
  };
  victory: {
    type: "score" | "elimination" | "objective" | "survival";
    conditions: Array<{ type: string; threshold?: number }>;
    duration: number;
  };
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

// Schema for AI Game Designer output
const gameSpecSchema = {
  type: "object" as const,
  properties: {
    title: { type: "string" as const },
    narrative: { type: "string" as const },
    genre: { type: "string" as const },
    subGenres: { type: "array" as const, items: { type: "string" as const } },
    theme: {
      type: "object" as const,
      properties: {
        style: { type: "string" as const },
        primaryColor: { type: "string" as const },
        accentColor: { type: "string" as const },
        backgroundColor: { type: "string" as const },
        mood: { type: "string" as const },
      },
      required: ["style", "primaryColor", "accentColor", "backgroundColor", "mood"],
    },
    world: {
      type: "object" as const,
      properties: {
        type: { type: "string" as const },
        size: {
          type: "object" as const,
          properties: {
            width: { type: "number" as const },
            height: { type: "number" as const },
          },
          required: ["width", "height"],
        },
        features: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              id: { type: "string" as const },
              type: { type: "string" as const },
              position: {
                type: "object" as const,
                properties: {
                  x: { type: "number" as const },
                  y: { type: "number" as const },
                },
                required: ["x", "y"],
              },
            },
            required: ["id", "type", "position"],
          },
        },
        zones: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              id: { type: "string" as const },
              name: { type: "string" as const },
              position: {
                type: "object" as const,
                properties: {
                  x: { type: "number" as const },
                  y: { type: "number" as const },
                },
                required: ["x", "y"],
              },
              size: {
                type: "object" as const,
                properties: {
                  width: { type: "number" as const },
                  height: { type: "number" as const },
                },
                required: ["width", "height"],
              },
              color: { type: "string" as const },
            },
            required: ["id", "name", "position", "size"],
          },
        },
      },
      required: ["type", "size", "features"],
    },
    players: {
      type: "object" as const,
      properties: {
        hasAvatar: { type: "boolean" as const },
        avatarStyle: { type: "string" as const },
        startingResources: { type: "object" as const },
        startingHealth: { type: "number" as const },
        maxHealth: { type: "number" as const },
        abilities: { type: "array" as const, items: { type: "object" as const } },
      },
      required: ["hasAvatar", "avatarStyle", "startingResources", "abilities"],
    },
    mechanics: { type: "object" as const },
    scoring: {
      type: "object" as const,
      properties: {
        basePoints: { type: "number" as const },
        timeBonus: { type: "number" as const },
        streakMultiplier: { type: "number" as const },
        maxStreak: { type: "number" as const },
      },
      required: ["basePoints", "timeBonus", "streakMultiplier", "maxStreak"],
    },
    questionIntegration: {
      type: "object" as const,
      properties: {
        trigger: { type: "string" as const },
        interval: { type: "number" as const },
        onCorrect: { type: "array" as const, items: { type: "object" as const } },
        onIncorrect: { type: "array" as const, items: { type: "object" as const } },
        displayStyle: { type: "string" as const },
        allowSkip: { type: "boolean" as const },
      },
      required: ["trigger", "onCorrect", "onIncorrect", "displayStyle", "allowSkip"],
    },
    victory: {
      type: "object" as const,
      properties: {
        type: { type: "string" as const },
        conditions: { type: "array" as const, items: { type: "object" as const } },
        duration: { type: "number" as const },
      },
      required: ["type", "conditions", "duration"],
    },
  },
  required: [
    "title", "narrative", "genre", "subGenres", "theme", "world",
    "players", "mechanics", "scoring", "questionIntegration", "victory"
  ],
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

function buildGameDesignerPrompt(
  content: string,
  objective: string,
  objectiveType: string,
  hints?: {
    preferredGenre?: string;
    preferredMechanics?: string[];
    avoidMechanics?: string[];
  }
): string {
  const hintsSection = hints
    ? `
TEACHER HINTS (optional guidance):
${hints.preferredGenre ? `- Preferred genre: ${hints.preferredGenre}` : ""}
${hints.preferredMechanics?.length ? `- Include mechanics: ${hints.preferredMechanics.join(", ")}` : ""}
${hints.avoidMechanics?.length ? `- Avoid mechanics: ${hints.avoidMechanics.join(", ")}` : ""}
`
    : "";

  return `You are a game designer for an educational platform. Design an engaging multiplayer game that teaches the lesson content.

LEARNING OBJECTIVE: ${objective}
OBJECTIVE TYPE: ${objectiveType}
${hintsSection}
LESSON CONTENT:
${content.substring(0, 3000)}

ANALYZE the content and determine:
1. Subject matter (history, science, math, language, etc.)
2. Complexity level
3. Key concepts to test
4. Natural game metaphors that fit the content

AVAILABLE GAME GENRES:
- "economic": Currency trading, resource management (good for math, economics)
- "combat": Health/damage mechanics, elimination (good for competitive topics)
- "spatial": Territory control, movement, zones (good for history, geography)
- "social": Voting, roles, alliances (good for literature, social studies)
- "racing": Speed-based, first to finish (good for simple recall)
- "puzzle": Logic, pattern matching (good for science, problem-solving)

AVAILABLE SYSTEMS you can compose:
- Economy: currencies, trading, stealing, shops
- Combat: health, damage, shields, healing
- Movement: grid, zones, territory capture
- Timer: question timers, game duration, rounds

QUESTION INTEGRATION MODES:
- "timed": Questions appear on a timer interval
- "zone": Questions trigger when entering zones
- "combat": Questions trigger during attacks
- "turn": Questions at start of each turn

Design a game specification that:
1. Matches the genre to the content (e.g., history → spatial/territory, math → economic)
2. Makes learning feel like natural gameplay
3. Keeps players engaged for 10-15 minutes
4. Works with 2-20 players
5. Has clear visual theme matching the content

Output a complete GameSpecification JSON with:
- Engaging title related to the content
- Brief narrative setting the scene
- Appropriate theme colors (hex codes) and style
- World configuration (grid or zones based on game type)
- Player configuration with starting resources/health as needed
- Mechanics configuration (only include relevant systems)
- Scoring configuration (base points, time bonus, streaks)
- Question integration (how questions fit into gameplay)
- Victory conditions (score threshold, elimination, or objective)`;
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

// Legacy game generation (HTML-based)
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

// New: Engine-based game generation
export const generateEngineGame = action({
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
    hints: v.optional(v.object({
      preferredGenre: v.optional(v.string()),
      preferredMechanics: v.optional(v.array(v.string())),
      avoidMechanics: v.optional(v.array(v.string())),
    })),
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
    const rawQuestions: Question[] = JSON.parse(questionsText);

    if (!Array.isArray(rawQuestions) || rawQuestions.length < 5) {
      throw new Error("Failed to generate enough questions");
    }

    // Add IDs to questions
    const questions: EngineQuestion[] = rawQuestions.map((q, i) => ({
      ...q,
      id: `q-${i}`,
    }));

    // Step 2: AI Game Designer - Generate game specification
    const gameSpecResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: buildGameDesignerPrompt(
        args.content,
        args.objective,
        args.objectiveType,
        args.hints
      ),
      config: {
        responseMimeType: "application/json",
        responseSchema: gameSpecSchema,
        systemInstruction:
          "You are a game designer creating educational games. Design engaging multiplayer games that make learning fun. Output a complete game specification JSON.",
      },
    });
    const gameSpecText = gameSpecResponse.text;
    if (!gameSpecText) throw new Error("Empty response from game designer");

    let gameSpec: GameSpecification;
    try {
      gameSpec = JSON.parse(gameSpecText);
    } catch (e) {
      throw new Error("Failed to parse game specification: " + e);
    }

    // Validate essential fields
    if (!gameSpec.title || !gameSpec.genre || !gameSpec.theme || !gameSpec.world) {
      throw new Error("Invalid game specification: missing required fields");
    }

    // Add questions to spec
    const fullGameSpec = {
      ...gameSpec,
      questions,
    };

    const code = generateGameCode();
    const topic = gameSpec.title || extractTopic(args.content);

    // Create game with engine mode
    await ctx.runMutation(internal.games.createEngineGame, {
      code,
      topic,
      content: args.content,
      objective: args.objective,
      objectiveType: args.objectiveType,
      questions,
      gameSpec: fullGameSpec,
      fileId: args.fileId,
    });

    return { code, gameSpec: fullGameSpec };
  },
});
