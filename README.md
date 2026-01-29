# LessonPlay

Transform lesson materials into interactive learning games in seconds.

Teachers upload content, define what students should learn, and LessonPlay generates pedagogically-grounded classroom activities—not just trivia.

## The Problem

Existing tools like Kahoot and Quizizz are trivia engines. Teachers manually write questions, and games test recall over understanding. LessonPlay fixes this by:

- Generating questions automatically from uploaded materials
- Matching game mechanics to learning objective types
- Testing understanding, not just memorization
- Showing teachers where students actually struggled

## How It Works

1. **Teacher uploads content** — PDF, slides, doc, or paste text
2. **Defines learning objective** — "Students should understand that..." / "Students should be able to apply..."
3. **Selects objective type** — Understand, Explain, Apply, Distinguish, Perform, or Analyze
4. **AI generates game** — Questions matched to the objective type
5. **Students join with code** — No accounts, just a 6-character code
6. **Play in real-time** — Live leaderboard, instant feedback
7. **Teacher sees insights** — Per-question analytics on comprehension gaps

## Question Types

| Type | What It Tests | Example |
|------|---------------|---------|
| **Multiple Choice** | Understanding with misconception-based distractors | "Why can't photosynthesis happen at night?" (not "What is chlorophyll?") |
| **Ordering** | Procedural knowledge, cause-effect chains | "Arrange the steps of cellular respiration" |
| **Categorization** | Ability to distinguish and classify | "Sort into Renewable vs Non-Renewable energy" |

## Tech Stack

- **Frontend**: Next.js 14
- **Database**: Supabase (Postgres)
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **AI**: Claude API

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Anthropic API key

### Environment Variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Games table
create table games (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  topic text,
  objective text not null,
  objective_type text not null,
  content text,
  questions jsonb,
  state text default 'lobby',
  current_question int default 0,
  created_at timestamp with time zone default now()
);

-- Players table
create table players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  name text not null,
  score int default 0,
  joined_at timestamp with time zone default now()
);

-- Answers table
create table answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  question_index int not null,
  answer jsonb,
  correct boolean,
  time_ms int,
  created_at timestamp with time zone default now()
);

-- Enable realtime
alter publication supabase_realtime add table games;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table answers;

-- Index for game code lookups
create index games_code_idx on games(code);
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app
  /page.tsx                 # Teacher upload form
  /host/[code]/page.tsx     # Teacher game control
  /play/page.tsx            # Student join screen
  /play/[code]/page.tsx     # Student game view
  /api
    /generate/route.ts      # Claude content analysis
    /game/route.ts          # Create/get game
    /answer/route.ts        # Submit answer

/lib
  /supabase.ts              # Supabase client
  /prompts.ts               # Claude prompt templates
  /types.ts                 # TypeScript types

/components
  /QuestionCard.tsx         # Renders different question types
  /Leaderboard.tsx          # Live rankings
  /Timer.tsx                # Countdown timer
  /PlayerList.tsx           # Lobby player list
```

## API Routes

### POST /api/generate

Generate a game from content.

```json
{
  "content": "Lesson text or extracted content...",
  "objective": "Students should understand that...",
  "objectiveType": "understand"
}
```

Returns: `{ code: "ABC123", questions: [...] }`

### GET /api/game/[code]

Get game state.

### POST /api/answer

Submit an answer.

```json
{
  "gameId": "uuid",
  "playerId": "uuid",
  "questionIndex": 0,
  "answer": { "selected": "A" },
  "timeMs": 4500
}
```

## Learning Objective Types

The objective type determines which question formats are generated:

| Type | Best For | Game Formats |
|------|----------|--------------|
| **Understand** | Grasping concepts | Concept connections, misconception challenges |
| **Explain** | Articulating ideas | Build the explanation, sequencing |
| **Apply** | Using knowledge | Scenario-based questions |
| **Distinguish** | Comparing/contrasting | Categorization, sorting |
| **Perform** | Procedural steps | Ordering, process sequencing |
| **Analyze** | Evaluation | Evidence-based questions |

## Real-Time Architecture

```
Teacher Device                    Supabase                    Student Devices
     │                               │                              │
     ├── Start Game ────────────────►│                              │
     │                               ├── Broadcast state ──────────►│
     │                               │                              │
     │                               │◄────────── Submit answer ────┤
     │◄── Answer count update ───────┤                              │
     │                               │                              │
     ├── Next Question ─────────────►│                              │
     │                               ├── Broadcast new question ───►│
```

Each game session is a Supabase Realtime channel. Teacher publishes state changes, students subscribe and push answers.

## Demo Script

1. Open teacher view, paste sample content about photosynthesis
2. Set objective: "Students should understand how plants convert light energy to chemical energy"
3. Select "Understand" as objective type
4. Generate game (~10 seconds)
5. Show generated questions—note they test understanding, not just facts
6. Have 3-4 people join on phones
7. Play through 5 questions
8. Show teacher dashboard: "68% missed question 4—common misconception about oxygen production"

## Contributing

This is a hackathon project. Feel free to fork and build on it.

## License

MIT
