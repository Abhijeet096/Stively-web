import type { SalesLeadSource, LeadPriority } from "@prisma/client";

/** Every SalesLead field an import row can populate - "notes" isn't a lead column, it becomes an initial SalesLeadNote. */
export type ImportField =
  | "businessName"
  | "ownerName"
  | "phone"
  | "whatsapp"
  | "email"
  | "website"
  | "industry"
  | "address"
  | "city"
  | "state"
  | "country"
  | "gstNumber"
  | "source"
  | "priority"
  | "estimatedValue"
  | "notes";

export const IMPORT_FIELD_LABEL: Record<ImportField, string> = {
  businessName: "Business Name",
  ownerName: "Owner / Contact Name",
  phone: "Phone",
  whatsapp: "WhatsApp",
  email: "Email",
  website: "Website",
  industry: "Industry",
  address: "Address",
  city: "City",
  state: "State",
  country: "Country",
  gstNumber: "GST Number",
  source: "Source",
  priority: "Priority",
  estimatedValue: "Estimated Value (₹)",
  notes: "Notes",
};

export const IMPORT_FIELD_ORDER: ImportField[] = [
  "businessName",
  "ownerName",
  "phone",
  "whatsapp",
  "email",
  "website",
  "industry",
  "address",
  "city",
  "state",
  "country",
  "gstNumber",
  "source",
  "priority",
  "estimatedValue",
  "notes",
];

export const REQUIRED_IMPORT_FIELDS: ImportField[] = ["businessName", "ownerName", "phone"];

/** Common real-world header spellings a Google Sheets export might use, lowercased for matching. */
const COLUMN_ALIASES: Record<ImportField, string[]> = {
  businessName: ["business name", "company", "company name", "business", "organisation", "organization", "client name"],
  ownerName: ["owner name", "contact name", "contact person", "owner", "contact", "person"],
  phone: ["phone", "phone number", "mobile", "mobile number", "contact number", "number"],
  whatsapp: ["whatsapp", "whatsapp number", "wa number"],
  email: ["email", "email address", "e-mail"],
  website: ["website", "url", "web"],
  industry: ["industry", "sector", "category", "business type"],
  address: ["address", "full address"],
  city: ["city", "town"],
  state: ["state", "province"],
  country: ["country"],
  gstNumber: ["gst", "gst number", "gstin", "gst no"],
  source: ["source", "lead source"],
  priority: ["priority"],
  estimatedValue: ["estimated value", "deal value", "value", "budget", "estimated budget"],
  notes: ["notes", "note", "remarks", "comments", "comment"],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ");
}

/** Best-effort auto-mapping from raw CSV headers to ImportField - the admin can still override any guess in the UI. */
export function detectColumnMapping(headers: string[]): Record<string, ImportField | null> {
  const mapping: Record<string, ImportField | null> = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    let match: ImportField | null = null;
    for (const field of IMPORT_FIELD_ORDER) {
      if (COLUMN_ALIASES[field].includes(normalized)) {
        match = field;
        break;
      }
    }
    mapping[header] = match;
  }
  return mapping;
}

const SOURCE_KEYWORDS: [keyword: string, source: SalesLeadSource][] = [
  ["indiamart", "INDIAMART"],
  ["google map", "GOOGLE_MAPS"],
  ["whatsapp", "WHATSAPP"],
  ["linkedin", "LINKEDIN"],
  ["cold call", "COLD_CALLING"],
  ["refer", "REFERRAL"],
  ["facebook", "FACEBOOK"],
  ["instagram", "INSTAGRAM"],
  ["website", "WEBSITE"],
];

/** Free-text -> enum, since a spreadsheet's "Source" column will never match SalesLeadSource exactly. Falls back to OTHER (or MANUAL if genuinely blank) rather than rejecting the row. */
export function normalizeSource(raw: string | undefined): SalesLeadSource {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return "MANUAL";
  for (const [keyword, source] of SOURCE_KEYWORDS) {
    if (value.includes(keyword)) return source;
  }
  return "OTHER";
}

export function normalizePriority(raw: string | undefined): LeadPriority {
  const value = (raw ?? "").trim().toLowerCase();
  if (value.startsWith("high") || value === "h") return "HIGH";
  if (value.startsWith("low") || value === "l") return "LOW";
  return "MEDIUM";
}
