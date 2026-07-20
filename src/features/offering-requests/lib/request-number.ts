/**
 * Derives the human-friendly request number from OfferingRequest.sequence
 * rather than storing it as its own redundant text column (see
 * prisma/schema.prisma's comment on that field). One format for both
 * request types - one engine, one numbering scheme.
 */
export function formatRequestNumber(sequence: number): string {
  return `REQ-${String(sequence).padStart(6, "0")}`;
}
