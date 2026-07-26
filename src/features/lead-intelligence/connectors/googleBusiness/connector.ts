import { searchTextPlaces, GooglePlacesNotConfiguredError } from "./client";
import { googlePlaceResultSchema } from "./schema";
import type { ConnectorRunSummary, ConnectorResult } from "../types";

function humanizeType(type?: string): string | undefined {
  if (!type) return undefined;
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Real Google Places (New) Text Search connector - gated on
 * GOOGLE_PLACES_API_KEY via client.ts's assertGooglePlacesConfigured.
 * Missing key -> empty result set with a clear "not configured" error
 * entry, never fabricated businesses. A discovered place with a website
 * gets auto-chained into the `website` connector by
 * server/creation.ts::runConnectorAndPersist, since Places never returns
 * social media links.
 */
export async function runGoogleBusinessConnector(input: {
  query: string;
  location: string;
  radiusMeters?: number;
}): Promise<ConnectorRunSummary> {
  try {
    const places = await searchTextPlaces(input);
    const results: ConnectorResult[] = [];
    const errors: { item: string; message: string }[] = [];

    for (const raw of places) {
      const parsed = googlePlaceResultSchema.safeParse(raw);
      if (!parsed.success) {
        errors.push({ item: raw.id ?? "unknown", message: "Unexpected Google Places response shape" });
        continue;
      }
      const place = parsed.data;
      const businessName = place.displayName?.text;
      if (!businessName) {
        errors.push({ item: place.id, message: "Place has no display name" });
        continue;
      }

      results.push({
        businessName,
        industry: humanizeType(place.types?.[0]),
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        address: place.formattedAddress,
        googlePlaceId: place.id,
        googleRating: place.rating,
        googleReviewCount: place.userRatingCount,
        googlePlaceTypes: place.types,
      });
    }

    return { results, errors };
  } catch (error) {
    if (error instanceof GooglePlacesNotConfiguredError) {
      return { results: [], errors: [{ item: "config", message: "Google Places API key not configured yet." }] };
    }
    const message = error instanceof Error ? error.message : "Google Places search failed";
    return { results: [], errors: [{ item: input.query, message }] };
  }
}
