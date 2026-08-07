import path from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * Geist (SIL OFL), the same family the site uses for all body/UI text
 * (src/app/layout.tsx). Bricolage Grotesque - the site's display face for
 * headings - only ships as a variable font (no static weight files), which
 * @react-pdf/renderer's font engine handles less predictably than static
 * instances; these are utilitarian documents (invoices, receipts, legal
 * agreements), not marketing pages, so Geist alone - already genuinely
 * brand-correct, not a fallback to a generic PDF font - is the right call
 * rather than risking inconsistent weight rendering. Four static weights
 * cover every role a document needs (body, medium labels, semibold
 * emphasis, bold totals/headings).
 */
const FONT_DIR = path.join(process.cwd(), "src/features/documents/assets/fonts");

let registered = false;

/** Idempotent - safe to call at the top of every template/render path. */
export function registerDocumentFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Geist",
    fonts: [
      { src: path.join(FONT_DIR, "Geist-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "Geist-Medium.ttf"), fontWeight: 500 },
      { src: path.join(FONT_DIR, "Geist-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "Geist-Bold.ttf"), fontWeight: 700 },
    ],
  });

  // @react-pdf/renderer hyphenates by default, which reads oddly for
  // proper nouns, currency, and IDs in a business document.
  Font.registerHyphenationCallback((word) => [word]);
}
