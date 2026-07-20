import Link from "next/link";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LEAD_TYPE_OPTIONS = [
  { value: "STUDENT", label: "Student" },
  { value: "BUSINESS", label: "Business" },
];

const STATUS_OPTIONS = [
  "NEW",
  "ASSIGNED",
  "FIRST_CALL",
  "INTERESTED",
  "CALLBACK_REQUESTED",
  "NOT_RESPONDED",
  "NOT_INTERESTED",
  "COUNSELLING",
  "ENROLLMENT",
  "PAYMENT",
  "INITIAL_CONTACT",
  "WHATSAPP_DISCUSSION",
  "DISCOVERY_CALL",
  "REQUIREMENTS_GATHERING",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "PROJECT_APPROVED",
  "DEVELOPMENT_STARTED",
  "CONVERTED",
  "LOST",
];

const SOURCE_OPTIONS = [
  { value: "CONTACT_FORM", label: "Contact Form" },
  { value: "PROGRAM_INTEREST", label: "Program Interest" },
  { value: "CAREERS", label: "Careers" },
  { value: "NEWSLETTER_POPUP", label: "Newsletter" },
  { value: "OTHER", label: "Other" },
];

export interface Owner {
  id: string;
  name: string;
}

export interface LeadsFiltersProps {
  search?: string;
  leadType?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  owners: Owner[];
  action: string;
  hideLeadType?: boolean;
}

const nativeSelectClassName =
  "h-10 rounded-md border border-input bg-background px-3 text-sm outline-none " +
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

/**
 * Same native <form method="get"> pattern as
 * src/components/sections/training-filters.tsx - zero client JS, filter
 * state lives entirely in the URL, which is also what "Verify every
 * dashboard page" needs to be checkable via a plain page load.
 */
function LeadsFilters({
  search,
  leadType,
  status,
  source,
  ownerId,
  owners,
  action,
  hideLeadType,
}: LeadsFiltersProps) {
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          type="text"
          defaultValue={search}
          placeholder="Name, email, phone, company..."
          className="w-56"
        />
      </div>

      {!hideLeadType && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leadType">Lead type</Label>
          <select
            id="leadType"
            name="leadType"
            defaultValue={leadType ?? ""}
            className={nativeSelectClassName}
          >
            <option value="">All</option>
            {LEAD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={status ?? ""}
          className={nativeSelectClassName}
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="source">Source</Label>
        <select
          id="source"
          name="source"
          defaultValue={source ?? ""}
          className={nativeSelectClassName}
        >
          <option value="">All</option>
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ownerId">Owner</Label>
        <select
          id="ownerId"
          name="ownerId"
          defaultValue={ownerId ?? ""}
          className={nativeSelectClassName}
        >
          <option value="">All</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">Apply filters</Button>

      {(search || leadType || status || source || ownerId) && (
        <Button type="button" variant="ghost" asChild>
          <Link href={action}>Clear filters</Link>
        </Button>
      )}
    </form>
  );
}

export { LeadsFilters };
