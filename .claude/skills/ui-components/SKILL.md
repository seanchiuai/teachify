---
name: ui-components
description: shadcn/ui patterns, game UI components, responsive layouts for classroom use
---

# UI Components

UI patterns for LessonPlay — classroom-optimized, mobile-friendly game interfaces using shadcn/ui + Tailwind.

## Overview

- **Framework**: shadcn/ui components with Tailwind utility classes
- **Design**: Bold colors, large text for projection, big touch targets for mobile
- **Palette**: Kahoot-style vibrant answer options (red, blue, orange, green)
- **Responsive**: Desktop (projection), tablet, mobile (student devices)

## When to Use This Skill

- Building page layouts (homepage, host view, student view)
- Creating game UI components (question cards, answer buttons, leaderboard)
- Implementing feedback overlays and animations
- Making components responsive for classroom use
- Adding loading, error, and empty states

## Key Concepts

### Design Principles

1. **Projection-first for host**: Large text, high contrast, readable from back of room
2. **Touch-first for students**: Big tap targets (min 48px), no hover-dependent interactions
3. **Color-coded answers**: Each option has a distinct bold color (Kahoot-style)
4. **Minimal chrome**: Focus on content, not navigation — games are single-flow

### Component Library

Using shadcn/ui for base components. Key components:
- `Button` — primary actions, answer options
- `Card` — question containers, player cards
- `Input` — game code, name, objective text
- `Badge` — player names, score tags
- Custom components for game-specific UI

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
