import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

const SUPPORT_MESSAGE = "Hi Stively, I have a question about my course.";

/**
 * Replaces the old "Mentor - Coming soon" placeholder - a real, working
 * contact path instead of a card promising something that doesn't exist.
 * Deliberately generic ("Student Support", no name) - the founder answers
 * these personally today, but the copy shouldn't hard-code that and would
 * still be true if support work moves to someone else later.
 */
function SupportCard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3">
        <span className="bg-success/10 text-success flex size-9 items-center justify-center rounded-lg">
          <MessageCircle className="size-4" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground text-sm font-semibold">Student Support</h3>
          <p className="text-muted-foreground text-sm">
            Stuck on a lesson, or have a question about the course? Message us directly on
            WhatsApp - a real person replies.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message on WhatsApp
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { SupportCard };
