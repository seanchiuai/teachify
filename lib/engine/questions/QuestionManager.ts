/**
 * QuestionManager - Question delivery and effect application
 */

import type {
  GameSpecification,
  Question,
  QuestionIntegration,
  QuestionTrigger,
  Effect,
  PlayerState,
  ActionType,
} from "../types";

export interface QuestionDelivery {
  question: Question;
  index: number;
  trigger: QuestionTrigger;
  triggerSource?: string; // zone id, action type, etc.
}

export interface AnswerResult {
  correct: boolean;
  effects: Effect[];
  pointsAwarded: number;
  streakContinued: boolean;
  newStreak: number;
}

/**
 * QuestionManager class
 */
export class QuestionManager {
  private spec: GameSpecification;
  private askedQuestions: Set<number> = new Set();
  private currentQuestionIndex: number = 0;
  private questionStartTime: number = 0;

  constructor(spec: GameSpecification) {
    this.spec = spec;
  }

  /**
   * Get total number of questions
   */
  getTotalQuestions(): number {
    return this.spec.questions.length;
  }

  /**
   * Get number of remaining questions
   */
  getRemainingQuestions(): number {
    return this.spec.questions.length - this.askedQuestions.size;
  }

  /**
   * Check if there are more questions
   */
  hasMoreQuestions(): boolean {
    return this.askedQuestions.size < this.spec.questions.length;
  }

  /**
   * Get current question index
   */
  getCurrentIndex(): number {
    return this.currentQuestionIndex;
  }

  /**
   * Get next question based on trigger
   */
  getNextQuestion(trigger: QuestionTrigger, triggerSource?: string): QuestionDelivery | null {
    if (!this.hasMoreQuestions()) return null;

    // Find next unasked question
    let nextIndex = this.currentQuestionIndex;
    while (this.askedQuestions.has(nextIndex) && nextIndex < this.spec.questions.length) {
      nextIndex++;
    }

    if (nextIndex >= this.spec.questions.length) {
      // Wrap around or return null
      return null;
    }

    const question = this.spec.questions[nextIndex];

    return {
      question: { ...question, id: question.id || `q-${nextIndex}` },
      index: nextIndex,
      trigger,
      triggerSource,
    };
  }

  /**
   * Get specific question by index
   */
  getQuestion(index: number): Question | null {
    if (index < 0 || index >= this.spec.questions.length) return null;
    const q = this.spec.questions[index];
    return { ...q, id: q.id || `q-${index}` };
  }

  /**
   * Start a question (mark as current, record start time)
   */
  startQuestion(index: number): void {
    this.currentQuestionIndex = index;
    this.questionStartTime = Date.now();
  }

  /**
   * Mark question as asked
   */
  markAsked(index: number): void {
    this.askedQuestions.add(index);
    this.currentQuestionIndex = index + 1;
  }

  /**
   * Get time elapsed since question started
   */
  getElapsedTime(): number {
    return Date.now() - this.questionStartTime;
  }

  /**
   * Check if answer is correct
   */
  checkAnswer(answer: string | string[], question: Question): boolean {
    const correct = question.correct;

    if (Array.isArray(correct)) {
      if (!Array.isArray(answer)) return false;

      // For ordering: must match exactly
      if (question.type === "ordering") {
        return JSON.stringify(answer) === JSON.stringify(correct);
      }

      // For categorization/matching: check set equality
      if (answer.length !== correct.length) return false;
      const answerSet = new Set(answer);
      return correct.every(c => answerSet.has(c));
    }

    return answer === correct;
  }

  /**
   * Process an answer and return result
   */
  processAnswer(
    answer: string | string[],
    player: PlayerState,
    timeMs: number
  ): AnswerResult {
    const question = this.getQuestion(this.currentQuestionIndex);
    if (!question) {
      return {
        correct: false,
        effects: [],
        pointsAwarded: 0,
        streakContinued: false,
        newStreak: 0,
      };
    }

    const isCorrect = this.checkAnswer(answer, question);
    const integration = this.spec.questionIntegration;

    // Get effects
    const effects = isCorrect ? integration.onCorrect : integration.onIncorrect;

    // Calculate points
    let pointsAwarded = 0;
    let newStreak = player.streak;

    if (isCorrect) {
      // Base points
      pointsAwarded = question.points || this.spec.scoring.basePoints;

      // Time bonus
      const timeLimit = (question.timeLimit || integration.interval || 30) * 1000;
      const timeFraction = Math.max(0, 1 - timeMs / timeLimit);
      pointsAwarded += Math.floor(this.spec.scoring.timeBonus * timeFraction);

      // Streak
      newStreak = player.streak + 1;
      const cappedStreak = Math.min(newStreak, this.spec.scoring.maxStreak);
      const streakBonus = cappedStreak * this.spec.scoring.streakMultiplier;
      pointsAwarded = Math.floor(pointsAwarded * (1 + streakBonus));
    } else {
      newStreak = 0;
    }

    // Mark as asked
    this.markAsked(this.currentQuestionIndex);

    return {
      correct: isCorrect,
      effects,
      pointsAwarded,
      streakContinued: isCorrect,
      newStreak,
    };
  }

