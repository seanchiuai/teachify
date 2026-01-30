"use client";

import { useState } from "react";
import { FileUploadZone } from "@/components/FileUploadZone";
import { TextContentInput } from "@/components/TextContentInput";
import { ObjectiveTypeSelector, ObjectiveType } from "@/components/ObjectiveTypeSelector";
import { Id } from "@/convex/_generated/dataModel";

export default function HomePage() {
  const [content, setContent] = useState("");
  const [objective, setObjective] = useState("");
  const [objectiveType, setObjectiveType] = useState<ObjectiveType>("understand");
  const [fileId, setFileId] = useState<Id<"_storage"> | null>(null);
  const [loading, setLoading] = useState(false);

  const canGenerate = content.trim().length > 0 && objective.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    // Phase 2: Will call generateGame action
    // For now, just show we have the data
    console.log("Generate game with:", { content, objective, objectiveType, fileId });
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-2">LessonPlay</h1>
        <p className="text-center text-muted-foreground mb-8">
          Transform lesson materials into interactive classroom games
        </p>

        {/* File Upload Zone */}
        <FileUploadZone
          onContentExtracted={(text) => setContent(text)}
          onFileUploaded={(storageId) => setFileId(storageId)}
        />

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">or paste text below</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Text Content Input */}
        <TextContentInput value={content} onChange={setContent} />

        {/* Learning Objective */}
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

        {/* Objective Type Selector */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">Objective Type</label>
          <ObjectiveTypeSelector value={objectiveType} onChange={setObjectiveType} />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
          className="w-full mt-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
              Generating questions...
            </span>
          ) : (
            "Generate Game"
          )}
        </button>

        {/* Content preview (for debugging) */}
        {content && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Content preview:</p>
            <p className="text-sm line-clamp-3">{content.substring(0, 300)}...</p>
          </div>
        )}
      </div>
    </main>
  );
}
