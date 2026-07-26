import type { ConnectorType } from "@prisma/client";

import type { ConnectorRunSummary } from "./types";
import { runWebsiteConnector } from "./website/connector";
import { runManualImportConnector } from "./manualImport/connector";
import type { BusinessImportRow } from "../validation/business-schemas";

/**
 * The single entry point runConnectorAndPersist (server/creation.ts) calls,
 * used identically from both admin-triggered actions and cron routes -
 * both boundaries already deal in loosely-typed input (a connector's
 * `input` is stored as Json on LeadIntelligenceSearchRun), so the cast here
 * is the one place that untyped-ness is allowed to leak in; every connector
 * function itself keeps a fully-typed signature.
 */
export async function dispatchConnector(type: ConnectorType, input: unknown): Promise<ConnectorRunSummary> {
  switch (type) {
    case "WEBSITE":
      return runWebsiteConnector(input as { url: string });
    case "MANUAL_IMPORT":
      return runManualImportConnector(input as { rows: BusinessImportRow[] });
    case "GOOGLE_PLACES": {
      const { runGoogleBusinessConnector } = await import("./googleBusiness/connector");
      return runGoogleBusinessConnector(input as { query: string; location: string; radiusMeters?: number });
    }
    default: {
      const _exhaustive: never = type;
      return { results: [], errors: [{ item: String(_exhaustive), message: "Unknown connector type." }] };
    }
  }
}
