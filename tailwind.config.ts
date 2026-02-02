import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paper tones
        paper: {
          50: "hsl(var(--paper-50))",
          100: "hsl(var(--paper-100))",
          200: "hsl(var(--paper-200))",
          300: "hsl(var(--paper-300))",
          400: "hsl(var(--paper-400))",
          500: "hsl(var(--paper-500))",
          600: "hsl(var(--paper-600))",
          900: "hsl(var(--paper-900))",
        },
        // Highlighters
        highlight: {
          yellow: "hsl(var(--highlight-yellow))",
          pink: "hsl(var(--highlight-pink))",
          green: "hsl(var(--highlight-green))",
          blue: "hsl(var(--highlight-blue))",
          purple: "hsl(var(--highlight-purple))",
          orange: "hsl(var(--highlight-orange))",
        },
        // Semantic colors (shadcn/ui compatible)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Game colors
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        paper: "var(--shadow-md)",
        "paper-sm": "var(--shadow-sm)",
        "paper-lg": "var(--shadow-lg)",
        "paper-xl": "var(--shadow-xl)",
      },
      keyframes: {
        stamp: {
          "0%": { transform: "translate(-2px, -2px)" },
          "50%": { transform: "translate(1px, 1px)" },
          "100%": { transform: "translate(0, 0)" },
        },
        deal: {
          "0%": { opacity: "0", transform: "translateY(-20px) rotate(-3deg)" },
          "100%": { opacity: "1", transform: "translateY(0) rotate(0)" },
        },
        "stamp-approve": {
          "0%": { transform: "scale(1.5)", opacity: "0" },
          "50%": { transform: "scale(0.9)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "score-pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        stamp: "stamp 200ms ease-out",
        deal: "deal 400ms ease-out forwards",
        "stamp-approve": "stamp-approve 300ms ease-out forwards",
        "score-pop": "score-pop 300ms ease-out",
        "slide-up": "slide-up 400ms ease-out forwards",
        "scale-in": "scale-in 300ms ease-out forwards",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
