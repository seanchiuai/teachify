"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { FileUploadZone } from "@/components/FileUploadZone";
import { TextContentInput } from "@/components/TextContentInput";
import { ObjectiveTypeSelector, ObjectiveType } from "@/components/ObjectiveTypeSelector";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function HomePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [objective, setObjective] = useState("");
  const [objectiveType, setObjectiveType] = useState<ObjectiveType>("understand");
  const [fileId, setFileId] = useState<Id<"_storage"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateGame = useAction(api.generate.generateGame);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const isContentShort = wordCount > 0 && wordCount < 50;
  const canGenerate = content.trim().length > 0 && objective.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateGame({
        content,
        objective,
        objectiveType,
        fileId: fileId ?? undefined,
      });
      router.push(`/host/${result.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center mb-2">LessonPlay</h1>
        <p className="text-center text-muted-foreground mb-8">
          Transform lesson materials into interactive classroom games
        </p>

        <FileUploadZone
          onContentExtracted={(text) => setContent(text)}
          onFileUploaded={(storageId) => setFileId(storageId)}
        />

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">or paste text below</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <TextContentInput value={content} onChange={setContent} />

        <div className="mt-8">
          <label className="block text-sm font-medium mb-2">
            What should students learn from this?
          </label>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder='e.g. "Understand the causes of the French Revolution"'
            className="w-full rounded-lg border border-border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">Objective Type</label>
          <ObjectiveTypeSelector value={objectiveType} onChange={setObjectiveType} />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
          className="w-full mt-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
              Generating game...
            </span>
          ) : (
            "Generate Game"
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {content && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Content preview ({wordCount} words):
            </p>
            {isContentShort && (
              <p className="text-sm text-yellow-600 mb-2">
                Content may be too short for quality questions. Consider adding more detail.
              </p>
            )}
            <p className="text-sm line-clamp-3">{content.substring(0, 300)}...</p>
          </div>
        )}
      </div>
    </main>
  );
}
