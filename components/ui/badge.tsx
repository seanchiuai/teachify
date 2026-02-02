"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "yellow" | "green" | "pink" | "blue" | "purple" | "muted";
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "muted", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded border";

    const variants = {
      yellow: "bg-highlight-yellow/20 text-paper-900 border-highlight-yellow",
      green: "bg-highlight-green/20 text-green-800 border-highlight-green",
      pink: "bg-highlight-pink/20 text-red-700 border-highlight-pink",
      blue: "bg-highlight-blue/20 text-blue-800 border-highlight-blue",
      purple: "bg-highlight-purple/20 text-purple-800 border-highlight-purple",
      muted: "bg-paper-200 text-paper-500 border-paper-300",
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
