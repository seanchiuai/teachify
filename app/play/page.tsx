"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";

export default function PlayPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const game = useQuery(
    api.games.getByCode,
    code.length === 6 ? { code: code.toUpperCase() } : "skip"
  );
  const joinGame = useMutation(api.players.join);

  const canJoin = code.length === 6 && name.trim().length > 0 && game && game.state === "lobby";

  const handleJoin = async () => {
    if (!canJoin || !game) return;
    setJoining(true);
    setError(null);
    try {
      const playerId = await joinGame({
        gameId: game._id,
        name: name.trim(),
      });
      localStorage.setItem(`player_${game._id}`, playerId);
      router.push(`/play/${code.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-main relative overflow-hidden flex items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative w-full max-w-md mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-up">
          <h1 className="text-4xl font-black mb-2">
            <span className="text-gradient">Join Game</span>
          </h1>
          <p className="text-muted-foreground">Enter the code from your teacher</p>
        </div>

        <div className="glass-strong p-8 rounded-3xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-6">
            {/* Game Code Input */}
            <div>
              <label className="block text-sm font-medium mb-3 text-foreground/80">🎮 Game Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="XXXXXX"
                className="w-full text-center text-3xl font-mono tracking-[0.4em] input-glass py-5 uppercase"
                maxLength={6}
              />
              <div className="mt-3 h-6">
                {code.length === 6 && game === null && (
                  <p className="text-sm text-destructive animate-scale-in flex items-center justify-center gap-2">
                    ❌ Game not found
                  </p>
                )}
                {code.length === 6 && game && game.state !== "lobby" && (
                  <p className="text-sm text-accent animate-scale-in flex items-center justify-center gap-2">
                    ⚠️ Game already started
                  </p>
                )}
                {code.length === 6 && game && game.state === "lobby" && (
                  <p className="text-sm text-green-400 animate-scale-in flex items-center justify-center gap-2">
                    ✅ Game found!
                  </p>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium mb-3 text-foreground/80">👤 Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full input-glass text-lg"
                maxLength={20}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl animate-scale-in">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={!canJoin || joining}
              className="w-full btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Joining...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🚀 Join Game
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
