"use client";

/**
 * GameCanvas - Main game container component
 *
 * Orchestrates all rendering subsystems based on game specification.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import type {
  GameSpecification,
  GameState,
  PlayerState,
  Position,
  PlayerAction,
} from "../types";
import { WorldRenderer } from "./WorldRenderer";
import { EntityRenderer } from "./EntityRenderer";
import { HUDRenderer } from "./HUDRenderer";
import { EffectsRenderer } from "./EffectsRenderer";

export interface GameCanvasProps {
  spec: GameSpecification;
  state: GameState;
  players: Map<string, PlayerState>;
  currentPlayerId?: string;
  onAction?: (action: PlayerAction) => void;
  onCellClick?: (position: Position) => void;
  className?: string;
}

export function GameCanvas({
  spec,
  state,
  players,
  currentPlayerId,
  onAction,
  onCellClick,
  className = "",
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);

  // Default world config for games without spatial mechanics
  const worldSize = spec.world?.size ?? { width: 10, height: 10 };

  // Calculate cell size based on container and world dimensions
  const cellWidth = dimensions.width / worldSize.width;
  const cellHeight = dimensions.height / worldSize.height;
  const cellSize = Math.min(cellWidth, cellHeight, 60); // Max 60px per cell

  // Actual canvas dimensions based on cell size
  const canvasWidth = cellSize * worldSize.width;
  const canvasHeight = cellSize * worldSize.height;

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Handle cell click
  const handleCellClick = useCallback((position: Position) => {
    setSelectedCell(position);
    onCellClick?.(position);

    // If current player has a position, try to move
    if (currentPlayerId && onAction) {
      const currentPlayer = players.get(currentPlayerId);
      if (currentPlayer?.position) {
        onAction({
          type: "move",
          playerId: currentPlayerId,
          timestamp: Date.now(),
          payload: { targetPosition: position },
        });
      }
    }
  }, [currentPlayerId, onAction, onCellClick, players]);

  // Handle cell hover
  const handleCellHover = useCallback((position: Position | null) => {
    setHoveredCell(position);
  }, []);

  // Get current player
  const currentPlayer = currentPlayerId ? players.get(currentPlayerId) : undefined;

  // Convert players map to array for rendering
  const playersArray = Array.from(players.values());

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: spec.theme.backgroundColor,
        minHeight: "400px",
      }}
    >
      {/* Game canvas container */}
      <div
        className="relative mx-auto"
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {/* World layer (grid, zones, features) */}
        <WorldRenderer
          world={spec.world}
          worldState={state.worldState}
          theme={spec.theme}
          cellSize={cellSize}
          selectedCell={selectedCell}
          hoveredCell={hoveredCell}
          onCellClick={handleCellClick}
          onCellHover={handleCellHover}
        />

        {/* Entity layer (players, items, etc.) */}
        <EntityRenderer
          players={playersArray}
          worldState={state.worldState}
          playerConfig={spec.players}
          theme={spec.theme}
          cellSize={cellSize}
          currentPlayerId={currentPlayerId}
        />

        {/* Effects layer (particles, animations) */}
        <EffectsRenderer
          effects={state.worldState.effects}
          events={state.events}
          theme={spec.theme}
          cellSize={cellSize}
        />
      </div>

      {/* HUD overlay */}
      <HUDRenderer
        spec={spec}
        state={state}
        players={playersArray}
        currentPlayer={currentPlayer}
      />

      {/* Game title overlay */}
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium"
        style={{
          backgroundColor: `${spec.theme.primaryColor}dd`,
          color: "#fff",
        }}
      >
        {spec.title}
      </div>

      {/* Phase indicator */}
      {state.phase !== "active" && state.phase !== "lobby" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div
            className="px-8 py-4 rounded-lg text-2xl font-bold text-white"
            style={{ backgroundColor: spec.theme.primaryColor }}
          >
            {state.phase === "countdown" && "Starting..."}
            {state.phase === "question" && "Question Time!"}
            {state.phase === "results" && "Results"}
            {state.phase === "paused" && "Paused"}
            {state.phase === "complete" && "Game Over!"}
          </div>
        </div>
      )}
    </div>
  );
}
