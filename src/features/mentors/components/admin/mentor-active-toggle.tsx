"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setMentorActive } from "../../actions/admin-mentor-actions";

function MentorActiveToggle({ mentorId, isActive }: { mentorId: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleToggle() {
    setIsPending(true);
    await setMentorActive(mentorId, !isActive);
    setIsPending(false);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" loading={isPending} onClick={handleToggle}>
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}

export { MentorActiveToggle };
