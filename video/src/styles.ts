// LessonPlay Design System - Tactical Paper Theme
export const colors = {
  // Paper tones
  paper50: "#F9F5F2",
  paper100: "#F2EBE5",
  paper200: "#E8DFD8",
  paper300: "#CCC4BF",
  paper400: "#90857D",
  paper500: "#66594F",
  paper600: "#4A3F33",
  paper900: "#1A0F07",

  // Highlight colors
  yellow: "#F5D754",
  pink: "#FF5555",
  green: "#5BC583",
  blue: "#5DA5FF",
  purple: "#9752C9",
  orange: "#FFA542",
};

export const fonts = {
  display: "Space Grotesk, sans-serif",
  mono: "JetBrains Mono, monospace",
};

// Common styles
export const cardStyle = (variant: "default" | "yellow" | "green" | "pink" | "blue" | "purple" = "default") => {
  const borderColors: Record<string, string> = {
    default: colors.paper300,
    yellow: colors.yellow,
    green: colors.green,
    pink: colors.pink,
    blue: colors.blue,
    purple: colors.purple,
  };

  return {
    backgroundColor: colors.paper50,
    border: `3px solid ${borderColors[variant]}`,
    borderRadius: 12,
    boxShadow: `4px 4px 0px ${colors.paper300}`,
  };
};

export const buttonStyle = (variant: "yellow" | "green" | "purple" = "yellow") => {
  const bgColors: Record<string, string> = {
    yellow: colors.yellow,
    green: colors.green,
    purple: colors.purple,
  };

  return {
    backgroundColor: bgColors[variant],
    border: `2px solid ${colors.paper900}`,
    borderRadius: 8,
    padding: "12px 24px",
    fontFamily: fonts.display,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: variant === "purple" ? "#fff" : colors.paper900,
    boxShadow: `3px 3px 0px ${colors.paper900}`,
  };
};
