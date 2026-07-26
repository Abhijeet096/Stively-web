import type { ParsedPage } from "../parse-page";
import { scoreFromFindings, type CheckResult } from "./types";

export function runBusinessChecks(parsed: ParsedPage): CheckResult {
  const hasPhone = parsed.phones.length > 0;
  const hasMailto = parsed.$('a[href^="mailto:"]').length > 0;

  const businessJsonLd = parsed.jsonLd.find((entry) => typeof entry["@type"] === "string" && /LocalBusiness|Organization/i.test(entry["@type"] as string));
  const hasAddress = !!businessJsonLd?.address || /\b\d{5,6}\b/.test(parsed.visibleText); // JSON-LD address, or a bare postal-code-shaped number as a weak fallback signal
  const hasHours =
    !!businessJsonLd?.openingHours ||
    !!businessJsonLd?.openingHoursSpecification ||
    /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*[-–to]+\s*(mon|tue|wed|thu|fri|sat|sun)/i.test(parsed.visibleText) ||
    /\d{1,2}\s*(am|pm)\s*[-–to]+\s*\d{1,2}\s*(am|pm)/i.test(parsed.visibleText);

  return scoreFromFindings([
    { label: "Phone number detectable on the page", passed: hasPhone },
    { label: "Contact form or mailto link present", passed: parsed.hasContactForm || hasMailto },
    { label: "Address detectable (structured data or text)", passed: hasAddress },
    { label: "Business hours detectable", passed: hasHours },
    { label: "WhatsApp click-to-chat link present", passed: !!parsed.whatsappNumber },
  ]);
}
