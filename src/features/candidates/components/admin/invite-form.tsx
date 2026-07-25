"use client";

import * as React from "react";
import { Copy, Check, UserPlus } from "lucide-react";
import type { Job } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inviteCandidate } from "../../actions/invite-actions";

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-border bg-muted/40 flex items-center gap-2 rounded-lg border p-3">
      <code className="text-foreground min-w-0 flex-1 truncate text-sm">{url}</code>
      <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
        {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function InviteForm({ jobs, defaultJobId }: { jobs: Job[]; defaultJobId?: string }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [jobId, setJobId] = React.useState(defaultJobId ?? jobs[0]?.id ?? "");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [result, setResult] = React.useState<{ url: string; reused?: boolean } | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    setResult(undefined);

    const res = await inviteCandidate({ name, email, phone: phone || undefined, jobId, expiryDays: 7 });
    setIsPending(false);

    if (!res.success || !res.url) {
      setError(res.success ? "Something went wrong." : res.error);
      return;
    }
    setResult({ url: res.url, reused: res.reused });
    setName("");
    setEmail("");
    setPhone("");
  }

  if (jobs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Create a published job before inviting candidates.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="candidate-name" label="Candidate name">
          <Input id="candidate-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
        </FormField>
        <FormField id="candidate-email" label="Email">
          <Input id="candidate-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@example.com" />
        </FormField>
        <FormField id="candidate-phone" label="Phone" optional>
          <Input id="candidate-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <FormField id="candidate-job" label="Position">
          <Select value={jobId} onValueChange={setJobId}>
            <SelectTrigger id="candidate-job">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button onClick={handleSubmit} loading={isPending} disabled={!name || !email || !jobId}>
        <UserPlus className="size-4" aria-hidden="true" />
        Create interview link
      </Button>

      {result && (
        <Card className="border-primary/30">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="success">{result.reused ? "Existing link" : "Link created"}</Badge>
              <span className="text-muted-foreground text-sm">
                {result.reused
                  ? "This candidate already has an active link for this job - reusing it instead of creating a duplicate."
                  : "Share this link with the candidate. It expires in 7 days and can only be used once."}
              </span>
            </div>
            <CopyableUrl url={result.url} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { InviteForm };
