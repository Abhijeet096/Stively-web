import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPortfolioItemById } from "@/lib/queries/portfolio";
import { PortfolioForm } from "@/features/portfolio/components/admin/portfolio-form";

interface EditPortfolioItemPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditPortfolioItemPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getPortfolioItemById(id);
  return { title: item ? `Edit: ${item.title}` : "Portfolio item not found" };
}

export default async function EditPortfolioItemPage({ params }: EditPortfolioItemPageProps) {
  const { id } = await params;
  const item = await getPortfolioItemById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Edit: {item.title}</h1>
      <PortfolioForm existing={item} />
    </div>
  );
}
