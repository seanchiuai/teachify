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
  const gameAnalytics = useQuery(
    api.answers.gameAnalytics,
    game && game.state === "complete" ? { gameId: game._id } : "skip"
  );

  const startGame = useMutation(api.games.startGame);
  const showResults = useMutation(api.games.showResults);
  const nextQuestion = useMutation(api.games.nextQuestion);

  if (game === undefined) {
    return (
      <main className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  if (game === null) {
    return (
      <main className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center glass p-8 rounded-2xl animate-scale-in">
          <h1 className="text-2xl font-bold text-destructive mb-2">Game Not Found</h1>
          <p className="text-muted-foreground">Code: {code}</p>
        </div>
      </main>
    );
  }

  const currentQuestion = game.questions[game.currentQuestion];
  const isLastQuestion = game.currentQuestion >= game.questions.length - 1;

  return (
    <main className="min-h-screen bg-gradient-main relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative max-w-5xl mx-auto py-8 px-4">
        {/* Header with Game Code */}
        <div className="text-center mb-10 animate-slide-up">
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Game Code</p>
          <h1 className="game-code">{game.code}</h1>
          <p className="text-muted-foreground mt-4">
            Students join at <span className="text-primary font-semibold">/play</span>
          </p>
        </div>

        {/* LOBBY STATE */}
        {game.state === "lobby" && (
          <>
            <div className="glass-strong p-8 rounded-3xl mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>👥</span> Players ({players?.length || 0})
                </h2>
                <span className={`text-sm px-4 py-2 rounded-full ${
                  players?.length === 0 
                    ? "bg-accent/20 text-accent" 
                    : "bg-green-500/20 text-green-400"
                }`}>
                  {players?.length === 0 ? "Waiting for players..." : "Ready to start!"}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {players?.map((p, i) => (
                  <span 
                    key={p._id} 
                    className="player-badge animate-scale-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {p.name}
                  </span>
                ))}
                {players?.length === 0 && (
                  <p className="text-muted-foreground text-center w-full py-8">
                    Waiting for the first player to join...
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => startGame({ gameId: game._id })}
              disabled={!players || players.length === 0}
              className="w-full btn-success text-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              🎮 Start Game
            </button>
          </>
        )}

        {/* QUESTION STATE */}
        {game.state === "question" && (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="stat-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <p className="text-sm text-muted-foreground mb-2">Question</p>
                <p className="text-4xl font-bold text-gradient">
                  {game.currentQuestion + 1} / {game.questions.length}
                </p>
              </div>
              <div className="stat-card border-l-secondary animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <p className="text-sm text-muted-foreground mb-2">Responses</p>
                <p className="text-4xl font-bold">
                  {questionStats?.total || 0} / {players?.length || 0}
                </p>
              </div>
              <div className="stat-card border-l-accent animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <p className="text-sm text-muted-foreground mb-2">Correct</p>
                <p className="text-4xl font-bold text-gradient-accent">{questionStats?.percentCorrect || 0}%</p>
              </div>
            </div>

            <div className="glass-strong p-8 rounded-3xl mb-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <p className="text-sm text-muted-foreground mb-3">Current Question</p>
              <p className="text-xl font-semibold mb-6">{currentQuestion?.question}</p>
              <div className="grid gap-3">
                {currentQuestion?.options.map((opt: string, i: number) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl text-sm transition-all ${
                      opt === currentQuestion.correct
                        ? "bg-green-500/20 border border-green-500/40"
                        : "bg-muted/30"
                    }`}
                  >
                    <span className="mr-3 font-bold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {opt === currentQuestion.correct && (
                      <span className="ml-3 text-green-400">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => showResults({ gameId: game._id })}
              className="w-full btn-primary text-lg animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              📊 Show Results
            </button>
          </>
        )}

        {/* RESULTS STATE */}
        {game.state === "results" && (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="stat-card animate-slide-up">
                <p className="text-sm text-muted-foreground mb-2">Question</p>
                <p className="text-3xl font-bold">
                  {game.currentQuestion + 1} / {game.questions.length}
                </p>
              </div>
              <div className="stat-card border-l-secondary animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <p className="text-sm text-muted-foreground mb-2">Responses</p>
                <p className="text-3xl font-bold">{questionStats?.total || 0}</p>
              </div>
              <div className="stat-card border-l-green-500 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <p className="text-sm text-muted-foreground mb-2">Correct</p>
                <p className="text-3xl font-bold text-green-400">{questionStats?.percentCorrect || 0}%</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <div className="glass-strong p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <h3 className="font-bold mb-4 flex items-center gap-2">📊 Answer Distribution</h3>
                <div className="space-y-3">
                  {currentQuestion?.options.map((opt: string) => {
                    const count = questionStats?.distribution[opt] || 0;
                    const percent = questionStats?.total
                      ? Math.round((count / questionStats.total) * 100)
                      : 0;
                    const isCorrect = opt === currentQuestion.correct;
                    return (
                      <div key={opt} className="relative">
                        <div
                          className={`absolute inset-0 rounded-lg ${
                            isCorrect ? "bg-green-500/30" : "bg-muted/40"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                        <div className="relative flex items-center justify-between p-3">
                          <span className={`text-sm ${isCorrect ? "font-semibold" : ""}`}>
                            {opt.length > 35 ? opt.substring(0, 35) + "..." : opt}
                            {isCorrect && <span className="ml-2 text-green-400">✓</span>}
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

              <div className="glass-strong p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="font-bold mb-4 flex items-center gap-2">🏆 Leaderboard</h3>
                <div className="space-y-2">
                  {leaderboard?.slice(0, 8).map((p, i) => (
                    <div key={p._id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white ${
                            i === 0
                              ? "rank-gold"
                              : i === 1
                                ? "rank-silver"
                                : i === 2
                                  ? "rank-bronze"
                                  : "bg-muted"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span>{p.name}</span>
                      </div>
                      <span className="font-mono font-bold">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl mb-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <p className="text-sm text-muted-foreground mb-2">💡 Explanation</p>
              <p className="text-sm">{currentQuestion?.explanation}</p>
              {currentQuestion?.misconception && (
                <>
                  <p className="text-sm text-muted-foreground mt-4 mb-2">⚠️ Common Misconception</p>
                  <p className="text-sm text-accent">{currentQuestion.misconception}</p>
                </>
              )}
            </div>

            <button
              onClick={() => nextQuestion({ gameId: game._id })}
              className="w-full btn-primary text-lg animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              {isLastQuestion ? "🏁 End Game" : "➡️ Next Question"}
            </button>
          </>
        )}

        {/* COMPLETE STATE */}
        {game.state === "complete" && (
          <>
            <div className="text-center mb-10 animate-slide-up">
              <h2 className="text-4xl font-black mb-2">🎉 Game Complete!</h2>
              <p className="text-muted-foreground">Final Results & Analytics</p>
            </div>

            {gameAnalytics && (
              <div className="grid gap-4 md:grid-cols-4 mb-8">
                <div className="stat-card animate-slide-up">
                  <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                  <p className={`text-3xl font-bold ${
                    gameAnalytics.overallPercent >= 70 
                      ? "text-green-400" 
                      : gameAnalytics.overallPercent >= 50 
                        ? "text-accent" 
                        : "text-destructive"
                  }`}>
                    {gameAnalytics.overallPercent}%
                  </p>
                </div>
                <div className="stat-card border-l-secondary animate-slide-up" style={{ animationDelay: '0.05s' }}>
                  <p className="text-sm text-muted-foreground mb-2">Players</p>
                  <p className="text-3xl font-bold">{gameAnalytics.totalPlayers}</p>
                </div>
                <div className="stat-card border-l-accent animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <p className="text-sm text-muted-foreground mb-2">Questions</p>
                  <p className="text-3xl font-bold">{gameAnalytics.questionCount}</p>
                </div>
                <div className="stat-card border-l-green-500 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                  <p className="text-sm text-muted-foreground mb-2">Correct</p>
                  <p className="text-3xl font-bold">{gameAnalytics.totalCorrect}/{gameAnalytics.totalAnswers}</p>
                </div>
              </div>
            )}

            {gameAnalytics && gameAnalytics.comprehensionGaps.length > 0 && (
              <div className="glass-strong p-6 rounded-2xl border-l-4 border-l-accent mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="text-accent">⚠️</span> Comprehension Gaps
                </h3>
                <div className="space-y-4">
                  {gameAnalytics.comprehensionGaps.map((gap) => (
                    <div key={gap.questionIndex} className="p-4 bg-background/50 rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Question {gap.questionIndex + 1}</p>
                          <p className="font-medium">{gap.question}</p>
                          {gap.misconception && (
                            <p className="text-sm text-accent mt-2">
                              <span className="font-medium">Misconception:</span> {gap.misconception}
                            </p>
                          )}
                        </div>
                        <span className="text-destructive font-bold text-xl">{gap.percentCorrect}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gameAnalytics && (
              <div className="glass-strong p-6 rounded-2xl mb-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
                <h3 className="font-bold mb-4">📈 Per-Question Breakdown</h3>
                <div className="space-y-3">
                  {gameAnalytics.questionStats.map((q) => (
                    <div key={q.questionIndex} className="relative">
                      <div
                        className={`absolute inset-0 rounded-lg ${
                          q.percentCorrect >= 70 
                            ? "bg-green-500/20" 
                            : q.percentCorrect >= 50 
                              ? "bg-yellow-500/20" 
                              : "bg-red-500/20"
                        }`}
                        style={{ width: `${q.percentCorrect}%` }}
                      />
                      <div className="relative flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground w-8">Q{q.questionIndex + 1}</span>
                          <span className="text-sm truncate max-w-[300px]">
                            {q.question.length > 45 ? q.question.slice(0, 45) + "..." : q.question}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{q.correctCount}/{q.total}</span>
                          <span className={`font-bold w-12 text-right ${
                            q.percentCorrect >= 70 
                              ? "text-green-400" 
                              : q.percentCorrect >= 50 
                                ? "text-accent" 
                                : "text-destructive"
                          }`}>
                            {q.percentCorrect}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-strong p-8 rounded-3xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="font-bold mb-6 text-center text-2xl">🏆 Final Leaderboard</h3>
              <div className="space-y-3 max-w-md mx-auto">
                {leaderboard?.map((p, i) => (
                  <div
                    key={p._id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      i === 0
                        ? "bg-yellow-500/20 border-2 border-yellow-500/50"
                        : i === 1
                          ? "bg-gray-400/20 border-2 border-gray-400/50"
                          : i === 2
                            ? "bg-amber-700/20 border-2 border-amber-700/50"
                            : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold text-white ${
                          i === 0
                            ? "rank-gold"
                            : i === 1
                              ? "rank-silver"
                              : i === 2
                                ? "rank-bronze"
                                : "bg-muted"
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
