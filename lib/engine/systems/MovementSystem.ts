/**
 * MovementSystem - Position, zones, territory control
 */

import type {
  MovementConfig,
  WorldConfig,
  ZoneConfig,
  ZoneState,
  Position,
  PlayerState,
  WorldState,
  Effect,
} from "../types";

export interface MoveResult {
  success: boolean;
  error?: string;
  newPosition: Position;
  enteredZone?: string;
  leftZone?: string;
  capturedZone?: string;
}

export interface ZoneCaptureResult {
  captured: boolean;
  influenceAdded: number;
  totalInfluence: number;
  requiredInfluence: number;
  previousController?: string;
  newController?: string;
}

/**
 * Check if position is within world bounds
 */
export function isInBounds(position: Position, world: WorldConfig): boolean {
  return (
    position.x >= 0 &&
    position.x < world.size.width &&
    position.y >= 0 &&
    position.y < world.size.height
  );
}

/**
 * Check if position is blocked by obstacle
 */
export function isBlocked(
  position: Position,
  world: WorldConfig,
  config: MovementConfig
): boolean {
  if (config.canPassThrough) return false;

  return world.features.some(
    f => f.type === "obstacle" &&
    f.position.x === position.x &&
    f.position.y === position.y
  );
}

/**
 * Calculate Manhattan distance between two positions
 */
export function calculateDistance(from: Position, to: Position): number {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}

/**
 * Check if move is valid
 */
export function validateMove(
  player: PlayerState,
  targetPosition: Position,
  world: WorldConfig,
  config: MovementConfig
): { valid: boolean; error?: string } {
  // Check bounds
  if (!isInBounds(targetPosition, world)) {
    return { valid: false, error: "Position out of bounds" };
  }

  // Check obstacle
  if (isBlocked(targetPosition, world, config)) {
    return { valid: false, error: "Position blocked" };
  }

  // Check movement range
  if (player.position) {
    const distance = calculateDistance(player.position, targetPosition);
    const maxMove = config.movementPerTurn || 1;
    if (distance > maxMove) {
      return { valid: false, error: `Can only move ${maxMove} spaces` };
    }
  }

  return { valid: true };
}

/**
 * Get zone at position
 */
export function getZoneAtPosition(
  position: Position,
  zones: ZoneConfig[]
): ZoneConfig | null {
  for (const zone of zones) {
    if (
      position.x >= zone.position.x &&
      position.x < zone.position.x + zone.size.width &&
      position.y >= zone.position.y &&
      position.y < zone.position.y + zone.size.height
    ) {
      return zone;
    }
  }
  return null;
}

/**
 * Process player movement
 */
export function processMove(
  player: PlayerState,
  targetPosition: Position,
  world: WorldConfig,
  config: MovementConfig,
  worldState: WorldState
): MoveResult {
  const validation = validateMove(player, targetPosition, world, config);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      newPosition: player.position || { x: 0, y: 0 },
    };
  }

  // Determine zone transitions
  const zones = world.zones || [];
  const fromZone = player.position ? getZoneAtPosition(player.position, zones) : null;
  const toZone = getZoneAtPosition(targetPosition, zones);

  return {
    success: true,
    newPosition: targetPosition,
    enteredZone: toZone && toZone.id !== fromZone?.id ? toZone.id : undefined,
    leftZone: fromZone && fromZone.id !== toZone?.id ? fromZone.id : undefined,
  };
}

/**
 * Process zone-based movement (moving to a named zone)
 */
export function processMoveToZone(
  player: PlayerState,
  targetZoneId: string,
  world: WorldConfig
): MoveResult {
  const zone = world.zones?.find(z => z.id === targetZoneId);
  if (!zone) {
    return {
      success: false,
      error: "Invalid zone",
      newPosition: player.position || { x: 0, y: 0 },
    };
  }

  // Move to zone center
  const centerPosition: Position = {
    x: zone.position.x + Math.floor(zone.size.width / 2),
    y: zone.position.y + Math.floor(zone.size.height / 2),
  };

  const fromZone = player.position
    ? getZoneAtPosition(player.position, world.zones || [])
    : null;

  return {
    success: true,
    newPosition: centerPosition,
    enteredZone: targetZoneId,
    leftZone: fromZone?.id !== targetZoneId ? fromZone?.id : undefined,
  };
}

/**
 * Add influence to a zone
 */
