import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionProcessor } from '@/lib/engine/core/ActionProcessor';
import { StateManager } from '@/lib/engine/core/StateManager';
import type {
  GameSpecification,
  GameState,
  PlayerState,
  PlayerAction,
  Question,
} from '@/lib/engine/types';

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
    zones: [
      { id: 'zone-1', name: 'Zone 1', position: { x: 0, y: 0 }, size: { width: 5, height: 5 } },
    ],
  },
  players: {
    hasAvatar: true,
    avatarStyle: 'emoji',
    startingResources: { gold: 100 },
    abilities: [
      {
        id: 'ability-1',
        name: 'Power Strike',
        description: 'Deal extra damage',
        cooldown: 3,
        effects: [{ type: 'deal-damage', amount: 20 }],
      },
    ],
  },
  mechanics: {
    movement: {
      type: 'grid',
      movementPerTurn: 3,
      canPassThrough: false,
      captureEnabled: false,
    },
    combat: {
      maxHealth: 100,
      startingHealth: 100,
      damagePerAttack: 10,
      respawnEnabled: false,
      friendlyFire: true,
    },
    economy: {
      currencies: ['gold'],
      startingAmounts: { gold: 100 },
      tradingEnabled: true,
      stealingEnabled: true,
      earnRates: {},
    },
    social: {
      type: 'voting',
      accusationEnabled: false,
    },
    resources: {
      resources: ['wood'],
      gatheringEnabled: true,
    },
  },
  scoring: {
    basePoints: 100,
    timeBonus: 50,
    streakMultiplier: 0.1,
    maxStreak: 5,
  },
  questionIntegration: {
    trigger: 'turn',
    interval: 30,
    onCorrect: [{ type: 'grant-points', amount: 100 }],
    onIncorrect: [{ type: 'remove-points', amount: 10 }],
    displayStyle: 'modal',
    allowSkip: true,
    penaltyForSkip: [{ type: 'remove-points', amount: 5 }],
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
  ],
  ...overrides,
});

