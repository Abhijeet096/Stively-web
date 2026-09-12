import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { searchCertificatesForAdmin } from "@/features/certificates/server/admin-queries";
import { CertificateAdminList } from "@/features/certificates/components/admin/certificate-admin-list";

export const metadata: Metadata = { title: "Certificates" };

interface AdminCertificatesPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCertificatesPage({ searchParams }: AdminCertificatesPageProps) {
  await requireRole("ADMIN");
  const { q } = await searchParams;

  const certificates = await searchCertificatesForAdmin(q);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Certificates</h1>
      </div>

      <CertificateAdminList certificates={certificates} query={q ?? ""} />
    </div>
  );
}
