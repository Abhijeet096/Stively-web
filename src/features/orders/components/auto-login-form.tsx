"use client";

import * as React from "react";
import { useActionState } from "react";

import { acceptOrderAutoLogin } from "../actions/guest-checkout-actions";

/** Auto-submits itself on mount - the visitor never has to click anything, matching the brief's "carry them straight past the login wall." A successful sign-in throws a redirect before this ever re-renders with state; only a failure (expired/already-used link) actually shows the error below. */
function AutoLoginForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptOrderAutoLogin, null);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-center gap-3">
      <input type="hidden" name="token" value={token} />
      {state?.success === false ? (
        <>
          <h1 className="font-display text-xl font-semibold">This link isn&apos;t valid</h1>
          <p className="text-muted-foreground max-w-sm text-sm">{state.error}</p>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Signing you in…</p>
      )}
    </form>
  );
}

export { AutoLoginForm };
