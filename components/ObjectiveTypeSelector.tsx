"use client";

const OBJECTIVE_TYPES = [
  { value: "understand", label: "Understand" },
  { value: "explain", label: "Explain" },
  { value: "apply", label: "Apply" },
  { value: "distinguish", label: "Distinguish" },
  { value: "perform", label: "Perform" },
  { value: "analyze", label: "Analyze" },
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
