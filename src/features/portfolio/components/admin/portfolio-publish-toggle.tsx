"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { togglePortfolioPublished } from "@/features/portfolio/actions/portfolio-actions";

function PortfolioPublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleToggle() {
    setIsPending(true);
    await togglePortfolioPublished(id, !published);
    setIsPending(false);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" loading={isPending} onClick={handleToggle}>
      {published ? "Unpublish" : "Publish"}
    </Button>
  );
}

export { PortfolioPublishToggle };
