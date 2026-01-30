"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function HostPage() {
  const { code } = useParams<{ code: string }>();
  const game = useQuery(api.games.getByCode, { code: code ?? "" });
  const players = useQuery(api.players.listByGame, game ? { gameId: game._id } : "skip");
  const leaderboard = useQuery(api.players.leaderboard, game ? { gameId: game._id } : "skip");
  const questionStats = useQuery(
    api.answers.questionStats,
    game && game.state !== "lobby" ? { gameId: game._id, questionIndex: game.currentQuestion } : "skip"
  );

  const startGame = useMutation(api.games.startGame);
  const showResults = useMutation(api.games.showResults);
  const nextQuestion = useMutation(api.games.nextQuestion);

  if (game === undefined) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  if (game === null) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Game Not Found</h1>
          <p className="text-muted-foreground mt-2">Code: {code}</p>
        </div>
      </main>
    );
  }

  const currentQuestion = game.questions[game.currentQuestion];
  const isLastQuestion = game.currentQuestion >= game.questions.length - 1;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2">Game Code</p>
          <h1 className="text-6xl font-mono font-bold tracking-widest">{game.code}</h1>
          <p className="text-muted-foreground mt-4">
            Students join at <span className="font-medium">/play</span>
          </p>
        </div>

        {game.state === "lobby" && (
          <>
            <div className="p-6 rounded-xl border border-border bg-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Players ({players?.length || 0})</h2>
                <span className="text-sm text-muted-foreground">
                  {players?.length === 0 ? "Waiting for players..." : "Ready to start!"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {players?.map((p) => (
                  <span key={p._id} className="px-4 py-2 bg-muted rounded-full text-sm font-medium">
                    {p.name}
                  </span>
                ))}
                {players?.length === 0 && (
                  <p className="text-muted-foreground">No players yet</p>
                )}
              </div>
            </div>

            <button
              onClick={() => startGame({ gameId: game._id })}
              disabled={!players || players.length === 0}
              className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Start Game
            </button>
          </>
        )}

        {game.state === "question" && (
          <>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-sm text-muted-foreground">Question</p>
                <p className="text-3xl font-bold">
                  {game.currentQuestion + 1} / {game.questions.length}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-sm text-muted-foreground">Responses</p>
                <p className="text-3xl font-bold">
                  {questionStats?.total || 0} / {players?.length || 0}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-3xl font-bold">{questionStats?.percentCorrect || 0}%</p>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card mb-6">
              <p className="text-sm text-muted-foreground mb-2">Current Question</p>
              <p className="text-lg font-medium">{currentQuestion?.question}</p>
              <div className="mt-4 grid gap-2">
                {currentQuestion?.options.map((opt: string, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-sm ${
                      opt === currentQuestion.correct
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-muted"
                    }`}
                  >
                    {opt}
                    {opt === currentQuestion.correct && (
                      <span className="ml-2 text-green-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => showResults({ gameId: game._id })}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 transition-all"
            >
              Show Results
            </button>
          </>
        )}

        {game.state === "results" && (
          <>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-sm text-muted-foreground">Question</p>
                <p className="text-3xl font-bold">
                  {game.currentQuestion + 1} / {game.questions.length}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-sm text-muted-foreground">Responses</p>
                <p className="text-3xl font-bold">{questionStats?.total || 0}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-3xl font-bold text-green-600">{questionStats?.percentCorrect || 0}%</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-4">Answer Distribution</h3>
                <div className="space-y-2">
                  {currentQuestion?.options.map((opt: string) => {
                    const count = questionStats?.distribution[opt] || 0;
                    const percent = questionStats?.total
                      ? Math.round((count / questionStats.total) * 100)
                      : 0;
                    const isCorrect = opt === currentQuestion.correct;
                    return (
                      <div key={opt} className="relative">
                        <div
                          className={`absolute inset-0 rounded ${
                            isCorrect ? "bg-green-500/20" : "bg-muted"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                        <div className="relative flex items-center justify-between p-2">
                          <span className={`text-sm ${isCorrect ? "font-semibold" : ""}`}>
                            {opt.length > 40 ? opt.substring(0, 40) + "..." : opt}
                            {isCorrect && <span className="ml-1 text-green-600">✓</span>}
                          </span>
                          <span className="text-sm font-mono">
                            {count} ({percent}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-4">Leaderboard</h3>
                <div className="space-y-2">
                  {leaderboard?.slice(0, 8).map((p, i) => (
                    <div key={p._id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                            i === 0
                              ? "bg-yellow-500 text-white"
                              : i === 1
                                ? "bg-gray-400 text-white"
                                : i === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-background"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span>{p.name}</span>
                      </div>
                      <span className="font-mono font-semibold">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card mb-6">
              <p className="text-sm text-muted-foreground mb-1">Explanation</p>
              <p className="text-sm">{currentQuestion?.explanation}</p>
              {currentQuestion?.misconception && (
                <>
                  <p className="text-sm text-muted-foreground mt-3 mb-1">Common Misconception</p>
                  <p className="text-sm text-orange-600">{currentQuestion.misconception}</p>
                </>
              )}
            </div>

            <button
              onClick={() => nextQuestion({ gameId: game._id })}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 transition-all"
            >
              {isLastQuestion ? "End Game" : "Next Question"}
            </button>
          </>
        )}

        {game.state === "complete" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Game Complete!</h2>
              <p className="text-muted-foreground">Final Results</p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-6 text-center text-xl">Final Leaderboard</h3>
              <div className="space-y-3 max-w-md mx-auto">
                {leaderboard?.map((p, i) => (
                  <div
                    key={p._id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      i === 0
                        ? "bg-yellow-500/10 border-2 border-yellow-500"
                        : i === 1
                          ? "bg-gray-400/10 border-2 border-gray-400"
                          : i === 2
                            ? "bg-amber-700/10 border-2 border-amber-700"
                            : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold ${
                          i === 0
                            ? "bg-yellow-500 text-white"
                            : i === 1
                              ? "bg-gray-400 text-white"
                              : i === 2
                                ? "bg-amber-700 text-white"
                                : "bg-background"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-lg font-medium">{p.name}</span>
                    </div>
                    <span className="text-2xl font-mono font-bold">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
