/**
 * CombatSystem - Health, damage, shields, and elimination
 */

import type {
  CombatConfig,
  PlayerState,
  Effect,
  PlayerStatus,
} from "../types";

export interface DamageResult {
  damageDealt: number;
  shieldAbsorbed: number;
  newHealth: number;
  newShield: number;
  eliminated: boolean;
}

export interface HealResult {
  healAmount: number;
  newHealth: number;
  overheal: number;
}

/**
 * Calculate and apply damage to a player
 */
export function applyDamage(
  target: PlayerState,
  damage: number,
  config: CombatConfig
): DamageResult {
  let remainingDamage = damage;
  let shieldAbsorbed = 0;

  // Apply to shield first
  let newShield = target.shield || 0;
  if (newShield > 0) {
    shieldAbsorbed = Math.min(newShield, remainingDamage);
    newShield -= shieldAbsorbed;
    remainingDamage -= shieldAbsorbed;
  }

  // Apply remaining to health
  const currentHealth = target.health || config.maxHealth;
  const newHealth = Math.max(0, currentHealth - remainingDamage);
  const eliminated = newHealth <= 0;

  return {
    damageDealt: damage,
    shieldAbsorbed,
    newHealth,
    newShield,
    eliminated,
  };
}

/**
 * Apply healing to a player
 */
export function applyHeal(
  target: PlayerState,
  healAmount: number,
  config: CombatConfig
): HealResult {
  const currentHealth = target.health || config.maxHealth;
  const maxHealth = target.maxHealth || config.maxHealth;

  const newHealth = Math.min(maxHealth, currentHealth + healAmount);
  const actualHeal = newHealth - currentHealth;
  const overheal = healAmount - actualHeal;

  return {
    healAmount: actualHeal,
    newHealth,
    overheal,
  };
}

/**
 * Apply shield to a player
 */
export function applyShield(
  target: PlayerState,
  shieldAmount: number
): number {
  return (target.shield || 0) + shieldAmount;
}

/**
 * Process attack from one player to another
 */
export function processAttack(
  attacker: PlayerState,
  target: PlayerState,
  config: CombatConfig
): {
  damageResult: DamageResult;
  attackerUpdates: Partial<PlayerState>;
  targetUpdates: Partial<PlayerState>;
} {
  // Check friendly fire
  if (!config.friendlyFire && attacker.faction === target.faction) {
    return {
      damageResult: {
        damageDealt: 0,
        shieldAbsorbed: 0,
        newHealth: target.health || config.maxHealth,
        newShield: target.shield || 0,
        eliminated: false,
      },
      attackerUpdates: {},
      targetUpdates: {},
    };
  }

  const damageResult = applyDamage(target, config.damagePerAttack, config);

  const targetUpdates: Partial<PlayerState> = {
    health: damageResult.newHealth,
    shield: damageResult.newShield,
  };

  if (damageResult.eliminated) {
    targetUpdates.status = "eliminated";
  }

  return {
    damageResult,
    attackerUpdates: { lastAction: "attack", lastActionTime: Date.now() },
    targetUpdates,
  };
}

/**
 * Apply damage from incorrect answer
 */
export function applyIncorrectDamage(
  player: PlayerState,
  config: CombatConfig
): Partial<PlayerState> | null {
  if (!config.damagePerIncorrect) return null;

  const damageResult = applyDamage(player, config.damagePerIncorrect, config);

  const updates: Partial<PlayerState> = {
    health: damageResult.newHealth,
    shield: damageResult.newShield,
  };

  if (damageResult.eliminated) {
    updates.status = "eliminated";
  }

  return updates;
}

/**
 * Apply healing from correct answer
 */
export function applyCorrectHeal(
  player: PlayerState,
  config: CombatConfig
): Partial<PlayerState> | null {
  if (!config.healPerCorrect) return null;

  const healResult = applyHeal(player, config.healPerCorrect, config);

  return {
    health: healResult.newHealth,
  };
}

/**
 * Respawn a player
 */
export function respawnPlayer(
  player: PlayerState,
  config: CombatConfig
): Partial<PlayerState> {
  return {
    health: config.startingHealth,
    shield: 0,
    status: "active",
  };
}

/**
 * Apply combat effects from answer/action
 */
export function applyCombatEffects(
  effects: Effect[],
  player: PlayerState,
  config: CombatConfig
): Partial<PlayerState> {
  const updates: Partial<PlayerState> = {};
  let health = player.health || config.maxHealth;
  let shield = player.shield || 0;

  for (const effect of effects) {
    switch (effect.type) {
      case "deal-damage": {
        const result = applyDamage(
          { ...player, health, shield },
          effect.amount || config.damagePerAttack,
          config
        );
        health = result.newHealth;
        shield = result.newShield;
        if (result.eliminated) {
          updates.status = "eliminated";
        }
        break;
      }
      case "heal": {
        const result = applyHeal(
          { ...player, health },
          effect.amount || 0,
          config
        );
        health = result.newHealth;
        break;
      }
      case "grant-shield":
        shield += effect.amount || 0;
        break;
    }
  }

  updates.health = health;
  updates.shield = shield;

  return updates;
}

/**
 * Check if player is alive
 */
export function isAlive(player: PlayerState): boolean {
  return player.status === "active" || player.status === "shielded";
}

/**
 * Get alive players
 */
export function getAlivePlayers(players: PlayerState[]): PlayerState[] {
  return players.filter(isAlive);
}

/**
 * Get eliminated players
 */
export function getEliminatedPlayers(players: PlayerState[]): PlayerState[] {
  return players.filter(p => p.status === "eliminated");
}

/**
 * Check if only one player remains (for elimination victory)
 */
export function checkLastPlayerStanding(players: PlayerState[]): PlayerState | null {
  const alive = getAlivePlayers(players);
  return alive.length === 1 ? alive[0] : null;
}

/**
 * Get player with most eliminations (from events)
 */
export function getPlayerWithMostEliminations(
  eliminationCounts: Record<string, number>,
  players: PlayerState[]
): PlayerState | null {
  let maxElims = 0;
  let topPlayer: PlayerState | null = null;

  for (const [playerId, count] of Object.entries(eliminationCounts)) {
    if (count > maxElims) {
      maxElims = count;
      topPlayer = players.find(p => p.id === playerId) || null;
    }
  }

  return topPlayer;
}