export function addZoneInfluence(
  zoneState: ZoneState,
  playerId: string,
  amount: number,
  captureThreshold: number
): ZoneCaptureResult {
  const newInfluence = { ...zoneState.influence };
  newInfluence[playerId] = (newInfluence[playerId] || 0) + amount;

  const totalInfluence = newInfluence[playerId];
  const captured = totalInfluence >= captureThreshold;

  return {
    captured,
    influenceAdded: amount,
    totalInfluence,
    requiredInfluence: captureThreshold,
    previousController: zoneState.controlledBy,
    newController: captured ? playerId : zoneState.controlledBy,
  };
}

/**
 * Update zone state after player enters
 */
export function updateZoneOnEnter(
  zones: Record<string, ZoneState>,
  zoneId: string,
  playerId: string
): Record<string, ZoneState> {
  const updatedZones = { ...zones };

  if (updatedZones[zoneId]) {
    const zone = updatedZones[zoneId];
    if (!zone.playersInZone.includes(playerId)) {
      updatedZones[zoneId] = {
        ...zone,
        playersInZone: [...zone.playersInZone, playerId],
      };
    }
  }

  return updatedZones;
}

/**
 * Update zone state after player leaves
 */
export function updateZoneOnLeave(
  zones: Record<string, ZoneState>,
  zoneId: string,
  playerId: string
): Record<string, ZoneState> {
  const updatedZones = { ...zones };

  if (updatedZones[zoneId]) {
    const zone = updatedZones[zoneId];
    updatedZones[zoneId] = {
      ...zone,
      playersInZone: zone.playersInZone.filter(id => id !== playerId),
    };
  }

  return updatedZones;
}

/**
 * Apply movement effects
 */
export function applyMovementEffects(
  effects: Effect[],
  player: PlayerState,
  config: MovementConfig,
  world: WorldConfig
): Partial<PlayerState> {
  const updates: Partial<PlayerState> = {};

  for (const effect of effects) {
    switch (effect.type) {
      case "grant-movement":
        // Could be used to grant extra movement points
        break;
      case "teleport":
        if (effect.position) {
          updates.position = effect.position;
        }
        break;
      case "capture-influence":
        // Handled separately via zone state updates
        break;
    }
  }

  return updates;
}

/**
 * Get players in a specific zone
 */
export function getPlayersInZone(
  zoneId: string,
  players: PlayerState[],
  worldState: WorldState
): PlayerState[] {
  const zone = worldState.zones[zoneId];
  if (!zone) return [];

  return players.filter(p => zone.playersInZone.includes(p.id));
}

/**
 * Get controlled zones for a player
 */
export function getControlledZones(
  playerId: string,
  worldState: WorldState
): string[] {
  return Object.entries(worldState.zones)
    .filter(([_, zone]) => zone.controlledBy === playerId)
    .map(([id, _]) => id);
}

/**
 * Count total zones controlled
 */
export function countControlledZones(
  worldState: WorldState
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const zone of Object.values(worldState.zones)) {
    if (zone.controlledBy) {
      counts[zone.controlledBy] = (counts[zone.controlledBy] || 0) + 1;
    }
  }

  return counts;
}

/**
 * Check if player controls majority of zones
 */
export function controlsMajorityZones(
  playerId: string,
  worldState: WorldState
): boolean {
  const totalZones = Object.keys(worldState.zones).length;
  const controlledCount = getControlledZones(playerId, worldState).length;
  return controlledCount > totalZones / 2;
}

/**
 * Get adjacent positions (for grid movement)
 */
export function getAdjacentPositions(position: Position): Position[] {
  return [
    { x: position.x - 1, y: position.y },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y - 1 },
    { x: position.x, y: position.y + 1 },
  ];
}

/**
 * Get valid moves from current position
 */
export function getValidMoves(
  player: PlayerState,
  world: WorldConfig,
  config: MovementConfig
): Position[] {
  if (!player.position) return [];

  const maxMove = config.movementPerTurn || 1;
  const validMoves: Position[] = [];

  // For grid movement, check all positions within range
  for (let dx = -maxMove; dx <= maxMove; dx++) {
    for (let dy = -maxMove; dy <= maxMove; dy++) {
      if (Math.abs(dx) + Math.abs(dy) <= maxMove && (dx !== 0 || dy !== 0)) {
        const pos = {
          x: player.position.x + dx,
          y: player.position.y + dy,
        };
        if (isInBounds(pos, world) && !isBlocked(pos, world, config)) {
          validMoves.push(pos);
        }
      }
    }
  }

  return validMoves;
}
