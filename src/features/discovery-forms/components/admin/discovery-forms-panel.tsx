"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Copy, Send, CheckCircle2 } from "lucide-react";
import type { DiscoveryForm } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { siteConfig } from "@/config/site";
import { DISCOVERY_FORM_STATUS_LABEL, DISCOVERY_FORM_STATUS_VARIANT } from "../../lib/labels";
import { sendDiscoveryForm, resendDiscoveryForm, markDiscoveryFormReviewed } from "../../actions/discovery-form-actions";

type FormWithNames = DiscoveryForm & { sentBy: { name: string } | null; reviewedBy: { name: string } | null };

export interface DiscoveryFormsPanelProps {
  salesLeadId: string;
  forms: FormWithNames[];
  projects: { id: string; name: string }[];
  /** Base path for the read-only response detail link - differs between the admin CMS and the /sales portal. */
  basePath?: string;
}

function formatDateTime(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function DiscoveryFormsPanel({ salesLeadId, forms, projects, basePath = "/admin/sales-crm/leads" }: DiscoveryFormsPanelProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [projectId, setProjectId] = React.useState<string>("");
  const [isPending, setIsPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSend() {
    setIsPending("send");
    setError(undefined);
    const result = await sendDiscoveryForm({ salesLeadId, salesProjectId: projectId || undefined });
    setIsPending(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleResend(formId: string) {
    setIsPending(formId);
    await resendDiscoveryForm(formId);
    setIsPending(null);
    router.refresh();
  }

  async function handleMarkReviewed(formId: string) {
    setIsPending(formId);
    await markDiscoveryFormReviewed(formId);
    setIsPending(null);
    router.refresh();
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${siteConfig.url}/discovery/${token}`);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Discovery Forms</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Send className="size-4" aria-hidden="true" />
              Send Discovery Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Discovery Form</DialogTitle>
              <DialogDescription>Emails the client a secure link to Stively&apos;s Client Discovery & Requirements Form.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {projects.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dfp-project">Project (optional)</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger id="dfp-project">
                      <SelectValue placeholder="Not tied to a specific project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {error && <p className="text-destructive text-sm">{error}</p>}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleSend} loading={isPending === "send"}>
                  Send
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {forms.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">No discovery forms sent yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {forms.map((form) => (
              <li key={form.id} className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={DISCOVERY_FORM_STATUS_VARIANT[form.status]}>{DISCOVERY_FORM_STATUS_LABEL[form.status]}</Badge>
                    <span className="text-muted-foreground text-xs">Sent {formatDateTime(form.sentAt)}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {form.openedAt && `Opened ${formatDateTime(form.openedAt)} · `}
                    {form.submittedAt && `Submitted ${formatDateTime(form.submittedAt)} · `}
                    {form.reviewedAt && `Reviewed ${formatDateTime(form.reviewedAt)} by ${form.reviewedBy?.name ?? "—"}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.status === "SUBMITTED" || form.status === "REVIEWED") && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${basePath}/${salesLeadId}/discovery-forms/${form.id}`}>
                        <FileText className="size-3.5" aria-hidden="true" />
                        View response
                      </Link>
                    </Button>
                  )}
                  {form.status === "SUBMITTED" && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkReviewed(form.id)} loading={isPending === form.id}>
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      Mark reviewed
                    </Button>
                  )}
                  {form.status !== "SUBMITTED" && form.status !== "REVIEWED" && (
                    <Button variant="outline" size="sm" onClick={() => handleResend(form.id)} loading={isPending === form.id}>
                      Resend
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => copyLink(form.token)}>
                    <Copy className="size-3.5" aria-hidden="true" />
                    Copy link
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { DiscoveryFormsPanel };
