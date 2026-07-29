"use client";

import * as React from "react";
import { useActionState } from "react";
import { MessageCircle, CheckCircle2 } from "lucide-react";

import { submitStartProjectLead, type StartProjectFormState } from "@/actions/leads";
import {
  START_PROJECT_SERVICES,
  START_PROJECT_SERVICE_LABEL,
  START_PROJECT_BUDGETS,
  START_PROJECT_BUDGET_LABEL,
} from "@/lib/validations/lead";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

function PillGroup<T extends string>({
  name,
  options,
  labels,
  value,
  onChange,
}: {
  name: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((option) => (
        <label
          key={option}
          className={`cursor-pointer rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
            value === option
              ? "border-primary bg-primary/10 text-primary"
              : "border-input text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-foreground"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="sr-only"
          />
          {labels[option]}
        </label>
      ))}
    </div>
  );
}

/**
 * The /start-project ad-landing page's lead form. Deliberately shorter than
 * ContactForm - only Full Name and Phone are required (matches the founder's
 * own spec), no message-length minimum, so a paid-traffic visitor can submit
 * in under a minute. Service/budget render as clickable pill groups rather
 * than a native <select> so the qualifying signal (what do they want, what
 * can they spend) is visible at a glance, not hidden behind a dropdown.
 */
function StartProjectForm() {
  const [service, setService] = React.useState<(typeof START_PROJECT_SERVICES)[number] | "">("");
  const [budget, setBudget] = React.useState<(typeof START_PROJECT_BUDGETS)[number] | "">("");
  const [state, formAction, isPending] = useActionState<StartProjectFormState, FormData>(
    submitStartProjectLead,
    null
  );

  if (state?.success) {
    return (
      <div aria-live="polite" className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="text-primary size-10" aria-hidden="true" />
        <h3 className="text-foreground text-lg font-semibold">Got it — we&apos;ll call you today</h3>
        <p className="text-muted-foreground text-sm text-pretty">
          One of our team will reach out on the number you shared. If it&apos;s urgent, message us on
          WhatsApp right now instead.
        </p>
        <Button variant="outline" asChild className="mt-1">
          <a href={getWhatsAppUrl("/start-project")} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" aria-hidden="true" />
            Chat on WhatsApp
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="fullName" label="Full Name">
          <Input name="fullName" required autoComplete="name" />
        </FormField>
        <FormField id="companyName" label="Company Name" optional>
          <Input name="companyName" autoComplete="organization" />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="email" label="Email" optional>
          <Input name="email" type="email" autoComplete="email" />
        </FormField>
        <FormField id="phone" label="Phone Number">
          <Input name="phone" type="tel" required autoComplete="tel" />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="whatsappNumber" label="WhatsApp Number" optional>
          <Input name="whatsappNumber" type="tel" />
        </FormField>
        <FormField id="businessType" label="Business Type" optional>
          <Input name="businessType" placeholder="e.g. Retail, Clinic, SaaS" />
        </FormField>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Which service do you need?</span>
        <PillGroup
          name="service"
          options={START_PROJECT_SERVICES}
          labels={START_PROJECT_SERVICE_LABEL}
          value={service}
          onChange={setService}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Estimated Budget</span>
        <PillGroup
          name="budget"
          options={START_PROJECT_BUDGETS}
          labels={START_PROJECT_BUDGET_LABEL}
          value={budget}
          onChange={setBudget}
        />
      </div>

      <FormField id="description" label="Project Description" optional>
        <Textarea name="description" rows={3} placeholder="What are you looking to build?" />
      </FormField>

      {state?.success === false && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Submit
      </Button>

      <div className="flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs uppercase tracking-wide">or</span>
        <div className="bg-border h-px flex-1" />
      </div>

      <a
        href={getWhatsAppUrl("/start-project")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        Message us on WhatsApp instead
      </a>
    </form>
  );
}

export { StartProjectForm };
