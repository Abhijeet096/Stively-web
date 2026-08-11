"use client";

import * as React from "react";
import type { DiscoveryForm } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FUNCTIONAL_REQUIREMENT_FIELDS } from "../lib/labels";
import type { DiscoveryFormContent } from "../validation/discovery-form-schemas";

function fromForm(form: Partial<DiscoveryForm> | undefined): DiscoveryFormContent {
  return {
    clientCompanyName: form?.clientCompanyName ?? "",
    contactPerson: form?.contactPerson ?? "",
    contactEmail: form?.contactEmail ?? "",
    contactPhone: form?.contactPhone ?? "",
    businessIndustry: form?.businessIndustry ?? "",
    currentWebsite: form?.currentWebsite ?? "",
    businessStage: form?.businessStage ?? "",
    primaryGoal: form?.primaryGoal ?? "",
    projectDescription: form?.projectDescription ?? "",
    problemToSolve: form?.problemToSolve ?? "",
    targetUsers: form?.targetUsers ?? "",
    importantFeatures: form?.importantFeatures ?? "",
    hasExistingSystem: form?.hasExistingSystem ?? false,
    existingSystemIssues: form?.existingSystemIssues ?? "",
    successDefinition: form?.successDefinition ?? "",
    needsUserAccounts: form?.needsUserAccounts ?? false,
    needsAdminDashboard: form?.needsAdminDashboard ?? false,
    needsPayments: form?.needsPayments ?? false,
    needsNotifications: form?.needsNotifications ?? false,
    needsEmail: form?.needsEmail ?? false,
    needsSearch: form?.needsSearch ?? false,
    needsBooking: form?.needsBooking ?? false,
    needsContentManagement: form?.needsContentManagement ?? false,
    needsAnalytics: form?.needsAnalytics ?? false,
    needsIntegrations: form?.needsIntegrations ?? false,
    needsAiFeatures: form?.needsAiFeatures ?? false,
    needsMobileResponsive: form?.needsMobileResponsive ?? false,
    otherFunctionalNeeds: form?.otherFunctionalNeeds ?? "",
    additionalNotes: form?.additionalNotes ?? "",
    desiredLaunchDate: form?.desiredLaunchDate ?? undefined,
    priorityLevel: form?.priorityLevel ?? undefined,
    expectedBudgetRange: form?.expectedBudgetRange ?? "",
    hostingPreference: form?.hostingPreference ?? "",
    maintenanceRequired: form?.maintenanceRequired ?? false,
    postLaunchSupport: form?.postLaunchSupport ?? "",
    importantConstraints: form?.importantConstraints ?? "",
    commercialNotes: form?.commercialNotes ?? "",
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-border flex flex-col gap-5 rounded-xl border p-5">
      <legend className="text-foreground px-1 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export interface DiscoveryFormFieldsProps {
  initial?: Partial<DiscoveryForm>;
  onSubmit: (content: DiscoveryFormContent) => Promise<{ success: boolean; error?: string }>;
}

/** The full 4-section Client Discovery & Requirements Form - shared by the public /discovery/[token] page and the authenticated client-portal tab, since the fields and submit shape are identical either way. */
function DiscoveryFormFields({ initial, onSubmit }: DiscoveryFormFieldsProps) {
  const [content, setContent] = React.useState<DiscoveryFormContent>(() => fromForm(initial));
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [submitted, setSubmitted] = React.useState(false);

  function set<K extends keyof DiscoveryFormContent>(key: K, value: DiscoveryFormContent[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);
    const result = await onSubmit(content);
    setIsPending(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="border-border flex flex-col items-center gap-2 rounded-xl border p-10 text-center">
        <h2 className="font-display text-xl font-semibold">Thanks - we&apos;ve got it.</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Your requirements are with our team. We&apos;ll follow up once we&apos;ve reviewed everything.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Section title="Client & Business Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client / Company name">
            <Input value={content.clientCompanyName} onChange={(e) => set("clientCompanyName", e.target.value)} />
          </Field>
          <Field label="Contact person">
            <Input value={content.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={content.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={content.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </Field>
          <Field label="Business / Industry">
            <Input value={content.businessIndustry} onChange={(e) => set("businessIndustry", e.target.value)} />
          </Field>
          <Field label="Current website (if any)">
            <Input value={content.currentWebsite} onChange={(e) => set("currentWebsite", e.target.value)} />
          </Field>
          <Field label="Business stage">
            <Input value={content.businessStage} onChange={(e) => set("businessStage", e.target.value)} placeholder="e.g. Idea, launched, scaling" />
          </Field>
        </div>
        <Field label="Primary business goal">
          <Textarea value={content.primaryGoal} onChange={(e) => set("primaryGoal", e.target.value)} rows={2} />
        </Field>
      </Section>

      <Section title="Project Requirements">
        <Field label="What are you looking to build?">
          <Textarea value={content.projectDescription} onChange={(e) => set("projectDescription", e.target.value)} rows={3} />
        </Field>
        <Field label="What problem should the solution solve?">
          <Textarea value={content.problemToSolve} onChange={(e) => set("problemToSolve", e.target.value)} rows={2} />
        </Field>
        <Field label="Who will use it?">
          <Textarea value={content.targetUsers} onChange={(e) => set("targetUsers", e.target.value)} rows={2} />
        </Field>
        <Field label="What are the most important features?">
          <Textarea value={content.importantFeatures} onChange={(e) => set("importantFeatures", e.target.value)} rows={3} />
        </Field>
        <div className="flex items-center gap-2">
          <Checkbox
            id="hasExistingSystem"
            checked={content.hasExistingSystem}
            onCheckedChange={(v) => set("hasExistingSystem", v === true)}
          />
          <Label htmlFor="hasExistingSystem" className="font-normal">
            There&apos;s an existing system already
          </Label>
        </div>
        {content.hasExistingSystem && (
          <Field label="What currently doesn't work well?">
            <Textarea value={content.existingSystemIssues} onChange={(e) => set("existingSystemIssues", e.target.value)} rows={2} />
          </Field>
        )}
        <Field label="What would success look like?">
          <Textarea value={content.successDefinition} onChange={(e) => set("successDefinition", e.target.value)} rows={2} />
        </Field>
      </Section>

      <Section title="Functional Requirements">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FUNCTIONAL_REQUIREMENT_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <Checkbox
                id={field.key}
                checked={content[field.key]}
                onCheckedChange={(v) => set(field.key, v === true)}
              />
              <Label htmlFor={field.key} className="font-normal">
                {field.label}
              </Label>
            </div>
          ))}
        </div>
        <Field label="Other requirements">
          <Textarea value={content.otherFunctionalNeeds} onChange={(e) => set("otherFunctionalNeeds", e.target.value)} rows={2} />
        </Field>
        <Field label="Additional details / notes">
          <Textarea value={content.additionalNotes} onChange={(e) => set("additionalNotes", e.target.value)} rows={2} />
        </Field>
      </Section>

      <Section title="Commercial & Delivery">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Desired launch date">
            <Input
              type="date"
              value={content.desiredLaunchDate ? new Date(content.desiredLaunchDate).toISOString().slice(0, 10) : ""}
              onChange={(e) => set("desiredLaunchDate", e.target.value ? new Date(e.target.value) : undefined)}
            />
          </Field>
          <Field label="Priority level">
            <Select value={content.priorityLevel ?? ""} onValueChange={(v) => set("priorityLevel", v as DiscoveryFormContent["priorityLevel"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Expected budget range">
            <Input value={content.expectedBudgetRange} onChange={(e) => set("expectedBudgetRange", e.target.value)} />
          </Field>
          <Field label="Hosting preference">
            <Input value={content.hostingPreference} onChange={(e) => set("hostingPreference", e.target.value)} />
          </Field>
          <Field label="Post-launch support expectations">
            <Input value={content.postLaunchSupport} onChange={(e) => set("postLaunchSupport", e.target.value)} />
          </Field>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="maintenanceRequired"
            checked={content.maintenanceRequired}
            onCheckedChange={(v) => set("maintenanceRequired", v === true)}
          />
          <Label htmlFor="maintenanceRequired" className="font-normal">
            Ongoing maintenance required
          </Label>
        </div>
        <Field label="Important constraints">
          <Textarea value={content.importantConstraints} onChange={(e) => set("importantConstraints", e.target.value)} rows={2} />
        </Field>
        <Field label="Additional notes">
          <Textarea value={content.commercialNotes} onChange={(e) => set("commercialNotes", e.target.value)} rows={2} />
        </Field>
      </Section>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" size="lg" loading={isPending}>
        Submit
      </Button>
    </form>
  );
}

export { DiscoveryFormFields };
