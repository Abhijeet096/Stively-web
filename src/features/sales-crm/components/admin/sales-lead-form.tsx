"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SalesLeadSource, LeadPriority, TeamMember } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createSalesLead } from "../../actions/sales-lead-actions";
import { SALES_LEAD_SOURCE_LABEL, LEAD_PRIORITY_LABEL } from "../../lib/labels";

const SOURCES: SalesLeadSource[] = [
  "WEBSITE",
  "WHATSAPP",
  "LINKEDIN",
  "COLD_CALLING",
  "REFERRAL",
  "INDIAMART",
  "GOOGLE_MAPS",
  "FACEBOOK",
  "INSTAGRAM",
  "MANUAL",
  "OTHER",
];
const PRIORITIES: LeadPriority[] = ["LOW", "MEDIUM", "HIGH"];

export interface SalesLeadFormProps {
  teamMembers: TeamMember[];
}

function SalesLeadForm({ teamMembers }: SalesLeadFormProps) {
  const router = useRouter();

  const [businessName, setBusinessName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [country, setCountry] = React.useState("India");
  const [gstNumber, setGstNumber] = React.useState("");
  const [source, setSource] = React.useState<SalesLeadSource>("MANUAL");
  const [priority, setPriority] = React.useState<LeadPriority>("MEDIUM");
  const [estimatedValue, setEstimatedValue] = React.useState("");
  const [assignedToId, setAssignedToId] = React.useState<string>("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);

    const result = await createSalesLead({
      businessName,
      ownerName,
      industry: industry || undefined,
      phone,
      whatsapp: whatsapp || undefined,
      email: email || undefined,
      website: website || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      country,
      gstNumber: gstNumber || undefined,
      source,
      priority,
      // paise
      estimatedValue: estimatedValue ? Math.round(Number(estimatedValue) * 100) : undefined,
      assignedToId: assignedToId || undefined,
    });

    setIsPending(false);
    if (!result.success || !result.id) {
      setError(result.success ? "Something went wrong." : result.error);
      return;
    }
    router.push(`/admin/sales-crm/leads/${result.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="sl-business-name" label="Business name">
          <Input id="sl-business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Retail Pvt Ltd" />
        </FormField>
        <FormField id="sl-owner-name" label="Owner / contact name">
          <Input id="sl-owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Rohan Mehta" />
        </FormField>
        <FormField id="sl-industry" label="Industry" optional>
          <Input id="sl-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Retail, Manufacturing..." />
        </FormField>
        <FormField id="sl-phone" label="Phone">
          <Input id="sl-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        </FormField>
        <FormField id="sl-whatsapp" label="WhatsApp" optional>
          <Input id="sl-whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </FormField>
        <FormField id="sl-email" label="Email" optional>
          <Input id="sl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField id="sl-website" label="Website" optional>
          <Input id="sl-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
        </FormField>
        <FormField id="sl-gst" label="GST number" optional>
          <Input id="sl-gst" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
        </FormField>
        <FormField id="sl-city" label="City" optional>
          <Input id="sl-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </FormField>
        <FormField id="sl-state" label="State" optional>
          <Input id="sl-state" value={state} onChange={(e) => setState(e.target.value)} />
        </FormField>
        <FormField id="sl-country" label="Country">
          <Input id="sl-country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </FormField>
        <FormField id="sl-value" label="Estimated deal value (₹)" optional>
          <Input id="sl-value" type="number" min={0} value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="100000" />
        </FormField>
        <FormField id="sl-source" label="Source">
          <Select value={source} onValueChange={(v) => setSource(v as SalesLeadSource)}>
            <SelectTrigger id="sl-source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SALES_LEAD_SOURCE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="sl-priority" label="Priority">
          <Select value={priority} onValueChange={(v) => setPriority(v as LeadPriority)}>
            <SelectTrigger id="sl-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {LEAD_PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="sl-assignee" label="Assign to" optional helpText="Defaults to you if left blank.">
          <Select value={assignedToId} onValueChange={setAssignedToId}>
            <SelectTrigger id="sl-assignee">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField id="sl-address" label="Address" optional>
        <Textarea id="sl-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
      </FormField>

      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button onClick={handleSubmit} loading={isPending} disabled={!businessName || !ownerName || !phone}>
        Create lead
      </Button>
    </div>
  );
}

export { SalesLeadForm };
