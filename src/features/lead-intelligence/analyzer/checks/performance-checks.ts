import type { FetchedPage } from "../fetch-page";
import type { ParsedPage } from "../parse-page";
import { scoreFromFindings, type CheckResult } from "./types";

/**
 * Deliberately named "performance-proxy", not "Performance Score" - a real
 * Lighthouse/Core-Web-Vitals measurement needs a headless browser this
 * feature doesn't run. These are honest, directly-measurable proxies
 * (response time, payload size, render-blocking resource counts), never
 * presented as more than that.
 */
export function runPerformanceChecks(page: FetchedPage, parsed: ParsedPage): CheckResult {
  const htmlSizeKb = Buffer.byteLength(page.html, "utf8") / 1024;

  const renderBlockingScripts = parsed
    .$("head script[src]")
    .filter((_, el) => !parsed.$(el).attr("defer") && !parsed.$(el).attr("async")).length;
  const externalStylesheets = parsed.$('link[rel="stylesheet"]').length;

  return scoreFromFindings([
    { label: "Responds in under 1.5s", passed: page.responseTimeMs < 1500, detail: `${page.responseTimeMs}ms` },
    { label: "HTML payload under 200KB", passed: htmlSizeKb < 200, detail: `${htmlSizeKb.toFixed(0)}KB` },
    { label: "Fewer than 5 render-blocking scripts in <head>", passed: renderBlockingScripts < 5, detail: `${renderBlockingScripts} found` },
    { label: "Fewer than 5 external stylesheets", passed: externalStylesheets < 5, detail: `${externalStylesheets} found` },
  ]);
}
