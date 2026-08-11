"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightCircle } from "lucide-react";
import type { TeamMember } from "@prisma/client";

import { convertLeadToProject } from "../../actions/project-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

export interface ConvertToProjectDialogProps {
  salesLeadId: string;
  suggestedValue?: number | null;
  teamMembers: TeamMember[];
  /** True once this lead already has at least one project - changes the trigger label/copy from "Convert" (first project) to "Add project" (a client can now have more than one). */
  hasExistingProject?: boolean;
}

/** Admin-only trigger for convertLeadToProject - totalValue defaults to the lead's estimated value but is always re-confirmed here, since that figure predates any real negotiation. Callable more than once per lead - a client can have multiple projects. */
function ConvertToProjectDialog({ salesLeadId, suggestedValue, teamMembers, hasExistingProject = false }: ConvertToProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [priority, setPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [totalValue, setTotalValue] = React.useState(suggestedValue ? String(suggestedValue / 100) : "");
  const [projectManagerId, setProjectManagerId] = React.useState<string>("");
  const [assignedDeveloperId, setAssignedDeveloperId] = React.useState<string>("");
  const [targetEndDate, setTargetEndDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await convertLeadToProject({
      salesLeadId,
      name,
      type: type || undefined,
      priority,
      totalValue: Math.round(Number(totalValue) * 100),
      projectManagerId: projectManagerId || undefined,
      assignedDeveloperId: assignedDeveloperId || undefined,
      targetEndDate: targetEndDate ? new Date(targetEndDate) : undefined,
      description: description || undefined,
    });
    setIsPending(false);
    if (!result.success || !result.projectId) {
      setError(result.success ? "Something went wrong." : result.error);
      return;
    }
    setOpen(false);
    router.push(`/admin/sales-crm/projects/${result.projectId}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={hasExistingProject ? "outline" : "primary"} className="mt-3 w-full">
          <ArrowRightCircle className="size-4" aria-hidden="true" />
          {hasExistingProject ? "Add another project" : "Convert to Project"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasExistingProject ? "Add project" : "Convert to project"}</DialogTitle>
          <DialogDescription>Creates a project linked to this lead and the assigned salesperson.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ctp-name">Project name</Label>
            <Input id="ctp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Restaurant Website & Ordering Platform" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ctp-type">Project type</Label>
            <Input id="ctp-type" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Website, Mobile App" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ctp-priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as "LOW" | "MEDIUM" | "HIGH")}>
              <SelectTrigger id="ctp-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ctp-value">Agreed project value (₹)</Label>
            <Input id="ctp-value" type="number" min={1} value={totalValue} onChange={(e) => setTotalValue(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ctp-pm">Project manager</Label>
            <Select value={projectManagerId} onValueChange={setProjectManagerId}>
              <SelectTrigger id="ctp-pm">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ctp-dev">Assigned developer</Label>
            <Select value={assignedDeveloperId} onValueChange={setAssignedDeveloperId}>
              <SelectTrigger id="ctp-dev">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ctp-end">Target end date</Label>
            <Input id="ctp-end" type="date" value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ctp-desc">Notes</Label>
            <Textarea id="ctp-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSubmit} loading={isPending} disabled={!name.trim() || !totalValue || Number(totalValue) <= 0}>
              Create project
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ConvertToProjectDialog };
