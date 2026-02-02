/**
 * ActionProcessor - Validates and processes player actions
 *
 * Validates actions against game spec rules, processes actions,
 * applies effects, and emits events.
 */

import type {
  GameSpecification,
  GameState,
  PlayerState,
  PlayerAction,
  ActionType,
  Effect,
  Position,
  ResourceSet,
  GameEvent,
  ActionPayload,
  MovePayload,
  AttackPayload,
  TradePayload,
  UseItemPayload,
  VotePayload,
  AnswerPayload,
  AbilityPayload,
  WorldState,
  ZoneState,
} from "../types";
import type { StateManager } from "./StateManager";

export interface ActionResult {
  success: boolean;
  error?: string;
  effects: Effect[];
  events: GameEvent[];
  stateUpdates: {
    player?: Partial<PlayerState>;
    world?: Partial<WorldState>;
    game?: Partial<GameState>;
  };
}

export interface ActionContext {
  spec: GameSpecification;
  state: GameState;
  player: PlayerState;
  allPlayers: Map<string, PlayerState>;
}

type ActionHandler = (
  payload: ActionPayload,
  context: ActionContext
) => ActionResult;

/**
 * ActionProcessor class
 */
export class ActionProcessor {
  private stateManager: StateManager;
  private handlers: Map<ActionType, ActionHandler> = new Map();

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.registerDefaultHandlers();
  }

  /**
   * Register default action handlers
   */
  private registerDefaultHandlers(): void {
    this.handlers.set("move", this.handleMove.bind(this));
    this.handlers.set("attack", this.handleAttack.bind(this));
    this.handlers.set("defend", this.handleDefend.bind(this));
    this.handlers.set("trade", this.handleTrade.bind(this));
    this.handlers.set("steal", this.handleSteal.bind(this));
    this.handlers.set("use-item", this.handleUseItem.bind(this));
    this.handlers.set("gather", this.handleGather.bind(this));
    this.handlers.set("vote", this.handleVote.bind(this));
    this.handlers.set("answer-question", this.handleAnswerQuestion.bind(this));
    this.handlers.set("use-ability", this.handleUseAbility.bind(this));
    this.handlers.set("skip", this.handleSkip.bind(this));
  }

  /**
   * Process a player action
   */
  processAction(action: PlayerAction): ActionResult {
    const spec = this.stateManager.getSpec();
    const state = this.stateManager.getState();
    const player = this.stateManager.getPlayer(action.playerId);

    if (!spec || !state || !player) {
      return {
        success: false,
        error: "Game not initialized",
        effects: [],
        events: [],
        stateUpdates: {},
      };
    }

    // Validate game phase
    if (!this.isActionAllowedInPhase(action.type, state.phase)) {
      return {
        success: false,
        error: `Action ${action.type} not allowed in phase ${state.phase}`,
        effects: [],
        events: [],
        stateUpdates: {},
      };
    }

    // Validate player status
    if (player.status === "eliminated" || player.status === "frozen") {
      return {
        success: false,
        error: `Player is ${player.status}`,
        effects: [],
        events: [],
        stateUpdates: {},
      };
    }

    // Get handler
    const handler = this.handlers.get(action.type);
    if (!handler) {
      return {
        success: false,
        error: `Unknown action type: ${action.type}`,
        effects: [],
        events: [],
        stateUpdates: {},
      };
    }

    // Build context
    const context: ActionContext = {
      spec,
      state,
      player,
      allPlayers: this.stateManager.getPlayers(),
    };

    // Execute handler
    const result = handler(action.payload, context);

    // If successful, add action event
    if (result.success) {
      result.events.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: action.timestamp,
        type: "action",
        playerId: action.playerId,
        payload: {
          action: action.type,
          result: "success",
          effects: result.effects,
        },
      });
    }

    return result;
  }

  /**
   * Check if action is allowed in current phase
   */
  private isActionAllowedInPhase(actionType: ActionType, phase: GameState["phase"]): boolean {
    // Answer question is only allowed during question phase
    if (actionType === "answer-question") {
      return phase === "question";
    }

    // Most actions require active phase
    const activeActions: ActionType[] = [
      "move", "attack", "defend", "trade", "steal",
      "use-item", "gather", "craft", "use-ability",
    ];
    if (activeActions.includes(actionType)) {
      return phase === "active";
    }

    // Voting can happen in active or dedicated voting phase
    if (actionType === "vote") {
      return phase === "active";
    }

    // Skip is generally allowed
    return true;
  }

  // ==========================================================================
  // ACTION HANDLERS
  // ==========================================================================

  private handleMove(payload: ActionPayload, context: ActionContext): ActionResult {
    const { targetPosition, targetZone } = payload as MovePayload;
    const { spec, state, player } = context;

    // Check if movement is enabled
    if (!spec.mechanics.movement) {
      return { success: false, error: "Movement not enabled", effects: [], events: [], stateUpdates: {} };
    }

    const movementConfig = spec.mechanics.movement;

    // For zone-based movement
    if (movementConfig.type === "zone" && targetZone) {
      const zone = spec.world.zones?.find(z => z.id === targetZone);
      if (!zone) {
        return { success: false, error: "Invalid zone", effects: [], events: [], stateUpdates: {} };
      }

      // Update player position to zone center
      const newPosition = {
        x: zone.position.x + Math.floor(zone.size.width / 2),
        y: zone.position.y + Math.floor(zone.size.height / 2),
      };

      // Update zone state
      const zoneUpdates = this.updatePlayerZone(player, targetZone, state.worldState);

      return {
        success: true,
        effects: [],
        events: [],
        stateUpdates: {
          player: { position: newPosition },
          world: { zones: zoneUpdates },
        },
      };
    }

    // For grid/free movement
    if (!targetPosition) {
      return { success: false, error: "Target position required", effects: [], events: [], stateUpdates: {} };
    }

    // Validate position bounds
    if (targetPosition.x < 0 || targetPosition.x >= spec.world.size.width ||
        targetPosition.y < 0 || targetPosition.y >= spec.world.size.height) {
      return { success: false, error: "Position out of bounds", effects: [], events: [], stateUpdates: {} };
    }

    // Check for obstacles
    const obstacle = spec.world.features.find(f =>
      f.type === "obstacle" &&
      f.position.x === targetPosition.x &&
      f.position.y === targetPosition.y
    );
    if (obstacle && !movementConfig.canPassThrough) {
      return { success: false, error: "Blocked by obstacle", effects: [], events: [], stateUpdates: {} };
    }

    // Calculate distance (Manhattan for grid)
    const distance = player.position
      ? Math.abs(targetPosition.x - player.position.x) + Math.abs(targetPosition.y - player.position.y)
      : 0;

    // Check movement range
    const maxMove = movementConfig.movementPerTurn || 1;
    if (distance > maxMove) {
      return { success: false, error: `Can only move ${maxMove} spaces`, effects: [], events: [], stateUpdates: {} };
    }

    return {
      success: true,
      effects: [],
      events: [],
      stateUpdates: {
        player: { position: targetPosition },
      },
    };
  }

  private handleAttack(payload: ActionPayload, context: ActionContext): ActionResult {
    const { targetPlayerId } = payload as AttackPayload;
    const { spec, player, allPlayers } = context;

    if (!spec.mechanics.combat) {
      return { success: false, error: "Combat not enabled", effects: [], events: [], stateUpdates: {} };
    }

    const target = allPlayers.get(targetPlayerId);
    if (!target) {
      return { success: false, error: "Target not found", effects: [], events: [], stateUpdates: {} };
    }

    if (target.status === "eliminated") {
      return { success: false, error: "Target already eliminated", effects: [], events: [], stateUpdates: {} };
    }

    // Check friendly fire
    if (!spec.mechanics.combat.friendlyFire && player.faction === target.faction) {
      return { success: false, error: "Friendly fire disabled", effects: [], events: [], stateUpdates: {} };
    }

    const damage = spec.mechanics.combat.damagePerAttack;

    // Apply shield first
    let remainingDamage = damage;
    let newShield = target.shield || 0;
    if (newShield > 0) {
      const shieldAbsorb = Math.min(newShield, remainingDamage);
      newShield -= shieldAbsorb;
      remainingDamage -= shieldAbsorb;
    }

    // Apply remaining damage to health
    const newHealth = Math.max(0, (target.health || 0) - remainingDamage);
    const eliminated = newHealth <= 0;

    const effects: Effect[] = [
      { type: "deal-damage", target: targetPlayerId, amount: damage },
    ];

    const events: GameEvent[] = [];
    if (eliminated) {
      events.push({
        id: `evt-${Date.now()}-elim`,
        timestamp: Date.now(),
        type: "elimination",
        playerId: targetPlayerId,
        payload: { eliminatedBy: player.id },
      });
    }

    return {
      success: true,
      effects,
      events,
      stateUpdates: {
        // Target player updates would be applied via separate mutation
      },
    };
  }

  private handleDefend(_payload: ActionPayload, context: ActionContext): ActionResult {
    const { spec, player } = context;

    if (!spec.mechanics.combat) {
      return { success: false, error: "Combat not enabled", effects: [], events: [], stateUpdates: {} };
    }

    const shieldAmount = spec.mechanics.combat.shieldDuration || 1;

    return {
      success: true,
      effects: [{ type: "grant-shield", target: "self", amount: shieldAmount }],
      events: [],
      stateUpdates: {
        player: { shield: (player.shield || 0) + shieldAmount },
      },
    };
  }

  private handleTrade(payload: ActionPayload, context: ActionContext): ActionResult {
    const { targetPlayerId, offer, request } = payload as TradePayload;
    const { spec, player, allPlayers } = context;

    if (!spec.mechanics.economy?.tradingEnabled) {
      return { success: false, error: "Trading not enabled", effects: [], events: [], stateUpdates: {} };
    }

    const target = allPlayers.get(targetPlayerId);
    if (!target) {
      return { success: false, error: "Target not found", effects: [], events: [], stateUpdates: {} };
    }

    // Check if player has resources to offer
    for (const [resource, amount] of Object.entries(offer)) {
      if ((player.resources[resource] || 0) < amount) {
        return { success: false, error: `Insufficient ${resource}`, effects: [], events: [], stateUpdates: {} };
      }
    }

    // Check if target has resources to give
    for (const [resource, amount] of Object.entries(request)) {
      if ((target.resources[resource] || 0) < amount) {
        return { success: false, error: `Target has insufficient ${resource}`, effects: [], events: [], stateUpdates: {} };
      }
    }

    // Calculate new resources
    const newPlayerResources = { ...player.resources };
    for (const [resource, amount] of Object.entries(offer)) {
      newPlayerResources[resource] = (newPlayerResources[resource] || 0) - amount;
    }
    for (const [resource, amount] of Object.entries(request)) {
      newPlayerResources[resource] = (newPlayerResources[resource] || 0) + amount;
    }

    return {
      success: true,
      effects: [
        { type: "remove-currency", target: "self", amount: Object.values(offer).reduce((a, b) => a + b, 0) },
        { type: "grant-currency", target: "self", amount: Object.values(request).reduce((a, b) => a + b, 0) },
      ],
      events: [],
      stateUpdates: {
        player: { resources: newPlayerResources },
      },
    };
  }

  private handleSteal(payload: ActionPayload, context: ActionContext): ActionResult {
    const { targetPlayerId } = payload as AttackPayload;
    const { spec, player, allPlayers } = context;

    if (!spec.mechanics.economy?.stealingEnabled) {
      return { success: false, error: "Stealing not enabled", effects: [], events: [], stateUpdates: {} };
    }

    const target = allPlayers.get(targetPlayerId);
    if (!target) {
      return { success: false, error: "Target not found", effects: [], events: [], stateUpdates: {} };
    }

    // Steal 20% of target's primary currency (or first currency)
    const currencies = spec.mechanics.economy.currencies;
    if (currencies.length === 0) {
      return { success: false, error: "No currencies defined", effects: [], events: [], stateUpdates: {} };
    }

    const currency = currencies[0];
    const targetAmount = target.resources[currency] || 0;
    const stolenAmount = Math.floor(targetAmount * 0.2);

    if (stolenAmount <= 0) {
      return { success: false, error: "Target has nothing to steal", effects: [], events: [], stateUpdates: {} };
    }

    const newResources = { ...player.resources };
    newResources[currency] = (newResources[currency] || 0) + stolenAmount;

    return {
      success: true,
      effects: [
        { type: "grant-currency", target: "self", currency, amount: stolenAmount },
        { type: "remove-currency", target: targetPlayerId, currency, amount: stolenAmount },
      ],
      events: [],
      stateUpdates: {
        player: { resources: newResources },
      },
    };
  }

  private handleUseItem(payload: ActionPayload, context: ActionContext): ActionResult {
    const { itemId } = payload as UseItemPayload;
    const { player } = context;

    if (!player.inventory.includes(itemId)) {
      return { success: false, error: "Item not in inventory", effects: [], events: [], stateUpdates: {} };
    }

    // Remove item from inventory
    const newInventory = player.inventory.filter(i => i !== itemId);

    // Item effects would be defined in shop/crafting config
    return {
      success: true,
      effects: [],
      events: [],
      stateUpdates: {
        player: { inventory: newInventory },
      },
    };
  }

  private handleGather(payload: ActionPayload, context: ActionContext): ActionResult {
    const { spec, player, state } = context;

    if (!spec.mechanics.resources?.gatheringEnabled) {
      return { success: false, error: "Gathering not enabled", effects: [], events: [], stateUpdates: {} };
    }

    // Check if player is at a resource location
    const resourceSpawn = state.worldState.resources.find(r =>
      r.position.x === player.position?.x &&
      r.position.y === player.position?.y &&
      r.amount > 0
    );

    if (!resourceSpawn) {
      return { success: false, error: "No resources at this location", effects: [], events: [], stateUpdates: {} };
    }

    const gatherAmount = Math.min(10, resourceSpawn.amount);
    const newResources = { ...player.resources };
    newResources[resourceSpawn.type] = (newResources[resourceSpawn.type] || 0) + gatherAmount;

    return {
      success: true,
      effects: [{ type: "grant-resource", resource: resourceSpawn.type, amount: gatherAmount }],
      events: [],
      stateUpdates: {
        player: { resources: newResources },
      },
    };
  }

  private handleVote(payload: ActionPayload, context: ActionContext): ActionResult {
    const { targetPlayerId, voteType } = payload as VotePayload;
    const { spec, player, allPlayers } = context;

    if (!spec.mechanics.social) {
      return { success: false, error: "Social mechanics not enabled", effects: [], events: [], stateUpdates: {} };
    }

    const target = allPlayers.get(targetPlayerId);
    if (!target) {
      return { success: false, error: "Target not found", effects: [], events: [], stateUpdates: {} };
    }

    // Record vote
    const newVotes = { ...player.votes, [voteType]: targetPlayerId };

    return {
      success: true,
      effects: [],
      events: [{
        id: `evt-${Date.now()}-vote`,
        timestamp: Date.now(),
        type: "vote",
        playerId: player.id,
        payload: { targetPlayerId, voteType },
      }],
      stateUpdates: {
        player: { votes: newVotes },
      },
    };
  }

  private handleAnswerQuestion(payload: ActionPayload, context: ActionContext): ActionResult {
    const { questionId, answer, timeMs } = payload as AnswerPayload;
    const { spec, state, player } = context;

    if (!state.activeQuestion || state.activeQuestion.id !== questionId) {
      return { success: false, error: "Question not active", effects: [], events: [], stateUpdates: {} };
    }

    const question = state.activeQuestion;
    const isCorrect = this.checkAnswer(answer, question.correct);

    // Calculate score
    let points = spec.scoring.basePoints;
    if (isCorrect) {
      // Time bonus (faster = more points)
      const timeLimit = question.timeLimit || spec.questionIntegration.interval || 30;
      const timeFraction = Math.max(0, 1 - (timeMs / 1000) / timeLimit);
      points += Math.floor(spec.scoring.timeBonus * timeFraction);

      // Streak bonus
      const newStreak = player.streak + 1;
      const streakMultiplier = Math.min(newStreak, spec.scoring.maxStreak) * spec.scoring.streakMultiplier;
      points = Math.floor(points * (1 + streakMultiplier));
    }

    // Get effects based on correct/incorrect
    const effects = isCorrect
      ? spec.questionIntegration.onCorrect
      : spec.questionIntegration.onIncorrect;

    const newScore = isCorrect ? player.score + points : player.score;
    const newStreak = isCorrect ? player.streak + 1 : 0;

    return {
      success: true,
      effects,
      events: [{
        id: `evt-${Date.now()}-answer`,
        timestamp: Date.now(),
        type: "question",
        playerId: player.id,
        payload: {
          questionId,
          answer,
          correct: isCorrect,
          timeMs,
          points: isCorrect ? points : 0,
          effects,
        },
      }],
      stateUpdates: {
        player: {
          score: newScore,
          streak: newStreak,
          questionsAnswered: player.questionsAnswered + 1,
          correctAnswers: player.correctAnswers + (isCorrect ? 1 : 0),
        },
      },
    };
  }

  private handleUseAbility(payload: ActionPayload, context: ActionContext): ActionResult {
    const { abilityId, targetPlayerId, targetPosition } = payload as AbilityPayload;
    const { spec, player, allPlayers } = context;

    const ability = spec.players.abilities.find(a => a.id === abilityId);
    if (!ability) {
      return { success: false, error: "Ability not found", effects: [], events: [], stateUpdates: {} };
    }

    // Check cooldown
    const cooldown = player.abilityCooldowns[abilityId] || 0;
    if (cooldown > 0) {
      return { success: false, error: `Ability on cooldown (${cooldown} turns)`, effects: [], events: [], stateUpdates: {} };
    }

    // Check cost
    if (ability.cost) {
      for (const [resource, amount] of Object.entries(ability.cost)) {
        if ((player.resources[resource] || 0) < amount) {
          return { success: false, error: `Insufficient ${resource}`, effects: [], events: [], stateUpdates: {} };
        }
      }
    }

    // Apply cost
    const newResources = { ...player.resources };
    if (ability.cost) {
      for (const [resource, amount] of Object.entries(ability.cost)) {
        newResources[resource] = (newResources[resource] || 0) - amount;
      }
    }

    // Set cooldown
    const newCooldowns = { ...player.abilityCooldowns, [abilityId]: ability.cooldown };

    return {
      success: true,
      effects: ability.effects,
      events: [{
        id: `evt-${Date.now()}-ability`,
        timestamp: Date.now(),
        type: "ability",
        playerId: player.id,
        payload: { abilityId, targetPlayerId, targetPosition },
      }],
      stateUpdates: {
        player: {
          resources: newResources,
          abilityCooldowns: newCooldowns,
        },
      },
    };
  }

  private handleSkip(_payload: ActionPayload, context: ActionContext): ActionResult {
    const { spec, player } = context;

    const effects = spec.questionIntegration.penaltyForSkip || [];

    return {
      success: true,
      effects,
      events: [],
      stateUpdates: {
        player: { streak: 0 },
      },
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private checkAnswer(answer: string | string[], correct: string | string[]): boolean {
    if (Array.isArray(correct)) {
      if (Array.isArray(answer)) {
        // For ordering/categorization: must match exactly
        return JSON.stringify(answer) === JSON.stringify(correct);
      }
      return false;
    }
    return answer === correct;
  }

  private updatePlayerZone(
    player: PlayerState,
    newZoneId: string,
    worldState: WorldState
  ): Record<string, ZoneState> {
    const zones = { ...worldState.zones };

    // Remove from old zone
    for (const zoneId in zones) {
      const zone = zones[zoneId];
      if (zone.playersInZone.includes(player.id)) {
        zones[zoneId] = {
          ...zone,
          playersInZone: zone.playersInZone.filter(id => id !== player.id),
        };
      }
    }

    // Add to new zone
    if (zones[newZoneId]) {
      zones[newZoneId] = {
        ...zones[newZoneId],
        playersInZone: [...zones[newZoneId].playersInZone, player.id],
      };
    }

    return zones;
  }
}

/**
 * Create ActionProcessor instance
 */
export function createActionProcessor(stateManager: StateManager): ActionProcessor {
  return new ActionProcessor(stateManager);
}
