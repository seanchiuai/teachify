"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "w-full min-h-[120px] bg-background border-2 border-solid border-paper-300 rounded-lg px-4 py-3 resize-none",
          "text-foreground placeholder:text-muted-foreground text-sm",
          "transition-all duration-150 ease-out",
          "focus:outline-none focus:border-highlight-blue focus:bg-white",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
