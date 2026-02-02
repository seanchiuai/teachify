"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileUploadZone } from "@/components/FileUploadZone";
import { TextContentInput } from "@/components/TextContentInput";
import { ObjectiveTypeSelector, ObjectiveType } from "@/components/ObjectiveTypeSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Sparkles, ChevronDown, ChevronUp, Gamepad2, Upload, FileText, Lightbulb, GraduationCap } from "lucide-react";

type GameMode = "legacy" | "engine";
type Genre = "economic" | "combat" | "spatial" | "social" | "racing" | "puzzle";

const GENRES: { value: Genre; label: string; description: string }[] = [
  { value: "economic", label: "Economic", description: "Currency trading, resource management" },
  { value: "combat", label: "Combat", description: "Health, damage, elimination mechanics" },
  { value: "spatial", label: "Spatial", description: "Territory control, movement, zones" },
  { value: "social", label: "Social", description: "Voting, roles, alliances" },
  { value: "racing", label: "Racing", description: "Speed-based, first to finish" },
  { value: "puzzle", label: "Puzzle", description: "Logic, pattern matching" },
];

const MECHANICS = [
  { id: "economy", label: "Economy", description: "Currencies and trading" },
  { id: "combat", label: "Combat", description: "Health and damage" },
  { id: "movement", label: "Movement", description: "Grid or zone movement" },
  { id: "timer", label: "Timer", description: "Time pressure elements" },
];

