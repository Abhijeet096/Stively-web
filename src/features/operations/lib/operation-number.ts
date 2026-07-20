/** Derived from OperationItem.sequence rather than stored - same convention as Order/OfferingRequest's own number formatters. */
export function formatOperationNumber(sequence: number): string {
  return `OPS-${String(sequence).padStart(6, "0")}`;
}
