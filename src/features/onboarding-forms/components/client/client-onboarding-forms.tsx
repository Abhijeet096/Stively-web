"use client";

import { useRouter } from "next/navigation";
import type { OnboardingForm } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { ONBOARDING_FORM_STATUS_LABEL, ONBOARDING_FORM_STATUS_VARIANT } from "../../lib/labels";
import { OnboardingFormFields } from "../onboarding-form-fields";
import { submitOnboardingFormAuthenticated } from "../../actions/onboarding-form-actions";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

// EXPIRED included for the same reason as ClientDiscoveryForms - expiry only
// guards the unauthenticated public link, not this already-authenticated
// in-portal path.
const OPEN_STATUSES: OnboardingForm["status"][] = ["SENT", "OPENED", "EXPIRED"];

/** Client-portal counterpart to the public /onboarding/[token] page - same OnboardingFormFields component, submitting via the authenticated action instead of a token. */
function ClientOnboardingForms({ forms }: { forms: OnboardingForm[] }) {
  const router = useRouter();
  const openForm = forms.find((f) => OPEN_STATUSES.includes(f.status));
  const closedForms = forms.filter((f) => f.id !== openForm?.id);

  if (forms.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No onboarding form yet - your Stively contact will send one once the project is approved and ready to kick off.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {openForm && (
        <OnboardingFormFields
          initial={openForm}
          onSubmit={async (formData) => {
            const result = await submitOnboardingFormAuthenticated(openForm.id, formData);
            if (result.success) router.refresh();
            return result;
          }}
        />
      )}

      {closedForms.length > 0 && (
        <div className="flex flex-col gap-2">
          {!openForm && <p className="text-muted-foreground text-sm">Previously submitted:</p>}
          {closedForms.map((form) => (
            <div key={form.id} className="border-border flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-muted-foreground text-sm">Submitted {formatDate(form.submittedAt)}</span>
              <Badge variant={ONBOARDING_FORM_STATUS_VARIANT[form.status]}>{ONBOARDING_FORM_STATUS_LABEL[form.status]}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { ClientOnboardingForms };
