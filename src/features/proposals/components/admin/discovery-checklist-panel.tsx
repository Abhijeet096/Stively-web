"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import type { SalesLeadDiscovery } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { updateSalesLeadDiscovery } from "../../actions/discovery-actions";
import { computeProposalReadiness } from "../../lib/readiness";

export interface DiscoveryOfferingOption {
  id: string;
  title: string;
  price: number | null;
  currency: string;
}

interface DiscoveryChecklistPanelProps {
  salesLeadId: string;
  discovery: SalesLeadDiscovery | null;
  offerings: DiscoveryOfferingOption[];
}

/** paise -> rupees for the plain-number budget inputs; null/blank stays null, never coerced to 0. */
function toRupees(paise: number | null | undefined): string {
  return paise != null ? String(Math.round(paise / 100)) : "";
}
function toPaise(rupees: string): number | null {
  const trimmed = rupees.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/**
 * The proposal readiness checklist a salesperson fills in as discovery
 * happens - not an event log, a working draft (see SalesLeadDiscovery's
 * schema comment). Generate Proposal (built in a later phase) stays
 * disabled until computeProposalReadiness says every item here is done -
 * a proposal must never be generated before discovery is captured.
 */
function DiscoveryChecklistPanel({ salesLeadId, discovery, offerings }: DiscoveryChecklistPanelProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const [budgetDiscussed, setBudgetDiscussed] = React.useState(discovery?.budgetDiscussed ?? false);
  const [budgetMin, setBudgetMin] = React.useState(toRupees(discovery?.budgetMin));
  const [budgetMax, setBudgetMax] = React.useState(toRupees(discovery?.budgetMax));
  const [budgetNotes, setBudgetNotes] = React.useState(discovery?.budgetNotes ?? "");

  const [timelineDiscussed, setTimelineDiscussed] = React.useState(discovery?.timelineDiscussed ?? false);
  const [timelineExpectation, setTimelineExpectation] = React.useState(discovery?.timelineExpectation ?? "");

  const [decisionMakerIdentified, setDecisionMakerIdentified] = React.useState(discovery?.decisionMakerIdentified ?? false);
  const [decisionMakerName, setDecisionMakerName] = React.useState(discovery?.decisionMakerName ?? "");
  const [decisionMakerRole, setDecisionMakerRole] = React.useState(discovery?.decisionMakerRole ?? "");

  const [requirementsCaptured, setRequirementsCaptured] = React.useState(discovery?.requirementsCaptured ?? false);
  const [requirementsNotes, setRequirementsNotes] = React.useState(discovery?.requirementsNotes ?? "");
  const [painPoints, setPainPoints] = React.useState(discovery?.painPoints ?? "");

  const [selectedOfferingIds, setSelectedOfferingIds] = React.useState<Set<string>>(new Set(discovery?.selectedOfferingIds ?? []));
  const [customServiceNotes, setCustomServiceNotes] = React.useState(discovery?.customServiceNotes ?? "");

  const readiness = computeProposalReadiness({
    ...discovery,
    budgetDiscussed,
    timelineDiscussed,
    decisionMakerIdentified,
    requirementsCaptured,
    selectedOfferingIds: Array.from(selectedOfferingIds),
  } as SalesLeadDiscovery);

  function toggleOffering(id: string) {
    setSelectedOfferingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setError(undefined);
    const result = await updateSalesLeadDiscovery({
      salesLeadId,
      budgetDiscussed,
      budgetMin: toPaise(budgetMin),
      budgetMax: toPaise(budgetMax),
      budgetNotes,
      timelineDiscussed,
      timelineExpectation,
      decisionMakerIdentified,
      decisionMakerName,
      decisionMakerRole,
      requirementsCaptured,
      requirementsNotes,
      painPoints,
      selectedOfferingIds: Array.from(selectedOfferingIds),
      customServiceNotes,
    });
    setIsSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Discovery &amp; proposal readiness</CardTitle>
        <Badge variant={readiness.ready ? "success" : "secondary"}>
          {readiness.ready ? "Ready for proposal" : `${readiness.missing.length} item${readiness.missing.length === 1 ? "" : "s"} left`}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!readiness.ready && (
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            {readiness.missing.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Circle className="size-3.5 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={budgetDiscussed} onChange={(e) => setBudgetDiscussed(e.target.checked)} />
            Budget discussed
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Min (₹)" inputMode="numeric" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            <Input placeholder="Max (₹)" inputMode="numeric" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </div>
          <Textarea placeholder="Budget notes (optional)" rows={2} value={budgetNotes} onChange={(e) => setBudgetNotes(e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={timelineDiscussed} onChange={(e) => setTimelineDiscussed(e.target.checked)} />
            Timeline discussed
          </label>
          <Input
            placeholder="e.g. Launch before Diwali"
            value={timelineExpectation}
            onChange={(e) => setTimelineExpectation(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={decisionMakerIdentified} onChange={(e) => setDecisionMakerIdentified(e.target.checked)} />
            Decision maker identified
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Name" value={decisionMakerName} onChange={(e) => setDecisionMakerName(e.target.value)} />
            <Input placeholder="Role, e.g. Founder" value={decisionMakerRole} onChange={(e) => setDecisionMakerRole(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={requirementsCaptured} onChange={(e) => setRequirementsCaptured(e.target.checked)} />
            Requirements captured
          </label>
          <Textarea placeholder="What they asked for" rows={3} value={requirementsNotes} onChange={(e) => setRequirementsNotes(e.target.value)} />
          <Textarea
            placeholder="Pain points you observed (optional - distinct from AI-detected website issues)"
            rows={2}
            value={painPoints}
            onChange={(e) => setPainPoints(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Services selected</Label>
          {offerings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No published offerings to select from.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {offerings.map((offering) => (
                <label key={offering.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedOfferingIds.has(offering.id)} onChange={() => toggleOffering(offering.id)} />
                    {offering.title}
                  </span>
                  {offering.price != null && (
                    <span className="text-muted-foreground text-xs">{formatPrice(offering.price, offering.currency)}</span>
                  )}
                </label>
              ))}
            </div>
          )}
          <Textarea
            placeholder="Custom / add-on service notes (optional)"
            rows={2}
            value={customServiceNotes}
            onChange={(e) => setCustomServiceNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button size="sm" loading={isSaving} onClick={handleSave} className="self-start">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Save discovery notes
        </Button>
      </CardContent>
    </Card>
  );
}

export { DiscoveryChecklistPanel };
