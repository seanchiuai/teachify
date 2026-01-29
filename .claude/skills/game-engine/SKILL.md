---
name: game-engine
description: Game state machine, lobby system, question flow, scoring, and real-time game coordination
---

# Game Engine

Manages the game lifecycle from lobby to completion — state transitions, question progression, answer tracking, scoring, iframe communication, and real-time coordination between host and players.

## Overview

- **State Machine**: lobby → playing → question → results → complete
- **Host Controls**: Start game, next question, show results
- **Player Flow**: Join lobby, play AI-generated game in sandboxed iframe, see feedback, view leaderboard
- **Iframe Architecture**: Parent owns game state, iframe is a dumb renderer, communication via MessageChannel
- **Scoring**: Points based on correctness + speed (validated server-side, not in iframe)
- **Real-time**: All state changes sync instantly via Convex

## When to Use This Skill

- Building or modifying the game state machine
- Implementing host controls (start, next, results)
- Building the iframe sandbox and MessageChannel communication
- Building the player answer flow (iframe → parent → Convex)
- Implementing scoring logic (server-side validation)
- Handling edge cases (disconnects, late joins, timeouts, iframe errors)

## Key Concepts

### State Machine

```
lobby → playing → question ←→ results → complete
                     ↑              |
                     └──────────────┘ (next question)
```

- **lobby**: Players joining, host waiting to start
- **playing**: Transitional state when game starts
- **question**: Active question, players submitting answers
- **results**: Showing answer results + leaderboard for current question
- **complete**: All questions done, final results displayed

### State Transitions

| From | To | Trigger |
|------|----|---------|
| lobby | question | Host clicks "Start Game" |
| question | results | Host clicks "Show Results" OR timer expires |
| results | question | Host clicks "Next Question" (if questions remain) |
| results | complete | Host clicks "Next Question" on last question |

### Scoring Formula

```
Points = correctness_points + speed_bonus
correctness_points = correct ? 1000 : 0
speed_bonus = correct ? max(0, 500 * (1 - timeMs / timerDuration)) : 0
```

Max points per question: 1500 (correct + fastest possible)

### Timer

- Default: 30 seconds per question
- Timer runs in the **parent app** (authoritative), not in the iframe
- iframe can display a visual countdown, but parent enforces the actual limit
- When timer expires, parent sends `TIME_UP` to iframe via MessageChannel

### Iframe Communication

Parent and iframe communicate via a private MessageChannel:
1. Parent creates `MessageChannel`, transfers one port to iframe via initial `postMessage`
2. All subsequent communication flows through the private channel port
3. Never combine `allow-scripts` + `allow-same-origin` in sandbox

### Parent as Source of Truth

- Parent owns game state — iframe is a rendering engine
- Scoring happens server-side (Convex), not in the iframe
- If iframe crashes, parent still has game state and can recover
- iframe cannot be trusted for authoritative state (it runs AI-generated code)

## Related Files

- `convex/games.ts` — Game state mutations
- `convex/answers.ts` — Answer submission and scoring
- `convex/players.ts` — Player management and scores
- `components/GameIframe.tsx` — Sandboxed iframe wrapper with MessageChannel

## Reference Files

- [reference.md](reference.md) — Code patterns for state management and iframe communication
