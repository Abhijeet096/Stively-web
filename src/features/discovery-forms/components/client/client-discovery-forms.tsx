"use client";

import { useRouter } from "next/navigation";
import type { DiscoveryForm } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { DISCOVERY_FORM_STATUS_LABEL, DISCOVERY_FORM_STATUS_VARIANT } from "../../lib/labels";
import { DiscoveryFormFields } from "../discovery-form-fields";
import { submitDiscoveryFormAuthenticated } from "../../actions/discovery-form-actions";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

// EXPIRED is included here even though the public /discovery/[token] link is
// dead by then - expiry only guards that unauthenticated link, not this
// already-authenticated in-portal path, so a logged-in client can still
// complete a form whose public link has lapsed rather than being stuck
// waiting on an admin to notice and click Resend.
const OPEN_STATUSES: DiscoveryForm["status"][] = ["SENT", "OPENED", "IN_PROGRESS", "EXPIRED"];

/** Client-portal counterpart to the public /discovery/[token] page - same DiscoveryFormFields component, submitting via the authenticated action instead of a token. */
function ClientDiscoveryForms({ forms }: { forms: DiscoveryForm[] }) {
  const router = useRouter();
  const openForm = forms.find((f) => OPEN_STATUSES.includes(f.status));
  const closedForms = forms.filter((f) => f.id !== openForm?.id);

  if (forms.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No discovery forms yet - your Stively contact will send one when it&apos;s time to gather requirements.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {openForm && (
        <DiscoveryFormFields
          initial={openForm}
          onSubmit={async (content) => {
            const result = await submitDiscoveryFormAuthenticated(openForm.id, content);
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
              <Badge variant={DISCOVERY_FORM_STATUS_VARIANT[form.status]}>{DISCOVERY_FORM_STATUS_LABEL[form.status]}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { ClientDiscoveryForms };
