---
name: ui-components
description: shadcn/ui patterns, game UI components, responsive layouts for classroom use
---

# UI Components

UI patterns for LessonPlay — classroom-optimized, mobile-friendly interfaces using shadcn/ui + Tailwind. Game UI is AI-generated inside a sandboxed iframe; parent app handles wrapper UI (timer, score, leaderboard, feedback).

## Overview

- **Framework**: shadcn/ui components with Tailwind utility classes
- **Design**: Bold colors, large text for projection, big touch targets for mobile
- **Game rendering**: AI-generated HTML runs in sandboxed iframe; parent app wraps with timer, score, leaderboard
- **Responsive**: Desktop (projection), tablet, mobile (student devices)

## When to Use This Skill

- Building page layouts (homepage, host view, student view)
- Creating parent wrapper UI (timer display, score, leaderboard, feedback overlay)
- Building the GameIframe component and its container
- Implementing feedback overlays and animations (shown by parent, not iframe)
- Making components responsive for classroom use
- Adding loading, error, and empty states

## Key Concepts

### Design Principles

1. **Projection-first for host**: Large text, high contrast, readable from back of room
2. **Touch-first for students**: Big tap targets (min 48px), no hover-dependent interactions
3. **Iframe-first for game**: The actual game UI is AI-generated, rendered in a sandboxed iframe
4. **Parent wrapper**: Timer, score, leaderboard, and feedback are rendered by the parent app outside the iframe
5. **Minimal chrome**: Focus on content, not navigation — games are single-flow

### Component Library

Using shadcn/ui for base components. Key components:
- `Button` — primary actions, host controls
- `Card` — player cards, results containers
- `Input` — game code, name, objective text
- `Badge` — player names, score tags
- `GameIframe` — sandboxed iframe wrapper for AI-generated game (see game-engine skill)

### Color System

```
Primary: #6C5CE7 (purple)
Success: #00B894 (green — correct)
Warning: #FDCB6E (yellow — timer)
Error: #E17055 (red — wrong)

Option A: #E74C3C (red)
Option B: #3498DB (blue)
Option C: #F39C12 (orange)
Option D: #27AE60 (green)
```

### Responsive Breakpoints

- Mobile (<768px): Stacked layout, full-width buttons
- Tablet (768-1024px): Similar to desktop, slightly condensed
- Desktop (>1024px): Full layout, 2x2 answer grid

## Related Files

- `docs/design.md` — Full wireframes and design specs
- Page components in `app/` directory

## Reference Files

- [reference.md](reference.md) — Component code examples
