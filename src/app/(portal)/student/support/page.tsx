import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, MessageCircle } from "lucide-react";

import { requireRole } from "@/lib/session";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SupportQueryForm } from "@/features/support/components/student/support-query-form";

export const metadata: Metadata = { title: "Support" };

const WHATSAPP_MESSAGE = "Hi Stively, I have a question about my course.";

/**
 * Two real paths, not a link out to the public /contact lead form
 * (StudentQuery's whole reason to exist is that a signed-in student
 * shouldn't have to re-enter name/email/phone into a stranger-facing
 * form). WhatsApp for anything time-sensitive, the message form for
 * anything that reads better in writing - both reach the same person.
 */
export default async function StudentSupportPage() {
  await requireRole("STUDENT");

  return (
    <>
      <SetPageTitle title="Support" />
      <Container className="flex flex-col gap-6 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground font-display text-2xl font-semibold tracking-tight">
            Need a hand with something?
          </h1>
          <p className="text-muted-foreground text-sm">
            Send us a message and a real person will get back to you - usually within a day.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col items-start gap-3">
              <span className="bg-success/10 text-success flex size-9 items-center justify-center rounded-lg">
                <MessageCircle className="size-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-foreground text-sm font-semibold">WhatsApp</h2>
                <p className="text-muted-foreground text-sm">Fastest way to reach us - a real person replies.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Message on WhatsApp
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-start gap-3">
              <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                <LifeBuoy className="size-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-foreground text-sm font-semibold">Send a message</h2>
                <p className="text-muted-foreground text-sm">Prefer writing it out? We&apos;ll reply here or by email.</p>
              </div>
              <SupportQueryForm />
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
