# UI Components Reference

Code patterns for LessonPlay parent app UI. Question/answer UI is AI-generated inside the iframe — these components are the wrapper around it.

**Note:** Individual question type components (MultipleChoiceOptions, OrderingQuestion, CategorizationQuestion) are NOT needed. The AI generates the entire game UI inside the sandboxed iframe. The components below are for the parent app wrapper only.

## Game Code Display (Host View)

```tsx
function GameCodeDisplay({ code }: { code: string }) {
  return (
    <div className="text-center">
      <p className="text-muted-foreground text-lg">Join at <strong>lessonplay.app/play</strong></p>
      <div className="mt-4 flex justify-center gap-2">
        {code.split("").map((char, i) => (
          <span
            key={i}
            className="inline-flex items-center justify-center w-14 h-16 bg-primary text-white text-3xl font-bold rounded-lg"
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
```

## Player List (Lobby)

```tsx
function PlayerList({ players }: { players: { _id: string; name: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {players.map((player) => (
        <span
          key={player._id}
          className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary font-medium rounded-full text-sm animate-in fade-in slide-in-from-bottom-2"
        >
          {player.name}
        </span>
      ))}
      {players.length === 0 && (
        <p className="text-muted-foreground">Waiting for students to join...</p>
      )}
    </div>
  );
}
```

## Timer Display

```tsx
function Timer({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const seconds = Math.ceil(remainingMs / 1000);
  const percent = (remainingMs / totalMs) * 100;
  const isWarning = remainingMs < 5000;

  return (
    <div className="flex items-center gap-2">
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-100 rounded-full ${
            isWarning ? "bg-yellow-500" : "bg-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`text-lg font-bold min-w-[3ch] text-right ${
        isWarning ? "text-yellow-500" : "text-foreground"
      }`}>
        {seconds}
      </span>
    </div>
  );
}
```

## Feedback Overlay

```tsx
function FeedbackOverlay({
  correct,
  explanation,
  points,
}: {
  correct: boolean;
  explanation: string;
  points: number;
}) {
  return (
    <div className={`rounded-xl p-6 mt-4 ${
      correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{correct ? "✅" : "❌"}</span>
        <span className={`font-bold text-lg ${correct ? "text-green-700" : "text-red-700"}`}>
          {correct ? `Correct! +${points} pts` : "Incorrect"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{explanation}</p>
    </div>
  );
}
```

## Leaderboard

```tsx
function Leaderboard({
  players,
  currentPlayerId,
}: {
  players: { _id: string; name: string; score: number }[];
  currentPlayerId?: string;
}) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-2">
      {players.slice(0, 10).map((player, i) => (
        <div
          key={player._id}
          className={`flex items-center justify-between p-3 rounded-lg ${
            player._id === currentPlayerId ? "bg-primary/10 font-bold" : "bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg w-8 text-center">
              {i < 3 ? medals[i] : `${i + 1}.`}
            </span>
            <span>{player._id === currentPlayerId ? "You" : player.name}</span>
          </div>
          <span className="font-mono">{player.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

## Objective Type Selector

```tsx
const OBJECTIVE_TYPES = [
  { value: "understand", label: "Understand", description: "Students should understand that..." },
  { value: "explain", label: "Explain", description: "Students should be able to explain..." },
  { value: "apply", label: "Apply", description: "Students should be able to apply..." },
  { value: "distinguish", label: "Distinguish", description: "Students should distinguish between..." },
  { value: "perform", label: "Perform", description: "Students should be able to perform..." },
  { value: "analyze", label: "Analyze", description: "Students should be able to analyze..." },
] as const;

function ObjectiveTypeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (type: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OBJECTIVE_TYPES.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === type.value
              ? "bg-primary text-white"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
```

## Loading States

```tsx
// Generate button with loading
function GenerateButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          Generating questions...
        </span>
      ) : (
        "✨ Generate Game"
      )}
    </button>
  );
}
```
