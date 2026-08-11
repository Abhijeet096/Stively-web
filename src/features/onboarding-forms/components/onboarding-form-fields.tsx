"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import type { OnboardingForm } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { UploadWarning } from "../server/upload-files";

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-border flex flex-col gap-5 border-t pt-8">
      <legend className="flex items-baseline gap-3 px-0 pb-1">
        <span className="text-primary font-display text-sm font-extrabold">{number}</span>
        <span className="font-display text-xl font-extrabold sm:text-2xl">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function FileField({ label, name, multiple }: { label: string; name: string; multiple?: boolean }) {
  const [fileNames, setFileNames] = React.useState<string[]>([]);
  const inputId = React.useId();

  return (
    <Field label={label}>
      <label
        htmlFor={inputId}
        className="border-border bg-muted/40 hover:bg-muted flex min-h-[38px] cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2 text-sm"
      >
        <span className="text-muted-foreground truncate">
          {fileNames.length === 0
            ? multiple
              ? "No files selected"
              : "No file selected"
            : fileNames.length === 1
              ? fileNames[0]
              : `${fileNames.length} files selected`}
        </span>
        <span className="text-primary shrink-0 text-xs font-extrabold tracking-wide">BROWSE</span>
        <input
          id={inputId}
          type="file"
          name={name}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))}
        />
      </label>
    </Field>
  );
}

function dateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export interface OnboardingFormFieldsProps {
  initial?: Partial<OnboardingForm>;
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string; warnings?: UploadWarning[] }>;
}

/**
 * The full 7-section Client Onboarding Form, transcribed verbatim from the
 * Claude Design handoff (labels, placeholders, required marks, warning
 * copy, thank-you copy) but built with this codebase's own form
 * primitives - same precedent as DiscoveryFormFields. Shared by the public
 * /onboarding/[token] page and the authenticated client-portal tab.
 * Uncontrolled/native inputs (not React state per field) since this form
 * carries real File uploads alongside text, submitted as one FormData.
 */
