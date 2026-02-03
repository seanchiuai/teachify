import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameRunner, type GameRunnerConfig } from '@/lib/engine/core/GameRunner';
import { StateManager } from '@/lib/engine/core/StateManager';
import { ActionProcessor } from '@/lib/engine/core/ActionProcessor';
import type {
  GameSpecification,
  GameState,
  PlayerState,
  GamePhase,
  Question,
  WorldState,
} from '@/lib/engine/types';
import type { Id } from '@/convex/_generated/dataModel';

// Mock game specification
const createMockSpec = (overrides?: Partial<GameSpecification>): GameSpecification => ({
  title: 'Test Game',
  narrative: 'A test game',
  genre: 'economic',
  subGenres: [],
  theme: {
    style: 'pirate',
    primaryColor: '#000',
    accentColor: '#fff',
    backgroundColor: '#333',
    mood: 'competitive',
  },
  world: {
    type: 'grid',
    size: { width: 10, height: 10 },
    features: [],
    zones: [],
  },
  players: {
    hasAvatar: true,
    avatarStyle: 'emoji',
    startingResources: {},
    abilities: [],
  },
  mechanics: {},
  scoring: {
    basePoints: 100,
    timeBonus: 50,
    streakMultiplier: 0.1,
    maxStreak: 5,
  },
  questionIntegration: {
    trigger: 'turn',
    onCorrect: [{ type: 'grant-points', amount: 100 }],
    onIncorrect: [],
    displayStyle: 'modal',
    allowSkip: false,
  },
  victory: {
    type: 'score',
    conditions: [],
    duration: 300,
  },
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice',
      question: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correct: '4',
      explanation: 'Basic addition',
      misconception: 'None',
    },
    {
      id: 'q2',
      type: 'multiple_choice',
      question: 'What is 3+3?',
      options: ['5', '6', '7', '8'],
      correct: '6',
      explanation: 'Basic addition',
      misconception: 'None',
    },
  ],
  ...overrides,
});

// Mock game state
const createMockGameState = (overrides?: Partial<GameState>): GameState => ({
  phase: 'lobby',
  roundNumber: 0,
  turnNumber: 0,
  currentQuestionIndex: 0,
  worldState: {
    zones: {},
    resources: [],
    entities: [],
    effects: [],
  },
  events: [],
  ...overrides,
});

// Mock player
const createMockPlayer = (overrides?: Partial<PlayerState>): PlayerState => ({
  id: 'player-1',
  name: 'Test Player',
  resources: {},
  status: 'active',
  score: 0,
  streak: 0,
  inventory: [],
  abilityCooldowns: {},
  questionsAnswered: 0,
  correctAnswers: 0,
  ...overrides,
});

