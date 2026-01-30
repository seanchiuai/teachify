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
    <main className="min-h-screen bg-gradient-main relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="relative max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="text-gradient">LessonPlay</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Transform lesson materials into <span className="text-accent font-semibold">interactive classroom games</span>
          </p>
        </div>

        {/* Upload Section */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <FileUploadZone
            onContentExtracted={(text) => setContent(text)}
            onFileUploaded={(storageId) => setFileId(storageId)}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-sm text-muted-foreground px-4 py-2 glass rounded-full">or paste text below</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Text Input */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <TextContentInput value={content} onChange={setContent} />
        </div>

        {/* Objective Input */}
        <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <label className="block text-sm font-medium mb-3 text-foreground/80">
            ✨ What should students learn from this?
          </label>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder='e.g. "Understand the causes of the French Revolution"'
            className="w-full input-glass text-base"
          />
        </div>

        {/* Objective Type */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <label className="block text-sm font-medium mb-3 text-foreground/80">🎯 Objective Type</label>
          <ObjectiveTypeSelector value={objectiveType} onChange={setObjectiveType} />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
          className="w-full mt-10 btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 animate-slide-up"
          style={{ animationDelay: '0.6s' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Generating game...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🚀 Generate Game
            </span>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 glass border-l-4 border-l-destructive rounded-xl animate-scale-in">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Content Preview */}
        {content && (
          <div className="mt-8 p-6 glass rounded-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                📝 Content preview
              </p>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary">
                {wordCount} words
              </span>
            </div>
            {isContentShort && (
              <p className="text-sm text-accent mb-3 flex items-center gap-2">
                ⚠️ Content may be too short for quality questions. Consider adding more detail.
              </p>
            )}
            <p className="text-sm text-muted-foreground/80 line-clamp-3">
              {content.substring(0, 300)}...
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-muted-foreground/50 text-sm mt-12 animate-slide-up" style={{ animationDelay: '0.7s' }}>
          Powered by AI • Built for educators
        </p>
      </div>
    </main>
  );
}
