"use client";

/**
 * EffectsRenderer - Visual effects, particles, and animations
 */

import React, { useEffect, useState } from "react";
import type {
  ActiveEffect,
  GameEvent,
  ThemeConfig,
} from "../types";

export interface EffectsRendererProps {
  effects: ActiveEffect[];
  events: GameEvent[];
  theme: ThemeConfig;
  cellSize: number;
}

interface VisualEffect {
  id: string;
  type: "particle" | "text" | "pulse" | "trail";
  position: { x: number; y: number };
  content: string;
  color: string;
  duration: number;
  startTime: number;
}

export function EffectsRenderer({
  effects,
  events,
  theme,
  cellSize,
}: EffectsRendererProps) {
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);

  // Process new events to create visual effects
  useEffect(() => {
    const recentEvents = events.slice(-5); // Only process recent events

    const newEffects: VisualEffect[] = [];

    for (const event of recentEvents) {
      // Skip if we've already processed this event
      if (visualEffects.some(ve => ve.id === event.id)) continue;

      const effectsToAdd = createVisualEffectsFromEvent(event, theme, cellSize);
      newEffects.push(...effectsToAdd);
    }

    if (newEffects.length > 0) {
      setVisualEffects(prev => [...prev, ...newEffects]);
    }
  }, [events, theme, cellSize]);

  // Clean up expired effects
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setVisualEffects(prev =>
        prev.filter(effect => now - effect.startTime < effect.duration)
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {visualEffects.map(effect => (
        <VisualEffectComponent
          key={effect.id}
          effect={effect}
          cellSize={cellSize}
        />
      ))}

      {/* Render active status effects */}
      {effects.map(effect => (
        <ActiveEffectIndicator
          key={effect.id}
          effect={effect}
          cellSize={cellSize}
          theme={theme}
        />
      ))}
    </div>
  );
}

function createVisualEffectsFromEvent(
  event: GameEvent,
  theme: ThemeConfig,
  cellSize: number
): VisualEffect[] {
  const effects: VisualEffect[] = [];
  const baseId = event.id;

  switch (event.type) {
    case "question": {
      const payload = event.payload as { correct: boolean; points?: number };
      if (payload.correct) {
        effects.push({
          id: `${baseId}-correct`,
          type: "text",
          position: { x: 50, y: 40 },
          content: payload.points ? `+${payload.points}` : "Correct!",
          color: "#22c55e",
          duration: 1500,
          startTime: Date.now(),
        });
      } else {
        effects.push({
          id: `${baseId}-incorrect`,
          type: "text",
          position: { x: 50, y: 40 },
          content: "Wrong",
          color: "#ef4444",
          duration: 1500,
          startTime: Date.now(),
        });
      }
      break;
    }

    case "elimination": {
      effects.push({
        id: `${baseId}-elim`,
        type: "text",
        position: { x: 50, y: 50 },
        content: "💀 Eliminated!",
        color: "#ef4444",
        duration: 2000,
        startTime: Date.now(),
      });
      break;
    }

    case "action": {
      const payload = event.payload as { action: string; result: string };
      if (payload.result === "success" && payload.action === "attack") {
        effects.push({
          id: `${baseId}-attack`,
          type: "pulse",
          position: { x: 50, y: 50 },
          content: "⚔️",
          color: theme.accentColor,
          duration: 500,
          startTime: Date.now(),
        });
      }
      break;
    }

    case "phase_change": {
      const payload = event.payload as { to: string };
      if (payload.to === "active") {
        effects.push({
          id: `${baseId}-start`,
          type: "text",
          position: { x: 50, y: 50 },
          content: "GO!",
          color: theme.primaryColor,
          duration: 1000,
          startTime: Date.now(),
        });
      }
      break;
    }
  }

  return effects;
}

interface VisualEffectComponentProps {
  effect: VisualEffect;
  cellSize: number;
}

function VisualEffectComponent({ effect, cellSize }: VisualEffectComponentProps) {
  const elapsed = Date.now() - effect.startTime;
  const progress = Math.min(1, elapsed / effect.duration);

  switch (effect.type) {
    case "text":
      return (
        <FloatingText
          x={effect.position.x}
          y={effect.position.y}
          content={effect.content}
          color={effect.color}
          progress={progress}
        />
      );

    case "pulse":
      return (
        <PulseEffect
          x={effect.position.x}
          y={effect.position.y}
          content={effect.content}
          color={effect.color}
          progress={progress}
        />
      );

    case "particle":
      return (
        <ParticleEffect
          x={effect.position.x}
          y={effect.position.y}
          color={effect.color}
          progress={progress}
        />
      );

    default:
      return null;
  }
}

interface FloatingTextProps {
  x: number;
  y: number;
  content: string;
  color: string;
  progress: number;
}

function FloatingText({ x, y, content, color, progress }: FloatingTextProps) {
  const opacity = 1 - progress;
  const translateY = -30 * progress;
  const scale = 1 + 0.2 * Math.sin(progress * Math.PI);

  return (
    <div
      className="absolute text-2xl font-bold pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
        opacity,
        color,
        textShadow: `0 0 10px ${color}88`,
      }}
    >
      {content}
    </div>
  );
}

interface PulseEffectProps {
  x: number;
  y: number;
  content: string;
  color: string;
  progress: number;
}

function PulseEffect({ x, y, content, color, progress }: PulseEffectProps) {
  const opacity = 1 - progress;
  const scale = 1 + progress * 2;

  return (
    <div
      className="absolute text-4xl pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}
    >
      {content}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: `${color}44`,
          transform: `scale(${1 + progress * 3})`,
          opacity: opacity * 0.5,
        }}
      />
    </div>
  );
}

interface ParticleEffectProps {
  x: number;
  y: number;
  color: string;
  progress: number;
}

function ParticleEffect({ x, y, color, progress }: ParticleEffectProps) {
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const distance = progress * 50;
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance;
    return { px, py };
  });

  const opacity = 1 - progress;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            transform: `translate(${p.px}px, ${p.py}px)`,
            opacity,
          }}
        />
      ))}
    </div>
  );
}

interface ActiveEffectIndicatorProps {
  effect: ActiveEffect;
  cellSize: number;
  theme: ThemeConfig;
}

function ActiveEffectIndicator({ effect, cellSize, theme }: ActiveEffectIndicatorProps) {
  // Show visual indicator for active status effects
  const effectIcons: Record<string, string> = {
    "grant-shield": "🛡️",
    freeze: "❄️",
    "boost-speed": "⚡",
  };

  const icon = effectIcons[effect.type];
  if (!icon) return null;

  return (
    <div
      className="absolute animate-bounce text-lg"
      style={{
        // Position would need to be based on target player position
        right: "10px",
        bottom: "100px",
      }}
    >
      <div className="px-2 py-1 bg-gray-900/80 rounded-lg flex items-center gap-1">
        <span>{icon}</span>
        <span className="text-xs text-white">{effect.remainingDuration}s</span>
      </div>
    </div>
  );
}
