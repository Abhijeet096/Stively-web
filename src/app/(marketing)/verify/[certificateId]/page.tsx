import type { Metadata } from "next";
import { CheckCircle2, XCircle, Ban } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublicCertificateByNumber } from "@/features/certificates/server/verify-queries";

interface VerifyPageProps {
  params: Promise<{ certificateId: string }>;
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { certificateId } = await params;
  return { title: `Verify Certificate ${certificateId}` };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * The one page a certificate's QR code (and every "Verify Certificate"
 * mention printed on the certificate itself) ever points at. Public,
 * unauthenticated, read-only - getPublicCertificateByNumber only ever
 * returns the handful of fields that are meant to be publicly checkable,
 * never an email address or internal id. Certificate issuance itself has
 * no public entry point - this page can only ever confirm something that
 * was already issued through the authenticated student flow.
 */
export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { certificateId } = await params;
  const certificate = await getPublicCertificateByNumber(certificateId);

  return (
    <Section className="flex min-h-[70vh] items-center">
      <Container className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
            <span className="text-primary font-display text-lg font-semibold tracking-wide">STIVELY</span>

            {!certificate && (
              <>
                <span className="bg-muted flex size-14 items-center justify-center rounded-full">
                  <XCircle className="text-muted-foreground size-7" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h1 className="font-display text-foreground text-xl font-semibold">CERTIFICATE NOT FOUND</h1>
                  <p className="text-muted-foreground text-sm text-balance">The certificate ID could not be verified.</p>
                </div>
              </>
            )}

            {certificate?.status === "REVOKED" && (
              <>
                <span className="bg-destructive/10 flex size-14 items-center justify-center rounded-full">
                  <Ban className="text-destructive size-7" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h1 className="font-display text-foreground text-xl font-semibold">CERTIFICATE REVOKED</h1>
                  <p className="text-muted-foreground text-sm text-balance">This certificate is no longer valid.</p>
                </div>
              </>
            )}

            {certificate?.status === "ISSUED" && (
              <>
                <span className="bg-success/10 flex size-14 items-center justify-center rounded-full">
                  <CheckCircle2 className="text-success size-7" aria-hidden="true" />
                </span>
                <h1 className="font-display text-foreground text-xl font-semibold">CERTIFICATE VERIFIED</h1>

                <div className="border-border/70 mt-2 w-full rounded-lg border p-5 text-left">
                  <dl className="flex flex-col gap-3">
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Certificate ID</dt>
                      <dd className="text-foreground text-sm font-semibold">{certificate.certificateNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Recipient</dt>
                      <dd className="text-foreground text-sm font-semibold">{certificate.recipientName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Course</dt>
                      <dd className="text-foreground text-sm font-semibold">{certificate.courseName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Completion Date</dt>
                      <dd className="text-foreground text-sm font-semibold">{formatDate(certificate.completionDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Issue Date</dt>
                      <dd className="text-foreground text-sm font-semibold">
                        {formatDate(certificate.issuedAt ?? certificate.completionDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Status</dt>
                      <dd>
                        <Badge variant="success">ACTIVE</Badge>
                      </dd>
                    </div>
                  </dl>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
