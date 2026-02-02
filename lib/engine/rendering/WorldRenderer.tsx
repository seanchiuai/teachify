"use client";

/**
 * WorldRenderer - Draws game world (grid, zones, features)
 */

import React from "react";
import type {
  WorldConfig,
  WorldState,
  ThemeConfig,
  Position,
  ZoneConfig,
} from "../types";

export interface WorldRendererProps {
  world: WorldConfig;
  worldState: WorldState;
  theme: ThemeConfig;
  cellSize: number;
  selectedCell: Position | null;
  hoveredCell: Position | null;
  onCellClick: (position: Position) => void;
  onCellHover: (position: Position | null) => void;
}

export function WorldRenderer({
  world,
  worldState,
  theme,
  cellSize,
  selectedCell,
  hoveredCell,
  onCellClick,
  onCellHover,
}: WorldRendererProps) {
  // Handle missing world config (for quiz-only games)
  if (!world?.size) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Quiz Mode</div>
      </div>
    );
  }

  const width = world.size.width * cellSize;
  const height = world.size.height * cellSize;

  // Render based on world type
  switch (world.type) {
    case "grid":
      return (
        <GridWorld
          world={world}
          worldState={worldState}
          theme={theme}
          cellSize={cellSize}
          selectedCell={selectedCell}
          hoveredCell={hoveredCell}
          onCellClick={onCellClick}
          onCellHover={onCellHover}
        />
      );
    case "zones":
      return (
        <ZonesWorld
          world={world}
          worldState={worldState}
          theme={theme}
          cellSize={cellSize}
          onCellClick={onCellClick}
        />
      );
    default:
      return (
        <GridWorld
          world={world}
          worldState={worldState}
          theme={theme}
          cellSize={cellSize}
          selectedCell={selectedCell}
          hoveredCell={hoveredCell}
          onCellClick={onCellClick}
          onCellHover={onCellHover}
        />
      );
  }
}

interface GridWorldProps {
  world: WorldConfig;
  worldState: WorldState;
  theme: ThemeConfig;
  cellSize: number;
  selectedCell: Position | null;
  hoveredCell: Position | null;
  onCellClick: (position: Position) => void;
  onCellHover: (position: Position | null) => void;
}

function GridWorld({
  world,
  worldState,
  theme,
  cellSize,
  selectedCell,
  hoveredCell,
  onCellClick,
  onCellHover,
}: GridWorldProps) {
  const cells: React.ReactNode[] = [];

  for (let y = 0; y < world.size.height; y++) {
    for (let x = 0; x < world.size.width; x++) {
      const pos = { x, y };
      const isSelected = selectedCell?.x === x && selectedCell?.y === y;
      const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

      // Check for features at this position
      const feature = world.features.find(
        f => f.position.x === x && f.position.y === y
      );

      cells.push(
        <GridCell
          key={`${x}-${y}`}
          position={pos}
          cellSize={cellSize}
          theme={theme}
          feature={feature?.type}
          isSelected={isSelected}
          isHovered={isHovered}
          onClick={() => onCellClick(pos)}
          onMouseEnter={() => onCellHover(pos)}
          onMouseLeave={() => onCellHover(null)}
        />
      );
    }
  }

  return (
    <div
      className="absolute inset-0 grid"
      style={{
        gridTemplateColumns: `repeat(${world.size.width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${world.size.height}, ${cellSize}px)`,
      }}
    >
      {cells}
    </div>
  );
}

interface GridCellProps {
  position: Position;
  cellSize: number;
  theme: ThemeConfig;
  feature?: string;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function GridCell({
  position,
  cellSize,
  theme,
  feature,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: GridCellProps) {
  // Determine cell style based on feature
  let backgroundColor = "transparent";
  let borderColor = `${theme.primaryColor}33`;
  let content: React.ReactNode = null;

  if (feature) {
    switch (feature) {
      case "obstacle":
        backgroundColor = "#374151";
        content = "🪨";
        break;
      case "spawn":
        backgroundColor = `${theme.accentColor}44`;
        content = "⭐";
        break;
      case "goal":
        backgroundColor = `${theme.primaryColor}44`;
        content = "🎯";
        break;
      case "resource":
        content = "💎";
        break;
      case "hazard":
        backgroundColor = "#ef444433";
        content = "⚠️";
        break;
      case "portal":
        content = "🌀";
        break;
      case "shop":
        content = "🏪";
        break;
    }
  }

  if (isSelected) {
    borderColor = theme.accentColor;
  } else if (isHovered) {
    borderColor = `${theme.primaryColor}88`;
  }

  return (
    <div
      className="relative border cursor-pointer transition-all duration-150 flex items-center justify-center text-lg"
      style={{
        width: cellSize,
        height: cellSize,
        backgroundColor,
        borderColor,
        borderWidth: isSelected ? 2 : 1,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
      {isHovered && !feature && (
        <div
          className="absolute inset-1 rounded opacity-30"
          style={{ backgroundColor: theme.primaryColor }}
        />
      )}
    </div>
  );
}

interface ZonesWorldProps {
  world: WorldConfig;
  worldState: WorldState;
  theme: ThemeConfig;
  cellSize: number;
  onCellClick: (position: Position) => void;
}

function ZonesWorld({
  world,
  worldState,
  theme,
  cellSize,
  onCellClick,
}: ZonesWorldProps) {
  if (!world.zones) {
    return <div className="absolute inset-0 bg-gray-800" />;
  }

  return (
    <div className="absolute inset-0" style={{ backgroundColor: theme.backgroundColor }}>
      {world.zones.map(zone => (
        <ZoneArea
          key={zone.id}
          zone={zone}
          zoneState={worldState.zones[zone.id]}
          theme={theme}
          cellSize={cellSize}
          onClick={() => onCellClick({
            x: zone.position.x + Math.floor(zone.size.width / 2),
            y: zone.position.y + Math.floor(zone.size.height / 2),
          })}
        />
      ))}
    </div>
  );
}

interface ZoneAreaProps {
  zone: ZoneConfig;
  zoneState?: { controlledBy?: string; influence: Record<string, number>; playersInZone: string[] };
  theme: ThemeConfig;
  cellSize: number;
  onClick: () => void;
}

function ZoneArea({ zone, zoneState, theme, cellSize, onClick }: ZoneAreaProps) {
  const left = zone.position.x * cellSize;
  const top = zone.position.y * cellSize;
  const width = zone.size.width * cellSize;
  const height = zone.size.height * cellSize;

  const backgroundColor = zone.color || theme.primaryColor;
  const isControlled = !!zoneState?.controlledBy;
  const playerCount = zoneState?.playersInZone.length || 0;

  return (
    <div
      className="absolute rounded-lg border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: `${backgroundColor}44`,
        borderColor: isControlled ? theme.accentColor : backgroundColor,
        boxShadow: isControlled ? `0 0 20px ${theme.accentColor}66` : "none",
      }}
      onClick={onClick}
    >
      {/* Zone name */}
      <div
        className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold text-white"
        style={{ backgroundColor: `${backgroundColor}cc` }}
      >
        {zone.name}
      </div>

      {/* Player count indicator */}
      {playerCount > 0 && (
        <div
          className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: theme.accentColor }}
        >
          {playerCount}
        </div>
      )}

      {/* Control indicator */}
      {isControlled && (
        <div className="absolute top-2 right-2 text-lg">👑</div>
      )}
    </div>
  );
}
