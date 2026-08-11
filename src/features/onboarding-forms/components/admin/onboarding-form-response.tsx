import { Paperclip } from "lucide-react";
import type { OnboardingForm, OnboardingFormUpload } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ONBOARDING_UPLOAD_FIELDS } from "../../lib/labels";

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

function UploadsRow({ label, uploads }: { label: string; uploads: OnboardingFormUpload[] }) {
  if (uploads.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">{label}</dt>
      <dd className="flex flex-col gap-1">
        {uploads.map((u) => (
          <a
            key={u.id}
            href={u.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex items-center gap-1.5 text-sm hover:underline"
          >
            <Paperclip className="size-3.5 shrink-0" aria-hidden="true" />
            {u.fileName}
          </a>
        ))}
      </dd>
    </div>
  );
}

type FormWithUploads = OnboardingForm & { uploads: OnboardingFormUpload[] };

/** Read-only rendering of a submitted OnboardingForm's answers - the admin-side counterpart to OnboardingFormFields, same 7-section structure plus each section's uploaded files. */
function OnboardingFormResponse({ form }: { form: FormWithUploads }) {
  function uploadsFor(field: (typeof ONBOARDING_UPLOAD_FIELDS)[number]["key"]) {
    return form.uploads.filter((u) => u.field === field);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>01 · Client information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Form date" value={formatDate(form.formDate)} />
            <Row label="Prepared by" value={form.preparedBy} />
            <Row label="Company" value={form.company} />
            <Row label="Primary contact" value={form.primaryContact} />
            <Row label="Email" value={form.email} />
            <Row label="Phone" value={form.phone} />
            <div className="sm:col-span-2">
              <Row label="Billing information" value={form.billingInfo} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>02 · Project information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Project name" value={form.projectName} />
            <Row label="Target audience" value={form.targetAudience} />
            <div className="sm:col-span-2">
              <Row label="Approved scope" value={form.approvedScope} />
            </div>
            <div className="sm:col-span-2">
              <Row label="Primary objective" value={form.primaryObjective} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>03 · Brand assets</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Brand colors" value={form.brandColors} />
            <Row label="Brand fonts" value={form.brandFonts} />
            <UploadsRow label="Logo files" uploads={uploadsFor("LOGO")} />
            <UploadsRow label="Brand guidelines" uploads={uploadsFor("BRAND_GUIDELINES")} />
            <UploadsRow label="Brand images" uploads={uploadsFor("BRAND_IMAGE")} />
            <UploadsRow label="Existing design files" uploads={uploadsFor("DESIGN_FILE")} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>04 · Technical access</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Domain registrar" value={form.domainRegistrar} />
            <Row label="Hosting provider" value={form.hostingProvider} />
            <Row label="GitHub / source control" value={form.githubOrg} />
            <Row label="Cloud / infrastructure" value={form.cloudInfrastructure} />
            <Row label="API credentials needed" value={form.apiCredentialsNeeded} />
            <Row label="Third-party services" value={form.thirdPartyServices} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>05 · Content</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <UploadsRow label="Website copy" uploads={uploadsFor("WEBSITE_COPY")} />
            <UploadsRow label="Images" uploads={uploadsFor("CONTENT_IMAGE")} />
            <UploadsRow label="Documents" uploads={uploadsFor("DOCUMENT")} />
            <div className="sm:col-span-2">
              <Row label="Product information" value={form.productInformation} />
            </div>
            <div className="sm:col-span-2">
              <Row label="Legal pages" value={form.legalPages} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>06 · Communication</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Primary communication channel" value={form.primaryCommunicationChannel} />
            <Row label="Primary decision maker" value={form.primaryDecisionMaker} />
            <div className="sm:col-span-2">
              <Row label="Review / approval contact" value={form.reviewApprovalContact} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>07 · Project approval</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Project start date" value={formatDate(form.projectStartDate)} />
            <Row label="Expected milestone dates" value={form.expectedMilestoneDates} />
            <div className="sm:col-span-2">
              <Row label="Notes" value={form.notes} />
            </div>
            <Row label="Confirmed accurate" value={form.confirmedAccurate ? "Yes" : "No"} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

export { OnboardingFormResponse };
