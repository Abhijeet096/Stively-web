"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Copy, Check, ExternalLink, Send, Plus, Trash2, History, CalendarClock, BarChart3 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_VARIANT } from "../../lib/labels";
import type { ProposalContent, ProposalPackageContent, ProposalCalculatorItemContent } from "../../lib/content-types";
import type { ProposalDetail } from "../../server/proposal-queries";
import type { ProposalEngagement } from "../../server/analytics-queries";
import { computeDealHealth, type DealHealthLevel } from "../../lib/deal-health";
import {
  regenerateWithCopilot,
  updatePackagesAndPricing,
  updateCalculatorPricing,
  updateRoiAssumptions,
  sendProposal,
  confirmProposalMeeting,
  declineProposalMeeting,
  suggestFollowUpMessage,
} from "../../actions/proposal-actions";
import { DEFAULT_PAYMENT_MILESTONE_SPLIT } from "../../server/roi-calculator";

interface ProposalWorkspaceProps {
  proposal: ProposalDetail;
  proposalUrl: string;
  engagement: ProposalEngagement | null;
}

const SECTION_LABEL: Record<string, string> = {
  pricing: "Pricing",
  timeline: "Timeline",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Local datetime-local input needs "YYYY-MM-DDTHH:mm" in the browser's own timezone, not UTC. */
function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MEETING_REQUEST_STATUS_VARIANT: Record<ProposalDetail["meetingRequests"][number]["status"], "secondary" | "success" | "destructive"> = {
  PENDING: "secondary",
  CONFIRMED: "success",
  DECLINED: "destructive",
};

const DEAL_HEALTH_LABEL: Record<DealHealthLevel, string> = {
  COLD: "Cold",
  AT_RISK: "At risk",
  WARM: "Warm",
  ON_TRACK: "On track",
  CLOSED: "Closed",
};

const DEAL_HEALTH_VARIANT: Record<DealHealthLevel, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  COLD: "outline",
  AT_RISK: "destructive",
  WARM: "warning",
  ON_TRACK: "default",
  CLOSED: "secondary",
};

/**
 * Health level is computed client-side - computeDealHealth is pure/zero-I/O
 * and every field it needs (status/sentAt/viewCount/lastViewedAt) is already
 * on the proposal prop, so no extra server round-trip is needed just to
 * render the badge. Only the AI-drafted follow-up copy needs a server call.
 */
