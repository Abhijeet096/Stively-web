import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ConsultationForm } from "@/features/client-workspace/components/client/consultation-form";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Book Consultation" };

export default async function ClientConsultationPage() {
  const user = await requireRole("CLIENT");
  const account = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  return (
    <>
      <SetPageTitle title="Book Consultation" />
      <Container className="flex flex-col gap-6 py-8">
        <SectionHeader
          title="Book a Consultation"
          description="Tell us what's on your mind - a real person on our team will reach out, usually within a day."
        />
        <div className="max-w-2xl">
          <ConsultationForm name={account.name ?? "there"} email={account.email ?? ""} companyName={account.companyName} />
        </div>
      </Container>
    </>
  );
}
