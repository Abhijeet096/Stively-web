"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { LiveSessionStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { updateSessionStatus } from "../../actions/session-actions";

const NEXT_STATUS: Partial<Record<LiveSessionStatus, { label: string; status: LiveSessionStatus }[]>> = {
  SCHEDULED: [
    { label: "Mark live", status: "LIVE" },
    { label: "Cancel", status: "CANCELLED" },
  ],
  LIVE: [{ label: "Mark completed", status: "COMPLETED" }],
};

function SessionStatusControls({ sessionId, status }: { sessionId: string; status: LiveSessionStatus }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const options = NEXT_STATUS[status];
  if (!options) return null;

  async function handleClick(next: LiveSessionStatus) {
    setIsPending(true);
    await updateSessionStatus(sessionId, next);
    setIsPending(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <Button
          key={option.status}
          size="sm"
          variant={option.status === "CANCELLED" ? "ghost" : "outline"}
          loading={isPending}
          onClick={() => handleClick(option.status)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export { SessionStatusControls };
