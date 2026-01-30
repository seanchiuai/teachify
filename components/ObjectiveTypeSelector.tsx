"use client";

export type ObjectiveType = "understand" | "explain" | "apply" | "distinguish" | "perform" | "analyze";

interface ObjectiveTypeSelectorProps {
  value: ObjectiveType;
  onChange: (value: ObjectiveType) => void;
}

const objectives: { value: ObjectiveType; label: string; icon: string }[] = [
  { value: "understand", label: "Understand", icon: "💡" },
  { value: "explain", label: "Explain", icon: "🗣️" },
  { value: "apply", label: "Apply", icon: "⚡" },
  { value: "distinguish", label: "Distinguish", icon: "🔍" },
  { value: "perform", label: "Perform", icon: "🎯" },
  { value: "analyze", label: "Analyze", icon: "📊" },
];

export function ObjectiveTypeSelector({ value, onChange }: ObjectiveTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {objectives.map((obj) => (
        <button
          key={obj.value}
          type="button"
          onClick={() => onChange(obj.value)}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium
            transition-all duration-200
            ${value === obj.value
              ? "bg-gradient-purple text-white shadow-lg shadow-purple-500/25 scale-105"
              : "glass hover:bg-primary/10 hover:scale-105"
            }
          `}
        >
          <span className="mr-2">{obj.icon}</span>
          {obj.label}
        </button>
      ))}
    </div>
  );
}
