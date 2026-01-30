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
  const [answered, setAnswered] = useState(false);
  const startTimeRef = useRef<number>(0);
  const lastQuestionRef = useRef<number>(-1);

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

    const channel = new MessageChannel();
    portRef.current = channel.port1;

    channel.port1.onmessage = async (event) => {
      const { type, payload } = event.data;
      if (type === "GAME_READY") {
        setIframeReady(true);
      } else if (type === "ANSWER_SUBMITTED" && game && playerId && !answered) {
        setAnswered(true);
        const timeMs = Date.now() - startTimeRef.current;
        try {
          await submitAnswer({
            gameId: game._id,
            playerId,
            questionIndex: payload.questionIndex,
            answer: payload.answer,
            timeMs,
          });
        } catch (err) {
          // Already answered or invalid state
        }
      }
    };

    iframe.contentWindow.postMessage({ type: "INIT_PORT" }, "*", [channel.port2]);
  }, [game, playerId, answered, submitAnswer]);

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
          <button
            onClick={() => router.push("/play")}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Back to Join
          </button>
        </div>
      </main>
    );
  }

  if (game.state === "lobby") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-sm text-muted-foreground mb-2">Game Code</p>
          <h1 className="text-5xl font-mono font-bold tracking-widest mb-8">{game.code}</h1>

          <div className="p-6 rounded-xl border border-border bg-card mb-6">
            <p className="text-lg mb-4">
              Welcome, <span className="font-semibold">{player?.name}</span>!
            </p>
            <p className="text-muted-foreground">Waiting for host to start...</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card">
            <p className="text-sm text-muted-foreground mb-3">
              {players?.length || 0} player{(players?.length || 0) !== 1 ? "s" : ""} joined
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {players?.map((p) => (
                <span
                  key={p._id}
                  className={`px-3 py-1 rounded-full text-sm ${
                    p._id === playerId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
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

  if (game.state === "complete") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-bold mb-4">Game Over!</h1>
          <div className="p-6 rounded-xl border border-border bg-card mb-6">
            <p className="text-muted-foreground mb-2">Your final score</p>
            <p className="text-5xl font-bold">{player?.score || 0}</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-4">Leaderboard</h2>
            <div className="space-y-2">
              {leaderboard?.map((p, i) => (
                <div
                  key={p._id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    p._id === playerId ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-background text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className={p._id === playerId ? "font-semibold" : ""}>{p.name}</span>
                  </div>
                  <span className="font-mono font-semibold">{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (game.state === "results") {
    const currentQ = game.questions[game.currentQuestion];
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold mb-4">
            Question {game.currentQuestion + 1} Results
          </h2>
          <div className="p-6 rounded-xl border border-border bg-card mb-6">
            <p className="text-muted-foreground mb-2">Correct answer:</p>
            <p className="text-lg font-medium">
              {typeof currentQ.correct === "string" ? currentQ.correct : JSON.stringify(currentQ.correct)}
            </p>
            <p className="text-sm text-muted-foreground mt-4">{currentQ.explanation}</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card mb-6">
            <p className="text-muted-foreground mb-2">Your score</p>
            <p className="text-3xl font-bold">{player?.score || 0}</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-semibold mb-3">Top Players</h3>
            <div className="space-y-2">
              {leaderboard?.slice(0, 5).map((p, i) => (
                <div
                  key={p._id}
                  className={`flex items-center justify-between p-2 rounded ${
                    p._id === playerId ? "bg-primary/10" : ""
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

          <p className="text-sm text-muted-foreground mt-6">Waiting for next question...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Question {game.currentQuestion + 1} of {game.questions.length}
          </span>
          <span className="font-mono font-semibold">Score: {player?.score || 0}</span>
        </div>

        {answered && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-green-600 font-medium">Answer submitted! Waiting for results...</p>
          </div>
        )}

        <div className="relative w-full aspect-[16/10] max-w-[900px] mx-auto rounded-xl overflow-hidden border border-border">
          <iframe
            ref={iframeRef}
            key={game._id}
            sandbox="allow-scripts"
            srcDoc={game.gameHtml}
            onLoad={handleIframeLoad}
            className="absolute inset-0 w-full h-full border-0"
            title="Game"
          />
        </div>
      </div>
    </main>
  );
}
