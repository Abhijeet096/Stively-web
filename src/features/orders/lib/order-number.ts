/** Derived from Order.sequence rather than stored as its own column - same convention as src/features/offering-requests/lib/request-number.ts. */
export function formatOrderNumber(sequence: number): string {
  return `ORD-${String(sequence).padStart(6, "0")}`;
}
