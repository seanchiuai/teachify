# Agentic Development Planning Template

Turn any app idea into a structured plan ready for AI-assisted development.

## What is this?

This template helps you plan an app before building it. Instead of jumping into code, you first create:

- **PRD** - Product requirements with user stories
- **Design** - UI wireframes and component structure
- **Tasks** - Phased backlog organized for iterative development
- **Skills** - Domain-specific knowledge for the AI agent

The output is a fully planned project that Claude Code can build autonomously using the Ralph Loop workflow.

## Quick Start

1. **Copy this folder** to start a new project
2. **Open in Claude Code** - the agent reads `CLAUDE.md` automatically
3. **Describe your app** - the agent will ask clarifying questions
4. **Review the plan** - agent fills in all templates with your app's details

## Template Files

| File | What it does |
|------|--------------|
| `CLAUDE.md` | Instructions for the planning agent |
| `template-CLAUDE.md` | Template for your app's system prompt |
| `TASKS.md` | Task tracker (Active / Backlog / Complete) |
| `docs/PRD.md` | Product requirements + user stories |
| `docs/design.md` | UI layouts and component hierarchy |
| `docs/development-progress.yaml` | Phase tracking |
| `prompts/phase-1.md` | Ralph Loop prompt template |
| `.claude/skills/create-skill/` | Guide for creating domain skills |

## How It Works

### 1. Planning Phase

The agent gathers requirements by asking about:
- Problem being solved
- Target users and their roles
- Core features (must/should/could)
- Auth, data, and integration needs
- Tech stack preferences

### 2. Template Generation

The agent fills in `{{PLACEHOLDERS}}` across all files:

```
{{APP_NAME}}        → "TaskFlow"
{{TECH_STACK_LIST}} → "- Next.js 14\n- Prisma\n- Clerk"
{{USER_STORIES}}    → "US-001, US-002, US-003"
```

### 3. Development Phase

Once planned, rename `template-CLAUDE.md` to `CLAUDE.md` and start building. Each phase runs as a Ralph Loop:

```
Read PRD → Build feature → Test → Commit → Repeat
```

## Creating Skills

Skills provide domain-specific knowledge that loads on-demand. See `.claude/skills/create-skill/SKILL.md` for the template.

Example skills you might create:
- `auth/` - Authentication patterns
- `database/` - Schema and query patterns
- `api/` - Endpoint conventions
- `ui/` - Component library usage

## File Purposes

| File | Updated When |
|------|--------------|
| `CLAUDE.md` | Once at project start |
| `TASKS.md` | Every task start/complete |
| `docs/PRD.md` | Requirements change |
| `docs/design.md` | UI changes |
| `docs/development-progress.yaml` | Phase transitions |
| `prompts/phase-N.md` | Once per phase |

## Requirements

- [Claude Code](https://claude.ai/claude-code) CLI
- [Ralph Loop plugin](https://github.com/anthropics/claude-code) (for iterative development)
- I recommend installing `https://vercel.com/blog/introducing-react-best-practices`

## License

MIT
