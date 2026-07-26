/**
 * The dedupe key for the `website` connector path - "https://www.Acme.com/"
 * and "acme.com" should both dedupe against the same Business row. Strips
 * protocol, "www.", trailing slash, and lowercases; returns null for
 * anything unparseable rather than throwing.
 */
export function normalizeWebsiteDomain(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}
