"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle2, Copy } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sendClientInviteLink } from "../../actions/client-invite-actions";

export interface ClientInvitePanelProps {
  salesLeadId: string;
  clientUser: { id: string; name: string | null; email: string | null } | null;
  leadHasEmail: boolean;
}

/**
 * "The salesperson gets the client to create a real Stively account" - one
 * deliberate click, never automatic. Once linked, every document/payment/
 * progress update for this business becomes visible in the client's own
 * dashboard - see src/features/client-workspace/. Clicking again after an
 * account already exists elsewhere isn't offered (button disappears once
 * `clientUser` is set) - re-inviting an already-linked business has no
 * meaning.
 */
function ClientInvitePanel({ salesLeadId, clientUser, leadHasEmail }: ClientInvitePanelProps) {
  const router = useRouter();
  const [isInviting, setIsInviting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [inviteLink, setInviteLink] = React.useState<string | undefined>();
  const [justLinkedExisting, setJustLinkedExisting] = React.useState(false);

  async function handleInvite() {
    setIsInviting(true);
    setError(undefined);
    const result = await sendClientInviteLink({ salesLeadId });
    setIsInviting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.alreadyHadAccount) {
      setJustLinkedExisting(true);
    } else {
      setInviteLink(result.inviteLink);
    }
    router.refresh();
  }

  function copyLink() {
    if (inviteLink) navigator.clipboard.writeText(inviteLink);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client portal</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {clientUser ? (
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">Linked</span>
              <span className="text-muted-foreground text-xs">
                {clientUser.name ?? "Client"} · {clientUser.email}
              </span>
              {justLinkedExisting && <span className="text-muted-foreground text-xs">They already had an account - it&apos;s now linked.</span>}
            </div>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-xs">
              Give this business its own login - quotes, contract, invoices, payments, and project progress all in one place instead of email/WhatsApp.
            </p>
            {!leadHasEmail && <p className="text-destructive text-xs">Add an email address to this lead first.</p>}
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button type="button" size="sm" variant="outline" loading={isInviting} disabled={!leadHasEmail} onClick={handleInvite} className="w-fit">
              <UserPlus className="size-3.5" aria-hidden="true" />
              {inviteLink ? "Send new invite link" : "Invite to client portal"}
            </Button>
            {inviteLink && (
              <div className="border-border flex items-center justify-between gap-2 rounded-lg border p-2">
                <span className="text-muted-foreground truncate text-xs">{inviteLink}</span>
                <Button type="button" size="sm" variant="ghost" onClick={copyLink}>
                  <Copy className="size-3.5" aria-hidden="true" />
                  Copy
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { ClientInvitePanel };
