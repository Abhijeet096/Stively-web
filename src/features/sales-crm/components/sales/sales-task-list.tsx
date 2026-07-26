"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListChecks } from "lucide-react";
import type { SalesTask, SalesTaskStatus, TeamMember } from "@prisma/client";

import { updateTaskStatus } from "../../actions/task-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { SALES_TASK_STATUS_LABEL, LEAD_PRIORITY_LABEL, LEAD_PRIORITY_VARIANT } from "../../lib/labels";

const STATUSES: SalesTaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

type TaskWithRelations = SalesTask & { salesLead: { id: string; businessName: string } | null; assignedTo: TeamMember };

function TaskRow({ task }: { task: TaskWithRelations }) {
  const router = useRouter();
  const [status, setStatus] = React.useState(task.status);
  const [isPending, setIsPending] = React.useState(false);

  async function handleChange(value: string) {
    setStatus(value as SalesTaskStatus);
    setIsPending(true);
    const result = await updateTaskStatus({ taskId: task.id, status: value });
    setIsPending(false);
    if (!result.success) {
      setStatus(task.status);
      return;
    }
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-medium">{task.title}</span>
          {task.salesLead && (
            <Link href={`/sales/leads/${task.salesLead.id}`} className="text-muted-foreground text-xs hover:underline">
              {task.salesLead.businessName}
            </Link>
          )}
        </div>
        <Badge variant={LEAD_PRIORITY_VARIANT[task.priority]}>{LEAD_PRIORITY_LABEL[task.priority]}</Badge>
      </div>
      {task.description && <p className="text-muted-foreground text-sm">{task.description}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"} · {task.assignedTo.name}
        </span>
        <Select value={status} onValueChange={handleChange}>
          <SelectTrigger disabled={isPending} className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {SALES_TASK_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </li>
  );
}

function SalesTaskList({ tasks }: { tasks: TaskWithRelations[] }) {
  if (tasks.length === 0) {
    return <EmptyState icon={ListChecks} title="No tasks" description="Nothing assigned right now." />;
  }

  return (
    <Card>
      <CardContent>
        <ul className="divide-border divide-y">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export { SalesTaskList };
