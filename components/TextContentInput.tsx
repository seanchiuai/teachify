"use client";

interface TextContentInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TextContentInput({ value, onChange }: TextContentInputProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your lesson content here... (articles, notes, textbook sections)"
        className="w-full h-40 glass rounded-2xl p-5 text-sm resize-none
                   focus:outline-none focus:ring-2 focus:ring-primary/50
                   placeholder:text-muted-foreground/50
                   transition-all duration-200"
      />
      <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/50">
        {value.length > 0 && `${value.length} characters`}
      </div>
    </div>
  );
}
