export { formatPrice as formatDocumentCurrency } from "@/lib/utils";

/** "31 October 2026" - the same style the founder's reference invoice uses. */
export function formatDocumentDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}
