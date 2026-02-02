"use client";

import { Textarea } from "@/components/ui/textarea";

interface TextContentInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TextContentInput({ value, onChange }: TextContentInputProps) {
  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your lesson content here... (articles, notes, textbook sections)"
        className="min-h-[160px]"
      />
      <div className="absolute bottom-3 right-3 text-xs text-paper-400">
        {value.length > 0 && `${value.length} characters`}
      </div>
    </div>
  );
}
