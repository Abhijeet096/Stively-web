"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";

import { registerUser } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/forms/google-signin-button";

type PublicRole = "STUDENT" | "CLIENT";

export interface RegisterFormProps {
  defaultRole?: PublicRole;
  callbackUrl?: string;
  /** Prefilled (never locked - see AD-017) from a recent contact/start-project inquiry on this browser, so someone who already reached out doesn't drift into a second, disconnected identity by registering under a different email. */
  defaultEmail?: string;
}

/**
 * The only two roles anyone can self-register as - see the brief's
 * "expose Student and Business/Client only" rule, enforced again (not just
 * here) by src/lib/validations/auth.ts's registerSchema server-side.
 */
function RegisterForm({ defaultRole = "STUDENT", callbackUrl, defaultEmail }: RegisterFormProps) {
  const [role, setRole] = React.useState<PublicRole>(defaultRole);
  const [state, formAction, isPending] = useActionState(registerUser, null);

  if (state?.success) {
    return (
      <div
        aria-live="polite"
        className="border-border bg-card flex flex-col items-center gap-3 rounded-3xl border p-8 text-center"
      >
        <h2 className="text-foreground text-lg font-semibold">Check your email</h2>
        <p className="text-muted-foreground">{state.message}</p>
        <Link
          href="/login"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="border-border bg-muted flex gap-1 rounded-full border p-1"
        role="radiogroup"
        aria-label="I'm signing up as a"
      >
        {(["STUDENT", "CLIENT"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={role === option}
            onClick={() => setRole(option)}
            className={
              "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 " +
              (role === option
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {option === "STUDENT" ? "Student" : "Business"}
          </button>
        ))}
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="role" value={role} />
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

        <FormField id="name" label="Full name">
          <Input name="name" required autoComplete="name" />
        </FormField>

        <FormField
          id="email"
          label="Email"
          helpText={defaultEmail ? "This matches your recent inquiry to Stively - change it if you'd like to use a different one." : undefined}
        >
          <Input name="email" type="email" required autoComplete="email" defaultValue={defaultEmail} />
        </FormField>

        {role === "CLIENT" && (
          <FormField id="companyName" label="Company name">
            <Input name="companyName" required autoComplete="organization" />
          </FormField>
        )}

        <FormField id="password" label="Password" helpText="At least 8 characters, with a letter and a number.">
          <Input name="password" type="password" required autoComplete="new-password" />
        </FormField>

        <FormField id="confirmPassword" label="Confirm password">
          <Input name="confirmPassword" type="password" required autoComplete="new-password" />
        </FormField>

        {state?.success === false && (
          <p role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" loading={isPending} className="w-full">
          Create account
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or</span>
        <div className="bg-border h-px flex-1" />
      </div>

      <GoogleSignInButton callbackUrl={callbackUrl} role={role} email={defaultEmail} />

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export { RegisterForm };
