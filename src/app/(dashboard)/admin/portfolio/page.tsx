import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { getAllPortfolioItemsForAdmin } from "@/lib/queries/portfolio";
import { PortfolioList } from "@/features/portfolio/components/admin/portfolio-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Portfolio" };

export default async function AdminPortfolioPage() {
  const items = await getAllPortfolioItemsForAdmin();

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Portfolio</h1>
        <Button asChild>
          <Link href="/admin/portfolio/new">
            <Plus className="size-4" aria-hidden="true" />
            New project
          </Link>
        </Button>
      </div>

      <PortfolioList items={items} />
    </div>
  );
}
