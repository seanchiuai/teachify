"use client";

/**
 * EntityRenderer - Renders players, items, and other entities
 */

import React from "react";
import type {
  PlayerState,
  PlayerConfig,
  WorldState,
  ThemeConfig,
  AvatarStyle,
} from "../types";

export interface EntityRendererProps {
  players: PlayerState[];
  worldState: WorldState;
  playerConfig: PlayerConfig;
  theme: ThemeConfig;
  cellSize: number;
  currentPlayerId?: string;
}

// Avatar emoji options for players
const AVATAR_EMOJIS = ["🦊", "🐼", "🦁", "🐯", "🐸", "🦉", "🐙", "🦋", "🐬", "🦄"];

// Color palette for players
const PLAYER_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#06b6d4",
];

export function EntityRenderer({
  players,
  worldState,
  playerConfig,
  theme,
  cellSize,
  currentPlayerId,
}: EntityRendererProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Render resource spawns */}
      {worldState.resources.map((resource, index) => (
        <ResourceEntity
          key={`resource-${index}`}
          type={resource.type}
          position={resource.position}
          amount={resource.amount}
          cellSize={cellSize}
        />
      ))}

      {/* Render other entities */}
      {worldState.entities.map(entity => (
        <GenericEntity
          key={entity.id}
          entity={entity}
          cellSize={cellSize}
          theme={theme}
        />
      ))}

      {/* Render players */}
      {players.map((player, index) => (
        <PlayerEntity
          key={player.id}
          player={player}
          index={index}
          config={playerConfig}
          cellSize={cellSize}
          isCurrentPlayer={player.id === currentPlayerId}
          theme={theme}
        />
      ))}
    </div>
  );
}

interface PlayerEntityProps {
  player: PlayerState;
  index: number;
  config: PlayerConfig;
  cellSize: number;
  isCurrentPlayer: boolean;
  theme: ThemeConfig;
}

function PlayerEntity({
  player,
  index,
  config,
  cellSize,
  isCurrentPlayer,
  theme,
}: PlayerEntityProps) {
  if (!player.position) return null;
  if (player.status === "eliminated") return null;

  const left = player.position.x * cellSize + cellSize / 2;
  const top = player.position.y * cellSize + cellSize / 2;

  // Get avatar based on style
  const avatar = getAvatar(player, index, config.avatarStyle);
  const playerColor = PLAYER_COLORS[index % PLAYER_COLORS.length];

  return (
    <div
      className="absolute transition-all duration-300 ease-out"
      style={{
        left,
        top,
        transform: "translate(-50%, -50%)",
        zIndex: isCurrentPlayer ? 100 : 10,
      }}
    >
      {/* Player avatar container */}
      <div
        className={`relative flex items-center justify-center rounded-full border-2 shadow-lg ${
          isCurrentPlayer ? "animate-pulse" : ""
        }`}
        style={{
          width: cellSize * 0.8,
          height: cellSize * 0.8,
          backgroundColor: `${playerColor}dd`,
          borderColor: isCurrentPlayer ? theme.accentColor : playerColor,
          borderWidth: isCurrentPlayer ? 3 : 2,
          boxShadow: isCurrentPlayer
            ? `0 0 15px ${theme.accentColor}88`
            : `0 2px 8px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Avatar */}
        <span style={{ fontSize: cellSize * 0.4 }}>{avatar}</span>

        {/* Shield indicator */}
        {player.shield && player.shield > 0 && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs bg-blue-500 text-white"
          >
            🛡️
          </div>
        )}

        {/* Streak indicator */}
        {player.streak >= 3 && (
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs bg-orange-500 text-white"
          >
            🔥
          </div>
        )}
      </div>

      {/* Player name */}
      <div
        className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{
          top: cellSize * 0.45,
          backgroundColor: `${playerColor}cc`,
        }}
      >
        {player.name}
        {isCurrentPlayer && " (You)"}
      </div>

      {/* Health bar */}
      {player.health !== undefined && player.maxHealth && (
        <div
          className="absolute left-1/2 -translate-x-1/2 h-1 rounded-full overflow-hidden"
          style={{
            top: cellSize * 0.6,
            width: cellSize * 0.7,
            backgroundColor: "#374151",
          }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(player.health / player.maxHealth) * 100}%`,
              backgroundColor: player.health > player.maxHealth * 0.3 ? "#22c55e" : "#ef4444",
            }}
          />
        </div>
      )}
    </div>
  );
}

function getAvatar(player: PlayerState, index: number, style: AvatarStyle): string {
  switch (style) {
    case "emoji":
      return AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];
    case "initials":
      return player.name.slice(0, 2).toUpperCase();
    case "character":
      return AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];
    case "icon":
      return "👤";
    default:
      return AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];
  }
}

interface ResourceEntityProps {
  type: string;
  position: { x: number; y: number };
  amount: number;
  cellSize: number;
}

function ResourceEntity({ type, position, amount, cellSize }: ResourceEntityProps) {
  if (amount <= 0) return null;

  const left = position.x * cellSize + cellSize / 2;
  const top = position.y * cellSize + cellSize / 2;

  // Resource type to emoji mapping
  const resourceEmoji: Record<string, string> = {
    gold: "💰",
    gems: "💎",
    wood: "🪵",
    stone: "🪨",
    food: "🍎",
    energy: "⚡",
    ATP: "🔋",
    proteins: "🧬",
    default: "📦",
  };

  const emoji = resourceEmoji[type] || resourceEmoji.default;

  return (
    <div
      className="absolute flex items-center justify-center animate-bounce"
      style={{
        left,
        top,
        transform: "translate(-50%, -50%)",
        width: cellSize * 0.6,
        height: cellSize * 0.6,
      }}
    >
      <span style={{ fontSize: cellSize * 0.35 }}>{emoji}</span>
      {amount > 1 && (
        <span
          className="absolute -bottom-1 -right-1 text-xs font-bold bg-gray-800 text-white px-1 rounded"
        >
          {amount}
        </span>
      )}
    </div>
  );
}

interface GenericEntityProps {
  entity: {
    id: string;
    type: string;
    position: { x: number; y: number };
    properties: Record<string, unknown>;
  };
  cellSize: number;
  theme: ThemeConfig;
}

function GenericEntity({ entity, cellSize, theme }: GenericEntityProps) {
  const left = entity.position.x * cellSize + cellSize / 2;
  const top = entity.position.y * cellSize + cellSize / 2;

  // Entity type to emoji mapping
  const entityEmoji: Record<string, string> = {
    item: "📦",
    enemy: "👾",
    structure: "🏛️",
    projectile: "💫",
    default: "❓",
  };

  const emoji = entityEmoji[entity.type] || entityEmoji.default;

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left,
        top,
        transform: "translate(-50%, -50%)",
        width: cellSize * 0.6,
        height: cellSize * 0.6,
      }}
    >
      <span style={{ fontSize: cellSize * 0.35 }}>{emoji}</span>
    </div>
  );
}
