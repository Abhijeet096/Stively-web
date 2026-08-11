import type { LeadSource, SalesLeadSource } from "@prisma/client";

/** Maps a raw inbound Lead's origin onto the existing SalesLeadSource enum - same pattern as lead-intelligence's mapBusinessDataSourceToSalesLeadSource, no schema additions needed. */
export function mapLeadSourceToSalesLeadSource(source: LeadSource): SalesLeadSource {
  switch (source) {
    case "CONTACT_FORM":
    case "START_PROJECT":
    case "PROGRAM_INTEREST":
    case "NEWSLETTER_POPUP":
    case "CLIENT_PORTAL":
      return "WEBSITE";
    case "CAREERS":
    case "OTHER":
      return "OTHER";
  }
}
