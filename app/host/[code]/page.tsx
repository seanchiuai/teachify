"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function HostPage() {
  const { code } = useParams<{ code: string }>();
  const game = useQuery(api.games.getByCode, { code: code ?? "" });

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

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2">Game Code</p>
          <h1 className="text-6xl font-mono font-bold tracking-widest">{game.code}</h1>
          <p className="text-muted-foreground mt-4">
            Students join at <span className="font-medium">/play</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-2">Objective</h2>
            <p className="text-muted-foreground">{game.objective}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Type: <span className="capitalize">{game.objectiveType}</span>
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-2">Questions</h2>
            <p className="text-3xl font-bold">{game.questions.length}</p>
            <p className="text-sm text-muted-foreground">questions generated</p>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-4">Generated Questions Preview</h2>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {game.questions.map((q: { question: string; type: string; options: string[] }, i: number) => (
              <div key={i} className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {i + 1}. {q.question}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Type: {q.type} | Options: {q.options.length}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-2">Game Status</h2>
          <p className="text-muted-foreground capitalize">{game.state}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Full game engine coming in Phase 3
          </p>
        </div>
      </div>
    </main>
  );
}
