import Link from "next/link";
import type { Program } from "@prisma/client";

import { formatPrice } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LEVEL_LABEL: Record<Program["level"], string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const MODE_LABEL: Record<Program["mode"], string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  HYBRID: "Hybrid",
};

function ProgramCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/training/${program.slug}`}
      className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card variant="interactive" className="h-full">
        <CardHeader>
          <div className="mb-1 flex gap-2">
            <Badge variant="secondary">{LEVEL_LABEL[program.level]}</Badge>
            <Badge variant="outline">{MODE_LABEL[program.mode]}</Badge>
          </div>
          <CardTitle className="font-display">{program.title}</CardTitle>
          <CardDescription>{program.shortDescription}</CardDescription>
        </CardHeader>
        <CardFooter className="border-border/70 mt-auto justify-between border-t pt-4">
          <span className="text-foreground font-display text-base font-semibold tabular-nums">
            {formatPrice(program.price, program.currency)}
          </span>
          <span className="text-muted-foreground text-sm">{program.durationWeeks} weeks</span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export { ProgramCard };
