import Link from "next/link";
import Image from "next/image";
import { GalleryHorizontalEnd } from "lucide-react";
import type { PortfolioItem } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sections/empty-state";
import { PORTFOLIO_CATEGORY_LABEL } from "@/components/sections/portfolio-showcase";
import { PortfolioPublishToggle } from "@/features/portfolio/components/admin/portfolio-publish-toggle";
import { PortfolioDeleteButton } from "@/features/portfolio/components/admin/portfolio-delete-button";

function PortfolioList({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) {
    return <EmptyState icon={GalleryHorizontalEnd} title="No portfolio items yet" description="Create one to start building your case-study showcase." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-center gap-4">
            <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-md">
              <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/portfolio/${item.id}`} className="text-foreground font-medium hover:underline">
                  {item.title}
                </Link>
                <Badge variant={item.published ? "success" : "secondary"}>{item.published ? "Published" : "Draft"}</Badge>
                <Badge variant="outline">{PORTFOLIO_CATEGORY_LABEL[item.category]}</Badge>
                {item.clientName ? <Badge variant="secondary">Client Project</Badge> : <Badge variant="default">Portfolio Concept</Badge>}
              </div>
              <span className="text-muted-foreground truncate text-sm">{item.summary}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/portfolio/${item.id}`}>Edit</Link>
              </Button>
              <PortfolioPublishToggle id={item.id} published={item.published} />
              <PortfolioDeleteButton id={item.id} title={item.title} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { PortfolioList };
