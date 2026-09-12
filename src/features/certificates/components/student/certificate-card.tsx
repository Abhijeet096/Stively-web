import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Download, ExternalLink, Ban } from "lucide-react";
import type { Certificate } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GenerateCertificateButton } from "./generate-certificate-button";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Replaces the generic "Certificates - Coming soon" ComingSoonSection once
 * an enrollment can actually view certificates (access-policy.ts's
 * canViewCertificates). Three real states: not yet generated (offer to
 * generate, with the real template preview so there's no surprise),
 * generated (view/download), revoked (transparent, no silent hiding).
 */
function CertificateCard({ enrollmentId, certificate }: { enrollmentId: string; certificate: Certificate | null }) {
  if (!certificate) {
    return (
      <Card className="sm:col-span-2 lg:col-span-3">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
          <div className="border-border/70 relative aspect-[1920/1358] w-full max-w-xs shrink-0 overflow-hidden rounded-lg border shadow-sm">
            <Image src="/certificates/gen-ai-certificate-preview.png" alt="Certificate of completion preview" fill className="object-cover" />
          </div>
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Badge variant="success">Ready to generate</Badge>
            <div className="flex flex-col gap-1">
              <h3 className="text-foreground font-display text-lg font-semibold">Congratulations - you&apos;ve completed this course!</h3>
              <p className="text-muted-foreground text-sm">
                Your certificate of completion is ready. It&apos;ll be personalized with your name and a unique, verifiable ID.
              </p>
            </div>
            <GenerateCertificateButton enrollmentId={enrollmentId} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (certificate.status === "REVOKED") {
    return (
      <Card className="sm:col-span-2 lg:col-span-3">
        <CardContent className="flex flex-col items-start gap-3">
          <div className="flex w-full items-center justify-between">
            <span className="bg-destructive/10 text-destructive flex size-9 items-center justify-center rounded-lg">
              <Ban className="size-4" aria-hidden="true" />
            </span>
            <Badge variant="destructive">Revoked</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-foreground text-sm font-semibold">Certificate {certificate.certificateNumber}</h3>
            <p className="text-muted-foreground text-sm">
              This certificate is no longer valid. Contact support if you believe this is a mistake.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sm:col-span-2 lg:col-span-3">
      <CardContent className="flex flex-col items-start gap-4">
        <div className="flex w-full items-center justify-between">
          <span className="bg-success/10 text-success flex size-9 items-center justify-center rounded-lg">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
          <Badge variant="success">Issued</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground font-display text-lg font-semibold">Certificate of Completion</h3>
          <p className="text-muted-foreground text-sm">
            Certificate ID: <span className="text-foreground font-medium">{certificate.certificateNumber}</span>
          </p>
          <p className="text-muted-foreground text-sm">Issued on {formatDate(certificate.issuedAt ?? certificate.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/api/certificates/${certificate.certificateNumber}/pdf`} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              View Certificate
            </Link>
          </Button>
          <Button asChild>
            <a href={`/api/certificates/${certificate.certificateNumber}/pdf?mode=download`} download>
              <Download aria-hidden="true" />
              Download PDF
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { CertificateCard };
