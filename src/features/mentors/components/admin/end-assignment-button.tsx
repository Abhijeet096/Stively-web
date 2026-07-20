"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { endAssignment } from "../../actions/admin-assignment-actions";

function EndAssignmentButton({ assignmentId, mentorId }: { assignmentId: string; mentorId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleClick() {
    if (!window.confirm("End this mentor assignment?")) return;
    setIsPending(true);
    await endAssignment(assignmentId, mentorId);
    setIsPending(false);
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" loading={isPending} onClick={handleClick}>
      End
    </Button>
  );
}

export { EndAssignmentButton };
