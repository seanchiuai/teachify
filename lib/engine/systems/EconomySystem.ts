/**
 * EconomySystem - Currency, trading, and resource management
 */

import type {
  EconomyConfig,
  PlayerState,
  ResourceSet,
  Effect,
  ShopItem,
} from "../types";

export interface TransactionResult {
  success: boolean;
  error?: string;
  newResources: ResourceSet;
  effects?: Effect[];
}

export interface TradeOffer {
  fromPlayerId: string;
  toPlayerId: string;
  offer: ResourceSet;
  request: ResourceSet;
  status: "pending" | "accepted" | "rejected" | "expired";
  timestamp: number;
}

/**
 * Check if player has sufficient resources
 */
export function hasResources(
  player: PlayerState,
  required: ResourceSet
): boolean {
  for (const [resource, amount] of Object.entries(required)) {
    if ((player.resources[resource] || 0) < amount) {
      return false;
    }
  }
  return true;
}

/**
 * Add resources to player
 */
export function addResources(
  current: ResourceSet,
  toAdd: ResourceSet
): ResourceSet {
  const result = { ...current };
  for (const [resource, amount] of Object.entries(toAdd)) {
    result[resource] = (result[resource] || 0) + amount;
  }
  return result;
}

/**
 * Remove resources from player (returns null if insufficient)
 */
export function removeResources(
  current: ResourceSet,
  toRemove: ResourceSet
): ResourceSet | null {
  const result = { ...current };
  for (const [resource, amount] of Object.entries(toRemove)) {
    const newAmount = (result[resource] || 0) - amount;
    if (newAmount < 0) return null;
    result[resource] = newAmount;
  }
  return result;
}

/**
 * Process earning resources (from correct answer, turn, etc.)
 */
export function earnResources(
  player: PlayerState,
  config: EconomyConfig,
  source: "correctAnswer" | "turn" | "zone",
  zoneId?: string
): Partial<PlayerState> {
  let earned: ResourceSet = {};

  switch (source) {
    case "correctAnswer":
      earned = config.earnRates.perCorrectAnswer || {};
      break;
    case "turn":
      earned = config.earnRates.perTurn || {};
      break;
    case "zone":
      if (zoneId && config.earnRates.perZone) {
        earned = config.earnRates.perZone[zoneId] || {};
      }
      break;
  }

  if (Object.keys(earned).length === 0) {
    return {};
  }

  return {
    resources: addResources(player.resources, earned),
  };
}

/**
 * Purchase item from shop
 */
export function purchaseItem(
  player: PlayerState,
  item: ShopItem,
  config: EconomyConfig
): TransactionResult {
  // Check if player has resources
  if (!hasResources(player, item.cost)) {
    return {
      success: false,
      error: "Insufficient resources",
      newResources: player.resources,
    };
  }

  // Check item availability
  if (item.quantity !== undefined && item.quantity !== -1 && item.quantity <= 0) {
    return {
      success: false,
      error: "Item out of stock",
      newResources: player.resources,
    };
  }

  // Remove cost
  const newResources = removeResources(player.resources, item.cost);
  if (!newResources) {
    return {
      success: false,
      error: "Transaction failed",
      newResources: player.resources,
    };
  }

  return {
    success: true,
    newResources,
    effects: item.effects,
  };
}

/**
 * Process trade between players
 */
export function processTrade(
  fromPlayer: PlayerState,
  toPlayer: PlayerState,
  offer: ResourceSet,
  request: ResourceSet,
  config: EconomyConfig
): { fromResult: TransactionResult; toResult: TransactionResult } {
  // Check if trading is enabled
  if (!config.tradingEnabled) {
    return {
      fromResult: { success: false, error: "Trading disabled", newResources: fromPlayer.resources },
      toResult: { success: false, error: "Trading disabled", newResources: toPlayer.resources },
    };
  }

  // Check if from player has offer
  if (!hasResources(fromPlayer, offer)) {
    return {
      fromResult: { success: false, error: "Insufficient offer resources", newResources: fromPlayer.resources },
      toResult: { success: false, error: "Trade failed", newResources: toPlayer.resources },
    };
  }

  // Check if to player has request
  if (!hasResources(toPlayer, request)) {
    return {
      fromResult: { success: false, error: "Trade partner has insufficient resources", newResources: fromPlayer.resources },
      toResult: { success: false, error: "Insufficient resources for trade", newResources: toPlayer.resources },
    };
  }

  // Execute trade
  let fromResources = removeResources(fromPlayer.resources, offer);
  let toResources = removeResources(toPlayer.resources, request);

  if (!fromResources || !toResources) {
    return {
      fromResult: { success: false, error: "Trade failed", newResources: fromPlayer.resources },
      toResult: { success: false, error: "Trade failed", newResources: toPlayer.resources },
    };
  }

  fromResources = addResources(fromResources, request);
  toResources = addResources(toResources, offer);

  return {
    fromResult: { success: true, newResources: fromResources },
    toResult: { success: true, newResources: toResources },
  };
}

/**
 * Process stealing from another player
 */
export function processSteal(
  thief: PlayerState,
  victim: PlayerState,
  config: EconomyConfig,
  stealPercent: number = 0.2
): { thiefResult: TransactionResult; victimResult: TransactionResult } {
  // Check if stealing is enabled
  if (!config.stealingEnabled) {
    return {
      thiefResult: { success: false, error: "Stealing disabled", newResources: thief.resources },
      victimResult: { success: false, error: "N/A", newResources: victim.resources },
    };
  }

  // Calculate stolen amounts (percentage of each currency)
  const stolen: ResourceSet = {};
  for (const currency of config.currencies) {
    const victimAmount = victim.resources[currency] || 0;
    const stealAmount = Math.floor(victimAmount * stealPercent);
    if (stealAmount > 0) {
      stolen[currency] = stealAmount;
    }
  }

  if (Object.keys(stolen).length === 0) {
    return {
      thiefResult: { success: false, error: "Nothing to steal", newResources: thief.resources },
      victimResult: { success: true, newResources: victim.resources },
    };
  }

  // Remove from victim
  const victimResources = removeResources(victim.resources, stolen);
  if (!victimResources) {
    return {
      thiefResult: { success: false, error: "Steal failed", newResources: thief.resources },
      victimResult: { success: true, newResources: victim.resources },
    };
  }

  // Add to thief
  const thiefResources = addResources(thief.resources, stolen);

  return {
    thiefResult: { success: true, newResources: thiefResources },
    victimResult: { success: true, newResources: victimResources },
  };
}

/**
 * Apply economy effects
 */
export function applyEconomyEffects(
  effects: Effect[],
  player: PlayerState
): Partial<PlayerState> {
  let resources = { ...player.resources };

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
    }
  }

  return { resources };
}

/**
 * Get total value of resources (for ranking by wealth)
 */
export function calculateTotalWealth(resources: ResourceSet): number {
  return Object.values(resources).reduce((sum, val) => sum + val, 0);
}

/**
 * Get richest player
 */
export function getRichestPlayer(players: PlayerState[]): PlayerState | null {
  if (players.length === 0) return null;

  return players.reduce((richest, player) => {
    const playerWealth = calculateTotalWealth(player.resources);
    const richestWealth = calculateTotalWealth(richest.resources);
    return playerWealth > richestWealth ? player : richest;
  });
}
