import type { ParsedPage } from "../parse-page";
import { scoreFromFindings, type CheckResult } from "./types";

export interface SeoAuxSignals {
  robotsTxtReachable: boolean;
  sitemapReachable: boolean;
}

export function runSeoChecks(parsed: ParsedPage, aux: SeoAuxSignals): CheckResult {
  const titleLength = parsed.title?.length ?? 0;
  const descriptionLength = parsed.metaDescription?.length ?? 0;

  const images = parsed.$("img");
  const imagesWithAlt = images.filter((_, el) => !!parsed.$(el).attr("alt")?.trim());
  const altRatio = images.length > 0 ? imagesWithAlt.length / images.length : 1;

  const hasCanonical = parsed.$('link[rel="canonical"]').length > 0;
  const hasOgTitle = parsed.$('meta[property="og:title"]').length > 0;
  const hasOgImage = parsed.$('meta[property="og:image"]').length > 0;

  return scoreFromFindings([
    { label: "Has a <title> tag (10-60 characters)", passed: titleLength >= 10 && titleLength <= 60, detail: parsed.title ?? "missing" },
    { label: "Has a meta description (50-160 characters)", passed: descriptionLength >= 50 && descriptionLength <= 160, detail: parsed.metaDescription ?? "missing" },
    { label: "Exactly one <h1>", passed: parsed.h1Count === 1, detail: `${parsed.h1Count} found` },
    { label: "Most images have alt text", passed: altRatio >= 0.8, detail: `${Math.round(altRatio * 100)}% of images` },
    { label: "Has a canonical link tag", passed: hasCanonical },
    { label: "Has Open Graph title + image tags", passed: hasOgTitle && hasOgImage },
    { label: "robots.txt is reachable", passed: aux.robotsTxtReachable },
    { label: "sitemap.xml is reachable", passed: aux.sitemapReachable },
  ]);
}