function DealHealthCard({ proposal }: { proposal: ProposalDetail }) {
  const health = React.useMemo(() => computeDealHealth(proposal), [proposal]);
  const [draft, setDraft] = React.useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  if (health.level === "CLOSED") return null;

  async function handleSuggest() {
    setIsSuggesting(true);
    setError(undefined);
    const result = await suggestFollowUpMessage({ proposalId: proposal.id });
    setIsSuggesting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDraft(result.message ?? null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Deal health
          <Badge variant={DEAL_HEALTH_VARIANT[health.level]}>{DEAL_HEALTH_LABEL[health.level]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {health.reasons.map((reason, i) => (
          <p key={i} className="text-muted-foreground text-sm">
            {reason}
          </p>
        ))}
        {health.suggestFollowUp && (
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" size="sm" loading={isSuggesting} onClick={handleSuggest} className="w-fit">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Suggest follow-up message
            </Button>
            {error && <p className="text-destructive text-sm">{error}</p>}
            {draft && (
              <div className="flex flex-col gap-2">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} className="text-sm" />
                <p className="text-muted-foreground text-xs">Draft only - review, edit, and send it yourself over WhatsApp or email.</p>
                <CopyButton text={draft} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * One row per client-requested meeting time. No real Google Calendar/Meet
 * API integration exists in this codebase - meetingLink is whatever real
 * link the salesperson generated themselves and pastes in on confirm.
 */
function MeetingRequestRow({ meetingRequest, onChanged }: { meetingRequest: ProposalDetail["meetingRequests"][number]; onChanged: () => void }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmedAt, setConfirmedAt] = React.useState(toDatetimeLocalValue(meetingRequest.preferredAt));
  const [confirmedMethod, setConfirmedMethod] = React.useState<"EMAIL" | "PHONE" | "WHATSAPP" | "GOOGLE_MEET" | "ZOOM">("GOOGLE_MEET");
  const [meetingLink, setMeetingLink] = React.useState("");
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isDeclining, setIsDeclining] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleConfirm() {
    setIsConfirming(true);
    setError(undefined);
    const result = await confirmProposalMeeting({
      meetingRequestId: meetingRequest.id,
      confirmedAt: new Date(confirmedAt).toISOString(),
      confirmedMethod,
      meetingLink: meetingLink || undefined,
    });
    setIsConfirming(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setConfirmOpen(false);
    onChanged();
  }

  async function handleDecline() {
    setIsDeclining(true);
    await declineProposalMeeting({ meetingRequestId: meetingRequest.id });
    setIsDeclining(false);
    onChanged();
  }

  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground font-medium">{formatDateTime(meetingRequest.preferredAt)}</span>
        <Badge variant={MEETING_REQUEST_STATUS_VARIANT[meetingRequest.status]}>{meetingRequest.status}</Badge>
      </div>
      {meetingRequest.clientName && <span className="text-muted-foreground text-xs">From {meetingRequest.clientName}</span>}
      {meetingRequest.clientNote && <p className="text-muted-foreground text-xs">{meetingRequest.clientNote}</p>}

      {meetingRequest.status === "CONFIRMED" && meetingRequest.confirmedAt && (
        <p className="text-muted-foreground text-xs">
          Confirmed for {formatDateTime(meetingRequest.confirmedAt)}
          {meetingRequest.confirmedMethod ? ` via ${meetingRequest.confirmedMethod.replace(/_/g, " ")}` : ""}
          {meetingRequest.meetingLink ? ` · ${meetingRequest.meetingLink}` : ""}
        </p>
      )}

      {meetingRequest.status === "PENDING" && (
        <div className="flex gap-2">
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                Confirm
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm meeting</DialogTitle>
                <DialogDescription>Paste a real meeting link if you have one - no Calendar/Meet integration generates one automatically.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`confirmed-at-${meetingRequest.id}`}>Confirmed date &amp; time</Label>
                  <Input
                    id={`confirmed-at-${meetingRequest.id}`}
                    type="datetime-local"
                    value={confirmedAt}
                    onChange={(e) => setConfirmedAt(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`confirmed-method-${meetingRequest.id}`}>Method</Label>
                  {/* Native <select>, not Radix Select - see proposal-response-panel.tsx's package picker comment for why, inside a Dialog. */}
                  <select
                    id={`confirmed-method-${meetingRequest.id}`}
                    value={confirmedMethod}
                    onChange={(e) => setConfirmedMethod(e.target.value as typeof confirmedMethod)}
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                  >
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="ZOOM">Zoom</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="PHONE">Phone</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`meeting-link-${meetingRequest.id}`}>Meeting link (optional)</Label>
                  <Input
                    id={`meeting-link-${meetingRequest.id}`}
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button onClick={handleConfirm} loading={isConfirming}>
                    Confirm meeting
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="ghost" loading={isDeclining} onClick={handleDecline}>
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * The full authoring surface for one proposal - AI co-pilot, package/
 * pricing editor, ROI assumptions, send, and version history. Every
 * mutation here goes through proposal-actions.ts's role/viewer-scoped
 * server actions (never the public token-authenticated ones).
 */
function ProposalWorkspace({ proposal, proposalUrl, engagement }: ProposalWorkspaceProps) {
  const router = useRouter();
  const currentVersion = proposal.versions[0];
  const content = currentVersion?.content as unknown as ProposalContent | undefined;

  const [copilotInstruction, setCopilotInstruction] = React.useState("");
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const [packages, setPackages] = React.useState<ProposalPackageContent[]>(content?.packages ?? []);
  const [milestones, setMilestones] = React.useState(
    content && content.paymentMilestones.length > 0 ? content.paymentMilestones : DEFAULT_PAYMENT_MILESTONE_SPLIT
  );
  const [isSavingPricing, setIsSavingPricing] = React.useState(false);

  const [calculatorItems, setCalculatorItems] = React.useState<ProposalCalculatorItemContent[]>(content?.calculator?.items ?? []);
  const [calculatorMilestones, setCalculatorMilestones] = React.useState(
    content?.calculator && content.calculator.paymentMilestones.length > 0 ? content.calculator.paymentMilestones : DEFAULT_PAYMENT_MILESTONE_SPLIT
  );
  const [isSavingCalculator, setIsSavingCalculator] = React.useState(false);

  const [currentMonthlyLeads, setCurrentMonthlyLeads] = React.useState(content?.roiEstimate?.currentMonthlyLeads?.toString() ?? "");
  const [upliftPercent, setUpliftPercent] = React.useState(content?.roiEstimate?.upliftPercent?.toString() ?? "");
  const [averageDealValue, setAverageDealValue] = React.useState(
    content?.roiEstimate?.estimatedAdditionalMonthlyRevenue != null && content.roiEstimate.estimatedAdditionalLeadsPerMonth > 0
      ? String(Math.round(content.roiEstimate.estimatedAdditionalMonthlyRevenue / content.roiEstimate.estimatedAdditionalLeadsPerMonth / 100))
      : ""
  );
  const [roiNotes, setRoiNotes] = React.useState(content?.roiEstimate?.notes ?? "");
  const [isSavingRoi, setIsSavingRoi] = React.useState(false);

  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleRegenerate() {
    if (!copilotInstruction.trim()) return;
    setIsRegenerating(true);
    setError(undefined);
    const result = await regenerateWithCopilot({ proposalId: proposal.id, instruction: copilotInstruction });
    setIsRegenerating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCopilotInstruction("");
    router.refresh();
  }

  function addPackage() {
    setPackages((prev) => [...prev, { id: `package-${prev.length + 1}-${Date.now()}`, name: "", priceAmount: 0, whatsIncluded: [] }]);
  }
  function removePackage(id: string) {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  }
  function updatePackage(id: string, patch: Partial<ProposalPackageContent>) {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function handleSavePricing() {
    setIsSavingPricing(true);
    setError(undefined);
    const result = await updatePackagesAndPricing({
      proposalId: proposal.id,
      packages: packages.map((p) => ({ ...p, priceAmount: Math.round(p.priceAmount) })),
      paymentMilestones: milestones,
    });
    setIsSavingPricing(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function addCalculatorItem() {
    setCalculatorItems((prev) => [
      ...prev,
      { id: `item-${prev.length + 1}-${Date.now()}`, label: "", priceAmount: 0, defaultSelected: true, description: "" },
    ]);
  }
  function removeCalculatorItem(id: string) {
    setCalculatorItems((prev) => prev.filter((i) => i.id !== id));
  }
  function updateCalculatorItem(id: string, patch: Partial<ProposalCalculatorItemContent>) {
    setCalculatorItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function handleSaveCalculator() {
    setIsSavingCalculator(true);
    setError(undefined);
    const result = await updateCalculatorPricing({
      proposalId: proposal.id,
      items: calculatorItems.map((i) => ({ ...i, priceAmount: Math.round(i.priceAmount) })),
      paymentMilestones: calculatorMilestones,
    });
    setIsSavingCalculator(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleSaveRoi() {
    setIsSavingRoi(true);
    setError(undefined);
    const result = await updateRoiAssumptions({
      proposalId: proposal.id,
      currentMonthlyLeads: currentMonthlyLeads ? Number(currentMonthlyLeads) : null,
      estimatedUpliftPercent: upliftPercent ? Number(upliftPercent) : null,
      averageDealValue: averageDealValue ? Math.round(Number(averageDealValue) * 100) : null,
      notes: roiNotes || undefined,
    });
    setIsSavingRoi(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleSend() {
    setIsSending(true);
    setError(undefined);
    const result = await sendProposal({ proposalId: proposal.id });
    setIsSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">{proposal.title}</h1>
            <Badge variant={PROPOSAL_STATUS_VARIANT[proposal.status]}>{PROPOSAL_STATUS_LABEL[proposal.status]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            PR-{String(proposal.sequence).padStart(6, "0")} · {proposal.viewCount} view{proposal.viewCount === 1 ? "" : "s"}
            {proposal.sentAt ? ` · Sent ${formatDateTime(proposal.sentAt)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={proposalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" aria-hidden="true" />
              Preview
            </a>
          </Button>
          <Button size="sm" loading={isSending} onClick={handleSend}>
            <Send className="size-4" aria-hidden="true" />
            {proposal.status === "DRAFT" || proposal.status === "INTERNAL_REVIEW" ? "Send Proposal" : "Resend"}
          </Button>
        </div>
      </div>

      <div className="border-border bg-muted/40 flex items-center gap-2 rounded-lg border p-3">
        <code className="text-foreground min-w-0 flex-1 truncate text-sm">{proposalUrl}</code>
        <CopyButton text={proposalUrl} />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <DealHealthCard proposal={proposal} />

      {engagement && engagement.totalSessions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4" aria-hidden="true" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs">
              Real time spent reading, not just page loads (that&apos;s the {proposal.viewCount} view{proposal.viewCount === 1 ? "" : "s"} count above).
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span>
                <span className="text-foreground font-medium">{engagement.totalSessions}</span>{" "}
                <span className="text-muted-foreground">engaged session{engagement.totalSessions === 1 ? "" : "s"}</span>
              </span>
              <span>
                <span className="text-foreground font-medium">{engagement.totalActiveMinutes}</span>{" "}
                <span className="text-muted-foreground">total minutes reading</span>
              </span>
              {engagement.sectionMinutes.map((s) => (
                <span key={s.key}>
                  <span className="text-foreground font-medium">{s.minutes}</span>{" "}
                  <span className="text-muted-foreground">min on {SECTION_LABEL[s.key] ?? s.key}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" aria-hidden="true" />
            AI co-pilot
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Describe an update and the narrative, solution, and delivery sections will regenerate around it - pricing and ROI stay as you set them.
          </p>
          <Textarea
            placeholder='e.g. "The client is a gym, budget ₹1.5 lakh, they want online memberships and a mobile app in phase 2."'
            rows={3}
            value={copilotInstruction}
            onChange={(e) => setCopilotInstruction(e.target.value)}
          />
          <Button size="sm" loading={isRegenerating} onClick={handleRegenerate} disabled={!copilotInstruction.trim()} className="self-start">
            <Sparkles className="size-4" aria-hidden="true" />
            Update with AI
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Packages &amp; pricing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="border-border flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label>Package name</Label>
                  <Input value={pkg.name} onChange={(e) => updatePackage(pkg.id, { name: e.target.value })} placeholder="Starter" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={pkg.priceAmount ? pkg.priceAmount / 100 : ""}
                    onChange={(e) => updatePackage(pkg.id, { priceAmount: Math.round(Number(e.target.value || 0) * 100) })}
                  />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removePackage(pkg.id)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <Label>What&apos;s included (one per line)</Label>
              <Textarea
                rows={3}
                value={pkg.whatsIncluded.join("\n")}
                onChange={(e) => updatePackage(pkg.id, { whatsIncluded: e.target.value.split("\n").filter(Boolean) })}
              />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addPackage} className="self-start">
            <Plus className="size-4" aria-hidden="true" />
            Add package
          </Button>

          <div className="flex flex-col gap-2">
            <Label>Payment schedule (percentages)</Label>
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={m.label}
                  onChange={(e) =>
                    setMilestones((prev) => prev.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))
                  }
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={m.percent}
                  onChange={(e) =>
                    setMilestones((prev) => prev.map((x, xi) => (xi === i ? { ...x, percent: Number(e.target.value || 0) } : x)))
                  }
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">%</span>
              </div>
            ))}
          </div>

          <Button size="sm" loading={isSavingPricing} onClick={handleSavePricing} disabled={packages.length === 0} className="self-start">
            Save pricing
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interactive calculator</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            An alternative to fixed packages above - the client toggles individual services and the price updates live. Use one pricing mode or the
            other, not both.
          </p>
          {calculatorItems.map((item) => (
            <div key={item.id} className="border-border flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label>Service name</Label>
                  <Input value={item.label} onChange={(e) => updateCalculatorItem(item.id, { label: e.target.value })} placeholder="SEO" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={item.priceAmount ? item.priceAmount / 100 : ""}
                    onChange={(e) => updateCalculatorItem(item.id, { priceAmount: Math.round(Number(e.target.value || 0) * 100) })}
                  />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeCalculatorItem(item.id)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.defaultSelected}
                  onChange={(e) => updateCalculatorItem(item.id, { defaultSelected: e.target.checked })}
                />
                Selected by default
              </label>
              <Input
                value={item.description ?? ""}
                onChange={(e) => updateCalculatorItem(item.id, { description: e.target.value })}
                placeholder="Short description (optional)"
              />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCalculatorItem} className="self-start">
            <Plus className="size-4" aria-hidden="true" />
            Add service
          </Button>

          <div className="flex flex-col gap-2">
            <Label>Payment schedule (percentages)</Label>
            {calculatorMilestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={m.label}
                  onChange={(e) => setCalculatorMilestones((prev) => prev.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={m.percent}
                  onChange={(e) =>
                    setCalculatorMilestones((prev) => prev.map((x, xi) => (xi === i ? { ...x, percent: Number(e.target.value || 0) } : x)))
                  }
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">%</span>
              </div>
            ))}
          </div>

          <Button size="sm" loading={isSavingCalculator} onClick={handleSaveCalculator} disabled={calculatorItems.length === 0} className="self-start">
            Save calculator
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ROI calculator assumptions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Computed only from what you enter here - leave blank to omit the ROI section entirely rather than show an invented estimate.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Current monthly leads</Label>
              <Input type="number" value={currentMonthlyLeads} onChange={(e) => setCurrentMonthlyLeads(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Estimated uplift (%)</Label>
              <Input type="number" value={upliftPercent} onChange={(e) => setUpliftPercent(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Avg. deal value (₹, optional)</Label>
              <Input type="number" value={averageDealValue} onChange={(e) => setAverageDealValue(e.target.value)} />
            </div>
          </div>
          <Textarea placeholder="Notes (optional)" rows={2} value={roiNotes} onChange={(e) => setRoiNotes(e.target.value)} />
          <Button size="sm" loading={isSavingRoi} onClick={handleSaveRoi} className="self-start">
            Save ROI assumptions
          </Button>
        </CardContent>
      </Card>

      {proposal.meetingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4" aria-hidden="true" />
              Meeting requests
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {proposal.meetingRequests.map((mr) => (
              <MeetingRequestRow key={mr.id} meetingRequest={mr} onChanged={() => router.refresh()} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" aria-hidden="true" />
            Version history
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {proposal.versions.map((v) => (
            <div key={v.id} className="border-border flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex flex-col">
                <span className="text-foreground font-medium">
                  Version {v.versionNumber} · {v.source.replace(/_/g, " ")}
                </span>
                {v.copilotInstruction && <span className="text-muted-foreground text-xs">&ldquo;{v.copilotInstruction}&rdquo;</span>}
              </div>
              <span className="text-muted-foreground text-xs">{formatDateTime(v.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {proposal.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Client comments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {proposal.comments.map((c) => (
              <div key={c.id} className="border-border rounded-lg border p-3">
                {c.type === "MEETING_REQUEST" && (
                  <Badge variant="secondary" className="mb-1.5">
                    Meeting request
                  </Badge>
                )}
                {c.type === "AI_CHAT" && (
                  <Badge variant="secondary" className="mb-1.5">
                    <Sparkles className="size-3" aria-hidden="true" />
                    AI chat
                  </Badge>
                )}
                <p className="text-foreground text-sm">{c.content}</p>
                {c.type === "AI_CHAT" && c.aiAnswer && <p className="text-muted-foreground mt-1 text-sm italic">{c.aiAnswer}</p>}
                <p className="text-muted-foreground mt-1 text-xs">
                  {c.clientName ?? "Client"} · {formatDateTime(c.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {proposal.clientResponseNote && (
        <Card>
          <CardHeader>
            <CardTitle>Client response</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-sm">{proposal.clientResponseNote}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { ProposalWorkspace };