function OnboardingFormFields({ initial, onSubmit }: OnboardingFormFieldsProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [warnings, setWarnings] = React.useState<UploadWarning[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("confirmedAccurate", confirmed ? "on" : "");
    setIsPending(true);
    setError(undefined);
    const result = await onSubmit(formData);
    setIsPending(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setWarnings(result.warnings ?? []);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="border-primary bg-primary/5 flex flex-col gap-2 rounded-md border p-6">
        <p className="font-display text-base font-extrabold">Thank you — your onboarding form has been received.</p>
        <p className="text-muted-foreground text-sm">
          A Stively project coordinator will follow up within one business day with secure credential-sharing
          instructions for the systems you listed.
        </p>
        {warnings.length > 0 && (
          <ul className="text-destructive mt-2 flex flex-col gap-1 text-sm">
            {warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="border-border grid gap-4 border-t pt-6 sm:grid-cols-2">
        <Field label="Form date">
          <Input type="date" name="formDate" defaultValue={dateInputValue(initial?.formDate)} />
        </Field>
        <Field label="Prepared by (Stively contact)">
          <Input name="preparedBy" defaultValue={initial?.preparedBy ?? ""} placeholder="Account manager name" />
        </Field>
      </div>

      <Section number="01" title="Client information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" required>
            <Input name="company" defaultValue={initial?.company ?? ""} placeholder="Company legal name" required />
          </Field>
          <Field label="Primary contact" required>
            <Input name="primaryContact" defaultValue={initial?.primaryContact ?? ""} placeholder="Full name" required />
          </Field>
          <Field label="Email" required>
            <Input type="email" name="email" defaultValue={initial?.email ?? ""} placeholder="name@company.com" required />
          </Field>
          <Field label="Phone">
            <Input type="tel" name="phone" defaultValue={initial?.phone ?? ""} placeholder="+1 (___) ___-____" />
          </Field>
        </div>
        <Field label="Billing information">
          <Textarea
            name="billingInfo"
            defaultValue={initial?.billingInfo ?? ""}
            placeholder="Billing contact, address, PO number if applicable"
            rows={3}
          />
        </Field>
      </Section>

      <Section number="02" title="Project information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name" required>
            <Input name="projectName" defaultValue={initial?.projectName ?? ""} placeholder="Working project title" required />
          </Field>
          <Field label="Target audience">
            <Input name="targetAudience" defaultValue={initial?.targetAudience ?? ""} placeholder="Who is this built for?" />
          </Field>
        </div>
        <Field label="Approved scope" required>
          <Textarea
            name="approvedScope"
            defaultValue={initial?.approvedScope ?? ""}
            placeholder="Paste or summarize the scope from the signed proposal/SOW"
            rows={3}
            required
          />
        </Field>
        <Field label="Primary objective">
          <Textarea
            name="primaryObjective"
            defaultValue={initial?.primaryObjective ?? ""}
            placeholder="The single most important outcome for this project"
            rows={2}
          />
        </Field>
      </Section>

      <Section number="03" title="Brand assets">
        <div className="grid gap-4 sm:grid-cols-2">
          <FileField label="Logo files" name="logo" />
          <FileField label="Brand guidelines" name="guidelines" />
          <Field label="Brand colors">
            <Input name="brandColors" defaultValue={initial?.brandColors ?? ""} placeholder="Hex codes or link to palette" />
          </Field>
          <Field label="Brand fonts">
            <Input name="brandFonts" defaultValue={initial?.brandFonts ?? ""} placeholder="Typeface names / links to license" />
          </Field>
          <FileField label="Brand images" name="brandImages" multiple />
          <FileField label="Existing design files" name="designFiles" multiple />
        </div>
      </Section>

      <Section number="04" title="Technical access">
        <div className="border-primary bg-primary/5 flex gap-3 rounded-md border p-4">
          <ShieldAlert className="text-primary mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            <strong className="font-extrabold">Do not enter passwords or secret API keys into this form.</strong> Use
            the fields below to name the systems and account owners, then share credentials through a secure
            channel — a password manager invite (1Password, Bitwarden), a time-limited secret link, or a call with
            our engineering team. We&apos;ll send setup instructions per system once this form is submitted.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Domain registrar">
            <Input name="domainRegistrar" defaultValue={initial?.domainRegistrar ?? ""} placeholder="e.g. GoDaddy, Namecheap — account owner" />
          </Field>
          <Field label="Hosting provider">
            <Input name="hostingProvider" defaultValue={initial?.hostingProvider ?? ""} placeholder="e.g. AWS, Vercel — account owner" />
          </Field>
          <Field label="GitHub / source control">
            <Input name="githubOrg" defaultValue={initial?.githubOrg ?? ""} placeholder="Org name — invite stively-dev as collaborator" />
          </Field>
          <Field label="Cloud / infrastructure">
            <Input name="cloudInfrastructure" defaultValue={initial?.cloudInfrastructure ?? ""} placeholder="e.g. AWS, GCP, Azure — account owner" />
          </Field>
          <Field label="API credentials needed">
            <Input name="apiCredentialsNeeded" defaultValue={initial?.apiCredentialsNeeded ?? ""} placeholder="Which services — share keys via secure link, not here" />
          </Field>
          <Field label="Third-party services">
            <Input name="thirdPartyServices" defaultValue={initial?.thirdPartyServices ?? ""} placeholder="Payments, analytics, CRM, email, etc." />
          </Field>
        </div>
      </Section>

      <Section number="05" title="Content">
        <div className="grid gap-4 sm:grid-cols-2">
          <FileField label="Website copy" name="copy" />
          <FileField label="Images" name="contentImages" multiple />
          <FileField label="Documents" name="documents" multiple />
        </div>
        <Field label="Product information">
          <Textarea
            name="productInformation"
            defaultValue={initial?.productInformation ?? ""}
            placeholder="SKUs, catalogs, specs, or link to source of truth"
            rows={3}
          />
        </Field>
        <Field label="Legal pages">
          <Textarea
            name="legalPages"
            defaultValue={initial?.legalPages ?? ""}
            placeholder="Privacy policy, terms of service — paste text or link"
            rows={2}
          />
        </Field>
      </Section>

      <Section number="06" title="Communication">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary communication channel">
            <Input name="primaryCommunicationChannel" defaultValue={initial?.primaryCommunicationChannel ?? ""} placeholder="Email, Slack Connect, phone, etc." />
          </Field>
          <Field label="Primary decision maker">
            <Input name="primaryDecisionMaker" defaultValue={initial?.primaryDecisionMaker ?? ""} placeholder="Name and title" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Review / approval contact">
              <Input name="reviewApprovalContact" defaultValue={initial?.reviewApprovalContact ?? ""} placeholder="Who signs off on deliverables, if different above" />
            </Field>
          </div>
        </div>
      </Section>

      <Section number="07" title="Project approval">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project start date" required>
            <Input type="date" name="projectStartDate" defaultValue={dateInputValue(initial?.projectStartDate)} required />
          </Field>
          <Field label="Expected milestone dates">
            <Input name="expectedMilestoneDates" defaultValue={initial?.expectedMilestoneDates ?? ""} placeholder="e.g. Design review 9/15, Beta 10/20" />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea name="notes" defaultValue={initial?.notes ?? ""} placeholder="Anything else we should know before kickoff" rows={3} />
        </Field>
      </Section>

      <div className="border-border flex flex-col gap-4 border-t pt-8">
        <div className="flex items-start gap-2">
          <Checkbox id="confirmedAccurate" checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
          <Label htmlFor="confirmedAccurate" className="font-normal">
            I confirm the information above is accurate to the best of my knowledge and I am authorized to submit it
            on behalf of the company named.
          </Label>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" size="lg" loading={isPending} disabled={!confirmed}>
          Submit onboarding form
        </Button>

        <p className="text-muted-foreground max-w-[60ch] text-xs">
          Submitting this form does not transmit passwords or API secrets — those are exchanged separately through a
          secure credential-sharing channel after submission.
        </p>
      </div>
    </form>
  );
}

export { OnboardingFormFields };
