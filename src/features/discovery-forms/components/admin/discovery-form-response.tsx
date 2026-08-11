import type { DiscoveryForm } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FUNCTIONAL_REQUIREMENT_FIELDS } from "../../lib/labels";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground text-sm whitespace-pre-line">{value}</dd>
    </div>
  );
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

/** Read-only rendering of a submitted DiscoveryForm's answers - the admin-side counterpart to DiscoveryFormFields, one section per card, matching the same 4-section structure. */
function DiscoveryFormResponse({ form }: { form: DiscoveryForm }) {
  const selectedFunctional = FUNCTIONAL_REQUIREMENT_FIELDS.filter((f) => form[f.key]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Client & Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Company" value={form.clientCompanyName} />
            <Row label="Contact person" value={form.contactPerson} />
            <Row label="Email" value={form.contactEmail} />
            <Row label="Phone" value={form.contactPhone} />
            <Row label="Industry" value={form.businessIndustry} />
            <Row label="Current website" value={form.currentWebsite} />
            <Row label="Business stage" value={form.businessStage} />
            <div className="sm:col-span-2">
              <Row label="Primary business goal" value={form.primaryGoal} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-4">
            <Row label="What are they looking to build?" value={form.projectDescription} />
            <Row label="Problem to solve" value={form.problemToSolve} />
            <Row label="Who will use it" value={form.targetUsers} />
            <Row label="Most important features" value={form.importantFeatures} />
            <Row label="Existing system" value={form.hasExistingSystem ? "Yes" : "No"} />
            {form.hasExistingSystem && <Row label="What doesn't work well" value={form.existingSystemIssues} />}
            <Row label="What success looks like" value={form.successDefinition} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Functional Requirements</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {selectedFunctional.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedFunctional.map((f) => (
                <Badge key={f.key} variant="secondary">
                  {f.label}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No functional requirements selected.</p>
          )}
          <Row label="Other requirements" value={form.otherFunctionalNeeds} />
          <Row label="Additional notes" value={form.additionalNotes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commercial & Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Desired launch date" value={formatDate(form.desiredLaunchDate)} />
            <Row label="Priority" value={form.priorityLevel} />
            <Row label="Expected budget range" value={form.expectedBudgetRange} />
            <Row label="Hosting preference" value={form.hostingPreference} />
            <Row label="Maintenance required" value={form.maintenanceRequired ? "Yes" : "No"} />
            <Row label="Post-launch support" value={form.postLaunchSupport} />
            <div className="sm:col-span-2">
              <Row label="Important constraints" value={form.importantConstraints} />
            </div>
            <div className="sm:col-span-2">
              <Row label="Additional notes" value={form.commercialNotes} />
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

export { DiscoveryFormResponse };
