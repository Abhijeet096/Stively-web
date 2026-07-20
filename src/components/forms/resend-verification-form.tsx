"use client";

import { useActionState } from "react";

import { resendVerificationEmail } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

/** Used from both /verify-email (expired/invalid token) and the login form's "email not verified" error state. */
function ResendVerificationForm() {
  const [state, formAction, isPending] = useActionState(resendVerificationEmail, null);

  if (state?.success) {
    return <p className="text-muted-foreground text-sm">{state.message}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <FormField id="resend-email" label="Email address">
        <Input name="email" type="email" required autoComplete="email" />
      </FormField>
      {state?.success === false && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="outline" loading={isPending} className="w-full">
        Resend verification email
      </Button>
    </form>
  );
}

export { ResendVerificationForm };
