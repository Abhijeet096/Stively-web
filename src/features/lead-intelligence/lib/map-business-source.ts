import type { BusinessDataSource, SalesLeadSource } from "@prisma/client";

/** Maps a discovered Business's origin onto the existing SalesLeadSource enum - all four values already exist, no schema additions needed. */
export function mapBusinessDataSourceToSalesLeadSource(source: BusinessDataSource): SalesLeadSource {
  switch (source) {
    case "GOOGLE_PLACES":
      return "GOOGLE_MAPS";
    case "WEBSITE":
      return "WEBSITE";
    case "MANUAL_IMPORT":
    case "MANUAL_ENTRY":
      return "MANUAL";
  }
}
