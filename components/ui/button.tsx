"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "yellow" | "green" | "pink" | "blue" | "purple" | "outline" | "white";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "yellow", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wider border-2 border-solid rounded-lg transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";

    const variants = {
      yellow: "bg-highlight-yellow border-paper-900 text-paper-900 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
      green: "bg-highlight-green border-paper-900 text-paper-900 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
      pink: "bg-highlight-pink border-paper-900 text-paper-900 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
      blue: "bg-highlight-blue border-paper-900 text-paper-900 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
      purple: "bg-highlight-purple border-paper-900 text-white hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
      outline: "bg-transparent border-paper-300 text-paper-600 hover:bg-paper-100 shadow-none hover:shadow-none",
      white: "bg-white border-paper-300 text-paper-900 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs shadow-paper-sm",
      md: "px-6 py-4 text-sm shadow-paper",
      lg: "px-8 py-5 text-base shadow-paper-lg",
    };

    const shadows = {
      sm: "shadow-paper-sm hover:shadow-paper",
      md: "shadow-paper hover:shadow-paper-lg",
      lg: "shadow-paper-lg hover:shadow-paper-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          variant !== "outline" && shadows[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
