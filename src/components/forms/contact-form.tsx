"use client";

import * as React from "react";
import { useActionState } from "react";

import { submitContactEnquiry, type ContactFormState } from "@/actions/leads";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

type EnquiryType = "STUDENT" | "BUSINESS";

/**
 * The one Client Component this page needs - everything else (Hero, Contact
 * Methods, Trust, FAQ, final CTA) stays a Server Component. Two genuine
 * interactivity needs justify it: switching which fields render (Student vs
 * Business) and tracking submission state (pending/success/error) via
 * useActionState, per design-system.md's "Client Components only when
 * necessary" and Phase E's Contact page decision that a successful
 * submission replaces the form with a confirmation, not a toast.
 */
function ContactForm({
  defaultType = "STUDENT",
  offeringTitle,
}: {
  defaultType?: EnquiryType;
  /** Carried through from `/contact?offering=<title>` (see OfferingCTA) - prefills the field each mode already has for exactly this purpose, rather than adding new schema/validation. */
  offeringTitle?: string;
}) {
  const [enquiryType, setEnquiryType] = React.useState<EnquiryType>(defaultType);
  const [state, formAction, isPending] = useActionState<ContactFormState, FormData>(
    submitContactEnquiry,
    null
  );

  if (state?.success) {
    return (
      <div
        aria-live="polite"
        className="border-border bg-card flex flex-col items-center gap-3 rounded-3xl border p-8 text-center"
      >
        <h3 className="text-foreground text-lg font-semibold">Message sent</h3>
        <p className="text-muted-foreground">
          Thanks for reaching out - we usually reply within a day. We&apos;ll get back to you at the
          email you provided.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-foreground text-sm font-medium">I&apos;m reaching out as a</legend>
        <div className="flex gap-2" role="radiogroup" aria-label="Enquiry type">
          {(["STUDENT", "BUSINESS"] as const).map((type) => (
            <label
              key={type}
              className={`flex-1 cursor-pointer rounded-xl border px-4 py-2.5 text-center text-sm font-medium transition-colors duration-150 ${
                enquiryType === type
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                name="enquiryType"
                value={type}
                checked={enquiryType === type}
                onChange={() => setEnquiryType(type)}
                className="sr-only"
              />
              {type === "STUDENT" ? "Student" : "Business"}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField id="name" label="Full name">
        <Input name="name" required autoComplete="name" />
      </FormField>

      <FormField id="email" label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </FormField>

      <FormField id="phone" label="Phone" optional>
        <Input name="phone" type="tel" autoComplete="tel" />
      </FormField>

      {enquiryType === "BUSINESS" ? (
        <FormField id="companyName" label="Company name">
          <Input name="companyName" required autoComplete="organization" />
        </FormField>
      ) : (
        <FormField id="programInterest" label="Program of interest" optional>
          <Input
            name="programInterest"
            placeholder="e.g. Full-Stack Web Development"
            defaultValue={offeringTitle}
          />
        </FormField>
      )}

      <FormField
        id="message"
        label={enquiryType === "BUSINESS" ? "Tell us about your project" : "Your message"}
      >
        <Textarea
          name="message"
          required
          rows={5}
          defaultValue={
            enquiryType === "BUSINESS" && offeringTitle ? `Regarding: ${offeringTitle}\n\n` : undefined
          }
        />
      </FormField>

      {state?.success === false && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" loading={isPending} className="w-full sm:w-auto">
        Send a message
      </Button>
    </form>
  );
}

export { ContactForm };
