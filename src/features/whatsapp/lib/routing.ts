/**
 * Deterministic, keyword-based agency-intent classification - checked
 * BEFORE the AI ever sees a message. Requirement #12's own example phrases
 * plus close, obvious variants. Deliberately not AI-driven: a routing
 * decision this important (autonomous AI sales conversation vs. mandatory
 * human handoff) should be reliable and auditable, not dependent on a
 * model's judgment call on every message - same reasoning the deterministic
 * product-recommendation map (lib/products.ts) already applies to a
 * different simple decision.
 */
const AGENCY_INTENT_PATTERN =
  /\b(websites?|web\s?app(?:lication)?s?|webapps?|custom\s?softwares?|software\s?development|mobile\s?app(?:lication)?s?|android\s?apps?|ios\s?apps?|business\s?websites?|startup\s?websites?|e-?commerce\s?(?:sites?|stores?|websites?)|online\s?stores?|build\s?(?:me\s?)?(?:a|an|our)?\s?(?:app|website|software|platform)s?|develop\s?(?:a|an|our)?\s?(?:app|website|software)s?|crm\s?(?:systems?|development)|need\s?a\s?developer|hire\s?a?\s?developers?)\b/i;

export function classifyAgencyIntent(messageText: string): boolean {
  return AGENCY_INTENT_PATTERN.test(messageText);
}

/** Unambiguous opt-out phrases - Meta itself expects businesses to honor a plain "STOP". Kept intentionally narrow (no fuzzy matching) so a message like "please stop selling me on features I don't need" isn't misread as an opt-out. */
const OPT_OUT_PATTERN = /^\s*(stop|unsubscribe|opt\s?out)\s*[.!]?\s*$/i;

export function classifyOptOut(messageText: string): boolean {
  return OPT_OUT_PATTERN.test(messageText);
}
