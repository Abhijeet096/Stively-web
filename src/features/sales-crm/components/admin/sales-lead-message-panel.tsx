import type { SalesLeadMessage } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SalesLeadMessageThread } from "@/features/client-workspace/components/shared/sales-lead-message-thread";
import { sendMessageToClientContent } from "../../actions/message-actions";

/** Thin Card wrapper around the shared thread - see client-workspace/components/shared/sales-lead-message-thread.tsx for the actual UI, reused unchanged on both the client and staff sides. */
function SalesLeadMessagePanel({
  salesLeadId,
  currentUserId,
  otherPartyName,
  messages,
}: {
  salesLeadId: string;
  currentUserId: string;
  otherPartyName: string;
  messages: SalesLeadMessage[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <SalesLeadMessageThread
          currentUserId={currentUserId}
          otherPartyName={otherPartyName}
          messages={messages}
          onSend={sendMessageToClientContent.bind(null, salesLeadId)}
        />
      </CardContent>
    </Card>
  );
}

export { SalesLeadMessagePanel };
