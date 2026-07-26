"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LeadScoringConfig } from "@prisma/client";
import { Save, Lightbulb } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/sections/empty-state";
import { updateLeadScoringConfig } from "../../actions/scoring-config-actions";
import type { WeightAdjustmentSuggestion } from "../../server/learning-engine";

const WEIGHT_FIELDS = [
  { key: "websiteQualityWeight", label: "Website Quality" },
  { key: "reviewRatingWeight", label: "Review Rating" },
  { key: "reviewCountWeight", label: "Review Count" },
  { key: "hasWebsiteWeight", label: "Has a Website" },
  { key: "industryFitWeight", label: "Industry Fit" },
  { key: "growthSignalsWeight", label: "Growth Signals" },
  { key: "contactAvailabilityWeight", label: "Contact Availability" },
] as const;

type WeightKey = (typeof WEIGHT_FIELDS)[number]["key"];

function ScoringConfigPanel({ config, suggestions }: { config: LeadScoringConfig; suggestions: WeightAdjustmentSuggestion[] }) {
  const router = useRouter();
  const [weights, setWeights] = React.useState<Record<WeightKey, number>>(() => {
    const initial = {} as Record<WeightKey, number>;
    for (const { key } of WEIGHT_FIELDS) initial[key] = config[key];
    return initial;
  });
  const [notes, setNotes] = React.useState(config.notes ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const total = WEIGHT_FIELDS.reduce((sum, { key }) => sum + weights[key], 0);

  async function handleSave() {
    setIsSaving(true);
    setError(undefined);
    const result = await updateLeadScoringConfig({ ...weights, notes: notes || undefined });
    setIsSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function applySuggestion(suggestion: WeightAdjustmentSuggestion) {
    setWeights((prev) => ({ ...prev, [suggestion.field]: suggestion.suggestedValue }));
  }

  function applyAll() {
    setWeights((prev) => {
      const next = { ...prev };
      for (const s of suggestions) next[s.field] = s.suggestedValue;
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Scoring weights</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className={`text-sm ${total === 100 ? "text-muted-foreground" : "text-warning"}`}>
            Total: {total} {total !== 100 && "(expected to sum to ~100, not enforced)"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {WEIGHT_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  min={0}
                  max={100}
                  value={weights[key]}
                  onChange={(e) => setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="config-notes">Notes (optional)</Label>
            <Textarea id="config-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Why this change..." />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button size="sm" loading={isSaving} onClick={handleSave} className="self-end">
            <Save className="size-4" aria-hidden="true" />
            Save as new active config
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested weight adjustments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {suggestions.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No suggestions yet"
              description="Once enough businesses have been promoted and their Sales Leads reach Won or Lost, real correlations will appear here."
            />
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {suggestions.map((s) => (
                  <li key={s.field} className="border-border flex flex-col gap-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-foreground text-sm font-medium">
                        {WEIGHT_FIELDS.find((f) => f.key === s.field)?.label}: {s.currentValue} → {s.suggestedValue}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => applySuggestion(s)}>
                        Apply
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm">{s.rationale}</p>
                  </li>
                ))}
              </ul>
              <Button size="sm" onClick={applyAll} className="self-end">
                Apply all
              </Button>
              <p className="text-muted-foreground text-xs">Applying only fills the form above - click &quot;Save as new active config&quot; to make it real.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { ScoringConfigPanel };
