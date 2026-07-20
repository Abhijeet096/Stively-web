"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { RequestType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { saveRequestStep, submitRequest } from "../../actions/request-actions";
import { STEPS_BY_TYPE } from "../../lib/steps-config";
import { WizardProgress } from "./wizard-progress";
import { WizardStepForm } from "./wizard-step-form";
import { WizardReview } from "./wizard-review";

export interface RequestWizardProps {
  requestId: string;
  requestType: RequestType;
  /** currentStep is 1-based ("resume at step N"); this is that minus one, clamped to a valid index (steps.length itself = the Review step). */
  initialStepIndex: number;
  initialValues: Record<string, string>;
  /** Where Submit redirects to once the request is created. */
  detailPathPrefix: string;
}

const AUTOSAVE_DELAY_MS = 1500;

/**
 * Owns the whole client-side flow: which step is showing, the values
 * collected so far, debounced autosave, and the final submit. Persistence
 * always goes through saveRequestStep/submitRequest (server actions that
 * re-check ownership) - this component never talks to Prisma directly.
 */
function RequestWizard({
  requestId,
  requestType,
  initialStepIndex,
  initialValues,
  detailPathPrefix,
}: RequestWizardProps) {
  const router = useRouter();
  const steps = STEPS_BY_TYPE[requestType];
  const reviewIndex = steps.length;

  const [stepIndex, setStepIndex] = React.useState(() => Math.min(initialStepIndex, reviewIndex));
  const [values, setValues] = React.useState<Record<string, string>>(initialValues);
  const [stepError, setStepError] = React.useState<string | undefined>();
  const [submitError, setSubmitError] = React.useState<string | undefined>();
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [autosaveStatus, setAutosaveStatus] = React.useState<"idle" | "saving" | "saved">("idle");

  const currentStep = stepIndex < steps.length ? steps[stepIndex] : undefined;

  const currentStepValues = React.useMemo(() => {
    if (!currentStep) return {};
    const subset: Record<string, string> = {};
    for (const field of currentStep.fields) subset[field.name] = values[field.name] ?? "";
    return subset;
  }, [currentStep, values]);

  // Debounced autosave of the current step's fields while the user types -
  // doesn't advance currentStep or block on validation, so a half-filled
  // optional field never blocks the save (only Next/Submit enforce rules).
  React.useEffect(() => {
    if (!currentStep) return;
    const hasAnyValue = Object.values(currentStepValues).some((v) => v.trim() !== "");
    if (!hasAnyValue) return;

    const handle = setTimeout(() => {
      setAutosaveStatus("saving");
      saveRequestStep(requestId, currentStep.key, currentStepValues, false)
        .then(() => setAutosaveStatus("saved"))
        .catch(() => setAutosaveStatus("idle"));
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepValues, requestId]);

  function handleChange(name: string, value: string) {
    setStepError(undefined);
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleNext() {
    if (!currentStep) return;
    setIsNavigating(true);
    setStepError(undefined);
    const result = await saveRequestStep(requestId, currentStep.key, currentStepValues, true);
    setIsNavigating(false);
    if (!result.success) {
      setStepError(result.error);
      return;
    }
    setStepIndex((i) => Math.min(i + 1, reviewIndex));
  }

  function handleBack() {
    setStepError(undefined);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(undefined);
    const result = await submitRequest(requestId);
    setIsSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    router.push(`${detailPathPrefix}/${result.requestId}`);
  }

  const titles = [...steps.map((s) => s.title), "Review"];

  return (
    <div className="flex flex-col gap-8">
      <WizardProgress titles={titles} currentIndex={stepIndex} />

      <div>
        {currentStep ? (
          <>
            <h2 className="font-display mb-6 text-xl font-semibold">{currentStep.title}</h2>
            <WizardStepForm step={currentStep} values={values} error={stepError} onChange={handleChange} />
          </>
        ) : (
          <>
            <h2 className="font-display mb-6 text-xl font-semibold">Review &amp; submit</h2>
            <WizardReview
              steps={steps}
              values={values}
              error={submitError}
              isPending={isSubmitting}
              onEditStep={setStepIndex}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </div>

      {currentStep && (
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={handleBack} disabled={stepIndex === 0}>
            Back
          </Button>
          <div className="flex items-center gap-3">
            <span aria-live="polite" className="text-muted-foreground text-xs">
              {autosaveStatus === "saving" ? "Saving..." : autosaveStatus === "saved" ? "Draft saved" : ""}
            </span>
            <Button type="button" loading={isNavigating} onClick={handleNext}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { RequestWizard };
