"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, Play, BarChart3, Trophy, Lightbulb, AlertTriangle, ArrowRight, Flag, Check, TrendingUp, Gamepad2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameCode } from "@/components/ui/game-code";
import { isEngineGame } from "@/lib/engine";

export default function HostPage() {
  const { code } = useParams<{ code: string }>();
  const game = useQuery(api.games.getByCode, { code: code ?? "" });
  const players = useQuery(api.players.listByGame, game ? { gameId: game._id } : "skip");
  const leaderboard = useQuery(api.players.leaderboard, game ? { gameId: game._id } : "skip");

  const gamePhase = game?.engineMode ? (game.phase || "lobby") : game?.state;

  const questionStats = useQuery(
    api.answers.questionStats,
    game && gamePhase !== "lobby" ? { gameId: game._id, questionIndex: game.currentQuestion } : "skip"
  );
  const gameAnalytics = useQuery(
    api.answers.gameAnalytics,
    game && gamePhase === "complete" ? { gameId: game._id } : "skip"
  );

  // Legacy mutations
  const startGame = useMutation(api.games.startGame);
  const showResults = useMutation(api.games.showResults);
  const nextQuestion = useMutation(api.games.nextQuestion);

  // Engine mutations
  const startEngineGame = useMutation(api.gameActions.startEngineGame);
  const triggerEngineQuestion = useMutation(api.gameActions.triggerEngineQuestion);
  const showEngineResults = useMutation(api.gameActions.showEngineResults);
  const nextEngineQuestion = useMutation(api.gameActions.nextEngineQuestion);

  const isEngine = isEngineGame(game);
  const gameSpec = game?.gameSpec;

  if (game === undefined) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-bounce-subtle">
          <div className="w-12 h-12 border-4 border-paper-300 border-t-highlight-yellow rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (game === null) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="pink" className="p-8 text-center animate-scale-in">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Game Not Found</h1>
          <p className="text-paper-500">Code: {code}</p>
        </Card>
      </main>
    );
  }

  const currentQuestion = game.questions[game.currentQuestion];
  const isLastQuestion = game.currentQuestion >= game.questions.length - 1;

  return (
    <main className="min-h-screen bg-background">
      <div className="container-paper-lg py-8">
        {/* Header with Game Code */}
        <div className="text-center mb-10 animate-slide-up">
          <p className="text-sm font-medium text-paper-500 mb-3 uppercase tracking-wider">Game Code</p>
          <GameCode code={game.code} size="lg" />
          <p className="text-paper-500 mt-4">
            Students join at <span className="font-semibold text-highlight-purple">/play</span>
          </p>
        </div>

        {/* LOBBY STATE */}
        {gamePhase === "lobby" && (
          <>
            <Card variant="elevated" className="p-8 mb-8 animate-slide-up stagger-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-paper-900">
                  <Users className="w-5 h-5" /> Players ({players?.length || 0})
                </h2>
                <Badge variant={players?.length === 0 ? "yellow" : "green"}>
                  {players?.length === 0 ? "Waiting..." : "Ready!"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                {players?.map((p, i) => (
                  <span
                    key={p._id}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-paper-100 border border-paper-200 text-paper-700 animate-deal"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {p.name}
                  </span>
                ))}
                {players?.length === 0 && (
                  <p className="text-paper-400 text-center w-full py-8">
                    Waiting for the first player to join...
                  </p>
                )}
              </div>
            </Card>

            {/* Engine Game Info */}
            {isEngine && gameSpec && (
              <Card variant="default" className="p-6 mb-8 animate-slide-up stagger-2 border-l-4 border-l-highlight-purple">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-highlight-purple/20 flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6 text-highlight-purple" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-paper-900">{gameSpec.title}</h3>
                    <p className="text-sm text-paper-500">{gameSpec.narrative}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-paper-50 rounded-xl border border-paper-200 text-center">
                    <p className="text-xs text-paper-400 mb-1">Genre</p>
                    <p className="font-medium text-paper-900 capitalize">{gameSpec.genre}</p>
                  </div>
                  <div className="p-3 bg-paper-50 rounded-xl border border-paper-200 text-center">
                    <p className="text-xs text-paper-400 mb-1">Theme</p>
                    <p className="font-medium text-paper-900 capitalize">{gameSpec.theme?.style}</p>
                  </div>
                  <div className="p-3 bg-paper-50 rounded-xl border border-paper-200 text-center">
                    <p className="text-xs text-paper-400 mb-1">Questions</p>
                    <p className="font-medium text-paper-900">{game.questions.length}</p>
                  </div>
                  <div className="p-3 bg-paper-50 rounded-xl border border-paper-200 text-center">
                    <p className="text-xs text-paper-400 mb-1">Duration</p>
                    <p className="font-medium text-paper-900">{Math.ceil((gameSpec.victory?.duration || 600) / 60)} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm text-highlight-purple font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Generated Composable Game</span>
                </div>
              </Card>
            )}

            <Button
              onClick={() => isEngine
                ? startEngineGame({ gameId: game._id })
                : startGame({ gameId: game._id })
              }
              disabled={!players || players.length === 0}
              variant="green"
              size="lg"
              className="w-full animate-slide-up stagger-3"
            >
              <Play className="w-5 h-5" /> Start Game
            </Button>
          </>
        )}

        {/* COUNTDOWN STATE (Engine only) */}
        {gamePhase === "countdown" && (
          <div className="text-center animate-slide-up">
            <h2 className="text-5xl font-bold mb-4 text-paper-900 font-display">Get Ready!</h2>
            <p className="text-xl text-paper-500 mb-8">Game starting soon...</p>
            <div className="flex justify-center">
              <div className="flex space-x-3">
                <div className="w-4 h-4 bg-highlight-yellow rounded-full animate-bounce-subtle" />
                <div className="w-4 h-4 bg-highlight-yellow rounded-full animate-bounce-subtle" style={{ animationDelay: '0.1s' }} />
                <div className="w-4 h-4 bg-highlight-yellow rounded-full animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
            <Button
              onClick={() => triggerEngineQuestion({ gameId: game._id, questionIndex: 0 })}
              variant="yellow"
              size="lg"
              className="mt-8"
            >
              <Play className="w-5 h-5" /> Start First Question
            </Button>
          </div>
        )}

        {/* QUESTION STATE */}
        {gamePhase === "question" && (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card variant="yellow" className="p-6 text-center animate-slide-up stagger-1">
                <p className="text-sm text-paper-500 mb-2">Question</p>
                <p className="text-4xl font-bold text-paper-900 font-display">
                  {game.currentQuestion + 1} / {game.questions.length}
                </p>
              </Card>
              <Card variant="default" className="p-6 text-center animate-slide-up stagger-2">
                <p className="text-sm text-paper-500 mb-2">Responses</p>
                <p className="text-4xl font-bold text-paper-900 font-display">
                  {questionStats?.total || 0} / {players?.length || 0}
                </p>
              </Card>
              <Card variant="green" className="p-6 text-center animate-slide-up stagger-3">
                <p className="text-sm text-paper-500 mb-2">Correct</p>
                <p className="text-4xl font-bold text-green-700 font-display">
                  {questionStats?.percentCorrect || 0}%
                </p>
              </Card>
            </div>

            <Card variant="elevated" className="p-8 mb-8 animate-slide-up stagger-4">
              <p className="text-sm text-paper-500 mb-3">Current Question</p>
              <p className="text-xl font-semibold text-paper-900 mb-6">{currentQuestion?.question}</p>
              <div className="space-y-3">
                {currentQuestion?.options.map((opt: string, i: number) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl text-sm border-2 transition-all ${
                      opt === currentQuestion.correct
                        ? "bg-highlight-green/20 border-highlight-green"
                        : "bg-paper-50 border-paper-200"
                    }`}
                  >
                    <span className="mr-3 font-bold text-paper-400">{String.fromCharCode(65 + i)}.</span>
                    <span className="text-paper-700">{opt}</span>
                    {opt === currentQuestion.correct && (
                      <Check className="inline-block ml-3 w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Button
              onClick={() => isEngine
                ? showEngineResults({ gameId: game._id })
                : showResults({ gameId: game._id })
              }
              variant="yellow"
              size="lg"
              className="w-full animate-slide-up stagger-5"
            >
              <BarChart3 className="w-5 h-5" /> Show Results
            </Button>
          </>
        )}

        {/* RESULTS STATE */}
        {gamePhase === "results" && (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card variant="default" className="p-6 text-center animate-slide-up stagger-1">
                <p className="text-sm text-paper-500 mb-2">Question</p>
                <p className="text-3xl font-bold text-paper-900 font-display">
                  {game.currentQuestion + 1} / {game.questions.length}
                </p>
              </Card>
              <Card variant="default" className="p-6 text-center animate-slide-up stagger-2">
                <p className="text-sm text-paper-500 mb-2">Responses</p>
                <p className="text-3xl font-bold text-paper-900 font-display">{questionStats?.total || 0}</p>
              </Card>
              <Card variant="green" className="p-6 text-center animate-slide-up stagger-3">
                <p className="text-sm text-paper-500 mb-2">Correct</p>
                <p className="text-3xl font-bold text-green-700 font-display">{questionStats?.percentCorrect || 0}%</p>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Card variant="elevated" className="p-6 animate-slide-up stagger-4">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-paper-900">
                  <BarChart3 className="w-5 h-5" /> Answer Distribution
                </h3>
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
                            isCorrect ? "bg-highlight-green/40" : "bg-paper-100"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                        <div className="relative flex items-center justify-between p-3">
                          <span className={`text-sm ${isCorrect ? "font-semibold text-paper-900" : "text-paper-600"}`}>
                            {opt.length > 35 ? opt.substring(0, 35) + "..." : opt}
                            {isCorrect && <Check className="inline-block ml-2 w-4 h-4 text-green-600" />}
                          </span>
                          <span className="text-sm font-mono text-paper-500">
                            {count} ({percent}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card variant="elevated" className="p-6 animate-slide-up stagger-5">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-paper-900">
                  <Trophy className="w-5 h-5" /> Leaderboard
                </h3>
                <div className="space-y-2">
                  {leaderboard?.slice(0, 8).map((p, i) => (
                    <div key={p._id} className="flex items-center justify-between p-3 bg-paper-50 rounded-xl border border-paper-200">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white ${
                            i === 0
                              ? "rank-gold"
                              : i === 1
                                ? "rank-silver"
                                : i === 2
                                  ? "rank-bronze"
                                  : "bg-paper-300 text-paper-600"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-paper-700">{p.name}</span>
                      </div>
                      <span className="font-mono font-bold text-paper-900">{p.score}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card variant="default" className="p-6 mb-8 animate-slide-up stagger-6">
              <div className="flex items-center gap-2 mb-2 text-paper-500">
                <Lightbulb className="w-4 h-4" />
                <span className="text-sm font-medium">Explanation</span>
              </div>
              <p className="text-sm text-paper-700">{currentQuestion?.explanation}</p>
              {currentQuestion?.misconception && (
                <>
                  <div className="flex items-center gap-2 mt-4 mb-2 text-highlight-orange">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Common Misconception</span>
                  </div>
                  <p className="text-sm text-paper-600">{currentQuestion.misconception}</p>
                </>
              )}
            </Card>

            <Button
              onClick={() => isEngine
                ? nextEngineQuestion({ gameId: game._id })
                : nextQuestion({ gameId: game._id })
              }
              variant={isLastQuestion ? "yellow" : "green"}
              size="lg"
              className="w-full animate-slide-up stagger-6"
            >
              {isLastQuestion ? (
                <>
                  <Flag className="w-5 h-5" /> End Game
                </>
              ) : (
                <>
                  Next Question <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </>
        )}

        {/* COMPLETE STATE */}
        {gamePhase === "complete" && (
          <>
            <div className="text-center mb-10 animate-slide-up">
              <h2 className="text-4xl font-bold mb-2 text-paper-900 font-display">
                Game Complete!
              </h2>
              <p className="text-paper-500">Final Results & Analytics</p>
            </div>

            {gameAnalytics && (
              <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card variant="default" className="p-6 text-center animate-slide-up stagger-1">
                  <p className="text-sm text-paper-500 mb-2">Overall Score</p>
                  <p className={`text-3xl font-bold font-display ${
                    gameAnalytics.overallPercent >= 70
                      ? "text-green-600"
                      : gameAnalytics.overallPercent >= 50
                        ? "text-highlight-orange"
                        : "text-red-600"
                  }`}>
                    {gameAnalytics.overallPercent}%
                  </p>
                </Card>
                <Card variant="default" className="p-6 text-center animate-slide-up stagger-2">
                  <p className="text-sm text-paper-500 mb-2">Players</p>
                  <p className="text-3xl font-bold text-paper-900 font-display">{gameAnalytics.totalPlayers}</p>
                </Card>
                <Card variant="default" className="p-6 text-center animate-slide-up stagger-3">
                  <p className="text-sm text-paper-500 mb-2">Questions</p>
                  <p className="text-3xl font-bold text-paper-900 font-display">{gameAnalytics.questionCount}</p>
                </Card>
                <Card variant="green" className="p-6 text-center animate-slide-up stagger-4">
                  <p className="text-sm text-paper-500 mb-2">Correct</p>
                  <p className="text-3xl font-bold text-green-700 font-display">{gameAnalytics.totalCorrect}/{gameAnalytics.totalAnswers}</p>
                </Card>
              </div>
            )}

            {gameAnalytics && gameAnalytics.comprehensionGaps.length > 0 && (
              <Card variant="pink" className="p-6 mb-8 animate-slide-up stagger-5">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" /> Comprehension Gaps
                </h3>
                <div className="space-y-4">
                  {gameAnalytics.comprehensionGaps.map((gap) => (
                    <div key={gap.questionIndex} className="p-4 bg-paper-50 rounded-xl border border-paper-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-paper-400 mb-1">Question {gap.questionIndex + 1}</p>
                          <p className="font-medium text-paper-900">{gap.question}</p>
                          {gap.misconception && (
                            <p className="text-sm text-paper-600 mt-2">
                              <span className="font-medium">Misconception:</span> {gap.misconception}
                            </p>
                          )}
                        </div>
                        <span className="text-red-600 font-bold text-xl">{gap.percentCorrect}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {gameAnalytics && (
              <Card variant="elevated" className="p-6 mb-8 animate-slide-up stagger-6">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-paper-900">
                  <TrendingUp className="w-5 h-5" /> Per-Question Breakdown
                </h3>
                <div className="space-y-3">
                  {gameAnalytics.questionStats.map((q) => (
                    <div key={q.questionIndex} className="relative">
                      <div
                        className={`absolute inset-0 rounded-lg ${
                          q.percentCorrect >= 70
                            ? "bg-highlight-green/30"
                            : q.percentCorrect >= 50
                              ? "bg-highlight-yellow/30"
                              : "bg-highlight-pink/30"
                        }`}
                        style={{ width: `${q.percentCorrect}%` }}
                      />
                      <div className="relative flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-paper-400 w-8">Q{q.questionIndex + 1}</span>
                          <span className="text-sm truncate max-w-[300px] text-paper-700">
                            {q.question.length > 45 ? q.question.slice(0, 45) + "..." : q.question}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-paper-400">{q.correctCount}/{q.total}</span>
                          <span className={`font-bold w-12 text-right font-display ${
                            q.percentCorrect >= 70
                              ? "text-green-600"
                              : q.percentCorrect >= 50
                                ? "text-highlight-orange"
                                : "text-red-600"
                          }`}>
                            {q.percentCorrect}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card variant="yellow" className="p-8 animate-slide-up stagger-6">
              <h3 className="font-bold mb-6 text-center text-2xl flex items-center justify-center gap-2 text-paper-900">
                <Trophy className="w-6 h-6" /> Final Leaderboard
              </h3>
              <div className="space-y-3 max-w-md mx-auto">
                {leaderboard?.map((p, i) => (
                  <div
                    key={p._id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                      i === 0
                        ? "bg-highlight-yellow/20 border-highlight-yellow"
                        : i === 1
                          ? "bg-paper-200 border-paper-300"
                          : i === 2
                            ? "bg-orange-100 border-orange-300"
                            : "bg-paper-50 border-paper-200"
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
                                : "bg-paper-300 text-paper-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-lg font-medium text-paper-900">{p.name}</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-paper-900">{p.score}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
