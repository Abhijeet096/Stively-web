"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createLearningExperience } from "../../actions/admin-curriculum-actions";
import type { Offering } from "@prisma/client";

function CreateLearningExperienceForm({ offerings }: { offerings: Offering[] }) {
  const router = useRouter();
  const [offeringId, setOfferingId] = React.useState<string | undefined>();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  if (offerings.length === 0) return null;

  async function handleCreate() {
    if (!offeringId) return;
    setIsPending(true);
    setError(undefined);
    const result = await createLearningExperience(offeringId);
    setIsPending(false);
    if (!result.success || !result.id) {
      setError(result.success ? "Something went wrong." : result.error);
      return;
    }
    router.push(`/admin/learning/${result.id}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Select value={offeringId} onValueChange={setOfferingId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Choose an offering..." />
          </SelectTrigger>
          <SelectContent>
            {offerings.map((offering) => (
              <SelectItem key={offering.id} value={offering.id}>
                {offering.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleCreate} disabled={!offeringId} loading={isPending}>
        Create curriculum
      </Button>
      {error && <p className="text-destructive w-full text-sm">{error}</p>}
    </div>
  );
}

export { CreateLearningExperienceForm };