export default function HomePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [objective, setObjective] = useState("");
  const [objectiveType, setObjectiveType] = useState<ObjectiveType>("understand");
  const [fileId, setFileId] = useState<Id<"_storage"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game mode and hints
  const [gameMode, setGameMode] = useState<GameMode>("engine");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [preferredGenre, setPreferredGenre] = useState<Genre | "">("");
  const [preferredMechanics, setPreferredMechanics] = useState<string[]>([]);
  const [avoidMechanics, setAvoidMechanics] = useState<string[]>([]);

  const generateGame = useAction(api.generate.generateGame);
  const generateEngineGame = useAction(api.generate.generateEngineGame);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const isContentShort = wordCount > 0 && wordCount < 50;
  const canGenerate = content.trim().length > 0 && objective.trim().length > 0;

  const toggleMechanic = (mechanicId: string, list: "preferred" | "avoid") => {
    if (list === "preferred") {
      if (preferredMechanics.includes(mechanicId)) {
        setPreferredMechanics(preferredMechanics.filter(m => m !== mechanicId));
      } else {
        setPreferredMechanics([...preferredMechanics, mechanicId]);
        setAvoidMechanics(avoidMechanics.filter(m => m !== mechanicId));
      }
    } else {
      if (avoidMechanics.includes(mechanicId)) {
        setAvoidMechanics(avoidMechanics.filter(m => m !== mechanicId));
      } else {
        setAvoidMechanics([...avoidMechanics, mechanicId]);
        setPreferredMechanics(preferredMechanics.filter(m => m !== mechanicId));
      }
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      if (gameMode === "engine") {
        const hints = {
          ...(preferredGenre && { preferredGenre }),
          ...(preferredMechanics.length > 0 && { preferredMechanics }),
          ...(avoidMechanics.length > 0 && { avoidMechanics }),
        };
        const result = await generateEngineGame({
          content,
          objective,
          objectiveType,
          fileId: fileId ?? undefined,
          hints: Object.keys(hints).length > 0 ? hints : undefined,
        });
        router.push(`/host/${result.code}`);
      } else {
        const result = await generateGame({
          content,
          objective,
          objectiveType,
          fileId: fileId ?? undefined,
        });
        router.push(`/host/${result.code}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate game");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="container-paper py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-paper-900 mb-4">
            Create a Game
          </h1>
          <p className="text-lg text-paper-500 max-w-md mx-auto">
            Transform lesson materials into <span className="text-highlight-purple font-semibold">interactive classroom games</span>
          </p>
        </div>

        {/* Step 1: Game Type */}
        <div className="mb-8 animate-slide-up stagger-1">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="yellow">Step 1</Badge>
            <span className="text-sm font-medium text-paper-600">Choose Game Type</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer p-5"
              variant={gameMode === "engine" ? "yellow" : "default"}
              onClick={() => setGameMode("engine")}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-highlight-purple/20 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="w-5 h-5 text-highlight-purple" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-paper-900">AI-Designed Game</span>
                    <Badge variant="purple">New</Badge>
                  </div>
                  <p className="text-sm text-paper-500">
                    AI creates unique game mechanics, themes, and visuals based on your content
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer p-5"
              variant={gameMode === "legacy" ? "yellow" : "default"}
              onClick={() => setGameMode("legacy")}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-highlight-yellow/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-paper-600" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-paper-900 block mb-1">Classic Quiz</span>
                  <p className="text-sm text-paper-500">
                    Traditional quiz game with multiple choice questions
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Step 2: Content */}
        <div className="mb-8 animate-slide-up stagger-2">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="yellow">Step 2</Badge>
            <span className="text-sm font-medium text-paper-600">Add Your Content</span>
          </div>

          <Card variant="default" className="p-6">
            {/* Upload Zone */}
            <FileUploadZone
              onContentExtracted={(text) => setContent(text)}
              onFileUploaded={(storageId) => setFileId(storageId)}
            />

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 divider-paper" />
              <span className="text-sm text-paper-400 font-medium">or paste text</span>
              <div className="flex-1 divider-paper" />
            </div>

            {/* Text Input */}
            <TextContentInput value={content} onChange={setContent} />
          </Card>
        </div>

        {/* Step 3: Learning Objective */}
        <div className="mb-8 animate-slide-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="yellow">Step 3</Badge>
            <span className="text-sm font-medium text-paper-600">Define Learning Objective</span>
          </div>

          <Card variant="default" className="p-6 space-y-6">
            {/* Objective Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-paper-700 mb-3">
                <Lightbulb className="w-4 h-4 text-highlight-yellow" />
                What should students learn from this?
              </label>
              <input
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder='e.g. "Understand the causes of the French Revolution"'
                className="input-paper"
              />
            </div>

            {/* Objective Type */}
            <div>
              <label className="block text-sm font-medium text-paper-700 mb-3">
                Objective Type
              </label>
              <ObjectiveTypeSelector value={objectiveType} onChange={setObjectiveType} />
            </div>
          </Card>
        </div>

        {/* Advanced Options (Engine mode only) */}
        {gameMode === "engine" && (
          <div className="mb-8 animate-slide-up stagger-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-paper-500 hover:text-paper-700 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Options (Optional)
            </button>

            {showAdvanced && (
              <Card variant="default" className="mt-4 p-6 animate-scale-in">
                {/* Genre Preference */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-paper-700 mb-3">
                    Preferred Genre
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPreferredGenre("")}
                      className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                        preferredGenre === ""
                          ? "border-highlight-purple bg-highlight-purple/10"
                          : "border-paper-300 hover:border-paper-400"
                      }`}
                    >
                      <span className="font-medium text-paper-900">Auto</span>
                      <p className="text-xs text-paper-500">Let AI decide</p>
                    </button>
                    {GENRES.map(genre => (
                      <button
                        key={genre.value}
                        type="button"
                        onClick={() => setPreferredGenre(genre.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                          preferredGenre === genre.value
                            ? "border-highlight-purple bg-highlight-purple/10"
                            : "border-paper-300 hover:border-paper-400"
                        }`}
                      >
                        <span className="font-medium text-paper-900">{genre.label}</span>
                        <p className="text-xs text-paper-500">{genre.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mechanic Preferences */}
                <div>
                  <label className="block text-sm font-medium text-paper-700 mb-3">
                    Mechanic Preferences
                  </label>
                  <div className="space-y-2">
                    {MECHANICS.map(mechanic => (
                      <div key={mechanic.id} className="flex items-center gap-4 p-3 bg-paper-50 rounded-lg border border-paper-200">
                        <div className="flex-1">
                          <span className="font-medium text-sm text-paper-900">{mechanic.label}</span>
                          <p className="text-xs text-paper-500">{mechanic.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => toggleMechanic(mechanic.id, "preferred")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              preferredMechanics.includes(mechanic.id)
                                ? "bg-highlight-green text-paper-900 border border-highlight-green"
                                : "bg-paper-100 text-paper-500 hover:bg-paper-200"
                            }`}
                          >
                            Include
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMechanic(mechanic.id, "avoid")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              avoidMechanics.includes(mechanic.id)
                                ? "bg-highlight-pink text-paper-900 border border-highlight-pink"
                                : "bg-paper-100 text-paper-500 hover:bg-paper-200"
                            }`}
                          >
                            Avoid
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-paper-400 mt-4">
                  These are hints for the AI - it may adjust based on your content for better learning outcomes.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Generate Button */}
        <div className="animate-slide-up stagger-5">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            variant={gameMode === "engine" ? "purple" : "yellow"}
            size="lg"
            isLoading={loading}
            className="w-full"
          >
            {gameMode === "engine" ? (
              <>
                <Gamepad2 className="w-5 h-5" />
                Generate AI Game
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Quiz
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card variant="pink" className="mt-6 p-4 animate-scale-in">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </Card>
        )}

        {/* Content Preview */}
        {content && (
          <Card variant="default" className="mt-8 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-paper-500">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Content preview</span>
              </div>
              <Badge variant="blue">{wordCount} words</Badge>
            </div>
            {isContentShort && (
              <div className="flex items-center gap-2 text-sm text-highlight-orange mb-3">
                <span>Content may be too short for quality questions. Consider adding more detail.</span>
              </div>
            )}
            <p className="text-sm text-paper-500 line-clamp-3">
              {content.substring(0, 300)}...
            </p>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-paper-400 text-sm mt-12 animate-slide-up stagger-6">
          Powered by AI • Built for educators
        </p>
      </div>
    </main>
  );
}
