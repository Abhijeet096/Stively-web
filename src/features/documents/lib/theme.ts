/**
 * Brand constants for the documents engine, resolved to plain hex values.
 * @react-pdf/renderer runs outside a browser (no CSSOM), so it can't read
 * the site's OKLCH custom properties (src/app/globals.css) - these are that
 * same palette's light-mode values, converted once with a verified library
 * (culori) rather than hand-rolled, and hardcoded here since a printed PDF
 * shouldn't be theme-aware anyway (light/dark mode is a UI concept, not a
 * document one - every generated PDF looks the same regardless of who's
 * viewing it or their OS theme).
 */
export const documentColors = {
  foreground: "#09090B",
  mutedForeground: "#71717A",
  border: "#E4E4E7",
  ink: "#080D18",
  inkForeground: "#F7F8FB",
  inkMutedForeground: "#9EA5B2",
  primary: "#325FEA",
  brandTeal: "#00C4CC",
  brandIris: "#0087D6",
  success: "#33A340",
  destructive: "#DF2225",
  white: "#FFFFFF",
} as const;

/** A4 in points (72pt/inch) - @react-pdf/renderer's native unit. */
export const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 40,
} as const;

export const typeScale = {
  xs: 8,
  sm: 9,
  base: 10,
  md: 11,
  lg: 13,
  xl: 16,
  "2xl": 20,
  "3xl": 26,
} as const;
