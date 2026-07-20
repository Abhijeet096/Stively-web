import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatOperationNumber } from "../lib/operation-number";
import { OperationStatusBadge } from "./operation-status-badge";
import { OperationPriorityBadge } from "./operation-priority-badge";
import type { OperationItemWithRelations } from "../server/queries";

function OperationCard({ item }: { item: OperationItemWithRelations }) {
  const source = item.type === "REQUEST" ? item.request : item.order;
  if (!source) return null;

  const customerName = source.user.name ?? source.user.email ?? "Unknown";

  return (
    <Link
      href={`/admin/operations/${item.id}`}
      className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card variant="interactive" className="h-full">
        <CardHeader>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground font-mono text-xs">{formatOperationNumber(item.sequence)}</span>
            <div className="flex gap-2">
              <Badge variant="secondary">{item.type === "REQUEST" ? "Request" : "Order"}</Badge>
              <OperationPriorityBadge priority={item.priority} />
            </div>
          </div>
          <CardTitle className="font-display">{customerName}</CardTitle>
          <CardDescription>{source.offering.title}</CardDescription>
        </CardHeader>
        <CardFooter className="border-border/70 mt-auto flex-wrap justify-between gap-2 border-t pt-4">
          <OperationStatusBadge item={item} />
          <span className="text-muted-foreground text-xs">
            {item.assignedTo ? item.assignedTo.name : "Unassigned"}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export { OperationCard };
