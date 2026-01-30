"use client";

const OBJECTIVE_TYPES = [
  { value: "understand", label: "Understand", description: "Students should understand that..." },
  { value: "explain", label: "Explain", description: "Students should be able to explain..." },
  { value: "apply", label: "Apply", description: "Students should be able to apply..." },
  { value: "distinguish", label: "Distinguish", description: "Students should distinguish between..." },
  { value: "perform", label: "Perform", description: "Students should be able to perform..." },
  { value: "analyze", label: "Analyze", description: "Students should be able to analyze..." },
] as const;

export type ObjectiveType = (typeof OBJECTIVE_TYPES)[number]["value"];

export function ObjectiveTypeSelector({
  value,
  onChange,
}: {
  value: ObjectiveType;
  onChange: (type: ObjectiveType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OBJECTIVE_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === type.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}

export { OBJECTIVE_TYPES };