  /**
   * Check if action should trigger a question
   */
  shouldTriggerOnAction(action: ActionType): boolean {
    const integration = this.spec.questionIntegration;
    if (integration.trigger !== "action") return false;
    if (!integration.triggerActions) return false;
    return integration.triggerActions.includes(action);
  }

  /**
   * Check if zone entry should trigger a question
   */
  shouldTriggerOnZone(zoneId: string): boolean {
    const integration = this.spec.questionIntegration;
    if (integration.trigger !== "zone") return false;
    if (!integration.triggerZones) return true; // All zones trigger
    return integration.triggerZones.includes(zoneId);
  }

  /**
   * Check if combat should trigger a question
   */
  shouldTriggerOnCombat(): boolean {
    return this.spec.questionIntegration.trigger === "combat";
  }

  /**
   * Get question time limit
   */
  getTimeLimit(questionIndex?: number): number {
    const index = questionIndex ?? this.currentQuestionIndex;
    const question = this.spec.questions[index];
    return question?.timeLimit || this.spec.questionIntegration.interval || 30;
  }

  /**
   * Reset question manager (for new game)
   */
  reset(): void {
    this.askedQuestions.clear();
    this.currentQuestionIndex = 0;
    this.questionStartTime = 0;
  }

  /**
   * Get progress stats
   */
  getProgress(): {
    asked: number;
    total: number;
    remaining: number;
    percentComplete: number;
  } {
    const asked = this.askedQuestions.size;
    const total = this.spec.questions.length;
    return {
      asked,
      total,
      remaining: total - asked,
      percentComplete: total > 0 ? Math.round((asked / total) * 100) : 0,
    };
  }

  /**
   * Get questions by difficulty
   */
  getQuestionsByDifficulty(difficulty: number): Question[] {
    return this.spec.questions.filter(q => q.difficulty === difficulty);
  }

  /**
   * Get unasked questions
   */
  getUnaskedQuestions(): Question[] {
    return this.spec.questions.filter((_, i) => !this.askedQuestions.has(i));
  }

  /**
   * Shuffle remaining questions (for randomization)
   */
  shuffleRemaining(): number[] {
    const remaining = this.spec.questions
      .map((_, i) => i)
      .filter(i => !this.askedQuestions.has(i));

    // Fisher-Yates shuffle
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }

    return remaining;
  }
}

/**
 * Apply question-based effects to player
 */
export function applyQuestionEffects(
  effects: Effect[],
  player: PlayerState,
  spec: GameSpecification
): Partial<PlayerState> {
  const updates: Partial<PlayerState> = {};
  let resources = { ...player.resources };
  let score = player.score;
  let health = player.health;
  let shield = player.shield;

  for (const effect of effects) {
    switch (effect.type) {
      case "grant-currency":
        if (effect.currency) {
          resources[effect.currency] = (resources[effect.currency] || 0) + (effect.amount || 0);
        }
        break;

      case "remove-currency":
        if (effect.currency) {
          resources[effect.currency] = Math.max(0, (resources[effect.currency] || 0) - (effect.amount || 0));
        }
        break;

      case "grant-resource":
        if (effect.resource) {
          resources[effect.resource] = (resources[effect.resource] || 0) + (effect.amount || 0);
        }
        break;

      case "grant-points":
        score += effect.amount || 0;
        break;

      case "remove-points":
        score = Math.max(0, score - (effect.amount || 0));
        break;

      case "deal-damage":
        if (health !== undefined) {
          // Apply to shield first
          let damage = effect.amount || 0;
          if (shield && shield > 0) {
            const absorbed = Math.min(shield, damage);
            shield -= absorbed;
            damage -= absorbed;
          }
          health = Math.max(0, health - damage);
        }
        break;

      case "heal":
        if (health !== undefined && spec.mechanics.combat) {
          const maxHealth = player.maxHealth || spec.mechanics.combat.maxHealth;
          health = Math.min(maxHealth, health + (effect.amount || 0));
        }
        break;

      case "grant-shield":
        shield = (shield || 0) + (effect.amount || 0);
        break;

      case "grant-movement":
        // Would be used with movement point tracking
        break;

      case "capture-influence":
        // Handled by MovementSystem
        break;
    }
  }

  updates.resources = resources;
  updates.score = score;
  if (health !== undefined) updates.health = health;
  if (shield !== undefined) updates.shield = shield;

  return updates;
}

/**
 * Create a new QuestionManager
 */
export function createQuestionManager(spec: GameSpecification): QuestionManager {
  return new QuestionManager(spec);
}
