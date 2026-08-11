"use client";

import { useActionState } from "react";

import { acceptClientInvite } from "../../actions/client-invite-actions";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

export interface AcceptInviteFormProps {
  token: string;
  email: string;
  businessName: string;
}

/** Sets a name + password and is signed straight into /client/dashboard on success (see acceptClientInvite) - the email itself is fixed (this link was generated for it specifically), never a free-text field here. */
function AcceptInviteForm({ token, email, businessName }: AcceptInviteFormProps) {
  const [state, formAction, isPending] = useActionState(acceptClientInvite, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      <FormField id="invite-email" label="Email">
        <Input id="invite-email" value={email} disabled readOnly />
      </FormField>

      <FormField id="invite-name" label="Your name">
        <Input name="name" required autoComplete="name" />
      </FormField>

      <FormField id="invite-password" label="Choose a password" helpText="At least 8 characters.">
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </FormField>

      {state?.success === false && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Create my {businessName} account
      </Button>
    </form>
  );
}

export { AcceptInviteForm };
