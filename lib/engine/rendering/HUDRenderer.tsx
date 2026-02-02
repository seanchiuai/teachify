"use client";

/**
 * HUDRenderer - Heads-Up Display overlay
 *
 * Shows resources, health, timers, leaderboard
 */

import React from "react";
import type {
  GameSpecification,
  GameState,
  PlayerState,
} from "../types";

export interface HUDRendererProps {
  spec: GameSpecification;
  state: GameState;
  players: PlayerState[];
  currentPlayer?: PlayerState;
}

export function HUDRenderer({
  spec,
  state,
  players,
  currentPlayer,
}: HUDRendererProps) {
  const showResources = spec.mechanics.economy || spec.mechanics.resources;
  const showHealth = spec.mechanics.combat;
  const showLeaderboard = true;

  return (
    <>
      {/* Top left: Current player stats */}
      {currentPlayer && (
        <div className="absolute top-12 left-4 flex flex-col gap-2">
          {/* Score */}
          <StatCard
            icon="🏆"
            label="Score"
            value={currentPlayer.score.toLocaleString()}
            color={spec.theme.primaryColor}
          />

          {/* Streak */}
          {currentPlayer.streak > 0 && (
            <StatCard
              icon="🔥"
              label="Streak"
              value={`${currentPlayer.streak}x`}
              color="#f97316"
            />
          )}

          {/* Health */}
          {showHealth && currentPlayer.health !== undefined && (
            <HealthBar
              current={currentPlayer.health}
              max={currentPlayer.maxHealth || spec.mechanics.combat!.maxHealth}
              shield={currentPlayer.shield}
            />
          )}

          {/* Resources */}
          {showResources && Object.keys(currentPlayer.resources).length > 0 && (
            <ResourceDisplay
              resources={currentPlayer.resources}
              color={spec.theme.accentColor}
            />
          )}
        </div>
      )}

      {/* Top right: Timer and round info */}
      <div className="absolute top-12 right-4 flex flex-col gap-2 items-end">
        {/* Game timer */}
        {state.timeRemaining !== undefined && (
          <TimerDisplay
            seconds={state.timeRemaining}
            label="Time"
            color={spec.theme.primaryColor}
          />
        )}

        {/* Round indicator */}
        {state.roundNumber > 0 && (
          <StatCard
            icon="🎯"
            label="Round"
            value={state.roundNumber.toString()}
            color={spec.theme.accentColor}
          />
        )}

        {/* Question progress */}
        {state.currentQuestionIndex >= 0 && (
          <StatCard
            icon="❓"
            label="Question"
            value={`${state.currentQuestionIndex + 1}`}
            color={spec.theme.primaryColor}
          />
        )}
      </div>

      {/* Bottom right: Mini leaderboard */}
      {showLeaderboard && (
        <div className="absolute bottom-4 right-4">
          <MiniLeaderboard
            players={players}
            currentPlayerId={currentPlayer?.id}
            theme={spec.theme}
          />
        </div>
      )}

      {/* Bottom left: Controls hint */}
      {spec.mechanics.movement && (
        <div className="absolute bottom-4 left-4 px-3 py-2 bg-gray-900/80 rounded-lg text-xs text-gray-300">
          Click to move • Answer questions to earn points
        </div>
      )}
    </>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm"
      style={{ backgroundColor: `${color}22`, borderLeft: `3px solid ${color}` }}
    >
      <span className="text-lg">{icon}</span>
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

interface HealthBarProps {
  current: number;
  max: number;
  shield?: number;
}

function HealthBar({ current, max, shield }: HealthBarProps) {
  const healthPercent = Math.max(0, Math.min(100, (current / max) * 100));
  const isLow = healthPercent <= 30;

  return (
    <div className="px-3 py-2 bg-gray-900/80 rounded-lg min-w-[120px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">❤️</span>
        <span className="text-xs text-gray-400">Health</span>
        <span className="text-xs font-bold text-white ml-auto">
          {current}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isLow ? "bg-red-500 animate-pulse" : "bg-green-500"
          }`}
          style={{ width: `${healthPercent}%` }}
        />
      </div>
      {shield && shield > 0 && (
        <div className="flex items-center gap-1 mt-1 text-xs text-blue-400">
          <span>🛡️</span>
          <span>+{shield} shield</span>
        </div>
      )}
    </div>
  );
}

interface ResourceDisplayProps {
  resources: Record<string, number>;
  color: string;
}

function ResourceDisplay({ resources, color }: ResourceDisplayProps) {
  const resourceEmojis: Record<string, string> = {
    gold: "💰",
    gems: "💎",
    energy: "⚡",
    wood: "🪵",
    stone: "🪨",
    food: "🍎",
    ATP: "🔋",
    proteins: "🧬",
  };

  return (
    <div
      className="px-3 py-2 rounded-lg backdrop-blur-sm"
      style={{ backgroundColor: `${color}22`, borderLeft: `3px solid ${color}` }}
    >
      <div className="text-xs text-gray-400 mb-1">Resources</div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(resources).map(([resource, amount]) => (
          <div key={resource} className="flex items-center gap-1">
            <span className="text-sm">{resourceEmojis[resource] || "📦"}</span>
            <span className="text-xs font-bold text-white">{amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimerDisplayProps {
  seconds: number;
  label: string;
  color: string;
}

function TimerDisplay({ seconds, label, color }: TimerDisplayProps) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const isLow = seconds <= 30;
  const isCritical = seconds <= 10;

  return (
    <div
      className={`px-4 py-2 rounded-lg backdrop-blur-sm ${
        isCritical ? "animate-pulse" : ""
      }`}
      style={{
        backgroundColor: isCritical ? "#ef444444" : `${color}22`,
        borderLeft: `3px solid ${isCritical ? "#ef4444" : color}`,
      }}
    >
      <div className="text-xs text-gray-400">{label}</div>
      <div
        className={`text-xl font-mono font-bold ${
          isCritical ? "text-red-400" : isLow ? "text-yellow-400" : "text-white"
        }`}
      >
        {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
      </div>
    </div>
  );
}

interface MiniLeaderboardProps {
  players: PlayerState[];
  currentPlayerId?: string;
  theme: { primaryColor: string; accentColor: string };
}

function MiniLeaderboard({ players, currentPlayerId, theme }: MiniLeaderboardProps) {
  const sorted = [...players]
    .filter(p => p.status !== "eliminated")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

  return (
    <div
      className="px-3 py-2 rounded-lg backdrop-blur-sm min-w-[150px]"
      style={{ backgroundColor: `${theme.primaryColor}22` }}
    >
      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
        <span>🏆</span>
        <span>Leaderboard</span>
      </div>
      <div className="flex flex-col gap-1">
        {sorted.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center gap-2 px-2 py-1 rounded ${
              player.id === currentPlayerId ? "bg-white/10" : ""
            }`}
          >
            <span className="text-sm">{medals[index]}</span>
            <span
              className={`text-xs truncate flex-1 ${
                player.id === currentPlayerId ? "font-bold text-white" : "text-gray-300"
              }`}
            >
              {player.name}
            </span>
            <span className="text-xs font-bold text-white">
              {player.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
