"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Copy, Send, CheckCircle2 } from "lucide-react";
import type { OnboardingForm } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { ONBOARDING_FORM_STATUS_LABEL, ONBOARDING_FORM_STATUS_VARIANT } from "../../lib/labels";
import { sendOnboardingForm, resendOnboardingForm, markOnboardingFormReviewed } from "../../actions/onboarding-form-actions";

type FormWithNames = OnboardingForm & { sentBy: { name: string } | null; reviewedBy: { name: string } | null };

export interface OnboardingFormsPanelProps {
  salesProjectId: string;
  forms: FormWithNames[];
  /** Base path for the read-only response detail link - differs between the admin CMS and the /sales portal. */
  basePath?: string;
}

function formatDateTime(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** One-click "send the client onboarding form" panel on a project's detail page - no project picker needed (unlike DiscoveryFormsPanel) since this form is already scoped to the project whose page it lives on. */
function OnboardingFormsPanel({ salesProjectId, forms, basePath = "/admin/sales-crm/projects" }: OnboardingFormsPanelProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSend() {
    setIsPending("send");
    setError(undefined);
    const result = await sendOnboardingForm({ salesProjectId });
    setIsPending(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleResend(formId: string) {
    setIsPending(formId);
    await resendOnboardingForm(formId);
    setIsPending(null);
    router.refresh();
  }

  async function handleMarkReviewed(formId: string) {
    setIsPending(formId);
    await markOnboardingFormReviewed(formId);
    setIsPending(null);
    router.refresh();
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${siteConfig.url}/onboarding/${token}`);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Onboarding Form</CardTitle>
        <Button size="sm" variant="outline" onClick={handleSend} loading={isPending === "send"}>
          <Send className="size-4" aria-hidden="true" />
          Send Onboarding Form
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {forms.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Not sent yet - click Send to email the client the project kickoff form.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {forms.map((form) => (
              <li key={form.id} className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={ONBOARDING_FORM_STATUS_VARIANT[form.status]}>{ONBOARDING_FORM_STATUS_LABEL[form.status]}</Badge>
                    <span className="text-muted-foreground text-xs">Sent {formatDateTime(form.sentAt)}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {form.openedAt && `Opened ${formatDateTime(form.openedAt)} · `}
                    {form.submittedAt && `Submitted ${formatDateTime(form.submittedAt)} · `}
                    {form.reviewedAt && `Reviewed ${formatDateTime(form.reviewedAt)} by ${form.reviewedBy?.name ?? "—"}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.status === "SUBMITTED" || form.status === "REVIEWED") && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${basePath}/${salesProjectId}/onboarding-forms/${form.id}`}>
                        <FileText className="size-3.5" aria-hidden="true" />
                        View response
                      </Link>
                    </Button>
                  )}
                  {form.status === "SUBMITTED" && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkReviewed(form.id)} loading={isPending === form.id}>
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      Mark reviewed
                    </Button>
                  )}
                  {form.status !== "SUBMITTED" && form.status !== "REVIEWED" && (
                    <Button variant="outline" size="sm" onClick={() => handleResend(form.id)} loading={isPending === form.id}>
                      Resend
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => copyLink(form.token)}>
                    <Copy className="size-3.5" aria-hidden="true" />
                    Copy link
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { OnboardingFormsPanel };
