import "server-only";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

/**
 * Fields actually requested from Text Search - id/displayName/types are
 * "Essentials" SKU tier; formattedAddress/nationalPhoneNumber/websiteUri/
 * rating/userRatingCount are "Pro" SKU tier (Google Places API New pricing).
 * Deliberately does NOT request addressComponents/plusCode/reviews
 * ("Enterprise" tier, materially more expensive) - Business.city/state stay
 * null for Google-discovered rows rather than pushing the user into a
 * pricier billing tier by default for fields this feature doesn't strictly
 * need (the full formattedAddress is still stored on Business.address).
 */
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.types",
].join(",");

export class GooglePlacesNotConfiguredError extends Error {
  constructor() {
    super("GOOGLE_PLACES_API_KEY is not set");
    this.name = "GooglePlacesNotConfiguredError";
  }
}

let warned = false;

/** Same lazy-check-and-warn-once gating as src/lib/razorpay.ts's missing-key handling - never fabricate results, just no-op with a clear error. */
function assertGooglePlacesConfigured(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    if (!warned) {
      console.warn("GOOGLE_PLACES_API_KEY is not set - the Google Business connector will no-op.");
      warned = true;
    }
    throw new GooglePlacesNotConfiguredError();
  }
  return key;
}

export interface GooglePlaceResult {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
}

/**
 * Google Places API (New) "Text Search". Location is folded into the query
 * text (e.g. "restaurants in Pune, India") rather than using locationBias,
 * since locationBias needs a geocoded lat/lng center this feature doesn't
 * resolve (no geocoding call in scope) - honestly simpler, not a fabricated
 * radius filter. `radiusMeters` is accepted for a future geocoding-backed
 * upgrade but currently unused.
 */
export async function searchTextPlaces(input: { query: string; location: string; radiusMeters?: number }): Promise<GooglePlaceResult[]> {
  const apiKey = assertGooglePlacesConfigured();

  const response = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: `${input.query} in ${input.location}` }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google Places search failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as { places?: GooglePlaceResult[] };
  return data.places ?? [];
}
