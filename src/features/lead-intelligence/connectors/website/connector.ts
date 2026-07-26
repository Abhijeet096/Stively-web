import { fetchPageSafely } from "../../analyzer/fetch-page";
import { parsePage } from "../../analyzer/parse-page";
import type { ConnectorRunSummary } from "../types";

/**
 * Given a URL, fetches and parses it (through the SSRF-guarded fetch) and
 * extracts whatever Business fields are honestly determinable from the
 * page itself - always 0-or-1 results, never fabricated. Used both
 * standalone (an admin pastes a URL) and chained automatically after a
 * Google Places discovery (server/creation.ts) so Social Presence data is
 * always real, scraped data, never invented.
 */
export async function runWebsiteConnector(input: { url: string }): Promise<ConnectorRunSummary> {
  try {
    const page = await fetchPageSafely(input.url);
    if (page.status >= 400) {
      return { results: [], errors: [{ item: input.url, message: `Site returned HTTP ${page.status}` }] };
    }

    const parsed = parsePage(page.html);
    const jsonLdBusiness = parsed.jsonLd.find(
      (entry) => typeof entry["@type"] === "string" && /LocalBusiness|Organization|Corporation/i.test(entry["@type"] as string)
    );

    const businessName =
      (typeof jsonLdBusiness?.name === "string" ? jsonLdBusiness.name : undefined) ??
      parsed.ogSiteName ??
      parsed.title ??
      new URL(page.url).hostname;

    const jsonLdAddress = jsonLdBusiness?.address as Record<string, unknown> | undefined;

    return {
      results: [
        {
          businessName,
          phone: parsed.phones[0],
          whatsapp: parsed.whatsappNumber ?? undefined,
          email: parsed.emails[0],
          website: page.url,
          address: typeof jsonLdAddress?.streetAddress === "string" ? jsonLdAddress.streetAddress : undefined,
          city: typeof jsonLdAddress?.addressLocality === "string" ? jsonLdAddress.addressLocality : undefined,
          state: typeof jsonLdAddress?.addressRegion === "string" ? jsonLdAddress.addressRegion : undefined,
          country: typeof jsonLdAddress?.addressCountry === "string" ? jsonLdAddress.addressCountry : undefined,
          socialLinks: parsed.socialLinks,
        },
      ],
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch or parse the page";
    return { results: [], errors: [{ item: input.url, message }] };
  }
}
