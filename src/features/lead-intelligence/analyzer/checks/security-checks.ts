import type { FetchedPage } from "../fetch-page";
import type { ParsedPage } from "../parse-page";
import { scoreFromFindings, type CheckResult } from "./types";

export function runSecurityChecks(page: FetchedPage, parsed: ParsedPage): CheckResult {
  const isHttps = new URL(page.url).protocol === "https:";
  const hasHsts = page.headers.has("strict-transport-security");
  const hasCsp = page.headers.has("content-security-policy");
  const hasFrameOptions = page.headers.has("x-frame-options") || /frame-ancestors/i.test(page.headers.get("content-security-policy") ?? "");

  const mixedContentAssets = parsed.$("img[src], script[src], link[href]")
    .map((_, el) => parsed.$(el).attr("src") ?? parsed.$(el).attr("href"))
    .get()
    .filter((src): src is string => !!src && /^http:\/\//i.test(src));
  const hasMixedContent = isHttps && mixedContentAssets.length > 0;

  return scoreFromFindings([
    { label: "Serves over HTTPS", passed: isHttps },
    { label: "No mixed-content (http://) assets on an https page", passed: !hasMixedContent, detail: hasMixedContent ? `${mixedContentAssets.length} insecure asset(s)` : undefined },
    { label: "Sends an HSTS header", passed: hasHsts },
    { label: "Sends a Content-Security-Policy header", passed: hasCsp },
    { label: "Sends X-Frame-Options or frame-ancestors", passed: hasFrameOptions },
  ]);
}
