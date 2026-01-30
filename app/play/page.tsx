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
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8">Join Game</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Game Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="XXXXXX"
              className="w-full text-center text-3xl font-mono tracking-[0.5em] rounded-lg border border-border bg-background p-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
              maxLength={6}
            />
            {code.length === 6 && game === null && (
              <p className="text-sm text-destructive mt-2">Game not found</p>
            )}
            {code.length === 6 && game && game.state !== "lobby" && (
              <p className="text-sm text-destructive mt-2">Game already started</p>
            )}
            {code.length === 6 && game && game.state === "lobby" && (
              <p className="text-sm text-green-600 mt-2">Game found!</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-border bg-background p-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              maxLength={20}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={!canJoin || joining}
            className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {joining ? "Joining..." : "Join Game"}
          </button>
        </div>
      </div>
    </main>
  );
}