// Mock game state
const createMockGameState = (overrides?: Partial<GameState>): GameState => ({
  phase: 'active',
  roundNumber: 1,
  turnNumber: 1,
  currentQuestionIndex: 0,
  worldState: {
    zones: {
      'zone-1': {
        id: 'zone-1',
        influence: {},
        playersInZone: [],
      },
    },
    resources: [
      { id: 'res-1', type: 'wood', position: { x: 5, y: 5 }, amount: 50 },
    ],
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
  position: { x: 0, y: 0 },
  resources: { gold: 100 },
  health: 100,
  maxHealth: 100,
  shield: 0,
  status: 'active',
  score: 0,
  streak: 0,
  inventory: ['item-1'],
  abilityCooldowns: {},
  questionsAnswered: 0,
  correctAnswers: 0,
  ...overrides,
});

describe('ActionProcessor', () => {
  let mockStateManager: StateManager;
  let actionProcessor: ActionProcessor;
  let mockSpec: GameSpecification;
  let mockState: GameState;
  let mockPlayer: PlayerState;
  let mockPlayers: Map<string, PlayerState>;

  beforeEach(() => {
    mockSpec = createMockSpec();
    mockState = createMockGameState();
    mockPlayer = createMockPlayer();
    mockPlayers = new Map([
      ['player-1', mockPlayer],
      ['player-2', createMockPlayer({ id: 'player-2', name: 'Player 2', position: { x: 1, y: 0 } })],
    ]);

    mockStateManager = {
      getSpec: vi.fn().mockReturnValue(mockSpec),
      getState: vi.fn().mockReturnValue(mockState),
      getPlayer: vi.fn().mockImplementation((id: string) => mockPlayers.get(id)),
      getPlayers: vi.fn().mockReturnValue(mockPlayers),
    } as unknown as StateManager;

    actionProcessor = new ActionProcessor(mockStateManager);
  });

  describe('processAction - validation', () => {
    it('returns error when game not initialized', () => {
      vi.mocked(mockStateManager.getSpec).mockReturnValue(null);

      const result = actionProcessor.processAction({
        type: 'move',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 1, y: 1 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not initialized');
    });

    it('rejects action when player is eliminated', () => {
      vi.mocked(mockStateManager.getPlayer).mockReturnValue(
        createMockPlayer({ status: 'eliminated' })
      );

      const result = actionProcessor.processAction({
        type: 'move',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 1, y: 1 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player is eliminated');
    });

    it('rejects action when player is frozen', () => {
      vi.mocked(mockStateManager.getPlayer).mockReturnValue(
        createMockPlayer({ status: 'frozen' })
      );

      const result = actionProcessor.processAction({
        type: 'move',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 1, y: 1 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player is frozen');
    });

    it('rejects unknown action type', () => {
      const result = actionProcessor.processAction({
        type: 'unknown-action' as any,
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown action type: unknown-action');
    });

    it('rejects answer-question in non-question phase', () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'active' })
      );

      const result = actionProcessor.processAction({
        type: 'answer-question',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { questionId: 'q1', answer: '4', timeMs: 5000 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not allowed in phase');
    });

    it('rejects move action in non-active phase', () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({ phase: 'lobby' })
      );

      const result = actionProcessor.processAction({
        type: 'move',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 1, y: 1 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not allowed in phase');
    });
  });

  describe('handleMove', () => {
    it('moves player to valid position', () => {
      const result = actionProcessor.processAction({
        type: 'move',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 1, y: 1 } },
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.position).toEqual({ x: 1, y: 1 });
    });

    it('rejects movement when disabled', () => {
      const spec = createMockSpec({ mechanics: {} });
      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);

      const result = actionProcessor.processAction({
        type: 'move',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 1, y: 1 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Movement not enabled');
    });

    it('rejects movement out of bounds', () => {
      const result = actionProcessor.processAction({
        type: 'move',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 100, y: 100 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Position out of bounds');
    });

    it('rejects movement exceeding range', () => {
      const result = actionProcessor.processAction({
        type: 'move',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 5, y: 5 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Can only move');
    });

    it('handles zone-based movement', () => {
      const spec = createMockSpec({
        mechanics: {
          movement: {
            type: 'zone',
            canPassThrough: true,
            captureEnabled: false,
          },
        },
      });
      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);

      const result = actionProcessor.processAction({
        type: 'move',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPosition: { x: 0, y: 0 }, targetZone: 'zone-1' },
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.world?.zones).toBeDefined();
    });
  });

  describe('handleAttack', () => {
    it('attacks target player successfully', () => {
      const result = actionProcessor.processAction({
        type: 'attack',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2' },
      });

      expect(result.success).toBe(true);
      expect(result.effects).toContainEqual(
        expect.objectContaining({ type: 'deal-damage' })
      );
    });

    it('rejects attack when combat disabled', () => {
      const spec = createMockSpec({ mechanics: {} });
      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);

      const result = actionProcessor.processAction({
        type: 'attack',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Combat not enabled');
    });

    it('rejects attack on non-existent player', () => {
      const result = actionProcessor.processAction({
        type: 'attack',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'non-existent' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target not found');
    });

    it('rejects attack on eliminated player', () => {
      mockPlayers.set('player-2', createMockPlayer({ id: 'player-2', status: 'eliminated' }));

      const result = actionProcessor.processAction({
        type: 'attack',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target already eliminated');
    });

    it('rejects friendly fire when disabled', () => {
      const spec = createMockSpec({
        mechanics: {
          combat: { ...mockSpec.mechanics!.combat!, friendlyFire: false },
        },
      });
      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);

      // Create players with same faction for friendly fire test
      const player1 = createMockPlayer({ id: 'player-1', faction: 'red' });
      const player2 = createMockPlayer({ id: 'player-2', faction: 'red' });
      const testPlayers = new Map([
        ['player-1', player1],
        ['player-2', player2],
      ]);

      vi.mocked(mockStateManager.getPlayer).mockImplementation((id: string) => testPlayers.get(id));
      vi.mocked(mockStateManager.getPlayers).mockReturnValue(testPlayers);

      const result = actionProcessor.processAction({
        type: 'attack',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Friendly fire disabled');
    });

    it('emits elimination event when target health reaches 0', () => {
      mockPlayers.set('player-2', createMockPlayer({
        id: 'player-2',
        health: 5,
        shield: 0,
      }));

      const result = actionProcessor.processAction({
        type: 'attack',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2' },
      });

      expect(result.success).toBe(true);
      expect(result.events).toContainEqual(
        expect.objectContaining({ type: 'elimination' })
      );
    });
  });

  describe('handleDefend', () => {
    it('grants shield to player', () => {
      const result = actionProcessor.processAction({
        type: 'defend',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {},
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.shield).toBeGreaterThan(0);
      expect(result.effects).toContainEqual(
        expect.objectContaining({ type: 'grant-shield' })
      );
    });
  });

  describe('handleTrade', () => {
    it('trades resources between players', () => {
      mockPlayers.set('player-2', createMockPlayer({
        id: 'player-2',
        resources: { gold: 200 },
      }));

      const result = actionProcessor.processAction({
        type: 'trade',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {
          targetPlayerId: 'player-2',
          offer: { gold: 50 },
          request: { gold: 25 },
        },
      });

      expect(result.success).toBe(true);
    });

    it('rejects trade when trading disabled', () => {
      const spec = createMockSpec({
        mechanics: {
          economy: { ...mockSpec.mechanics!.economy!, tradingEnabled: false },
        },
      });
      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);

      const result = actionProcessor.processAction({
        type: 'trade',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {
          targetPlayerId: 'player-2',
          offer: { gold: 50 },
          request: { gold: 25 },
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Trading not enabled');
    });

    it('rejects trade with insufficient resources', () => {
      const result = actionProcessor.processAction({
        type: 'trade',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {
          targetPlayerId: 'player-2',
          offer: { gold: 500 },
          request: { gold: 25 },
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient');
    });
  });

  describe('handleAnswerQuestion', () => {
    beforeEach(() => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({
          phase: 'question',
          activeQuestion: {
            id: 'q1',
            type: 'multiple_choice',
            question: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correct: '4',
            explanation: 'Basic addition',
            misconception: 'None',
          },
        })
      );
    });

    it('processes correct answer', () => {
      const result = actionProcessor.processAction({
        type: 'answer-question',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { questionId: 'q1', answer: '4', timeMs: 5000 },
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.score).toBeGreaterThan(0);
      expect(result.stateUpdates.player?.streak).toBe(1);
      expect(result.stateUpdates.player?.correctAnswers).toBe(1);
      expect(result.events[0].payload).toMatchObject({ correct: true });
    });

    it('processes incorrect answer', () => {
      const result = actionProcessor.processAction({
        type: 'answer-question',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { questionId: 'q1', answer: '3', timeMs: 5000 },
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.streak).toBe(0);
      expect(result.events[0].payload).toMatchObject({ correct: false });
    });

    it('rejects answer for non-active question', () => {
      const result = actionProcessor.processAction({
        type: 'answer-question',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { questionId: 'wrong-question', answer: '4', timeMs: 5000 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Question not active');
    });

    it('calculates time bonus for fast answers', () => {
      const result = actionProcessor.processAction({
        type: 'answer-question',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { questionId: 'q1', answer: '4', timeMs: 1000 }, // Very fast
      });

      expect(result.success).toBe(true);
      // Fast answer should get more points
      expect(result.stateUpdates.player?.score).toBeGreaterThan(100);
    });

    it('applies streak multiplier', () => {
      vi.mocked(mockStateManager.getPlayer).mockReturnValue(
        createMockPlayer({ streak: 3 })
      );

      const result = actionProcessor.processAction({
        type: 'answer-question',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { questionId: 'q1', answer: '4', timeMs: 15000 },
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.streak).toBe(4);
    });

    it('handles array answers for ordering questions', () => {
      vi.mocked(mockStateManager.getState).mockReturnValue(
        createMockGameState({
          phase: 'question',
          activeQuestion: {
            id: 'q-order',
            type: 'ordering',
            question: 'Order these numbers',
            options: ['3', '1', '2'],
            correct: ['1', '2', '3'],
            explanation: '',
            misconception: '',
          },
        })
      );

      const result = actionProcessor.processAction({
        type: 'answer-question',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { questionId: 'q-order', answer: ['1', '2', '3'], timeMs: 5000 },
      });

      expect(result.success).toBe(true);
      expect(result.events[0].payload).toMatchObject({ correct: true });
    });
  });

  describe('handleSkip', () => {
    it('resets streak on skip', () => {
      vi.mocked(mockStateManager.getPlayer).mockReturnValue(
        createMockPlayer({ streak: 5 })
      );

      const result = actionProcessor.processAction({
        type: 'skip',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {},
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.streak).toBe(0);
    });

    it('applies penalty effects for skip', () => {
      const result = actionProcessor.processAction({
        type: 'skip',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {},
      });

      expect(result.success).toBe(true);
      expect(result.effects).toContainEqual(
        expect.objectContaining({ type: 'remove-points' })
      );
    });
  });

  describe('handleUseItem', () => {
    it('uses item from inventory', () => {
      const result = actionProcessor.processAction({
        type: 'use-item',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { itemId: 'item-1' },
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.inventory).not.toContain('item-1');
    });

    it('rejects using item not in inventory', () => {
      const result = actionProcessor.processAction({
        type: 'use-item',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { itemId: 'non-existent-item' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not in inventory');
    });
  });

  describe('handleGather', () => {
    it('gathers resources at player position', () => {
      vi.mocked(mockStateManager.getPlayer).mockReturnValue(
        createMockPlayer({ position: { x: 5, y: 5 } })
      );

      const result = actionProcessor.processAction({
        type: 'gather',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {},
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.resources).toHaveProperty('wood');
    });

    it('rejects gathering at empty location', () => {
      vi.mocked(mockStateManager.getPlayer).mockReturnValue(
        createMockPlayer({ position: { x: 0, y: 0 } })
      );

      const result = actionProcessor.processAction({
        type: 'gather',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No resources at this location');
    });

    it('rejects when gathering disabled', () => {
      const spec = createMockSpec({
        mechanics: {
          resources: { resources: ['wood'], gatheringEnabled: false },
        },
      });
      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);

      const result = actionProcessor.processAction({
        type: 'gather',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Gathering not enabled');
    });
  });

  describe('handleVote', () => {
    it('records vote for target player', () => {
      const result = actionProcessor.processAction({
        type: 'vote',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2', voteType: 'eliminate' },
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.votes).toHaveProperty('eliminate', 'player-2');
      expect(result.events).toContainEqual(
        expect.objectContaining({ type: 'vote' })
      );
    });

    it('rejects vote when social mechanics disabled', () => {
      const spec = createMockSpec({ mechanics: {} });
      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);

      const result = actionProcessor.processAction({
        type: 'vote',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2', voteType: 'eliminate' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Social mechanics not enabled');
    });
  });

  describe('handleUseAbility', () => {
    it('uses ability successfully', () => {
      const result = actionProcessor.processAction({
        type: 'use-ability',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { abilityId: 'ability-1' },
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.abilityCooldowns).toHaveProperty('ability-1', 3);
    });

    it('rejects using ability on cooldown', () => {
      vi.mocked(mockStateManager.getPlayer).mockReturnValue(
        createMockPlayer({ abilityCooldowns: { 'ability-1': 2 } })
      );

      const result = actionProcessor.processAction({
        type: 'use-ability',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { abilityId: 'ability-1' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('cooldown');
    });

    it('rejects unknown ability', () => {
      const result = actionProcessor.processAction({
        type: 'use-ability',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { abilityId: 'unknown-ability' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ability not found');
    });
  });

  describe('handleSteal', () => {
    it('steals resources from target', () => {
      mockPlayers.set('player-2', createMockPlayer({
        id: 'player-2',
        resources: { gold: 100 },
      }));

      const result = actionProcessor.processAction({
        type: 'steal',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2' },
      });

      expect(result.success).toBe(true);
      expect(result.stateUpdates.player?.resources?.gold).toBe(120); // 100 + 20% of 100
    });

    it('rejects stealing when disabled', () => {
      const spec = createMockSpec({
        mechanics: {
          economy: { ...mockSpec.mechanics!.economy!, stealingEnabled: false },
        },
      });
      vi.mocked(mockStateManager.getSpec).mockReturnValue(spec);

      const result = actionProcessor.processAction({
        type: 'steal',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stealing not enabled');
    });

    it('rejects stealing from player with nothing', () => {
      mockPlayers.set('player-2', createMockPlayer({
        id: 'player-2',
        resources: { gold: 0 },
      }));

      const result = actionProcessor.processAction({
        type: 'steal',
        playerId: 'player-1',
        timestamp: Date.now(),
        payload: { targetPlayerId: 'player-2' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target has nothing to steal');
    });
  });
});
