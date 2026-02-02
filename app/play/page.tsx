"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Gamepad2, User, X, AlertTriangle, Check, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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

  // Render code input boxes
  const codeChars = code.padEnd(6, "").split("");

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 border-b-2 border-paper-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-highlight-yellow rounded-lg border-2 border-paper-900 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-paper-900" />
              </div>
              <span className="font-display text-xl font-bold text-paper-900">LessonPlay</span>
            </Link>
            <Link 
              href="/" 
              className="text-paper-600 hover:text-paper-900 transition-colors text-sm font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="font-display text-4xl font-bold text-paper-900 mb-2">
            Join Game
          </h1>
          <p className="text-paper-500">Enter the code from your teacher</p>
        </div>

        <Card variant="elevated" className="p-8 animate-slide-up stagger-1">
          <div className="space-y-6">
            {/* Game Code Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-paper-700 mb-4">
                <Gamepad2 className="w-4 h-4 text-highlight-purple" />
                Game Code
              </label>
              
              {/* Visual code boxes */}
              <div className="flex justify-center gap-2 mb-3">
                {codeChars.map((char, i) => (
                  <div
                    key={i}
                    className={`
                      w-12 h-14 flex items-center justify-center text-2xl font-mono font-bold rounded-lg border-2 transition-all duration-150
                      ${char 
                        ? "bg-highlight-yellow/10 border-highlight-yellow text-paper-900" 
                        : "bg-background border-paper-300 text-paper-400"
                      }
                      ${i % 2 === 0 ? "-rotate-1" : "rotate-1"}
                    `}
                  >
                    {char}
                  </div>
                ))}
              </div>
              
              {/* Hidden actual input */}
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="XXXXXX"
                className="w-full text-center text-2xl font-mono tracking-[0.5em] input-paper uppercase"
                maxLength={6}
              />
              
              <div className="mt-3 h-6 text-center">
                {code.length === 6 && game === null && (
                  <div className="flex items-center justify-center gap-2 text-highlight-pink animate-scale-in">
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Game not found</span>
                  </div>
                )}
                {code.length === 6 && game && game.state !== "lobby" && (
                  <div className="flex items-center justify-center gap-2 text-highlight-orange animate-scale-in">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Game already started</span>
                  </div>
                )}
                {code.length === 6 && game && game.state === "lobby" && (
                  <div className="flex items-center justify-center gap-2 text-green-600 animate-scale-in">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Game found!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-paper-700 mb-3">
                <User className="w-4 h-4 text-highlight-blue" />
                Your Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>

            {/* Error Display */}
            {error && (
              <Card variant="pink" className="p-4 animate-scale-in">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </Card>
            )}

            {/* Join Button */}
            <Button
              onClick={handleJoin}
              disabled={!canJoin || joining}
              variant="green"
              size="lg"
              className="w-full"
              isLoading={joining}
            >
              <span className="flex items-center justify-center gap-2">
                Join Game <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </Card>

        {/* Help text */}
        <p className="text-center text-paper-400 text-sm mt-6 animate-slide-up stagger-2">
          Ask your teacher for the 6-character game code
        </p>
        </div>
      </div>
    </main>
  );
}
