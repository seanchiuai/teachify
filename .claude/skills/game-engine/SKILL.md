---
name: game-engine
description: Game state machine, lobby system, question flow, scoring, and real-time game coordination
---

# Game Engine

Manages the game lifecycle from lobby to completion — state transitions, question progression, answer tracking, scoring, and real-time coordination between host and players.

## Overview

- **State Machine**: lobby → playing → question → results → complete
- **Host Controls**: Start game, next question, show results
- **Player Flow**: Join lobby, answer questions, see feedback, view leaderboard
- **Scoring**: Points based on correctness + speed
- **Real-time**: All state changes sync instantly via Convex

## When to Use This Skill

- Building or modifying the game state machine
- Implementing host controls (start, next, results)
- Building the player answer flow
- Implementing scoring logic
- Handling edge cases (disconnects, late joins, timeouts)

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
- Timer starts when question state is entered
- Client-side countdown, server records submission time

## Related Files

- `convex/games.ts` — Game state mutations
- `convex/answers.ts` — Answer submission and scoring
- `convex/players.ts` — Player management and scores

## Reference Files

- [reference.md](reference.md) — Code patterns for state management
