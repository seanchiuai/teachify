"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const portRef = useRef<MessagePort | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [answered, setAnswered] = useState(false);
  const startTimeRef = useRef<number>(0);
  const lastQuestionRef = useRef<number>(-1);
  const iframeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          // Use parent's currentQuestion index, not iframe's reported index
          // This fixes sync issues where the iframe's internal counter may differ
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
    if (iframeReady && game?.state === "question" && portRef.current) {
      portRef.current.postMessage({
        type: "START_GAME",
      });
      startTimeRef.current = Date.now();
    }
  }, [iframeReady, game?.state]);

  useEffect(() => {
    if (iframeReady && game?.state === "question" && portRef.current) {
      portRef.current.postMessage({
        type: "NEXT_QUESTION",
        payload: { questionIndex: game.currentQuestion },
      });
    }
  }, [iframeReady, game?.state, game?.currentQuestion]);

  if (game === undefined || player === undefined) {
    return (
      <main className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  if (game === null) {
    return (
      <main className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center glass-strong p-8 rounded-3xl animate-scale-in">
          <h1 className="text-2xl font-bold text-destructive mb-4">Game Not Found</h1>
          <button
            onClick={() => router.push("/play")}
            className="btn-primary"
          >
            Back to Join
          </button>
        </div>
      </main>
    );
  }

  // LOBBY STATE
  if (game.state === "lobby") {
    return (
      <main className="min-h-screen bg-gradient-main relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="relative text-center max-w-md mx-auto p-6">
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Game Code</p>
          <h1 className="game-code mb-8">{game.code}</h1>

          <div className="glass-strong p-8 rounded-3xl mb-6 animate-slide-up">
            <p className="text-xl mb-4">
              Welcome, <span className="font-bold text-gradient">{player?.name}</span>!
            </p>
            <p className="text-muted-foreground mb-4">Waiting for host to start...</p>
            <div className="flex justify-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-sm text-muted-foreground mb-4">
              👥 {players?.length || 0} player{(players?.length || 0) !== 1 ? "s" : ""} joined
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {players?.map((p) => (
                <span
                  key={p._id}
                  className={`px-4 py-2 rounded-full text-sm ${
                    p._id === playerId
                      ? "bg-gradient-purple text-white"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // COMPLETE STATE
  if (game.state === "complete") {
    return (
      <main className="min-h-screen bg-gradient-main relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-yellow-500/15 rounded-full blur-3xl animate-float" />
        
        <div className="relative text-center max-w-md mx-auto p-6">
          <h1 className="text-4xl font-black mb-6 animate-slide-up">
            🎉 <span className="text-gradient">Game Over!</span>
          </h1>
          
          <div className="glass-strong p-8 rounded-3xl mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-muted-foreground mb-3">Your final score</p>
            <p className="text-6xl font-black text-gradient">{player?.score || 0}</p>
          </div>

          <div className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-bold mb-4">🏆 Leaderboard</h2>
            <div className="space-y-2">
              {leaderboard?.map((p, i) => (
                <div
                  key={p._id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    p._id === playerId ? "bg-primary/20 border border-primary/30" : "bg-muted/30"
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
                            : "bg-muted"
                    }`}>
                      {i + 1}
                    </span>
                    <span className={p._id === playerId ? "font-semibold" : ""}>{p.name}</span>
                  </div>
                  <span className="font-mono font-bold">{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // RESULTS STATE
  if (game.state === "results") {
    const currentQ = game.questions[game.currentQuestion];
    return (
      <main className="min-h-screen bg-gradient-main relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        
        <div className="relative text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-6 animate-slide-up">
            Question {game.currentQuestion + 1} Results
          </h2>
          
          <div className="glass-strong p-6 rounded-2xl mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-muted-foreground mb-2">✅ Correct answer:</p>
            <p className="text-lg font-semibold text-green-400">
              {typeof currentQ.correct === "string" ? currentQ.correct : JSON.stringify(currentQ.correct)}
            </p>
            <p className="text-sm text-muted-foreground mt-4">{currentQ.explanation}</p>
          </div>

          <div className="glass p-6 rounded-2xl mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-muted-foreground mb-2">Your score</p>
            <p className="text-4xl font-black text-gradient">{player?.score || 0}</p>
          </div>

          <div className="glass p-4 rounded-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-semibold mb-3">🏆 Top Players</h3>
            <div className="space-y-2">
              {leaderboard?.slice(0, 5).map((p, i) => (
                <div
                  key={p._id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    p._id === playerId ? "bg-primary/20" : ""
                  }`}
                >
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <span className="font-mono">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-6 animate-pulse">
            Waiting for next question...
          </p>
        </div>
      </main>
    );
  }

  // QUESTION STATE (game playing)
  return (
    <main className="min-h-screen bg-gradient-main relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 glass px-6 py-3 rounded-2xl">
          <span className="text-sm text-muted-foreground">
            Question {game.currentQuestion + 1} of {game.questions.length}
          </span>
          <span className="font-mono font-bold text-lg">
            Score: <span className="text-gradient">{player?.score || 0}</span>
          </span>
        </div>

        {/* Answer Submitted Notification */}
        {answered && (
          <div className="mb-4 p-4 rounded-2xl bg-green-500/20 border border-green-500/30 text-center animate-scale-in">
            <p className="text-green-400 font-medium flex items-center justify-center gap-2">
              ✅ Answer submitted! Waiting for results...
            </p>
          </div>
        )}

        {/* Iframe Error */}
        {iframeError && (
          <div className="mb-4 p-6 rounded-2xl glass-strong border-l-4 border-l-destructive text-center animate-scale-in">
            <p className="text-destructive font-medium mb-3">Game failed to load</p>
            <button
              onClick={() => {
                setIframeError(false);
                setIframeReady(false);
                const iframe = iframeRef.current;
                if (iframe) iframe.src = iframe.src;
              }}
              className="btn-primary text-sm py-2"
            >
              🔄 Reload Game
            </button>
          </div>
        )}

        {/* Game Iframe */}
        <div className="relative w-full aspect-[16/10] max-w-[900px] mx-auto rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl glow-primary">
          <iframe
            ref={iframeRef}
            key={game._id}
            sandbox="allow-scripts"
            srcDoc={game.gameHtml}
            onLoad={handleIframeLoad}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            title="Game"
          />
        </div>
      </div>
    </main>
  );
}
