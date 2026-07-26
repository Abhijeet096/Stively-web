"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, IndianRupee } from "lucide-react";

import { approveCommission, rejectCommission, markCommissionPaid } from "../../actions/commission-actions";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/sections/empty-state";
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
import { formatPrice } from "@/lib/utils";
import { SALES_COMMISSION_STATUS_LABEL, SALES_COMMISSION_STATUS_VARIANT } from "../../lib/labels";
import type { getSalesCommissionsForViewer } from "../../server/queries";

type Commission = Awaited<ReturnType<typeof getSalesCommissionsForViewer>>[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function toCsv(commissions: Commission[]): string {
  const header = ["Salesperson", "Project", "Payment Amount", "Rate %", "Commission", "Status", "Created"];
  const rows = commissions.map((c) => [
    c.salesPerson.name,
    c.salesProject.clientName,
    (c.paymentAmount / 100).toFixed(2),
    String(c.commissionPercentage),
    (c.commissionAmount / 100).toFixed(2),
    c.status,
    formatDate(c.createdAt),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function ExportButton({ commissions }: { commissions: Commission[] }) {
  function handleExport() {
    const csv = toCsv(commissions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={commissions.length === 0}>
      <Download className="size-4" aria-hidden="true" />
      Export CSV
    </Button>
  );
}

function RejectDialog({ commissionId, onDone }: { commissionId: string; onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await rejectCommission({ commissionId, reason });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject commission</DialogTitle>
          <DialogDescription>Give a reason - the salesperson can see this.</DialogDescription>
        </DialogHeader>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} loading={isPending} disabled={!reason.trim()}>
            Confirm reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowActions({ commission }: { commission: Commission }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleApprove() {
    setIsPending(true);
    await approveCommission(commission.id);
    setIsPending(false);
    router.refresh();
  }

  async function handleMarkPaid() {
    setIsPending(true);
    await markCommissionPaid(commission.id);
    setIsPending(false);
    router.refresh();
  }

  if (commission.status === "PENDING") {
    return (
      <div className="flex justify-end gap-2">
        <Button size="sm" loading={isPending} onClick={handleApprove}>
          Approve
        </Button>
        <RejectDialog commissionId={commission.id} onDone={() => router.refresh()} />
      </div>
    );
  }
  if (commission.status === "APPROVED") {
    return (
      <div className="flex justify-end">
        <Button size="sm" loading={isPending} onClick={handleMarkPaid}>
          Mark paid
        </Button>
      </div>
    );
  }
  return null;
}

function AdminCommissionTable({ commissions }: { commissions: Commission[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ExportButton commissions={commissions} />
      </div>

      {commissions.length === 0 ? (
        <EmptyState icon={IndianRupee} title="No commissions" description="Commission appears here once a project payment is marked paid." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Salesperson</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-foreground font-medium">{c.salesPerson.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.salesProject.clientName}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{formatPrice(c.paymentAmount)}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{c.commissionPercentage}%</TableCell>
                <TableCell className="text-foreground tabular-nums">{formatPrice(c.commissionAmount)}</TableCell>
                <TableCell>
                  <Badge variant={SALES_COMMISSION_STATUS_VARIANT[c.status]}>{SALES_COMMISSION_STATUS_LABEL[c.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                <TableCell>
                  <RowActions commission={c} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export { AdminCommissionTable };
