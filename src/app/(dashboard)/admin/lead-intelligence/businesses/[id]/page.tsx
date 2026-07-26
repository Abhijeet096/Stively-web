import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { getBusinessById } from "@/features/lead-intelligence/server/queries";
import { getSalesTeamMembers } from "@/features/sales-crm/server/queries";
import { BusinessDetail } from "@/features/lead-intelligence/components/admin/business-detail";

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BusinessDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const business = await getBusinessById(id);
  return { title: business?.businessName ?? "Business" };
}

export default async function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const { id } = await params;

  const [business, teamMembers] = await Promise.all([getBusinessById(id), getSalesTeamMembers()]);
  if (!business) notFound();

  return (
    <div className="p-6">
      <BusinessDetail business={business} teamMembers={teamMembers} />
    </div>
  );
}
