"use client";

import { Lightbulb, MessageSquare, Zap, Search, Target, BarChart3, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export type ObjectiveType = "understand" | "explain" | "apply" | "distinguish" | "perform" | "analyze";

interface ObjectiveTypeSelectorProps {
  value: ObjectiveType;
  onChange: (value: ObjectiveType) => void;
}

const objectives: { value: ObjectiveType; label: string; Icon: LucideIcon; description: string }[] = [
  { value: "understand", label: "Understand", Icon: Lightbulb, description: "Grasp core concepts" },
  { value: "explain", label: "Explain", Icon: MessageSquare, description: "Describe and teach" },
  { value: "apply", label: "Apply", Icon: Zap, description: "Use in practice" },
  { value: "distinguish", label: "Distinguish", Icon: Search, description: "Tell differences" },
  { value: "perform", label: "Perform", Icon: Target, description: "Execute steps" },
  { value: "analyze", label: "Analyze", Icon: BarChart3, description: "Break down" },
];

export function ObjectiveTypeSelector({ value, onChange }: ObjectiveTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {objectives.map((obj) => (
        <Card
          key={obj.value}
          className="cursor-pointer p-4"
          variant={value === obj.value ? "yellow" : "default"}
          onClick={() => onChange(obj.value)}
        >
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
              ${value === obj.value 
                ? "bg-highlight-yellow/30" 
                : "bg-paper-100"
              }
            `}>
              <obj.Icon className={`w-5 h-5 ${value === obj.value ? "text-paper-900" : "text-paper-500"}`} />
            </div>
            <div>
              <span className={`font-medium text-sm ${value === obj.value ? "text-paper-900" : "text-paper-700"}`}>
                {obj.label}
              </span>
              <p className="text-xs text-paper-400">{obj.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
