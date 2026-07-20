import { Button } from "@/components/ui/button";
import type { WizardStepConfig } from "../../lib/steps-config";

export interface WizardReviewProps {
  steps: WizardStepConfig[];
  values: Record<string, string>;
  error?: string;
  isPending: boolean;
  onEditStep: (index: number) => void;
  onSubmit: () => void;
}

function fieldDisplayValue(field: WizardStepConfig["fields"][number], value: string): string {
  if (!value) return "-";
  const option = field.options?.find((o) => o.value === value);
  return option?.label ?? value;
}

function WizardReview({ steps, values, error, isPending, onEditStep, onSubmit }: WizardReviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Review everything below before submitting - you can jump back to any step to make a change.
      </p>

      <div className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <div key={step.key} className="border-border rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-foreground text-sm font-semibold">{step.title}</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(index)}>
                Edit
              </Button>
            </div>
            <dl className="grid gap-2 sm:grid-cols-2">
              {step.fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">{field.label}</dt>
                  <dd className="text-foreground text-sm">
                    {fieldDisplayValue(field, values[field.name] ?? "")}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button size="lg" loading={isPending} onClick={onSubmit} className="w-full sm:w-auto">
        Submit
      </Button>
    </div>
  );
}

export { WizardReview };
