import Link from "next/link";
import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Resource } from "@prisma/client";

/** PDF/SLIDES/DOWNLOAD blocks all render the same way - a reusable Resource, never a duplicated file per lesson (see LessonBlock's schema comment). */
function BlockResource({ resource }: { resource: Resource }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <FileDown className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-medium">{resource.title}</span>
            {resource.fileSize && (
              <span className="text-muted-foreground text-xs">{Math.round(resource.fileSize / 1024)} KB</span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={resource.url} target="_blank" rel="noopener noreferrer">
            Open
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { BlockResource };
