"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Users, Trophy, Check, RefreshCw, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameCode } from "@/components/ui/game-code";
import { GameCanvas, useGameEngine, isEngineGame } from "@/lib/engine";

export default function PlayerGamePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const game = useQuery(api.games.getByCode, { code: code ?? "" });
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const player = useQuery(api.players.get, playerId ? { playerId } : "skip");
  const players = useQuery(api.players.listByGame, game ? { gameId: game._id } : "skip");
  const leaderboard = useQuery(api.players.leaderboard, game ? { gameId: game._id } : "skip");
  const submitAnswer = useMutation(api.answers.submit);
  const existingAnswer = useQuery(
    api.answers.getByPlayerAndQuestion,
    playerId && game ? { playerId, questionIndex: game.currentQuestion } : "skip"
  );

  // Legacy iframe refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const portRef = useRef<MessagePort | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [answered, setAnswered] = useState(false);
  const startTimeRef = useRef<number>(0);
  const lastQuestionRef = useRef<number>(-1);
  const iframeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Engine mode state
  const isEngine = isEngineGame(game);
  const { spec, state: engineState, players: enginePlayers, currentPlayer, submitAction } = useGameEngine(
    game?._id ?? null,
    game ?? null,
    players ?? undefined,
    playerId ?? undefined
  );

  useEffect(() => {
    if (game) {
      const stored = localStorage.getItem(`player_${game._id}`);
      if (stored) {
        setPlayerId(stored as Id<"players">);
      } else {
        router.push("/play");
      }
    }
  }, [game, router]);

  useEffect(() => {
    if (game && game.currentQuestion !== lastQuestionRef.current) {
      lastQuestionRef.current = game.currentQuestion;
      setAnswered(false);
      startTimeRef.current = Date.now();
    }
  }, [game?.currentQuestion, game]);

  useEffect(() => {
    if (existingAnswer) {
      setAnswered(true);
    }
  }, [existingAnswer]);

  // Legacy iframe handler
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    iframeTimeoutRef.current = setTimeout(() => {
      if (!iframeReady) setIframeError(true);
    }, 10000);

    const channel = new MessageChannel();
    portRef.current = channel.port1;

    channel.port1.onmessage = async (event) => {
      const { type, payload } = event.data;
      if (type === "GAME_READY") {
        if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
        setIframeReady(true);
        setIframeError(false);
      } else if (type === "ANSWER_SUBMITTED" && game && playerId && !answered) {
        setAnswered(true);
        const timeMs = Date.now() - startTimeRef.current;
        try {
          await submitAnswer({
            gameId: game._id,
            playerId,
            questionIndex: game.currentQuestion,
            answer: payload.answer,
            timeMs,
          });
        } catch {
          // Already answered or invalid state
        }
      }
    };

    iframe.contentWindow.postMessage({ type: "INIT_PORT" }, "*", [channel.port2]);
  }, [game, playerId, answered, submitAnswer, iframeReady]);

  useEffect(() => {
    if (!isEngine && iframeReady && game?.state === "question" && portRef.current) {
      portRef.current.postMessage({
        type: "START_GAME",
      });
      startTimeRef.current = Date.now();
    }
  }, [isEngine, iframeReady, game?.state]);

  useEffect(() => {
    if (!isEngine && iframeReady && game?.state === "question" && portRef.current) {
      portRef.current.postMessage({
        type: "NEXT_QUESTION",
        payload: { questionIndex: game.currentQuestion },
      });
    }
  }, [isEngine, iframeReady, game?.state, game?.currentQuestion]);

  // Engine mode: handle answer submission
  const handleEngineAnswer = useCallback(async (answer: string | string[]) => {
    if (!game || !playerId || answered) return;

    setAnswered(true);
    const timeMs = Date.now() - startTimeRef.current;
    try {
      await submitAnswer({
        gameId: game._id,
        playerId,
        questionIndex: game.currentQuestion,
        answer,
        timeMs,
      });
    } catch {
      // Already answered or invalid state
    }
  }, [game, playerId, answered, submitAnswer]);

  if (game === undefined || player === undefined) {
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
          <h1 className="text-2xl font-bold text-red-700 mb-4">Game Not Found</h1>
          <Button onClick={() => router.push("/play")} variant="yellow">
            Back to Join
          </Button>
        </Card>
      </main>
    );
  }

  const gamePhase = isEngine ? (game.phase || "lobby") : game.state;

  // LOBBY STATE
  if (gamePhase === "lobby") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md mx-auto p-6">
          {/* Game Code */}
          <div className="text-center mb-8">
            <p className="text-sm text-paper-500 mb-2 uppercase tracking-wider font-medium">Game Code</p>
            <GameCode code={game.code} size="md" />
          </div>

          <Card variant="elevated" className="p-8 mb-6 animate-slide-up text-center">
            <p className="text-xl mb-2 text-paper-700">
              Welcome, <span className="font-bold text-paper-900">{player?.name}</span>!
            </p>

            {isEngine && spec && (
              <div className="mb-4 p-4 rounded-xl bg-highlight-purple/10 border-2 border-highlight-purple/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gamepad2 className="w-5 h-5 text-highlight-purple" />
                  <span className="font-semibold text-paper-900">{spec.title}</span>
                </div>
                <p className="text-xs text-paper-500">{spec.narrative}</p>
              </div>
            )}

            <p className="text-paper-500 mb-6">Waiting for host to start...</p>
            
            {/* Bouncing dots */}
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-highlight-yellow rounded-full animate-bounce-subtle" />
              <div className="w-3 h-3 bg-highlight-yellow rounded-full animate-bounce-subtle" style={{ animationDelay: '0.1s' }} />
              <div className="w-3 h-3 bg-highlight-yellow rounded-full animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
            </div>
          </Card>

          <Card variant="default" className="p-6 animate-slide-up stagger-1">
            <div className="flex items-center justify-center gap-2 text-paper-500 mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{players?.length || 0} player{(players?.length || 0) !== 1 ? "s" : ""} joined</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {players?.map((p) => (
                <span
                  key={p._id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    p._id === playerId
                      ? "bg-highlight-yellow text-paper-900 border-2 border-paper-900"
                      : "bg-paper-100 text-paper-600 border border-paper-200"
                  }`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // COMPLETE STATE
  if (gamePhase === "complete") {
    const playerRank = leaderboard?.findIndex(p => p._id === playerId) ?? -1;
    
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md mx-auto p-6">
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="font-display text-4xl font-bold text-paper-900 mb-2">
              Game Over!
            </h1>
            {playerRank >= 0 && (
              <Badge variant={playerRank === 0 ? "yellow" : playerRank === 1 ? "blue" : playerRank === 2 ? "green" : "muted"}>
                You placed #{playerRank + 1}!
              </Badge>
            )}
          </div>

          <Card variant="yellow" className="p-8 mb-6 text-center animate-slide-up stagger-1">
            <p className="text-paper-500 mb-3">Your final score</p>
            <p className="text-6xl font-bold text-paper-900 font-display animate-score-pop">{player?.score || 0}</p>
          </Card>

          <Card variant="elevated" className="p-6 animate-slide-up stagger-2">
            <h2 className="font-bold mb-4 flex items-center justify-center gap-2 text-paper-900">
              <Trophy className="w-5 h-5" /> Leaderboard
            </h2>
            <div className="space-y-2">
              {leaderboard?.map((p, i) => (
                <div
                  key={p._id}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                    p._id === playerId 
                      ? "bg-highlight-yellow/20 border-highlight-yellow" 
                      : "bg-paper-50 border-paper-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white ${
                      i === 0
                        ? "rank-gold"
                        : i === 1
                          ? "rank-silver"
                          : i === 2
                            ? "rank-bronze"
                            : "bg-paper-300 text-paper-600"
                    }`}>
                      {i + 1}
                    </span>
                    <span className={p._id === playerId ? "font-semibold text-paper-900" : "text-paper-700"}>
                      {p.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-paper-900">{p.score}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // RESULTS STATE
  if (gamePhase === "results") {
    const currentQ = game.questions[game.currentQuestion];
    const isCorrect = existingAnswer?.correct;
    
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-6 text-center text-paper-900 animate-slide-up">
            Question {game.currentQuestion + 1} Results
          </h2>

          <Card variant={isCorrect ? "green" : "pink"} className="p-6 mb-6 text-center animate-slide-up stagger-1">
            <div className="flex items-center justify-center gap-2 mb-3">
              {isCorrect ? (
                <Check className="w-6 h-6 text-green-600" />
              ) : (
                <span className="text-2xl">✗</span>
              )}
              <span className={`text-lg font-semibold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                {isCorrect ? "Correct!" : "Incorrect"}
              </span>
            </div>
            <p className="text-sm text-paper-500 mb-2">Correct answer:</p>
            <p className="text-lg font-semibold text-paper-900">
              {typeof currentQ.correct === "string" ? currentQ.correct : JSON.stringify(currentQ.correct)}
            </p>
            {currentQ.explanation && (
              <p className="text-sm text-paper-500 mt-4">{currentQ.explanation}</p>
            )}
          </Card>

          <Card variant="default" className="p-6 mb-6 text-center animate-slide-up stagger-2">
            <p className="text-paper-500 mb-2">Your score</p>
            <p className="text-4xl font-bold text-paper-900 font-display">{player?.score || 0}</p>
          </Card>

          <Card variant="elevated" className="p-4 animate-slide-up stagger-3">
            <h3 className="font-semibold mb-3 flex items-center justify-center gap-2 text-paper-900">
              <Trophy className="w-4 h-4" /> Top Players
            </h3>
            <div className="space-y-2">
              {leaderboard?.slice(0, 5).map((p, i) => (
                <div
                  key={p._id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    p._id === playerId ? "bg-highlight-yellow/20" : "bg-paper-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-paper-400 w-6">{i + 1}.</span>
                    <span className={p._id === playerId ? "font-medium text-paper-900" : "text-paper-700"}>
                      {p.name}
                    </span>
                  </div>
                  <span className="font-mono text-paper-900">{p.score}</span>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-sm text-paper-400 text-center mt-6 animate-pulse">
            Waiting for next question...
          </p>
        </div>
      </main>
    );
  }

  // ACTIVE/QUESTION STATE (game playing)
  const currentQ = game.questions[game.currentQuestion];
  const isQuestionPhase = gamePhase === "question";

  // Engine mode: use GameCanvas
  if (isEngine && spec && engineState) {
    return (
      <main className="min-h-screen bg-background">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4 bg-paper-100 border-2 border-paper-200 rounded-xl px-6 py-3 max-w-4xl mx-auto shadow-paper-sm">
            <div className="flex items-center gap-4">
              <span className="text-sm text-paper-500">
                Question {game.currentQuestion + 1} of {game.questions.length}
              </span>
              {spec.title && (
                <Badge variant="purple">{spec.title}</Badge>
              )}
            </div>
            <span className="font-mono font-bold text-lg text-paper-900">
              Score: <span className="text-highlight-purple">{player?.score || 0}</span>
            </span>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="max-w-5xl mx-auto px-4">
          <GameCanvas
            spec={spec}
            state={engineState}
            players={enginePlayers}
            currentPlayerId={playerId ?? undefined}
            className="rounded-3xl overflow-hidden border-2 border-paper-300 shadow-paper"
          />
        </div>

        {/* Question Modal for engine games */}
        {isQuestionPhase && currentQ && !answered && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper-900/80 p-4">
            <Card variant="elevated" className="p-8 max-w-lg w-full animate-scale-in">
              <h3 className="text-xl font-bold mb-6 text-paper-900">{currentQ.question}</h3>
              <div className="space-y-3">
                {currentQ.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleEngineAnswer(option)}
                    className="w-full p-4 rounded-xl bg-paper-50 hover:bg-highlight-yellow/20 border-2 border-paper-200 hover:border-highlight-yellow transition-all text-left"
                  >
                    <span className="font-medium text-paper-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                    <span className="text-paper-900">{option}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Answer submitted notification */}
        {answered && isQuestionPhase && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
            <Card variant="green" className="p-4 animate-scale-in">
              <p className="text-green-700 font-medium flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> Answer submitted! Waiting for results...
              </p>
            </Card>
          </div>
        )}
      </main>
    );
  }

  // Legacy iframe mode - Question with options
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-paper-100 border-2 border-paper-200 rounded-xl px-6 py-3 shadow-paper-sm">
          <span className="text-sm text-paper-500">
            Question {game.currentQuestion + 1} of {game.questions.length}
          </span>
          <span className="font-mono font-bold text-lg text-paper-900">
            Score: <span className="text-highlight-yellow">{player?.score || 0}</span>
          </span>
        </div>

        {/* Question */}
        {isQuestionPhase && currentQ && !answered && (
          <Card variant="elevated" className="p-8 mb-6 animate-slide-up">
            <Badge variant="yellow" className="mb-4">Question {game.currentQuestion + 1}</Badge>
            <h3 className="text-xl font-bold mb-6 text-paper-900">{currentQ.question}</h3>
            <div className="space-y-3">
              {currentQ.options.map((option: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleEngineAnswer(option)}
                  className="w-full p-4 rounded-xl bg-paper-50 hover:bg-highlight-yellow/20 border-2 border-paper-200 hover:border-highlight-yellow transition-all text-left"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-paper-200 text-paper-700 font-bold mr-3 text-sm">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-paper-900">{option}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Answer Submitted Notification */}
        {answered && (
          <Card variant="green" className="mb-6 p-6 text-center animate-scale-in">
            <p className="text-green-700 font-medium flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Answer submitted! Waiting for results...
            </p>
          </Card>
        )}

        {/* Iframe Error */}
        {iframeError && (
          <Card variant="pink" className="mb-6 p-6 text-center animate-scale-in">
            <p className="text-red-700 font-medium mb-4">Game failed to load</p>
            <Button
              onClick={() => {
                setIframeError(false);
                setIframeReady(false);
                const iframe = iframeRef.current;
                if (iframe) iframe.src = iframe.src;
              }}
              variant="yellow"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Reload Game
            </Button>
          </Card>
        )}

        {/* Game Iframe */}
        <div className="relative w-full aspect-[16/10] max-w-[900px] mx-auto rounded-3xl overflow-hidden border-2 border-paper-300 shadow-paper">
          <iframe
            ref={iframeRef}
            key={game._id}
            sandbox="allow-scripts"
            srcDoc={game.gameHtml || ""}
            onLoad={handleIframeLoad}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            title="Game"
          />
        </div>
      </div>
    </main>
  );
}
