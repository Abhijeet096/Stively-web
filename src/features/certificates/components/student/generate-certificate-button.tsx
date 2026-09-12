"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Award } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateCertificateAction } from "../../actions/certificate-actions";

/** Mirrors the codebase's established "call the action, then router.refresh()" pattern (e.g. MarkPaidButton) rather than tracking the new certificate in client state - the server is the source of truth, this just asks the page to re-read it. */
function GenerateCertificateButton({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleClick() {
    setIsPending(true);
    setError(undefined);
    const result = await generateCertificateAction(enrollmentId);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button loading={isPending} onClick={handleClick}>
        <Award aria-hidden="true" />
        Generate My Certificate
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

export { GenerateCertificateButton };
