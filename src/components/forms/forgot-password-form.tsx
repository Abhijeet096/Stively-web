"use client";

import { useActionState } from "react";
import Link from "next/link";

import { requestPasswordReset } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);

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
    <form action={formAction} className="flex flex-col gap-5">
      <FormField id="email" label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </FormField>

      {state?.success === false && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Send reset link
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export { ForgotPasswordForm };
