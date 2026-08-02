import type { Metadata } from "next";

import { PortfolioForm } from "@/features/portfolio/components/admin/portfolio-form";

export const metadata: Metadata = { title: "New Portfolio Item" };

export default function NewPortfolioItemPage() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">New Portfolio Item</h1>
      <PortfolioForm />
    </div>
  );
}
