import type { OperationPriority } from "@prisma/client";

import { Badge, type BadgeProps } from "@/components/ui/badge";

const PRIORITY_LABEL: Record<OperationPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const PRIORITY_VARIANT: Record<OperationPriority, NonNullable<BadgeProps["variant"]>> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "warning",
  URGENT: "destructive",
};

function OperationPriorityBadge({ priority }: { priority: OperationPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}

export { OperationPriorityBadge, PRIORITY_LABEL };
