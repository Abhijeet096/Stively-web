/** Derived from OfferingEnrollment.sequence rather than stored - same convention as every other reference number in this codebase. */
export function formatEnrollmentNumber(sequence: number): string {
  return `ENR-${String(sequence).padStart(6, "0")}`;
}
