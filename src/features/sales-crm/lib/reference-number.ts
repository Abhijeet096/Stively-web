/** Derived from sequence rather than stored - same convention as OperationItem/Order/OfferingRequest's own number formatters. */
export function formatSalesLeadNumber(sequence: number): string {
  return `SL-${String(sequence).padStart(6, "0")}`;
}

export function formatSalesProjectNumber(sequence: number): string {
  return `SP-${String(sequence).padStart(6, "0")}`;
}
