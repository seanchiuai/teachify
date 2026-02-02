"use client";

import { cn } from "@/lib/utils";

interface GameCodeProps {
  code: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function GameCode({ code, className, size = "md" }: GameCodeProps) {
  const characters = code.split("");

  const sizes = {
    sm: { box: "w-10 h-12 text-xl", gap: "gap-1" },
    md: { box: "w-14 h-16 text-3xl", gap: "gap-2" },
    lg: { box: "w-16 h-20 text-4xl", gap: "gap-3" },
  };

  return (
    <div className={cn("flex items-center justify-center", sizes[size].gap, className)}>
      {characters.map((char, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center justify-center font-mono font-bold bg-background border-2 border-solid border-paper-300 rounded-lg shadow-paper-sm",
            sizes[size].box,
            i % 2 === 0 ? "-rotate-1" : "rotate-1"
          )}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

interface GameCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  className?: string;
}

export function GameCodeInput({ value, onChange, maxLength = 6, className }: GameCodeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, maxLength);
    onChange(newValue);
  };

  // Render individual boxes
  const characters = value.padEnd(maxLength, "").split("");

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {characters.map((char, i) => (
        <div
          key={i}
          className={cn(
            "w-12 h-14 flex items-center justify-center text-2xl font-mono font-bold bg-background border-2 border-solid rounded-lg transition-all duration-150",
            char ? "border-highlight-yellow bg-highlight-yellow/10" : "border-paper-300",
            i % 2 === 0 ? "-rotate-1" : "rotate-1"
          )}
        >
          {char}
        </div>
      ))}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className="sr-only"
        aria-label="Game code"
      />
    </div>
  );
}
