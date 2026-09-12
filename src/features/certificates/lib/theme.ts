/**
 * Colors specific to the certificate design - sampled from the founder's
 * own master template (Certificate_Template.pptx/.pdf), not the generic
 * site/document palette (src/features/documents/lib/theme.ts), since this
 * design's dark forest-green + cream + gold identity is deliberately
 * distinct from the invoice/receipt engine's blue/ink palette.
 */
export const certificateColors = {
  ink: "#0B2B21",
  inkForeground: "#F4F6F3",
  inkMutedForeground: "#9FB3A8",
  cream: "#F7F6F1",
  creamPanel: "#EFEEE6",
  foreground: "#12241C",
  mutedForeground: "#5B6B62",
  border: "#DAD9CE",
  gold: "#C9A227",
  goldMuted: "#E7D9A8",
  white: "#FFFFFF",
} as const;

/** A4 landscape in points (72pt/inch), matching the source template's own ~1.41:1 aspect ratio. */
export const CERT_PAGE = {
  width: 841.89,
  height: 595.28,
  margin: 36,
} as const;
