"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ExternalLink, Award } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { revokeCertificateAction } from "../../actions/certificate-admin-actions";
import type { CertificateAdminRow } from "../../server/admin-queries";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function RevokeButton({ certificateId }: { certificateId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleClick() {
    if (!window.confirm("Revoke this certificate? It will stop showing as valid on the public verification page.")) return;
    setIsPending(true);
    await revokeCertificateAction(certificateId);
    setIsPending(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" loading={isPending} onClick={handleClick}>
      Revoke
    </Button>
  );
}

function CertificateAdminList({ certificates, query }: { certificates: CertificateAdminRow[]; query: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(query);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/admin/certificates${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex max-w-md gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by name, email or certificate ID"
        />
        <Button type="submit" size="icon" variant="outline" aria-label="Search">
          <Search className="size-4" />
        </Button>
      </form>

      {certificates.length === 0 ? (
        <EmptyState icon={Award} title="No certificates found" description="Issued certificates will show up here." />
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Certificate ID</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {certificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td className="text-foreground px-4 py-3 font-mono text-xs">{certificate.certificateNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">{certificate.recipientName}</span>
                      <span className="text-muted-foreground text-xs">{certificate.recipientEmail}</span>
                    </div>
                  </td>
                  <td className="text-foreground px-4 py-3">{certificate.enrollment.offering.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={certificate.status === "REVOKED" ? "destructive" : "success"}>{certificate.status}</Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{formatDate(certificate.issuedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/api/certificates/${certificate.certificateNumber}/pdf`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>
                      {certificate.status !== "REVOKED" && <RevokeButton certificateId={certificate.id} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { CertificateAdminList };
