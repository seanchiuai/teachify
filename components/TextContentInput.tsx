"use client";

export function TextContentInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Paste or type lesson content here..."
      className="w-full min-h-[160px] rounded-lg border border-border bg-background p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    />
  );
}
