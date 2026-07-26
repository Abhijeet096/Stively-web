"use client";

import * as React from "react";
import { UserPlus, Copy, Check, CheckCircle2 } from "lucide-react";

import { hireAsSalesPerson } from "../../actions/hire-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</span>
      <div className="border-border bg-muted/40 flex items-center gap-2 rounded-lg border p-2.5">
        <code className="text-foreground min-w-0 flex-1 truncate text-sm">{value}</code>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export interface HireAsSalesPersonPanelProps {
  candidateId: string;
  candidateName: string;
  alreadyHired: boolean;
}

/**
 * Turns a "Hire" / "Strong Hire" interview recommendation into a real,
 * login-capable Sales Executive account - see hireAsSalesPerson (server
 * action). The generated password is shown exactly once here, the same
 * "reveal a secret once, then it's gone" pattern the interview link
 * creation screen already uses.
 */
function HireAsSalesPersonPanel({ candidateId, candidateName, alreadyHired }: HireAsSalesPersonPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [commissionPercentage, setCommissionPercentage] = React.useState("10");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [result, setResult] = React.useState<{ email: string; temporaryPassword: string } | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const res = await hireAsSalesPerson(candidateId, Number(commissionPercentage));
    setIsPending(false);
    if (!res.success || !res.temporaryPassword || !res.email) {
      setError(res.success ? "Something went wrong." : res.error);
      return;
    }
    setResult({ email: res.email, temporaryPassword: res.temporaryPassword });
  }

  if (alreadyHired) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="text-success size-4" aria-hidden="true" />
          <span className="text-foreground">Already hired as a Sales Executive.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hiring</CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setResult(undefined);
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full">
              <UserPlus className="size-4" aria-hidden="true" />
              Hire as Sales Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            {result ? (
              <>
                <DialogHeader>
                  <DialogTitle>{candidateName} is now a Sales Executive</DialogTitle>
                  <DialogDescription>
                    Share these credentials with them directly - this password is shown only once and isn&apos;t
                    stored anywhere retrievable.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <CopyableField label="Email" value={result.email} />
                  <CopyableField label="Temporary password" value={result.temporaryPassword} />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button">Done</Button>
                  </DialogClose>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Hire {candidateName} as a Sales Executive</DialogTitle>
                  <DialogDescription>
                    Creates their login, links a sales team profile, and sets their commission rate. You can change
                    the rate anytime afterward.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="commission-rate">Commission percentage</Label>
                  <Input
                    id="commission-rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(e.target.value)}
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button onClick={handleSubmit} loading={isPending} disabled={!commissionPercentage}>
                    Confirm hire
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export { HireAsSalesPersonPanel };
