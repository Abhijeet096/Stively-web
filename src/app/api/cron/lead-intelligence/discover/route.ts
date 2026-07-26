import { z } from "zod";

import { isValidCronRequest } from "@/features/lead-intelligence/server/cron-auth";
import { runConnectorAndPersist } from "@/features/lead-intelligence/server/creation";

const standingSearchSchema = z.object({
  query: z.string().trim().min(1),
  location: z.string().trim().min(1),
  radiusMeters: z.number().int().positive().optional(),
});

/**
 * Scheduled Google Places discovery - runs a small, env-driven list of
 * standing searches (LEAD_INTELLIGENCE_STANDING_SEARCHES, a JSON array of
 * {query, location}). A full "saved search" admin UI is a reasonable later
 * extension, not v1 scope - this reads the same shape a human would type
 * into the Discover page's search form. Calls the exact same
 * runConnectorAndPersist every manual search uses, just with
 * trigger: "CRON" - no duplicated logic between the two paths.
 */
export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const raw = process.env.LEAD_INTELLIGENCE_STANDING_SEARCHES;
  if (!raw) {
    return Response.json({ ok: true, runsTriggered: 0, note: "LEAD_INTELLIGENCE_STANDING_SEARCHES is not configured." });
  }

  let searches: unknown;
  try {
    searches = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "LEAD_INTELLIGENCE_STANDING_SEARCHES is not valid JSON." }, { status: 500 });
  }

  const parsed = z.array(standingSearchSchema).safeParse(searches);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "LEAD_INTELLIGENCE_STANDING_SEARCHES entries are malformed." }, { status: 500 });
  }

  const results = [];
  for (const search of parsed.data) {
    const result = await runConnectorAndPersist("GOOGLE_PLACES", search, "CRON");
    results.push({ search, ...result });
  }

  return Response.json({ ok: true, runsTriggered: results.length, results });
}
