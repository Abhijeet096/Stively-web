import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download, XCircle, Mail } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveDigitalDownloadAccess } from "@/features/orders/server/digital-download";

export const metadata: Metadata = {
  title: "Your download",
  robots: { index: false, follow: false },
};

const INVALID_COPY: Record<"not_found" | "not_paid" | "expired", { title: string; body: string }> = {
  not_found: {
    title: "This download link isn't valid",
    body: "Double-check the link from your email, or reach out and we'll sort it out.",
  },
  not_paid: {
    title: "This order hasn't been confirmed yet",
    body: "If you just paid, give it a minute and try the link from your email again.",
  },
  expired: {
    title: "This download link has expired",
    body: "Your purchase is still valid - contact us and we'll send a fresh link right away.",
  },
};

/**
 * The page a buyer lands on before the actual file streams from
 * /api/digital-store/download/[token] - re-validates the same token
 * server-side (never trusts the email link alone) so an expired or already-
 * revoked link shows a real explanation instead of a bare download that
 * silently fails, or a generic 404.
 */
export default async function DigitalDownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await resolveDigitalDownloadAccess(token);

  return (
    <Section className="flex min-h-[70vh] items-center">
      <Container className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            {result.ok ? (
              <>
                <span className="bg-success/10 flex size-14 items-center justify-center rounded-full">
                  <CheckCircle2 className="text-success size-7" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h1 className="font-display text-foreground text-xl font-semibold">Your download is ready</h1>
                  <p className="text-muted-foreground text-sm text-balance">{result.access.productTitle}</p>
                </div>

                <Button asChild size="lg" className="mt-2 w-full">
                  <a href={`/api/digital-store/download/${token}`} download>
                    <Download aria-hidden="true" />
                    Download PDF
                  </a>
                </Button>

                <div className="border-border/70 mt-2 w-full rounded-lg border p-4 text-left">
                  <p className="text-muted-foreground text-xs">
                    Amount paid:{" "}
                    <span className="text-foreground font-medium">
                      {formatPrice(result.access.order.amount, result.access.order.currency)}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    This link works until{" "}
                    <span className="text-foreground font-medium">
                      {result.access.expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>{" "}
                    - re-download any time before then.
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="bg-muted flex size-14 items-center justify-center rounded-full">
                  <XCircle className="text-muted-foreground size-7" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h1 className="font-display text-foreground text-xl font-semibold">{INVALID_COPY[result.reason].title}</h1>
                  <p className="text-muted-foreground text-sm text-balance">{INVALID_COPY[result.reason].body}</p>
                </div>
                <Button asChild variant="outline" size="lg" className="mt-2 w-full">
                  <a href={`mailto:${siteConfig.contactEmail}`}>
                    <Mail aria-hidden="true" />
                    Contact support
                  </a>
                </Button>
              </>
            )}

            <Link href="/digital-store" className="text-muted-foreground hover:text-foreground mt-2 text-sm underline underline-offset-4">
              Back to Digital Store
            </Link>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
