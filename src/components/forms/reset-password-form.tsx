"use client";

import { useActionState } from "react";
import Link from "next/link";

import { resetPassword } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  if (state?.success) {
    return (
      <div
        aria-live="polite"
        className="border-border bg-card flex flex-col items-center gap-3 rounded-3xl border p-8 text-center"
      >
        <h2 className="text-foreground text-lg font-semibold">Password updated</h2>
        <p className="text-muted-foreground">{state.message}</p>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      <FormField
        id="password"
        label="New password"
        helpText="At least 8 characters, with a letter and a number."
      >
        <Input name="password" type="password" required autoComplete="new-password" />
      </FormField>

      <FormField id="confirmPassword" label="Confirm new password">
        <Input name="confirmPassword" type="password" required autoComplete="new-password" />
      </FormField>

      {state?.success === false && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Reset password
      </Button>
    </form>
  );
}

export { ResetPasswordForm };
