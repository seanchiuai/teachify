# LessonPlay Landing Page

## Overview
A comprehensive marketing landing page for LessonPlay that showcases the product, features, and drives conversions.

## URL Structure

| Route | Description |
|-------|-------------|
| `/landing` | Marketing landing page (new) |
| `/` | Create game page (existing app) |
| `/play` | Join game page |
| `/host/[code]` | Host game view |
| `/play/[code]` | Player game view |

## Landing Page Sections

### 1. Navigation
- Sticky header with logo
- Link to create game
- CTA button

### 2. Hero Section
- Bold headline with gradient text
- Subheadline explaining value prop
- Two CTAs (primary + secondary)
- Social proof badges
- Visual demo card with floating elements

### 3. Stats Section
- 60s to create a game
- 50K+ games played
- 1M+ students engaged
- 98% teacher satisfaction

### 4. How It Works
- 4-step process visualization
- Numbered cards with staggered layout
- Clear progression from upload to gameplay

### 5. Features Grid
- 6 key features with icons
- Hover animations
- Color-coded by category

### 6. Game Types Showcase
- 3 example AI-generated games
- Demonstrates variety/unique mechanics
- Colorful cards

### 7. Learning Science
- "Games that actually teach" section
- Pedagogical approach explanation
- Sample question demonstration
- Checklist of learning objectives

### 8. Testimonials
- 3 teacher testimonials
- Quote cards with attribution
- School/role information

### 9. FAQ
- 5 common questions
- Expandable card format
- Addresses pricing, file types, limits

### 10. CTA Section
- Large yellow card
- Final conversion push
- Reiteration of free/no signup

### 11. Footer
- 4-column layout
- Product, Resources, Connect links
- Copyright and legal

## Design System

The landing page uses the same "Tactical Paper" design system:
- Paper tone backgrounds (#FDFCFA)
- Highlighter accent colors
- Hard offset shadows
- Stamp-style buttons
- Index card aesthetics

## Key Features

1. **Fully Responsive** - Works on mobile, tablet, desktop
2. **Performance Optimized** - Static generation, no hydration issues
3. **Accessible** - WCAG compliant contrast, semantic HTML
4. **SEO Ready** - Proper headings, meta-ready structure

## Navigation Flow

```
Landing Page (/landing)
    ↓
Create Game (/)
    ↓
Host Game (/host/[code])
    ← Students join via /play
```

## Content Highlights

### Headlines
- "Transform Lessons Into Epic Games"
- "From Lesson to Game in 4 Steps"
- "Games That Actually Teach"
- "Every Game is Unique"

### Value Props
- Free to use
- No signup required
- 60 second setup
- AI-generated unique mechanics
- Tests understanding, not recall
- Real-time multiplayer

## Technical Notes

- Built with Next.js App Router
- Uses same component library as app
- Static generation for fast loads
- Consistent navigation across all pages
