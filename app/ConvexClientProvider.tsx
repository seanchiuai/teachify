"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
console.log("NEXT_PUBLIC_CONVEX_URL:", convexUrl);

if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL is not set!");
}

const convex = new ConvexReactClient(convexUrl || "");

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