describe('GameRunner', () => {
  let mockStateManager: StateManager;
  let mockActionProcessor: ActionProcessor;
  let gameRunner: GameRunner;
  let mockConfig: GameRunnerConfig;
  const mockGameId = 'test-game-id' as Id<"games">;

  beforeEach(() => {
    // Create mock state manager
    mockStateManager = {
      getSpec: vi.fn().mockReturnValue(createMockSpec()),
      getState: vi.fn().mockReturnValue(createMockGameState()),
      getPlayers: vi.fn().mockReturnValue(new Map([['player-1', createMockPlayer()]])),
      getPlayer: vi.fn().mockReturnValue(createMockPlayer()),
      getLeaderboard: vi.fn().mockReturnValue([createMockPlayer()]),
      initialize: vi.fn(),
      syncFromConvex: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      addEvent: vi.fn(),
    } as unknown as StateManager;

    // Create mock action processor
    mockActionProcessor = {
      processAction: vi.fn().mockReturnValue({
        success: true,
        effects: [],
        events: [],
        stateUpdates: {},
      }),
    } as unknown as ActionProcessor;

    // Create mock config with callbacks
    mockConfig = {
      onPhaseChange: vi.fn(),
      onQuestionTrigger: vi.fn(),
      onEffectApplied: vi.fn(),
      onVictory: vi.fn(),
      onEvent: vi.fn(),
    };

    // Create game runner
    gameRunner = new GameRunner({
      gameId: mockGameId,
      stateManager: mockStateManager,
      actionProcessor: mockActionProcessor,
      config: mockConfig,
    });
  });

  describe('start', () => {
    it('transitions from lobby to countdown phase', async () => {
      const result = await gameRunner.start();

      expect(result.phase).toBe('countdown');
      expect(result.updates.phase).toBe('countdown');
      expect(result.updates.roundNumber).toBe(1);
      expect(mockConfig.onPhaseChange).toHaveBeenCalledWith('countdown', 'lobby');
    });

    it('throws error if game not initialized', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(null);

      await expect(gameRunner.start()).rejects.toThrow('Game not initialized');
    });

    it('throws error if game already started', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active' })
      );

      await expect(gameRunner.start()).rejects.toThrow('Game already started');
    });

    it('emits phase change event', async () => {
      await gameRunner.start();

      expect(mockStateManager.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'phase_change',
          payload: { from: 'lobby', to: 'countdown' },
        })
      );
    });
  });

  describe('beginActivePlay', () => {
    it('transitions to active phase', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'countdown' })
      );

      const result = await gameRunner.beginActivePlay();

      expect(result.phase).toBe('active');
      expect(mockConfig.onPhaseChange).toHaveBeenCalledWith('active', 'countdown');
    });

    it('throws error if game not initialized', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(null);

      await expect(gameRunner.beginActivePlay()).rejects.toThrow('Game not initialized');
    });
  });

  describe('triggerQuestion', () => {
    it('transitions to question phase and returns question', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active', currentQuestionIndex: 0 })
      );

      const result = await gameRunner.triggerQuestion();

      expect(result.phase).toBe('question');
      expect(result.question).toBeDefined();
      expect(result.question.id).toBe('q1');
      expect(result.updates.activeQuestion).toBeDefined();
      expect(mockConfig.onQuestionTrigger).toHaveBeenCalled();
    });

    it('triggers specific question by index', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active', currentQuestionIndex: 0 })
      );

      const result = await gameRunner.triggerQuestion(1);

      expect(result.question.id).toBe('q2');
      expect(result.updates.currentQuestionIndex).toBe(1);
    });

    it('ends game when no more questions', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active', currentQuestionIndex: 2 })
      );

      const result = await gameRunner.triggerQuestion();

      expect(result.phase).toBe('complete');
    });

    it('emits question triggered event', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active', currentQuestionIndex: 0 })
      );

      await gameRunner.triggerQuestion();

      expect(mockStateManager.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'question_triggered',
        })
      );
    });
  });

  describe('showResults', () => {
    it('transitions to results phase', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'question' })
      );

      const result = await gameRunner.showResults();

      expect(result.phase).toBe('results');
      expect(mockConfig.onPhaseChange).toHaveBeenCalledWith('results', 'question');
    });
  });

  describe('next', () => {
    it('triggers next question when more questions available', async () => {
      const spec = createMockSpec();
      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'results', currentQuestionIndex: 0 })
      );

      const result = await gameRunner.next();

      expect(result.phase).toBe('question');
      expect(result.updates.currentQuestionIndex).toBe(1);
    });

    it('ends game when all questions answered', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'results', currentQuestionIndex: 1 })
      );

      const result = await gameRunner.next();

      expect(result.phase).toBe('complete');
    });
  });

  describe('endGame', () => {
    it('transitions to complete phase', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active' })
      );

      const result = await gameRunner.endGame();

      expect(result.phase).toBe('complete');
    });

    it('emits game complete event', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active' })
      );

      await gameRunner.endGame();

      expect(mockStateManager.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game_complete',
        })
      );
    });

    it('calls onVictory callback with winners', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active' })
      );

      await gameRunner.endGame();

      expect(mockConfig.onVictory).toHaveBeenCalled();
    });
  });

  describe('pause and resume', () => {
    it('pauses the game', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active' })
      );

      const result = await gameRunner.pause();

      expect(result.phase).toBe('paused');
    });

    it('resumes to active phase when no active question', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'paused' })
      );

      const result = await gameRunner.resume();

      expect(result.phase).toBe('active');
    });

    it('resumes to question phase when question is active', async () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({
          phase: 'paused',
          activeQuestion: {
            id: 'q1',
            type: 'multiple_choice',
            question: 'Test?',
            options: ['A', 'B'],
            correct: 'A',
            explanation: '',
            misconception: '',
          },
        })
      );

      const result = await gameRunner.resume();

      expect(result.phase).toBe('question');
    });
  });

  describe('processAction', () => {
    it('delegates to action processor', () => {
      const action = {
        type: 'answer-question' as const,
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {
          questionId: 'q1',
          answer: '4',
          timeMs: 5000,
        },
      };

      gameRunner.processAction(action);

      expect(mockActionProcessor.processAction).toHaveBeenCalledWith(action);
    });

    it('emits events from action result', () => {
      const mockEvent = {
        id: 'evt-1',
        timestamp: Date.now(),
        type: 'action',
        playerId: 'player-1',
        payload: {},
      };

      vi.mocked(mockActionProcessor.processAction).mockReturnValue({
        success: true,
        effects: [],
        events: [mockEvent],
        stateUpdates: {},
      });

      const action = {
        type: 'move' as const,
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 1, y: 1 } },
      };

      gameRunner.processAction(action);

      expect(mockStateManager.addEvent).toHaveBeenCalledWith(mockEvent);
    });

    it('calls onEffectApplied for each effect', () => {
      vi.mocked(mockActionProcessor.processAction).mockReturnValue({
        success: true,
        effects: [
          { type: 'grant-points', target: 'self', amount: 100 },
          { type: 'grant-currency', target: 'player-2', amount: 50 },
        ],
        events: [],
        stateUpdates: {},
      });

      const action = {
        type: 'answer-question' as const,
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { questionId: 'q1', answer: '4', timeMs: 5000 },
      };

      gameRunner.processAction(action);

      expect(mockConfig.onEffectApplied).toHaveBeenCalledTimes(2);
    });
  });

  describe('getters', () => {
    it('getState returns state from state manager', () => {
      const state = gameRunner.getState();
      expect(mockStateManager.getState).toHaveBeenCalled();
      expect(state).toBeDefined();
    });

    it('getSpec returns spec from state manager', () => {
      const spec = gameRunner.getSpec();
      expect(mockStateManager.getSpec).toHaveBeenCalled();
      expect(spec).toBeDefined();
    });

    it('getPlayers returns players from state manager', () => {
      const players = gameRunner.getPlayers();
      expect(mockStateManager.getPlayers).toHaveBeenCalled();
      expect(players).toBeDefined();
    });

    it('getPlayer returns specific player', () => {
      const player = gameRunner.getPlayer('player-1');
      expect(mockStateManager.getPlayer).toHaveBeenCalledWith('player-1');
      expect(player).toBeDefined();
    });

    it('getLeaderboard returns sorted players', () => {
      const leaderboard = gameRunner.getLeaderboard();
      expect(mockStateManager.getLeaderboard).toHaveBeenCalled();
      expect(leaderboard).toBeInstanceOf(Array);
    });
  });

  describe('subscribe', () => {
    it('subscribes to state manager changes', () => {
      const listener = vi.fn();

      gameRunner.subscribe(listener);

      expect(mockStateManager.subscribe).toHaveBeenCalledWith(listener);
    });

    it('returns unsubscribe function', () => {
      const unsubscribe = vi.fn();
      vi.mocked(mockStateManager.subscribe).mockReturnValue(unsubscribe);

      const result = gameRunner.subscribe(vi.fn());

      expect(result).toBe(unsubscribe);
    });
  });

  describe('victory conditions', () => {
    it('checks score threshold condition', async () => {
      const spec = createMockSpec({
        victory: {
          type: 'score',
          conditions: [
            { type: 'score-threshold', threshold: 500 },
          ],
          duration: 300,
        },
      });

      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);
      vi.mocked(mockStateManager.getPlayers).mockReturnValue(
        new Map([['player-1', createMockPlayer({ score: 600 })]])
      );
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'results', currentQuestionIndex: 0 })
      );

      const result = await gameRunner.next();

      expect(result.phase).toBe('complete');
      expect(mockConfig.onVictory).toHaveBeenCalled();
    });

    it('checks elimination condition', async () => {
      const spec = createMockSpec({
        victory: {
          type: 'elimination',
          conditions: [],
          duration: 300,
        },
      });

      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);
      vi.mocked(mockStateManager.getPlayers).mockReturnValue(
        new Map([
          ['player-1', createMockPlayer({ id: 'player-1', status: 'active' })],
          ['player-2', createMockPlayer({ id: 'player-2', status: 'eliminated' })],
        ])
      );
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'results', currentQuestionIndex: 0 })
      );

      const result = await gameRunner.next();

      // With only one active player, game should end
      expect(result.phase).toBe('complete');
    });
  });
});
