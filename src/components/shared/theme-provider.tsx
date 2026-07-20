"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Thin re-export so the root layout (a Server Component) never imports
 * `next-themes` directly - `ThemeProvider` itself must be a Client
 * Component (it touches `document.documentElement` and `localStorage`),
 * but nothing about *using* it in the tree requires the layout itself to
 * become one. Class-strategy dark mode was already fully specified in
 * globals.css (`@custom-variant dark`, a complete `.dark { ... }` token
 * block) per design-system.md §26's documented rollout plan - this wires
 * the one missing piece (the actual toggle mechanism) rather than
 * introducing new theme tokens.
 */
function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export { ThemeProvider };
