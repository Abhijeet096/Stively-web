import type { ConnectorRunSummary, ConnectorResult } from "../types";
import type { BusinessImportRow } from "../../validation/business-schemas";

/**
 * Wraps a batch of already-validated CSV rows (column mapping happens
 * client-side, same as sales-crm's import wizard) into the standard
 * ConnectorResult shape - no network I/O, no dedupe (that's
 * server/creation.ts's job, shared across every connector).
 */
export async function runManualImportConnector(input: { rows: BusinessImportRow[] }): Promise<ConnectorRunSummary> {
  const results: ConnectorResult[] = [];
  const errors: { item: string; message: string }[] = [];

  input.rows.forEach((row, index) => {
    if (!row.businessName.trim()) {
      errors.push({ item: `row ${index + 1}`, message: "Missing business name" });
      return;
    }
    results.push({
      businessName: row.businessName,
      ownerName: row.ownerName || undefined,
      industry: row.industry || undefined,
      phone: row.phone || undefined,
      whatsapp: row.whatsapp || undefined,
      email: row.email || undefined,
      website: row.website || undefined,
      address: row.address || undefined,
      city: row.city || undefined,
      state: row.state || undefined,
      country: row.country || undefined,
    });
  });

  return { results, errors };
}
