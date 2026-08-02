"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deletePortfolioItem } from "@/features/portfolio/actions/portfolio-actions";

function PortfolioDeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setIsPending(true);
    await deletePortfolioItem(id);
    setIsPending(false);
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" loading={isPending} onClick={handleDelete} aria-label={`Delete ${title}`}>
      <Trash2 className="size-4" aria-hidden="true" />
    </Button>
  );
}

export { PortfolioDeleteButton };
