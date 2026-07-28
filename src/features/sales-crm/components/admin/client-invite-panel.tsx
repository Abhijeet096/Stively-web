"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inviteClientToPortal } from "../../actions/client-invite-actions";

export interface ClientInvitePanelProps {
  salesLeadId: string;
  clientUser: { id: string; name: string | null; email: string | null } | null;
  leadHasEmail: boolean;
}

/**
 * "The salesperson gets the client to create a real Stively account" - one
 * deliberate click, never automatic. Once linked, every document/payment/
 * progress update for this business becomes visible in the client's own
 * dashboard - see src/features/client-workspace/.
 */
function ClientInvitePanel({ salesLeadId, clientUser, leadHasEmail }: ClientInvitePanelProps) {
  const router = useRouter();
  const [isInviting, setIsInviting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [justInvited, setJustInvited] = React.useState(false);

  async function handleInvite() {
    setIsInviting(true);
    setError(undefined);
    const result = await inviteClientToPortal({ salesLeadId });
    setIsInviting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setJustInvited(true);
    router.refresh();
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
              {justInvited && <span className="text-muted-foreground text-xs">An email was just sent to set up account access.</span>}
            </div>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-xs">
              Give this business its own login - proposal, contract, invoices, payments, and project progress all in one place instead of email/WhatsApp.
            </p>
            {!leadHasEmail && <p className="text-destructive text-xs">Add an email address to this lead first.</p>}
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button type="button" size="sm" variant="outline" loading={isInviting} disabled={!leadHasEmail} onClick={handleInvite} className="w-fit">
              <UserPlus className="size-3.5" aria-hidden="true" />
              Invite to client portal
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { ClientInvitePanel };
