"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

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
  const router = useRouter();
  // Defaults to Website - the first Google Ads campaign targets web
  // development search terms specifically, so most visitors landing here
  // already want this; pre-selecting it removes a click for them while
  // still letting anyone pick a different service.
  const [service, setService] = React.useState<(typeof START_PROJECT_SERVICES)[number] | "">("WEBSITE");
  const [budget, setBudget] = React.useState<(typeof START_PROJECT_BUDGETS)[number] | "">("");
  const [state, formAction, isPending] = useActionState<StartProjectFormState, FormData>(
    submitStartProjectLead,
    null
  );

  // Navigates to a dedicated URL (rather than swapping in an inline
  // confirmation) so Google Ads/GA4 can track "reached /thank-you" as a
  // real, reliable conversion event - the industry-standard approach for
  // lead-gen funnels. @next/third-parties' GoogleAnalytics component
  // already fires a pageview on App Router client-side navigation, so
  // router.push here is enough - no manual gtag call needed.
  React.useEffect(() => {
    if (state?.success) {
      router.push("/thank-you");
    }
  }, [state, router]);

  if (state?.success) {
    return (
      <div aria-live="polite" className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="border-primary/30 border-t-primary size-8 animate-spin rounded-full border-2" />
        <p className="text-muted-foreground text-sm">Redirecting…</p>
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
        <FormField id="email" label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </FormField>
        <FormField id="phone" label="Phone Number">
          <Input name="phone" type="tel" required autoComplete="tel" />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="whatsappNumber" label="WhatsApp Number" optional>
          <Input name="whatsappNumber" type="tel" />
        </FormField>
        <FormField id="businessType" label="Business Type">
          <Input name="businessType" required placeholder="e.g. Retail, Clinic, SaaS" />
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
