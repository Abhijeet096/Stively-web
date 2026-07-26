import type { ParsedPage } from "../parse-page";
import { scoreFromFindings, type CheckResult } from "./types";

const BLOG_NAV_REGEX = /\b(blog|news|articles|insights|resources)\b/i;
const TESTIMONIAL_REGEX = /\b(testimonial|review|what our clients|what our customers|success stor)/i;

export function runContentChecks(parsed: ParsedPage): CheckResult {
  const wordCount = parsed.visibleText.split(/\s+/).filter(Boolean).length;
  const hasBlogLink = parsed.$("a").filter((_, el) => BLOG_NAV_REGEX.test(parsed.$(el).text())).length > 0;
  const hasTestimonials = TESTIMONIAL_REGEX.test(parsed.visibleText);
  const hasServicesSection = /\b(services|what we do|our offerings)\b/i.test(parsed.visibleText);
  const hasAboutSection = /\b(about us|our story|who we are)\b/i.test(parsed.visibleText);

  return scoreFromFindings([
    { label: "Homepage has substantial content (200+ words)", passed: wordCount >= 200, detail: `${wordCount} words` },
    { label: "Links to a blog/news/articles section", passed: hasBlogLink },
    { label: "Has a testimonials/reviews section", passed: hasTestimonials },
    { label: "Describes services offered", passed: hasServicesSection },
    { label: "Has an About section", passed: hasAboutSection },
  ]);
}

/**
 * Separate from the scored checks above - these two booleans feed directly
 * into the Opportunity Score's `growthSignals` factor (see
 * server/scoring-engine.ts), so they're exposed individually rather than
 * buried inside a generic findings array only a human would read.
 */
export function detectGrowthSignals(parsed: ParsedPage): { hasBlog: boolean; hasRecentContent: boolean } {
  const hasBlog = parsed.$("a").filter((_, el) => BLOG_NAV_REGEX.test(parsed.$(el).text())).length > 0;
  // "Recent content" is a weak, honest proxy - a dated byline/copyright year
  // matching the current year - not a real CMS-freshness signal, which
  // would need a sitemap lastmod this feature doesn't always have.
  const currentYear = new Date().getFullYear();
  const hasRecentContent = parsed.visibleText.includes(String(currentYear));
  return { hasBlog, hasRecentContent };
}
