import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ComingSoonSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** ONE generic placeholder card reused for Assignments/Resources/Certificates/Mentor/Downloads/Notes - not six near-identical components. Clearly labeled, no fake functionality - same anti-fabrication discipline as every other "coming soon" surface in this codebase. */
function ComingSoonSection({ title, description, icon: Icon }: ComingSoonSectionProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3">
        <div className="flex w-full items-center justify-between">
          <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <Badge variant="outline">Coming soon</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { ComingSoonSection };
