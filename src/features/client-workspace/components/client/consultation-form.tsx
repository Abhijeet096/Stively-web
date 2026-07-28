"use client";

import * as React from "react";

import { bookConsultation } from "../../actions/consultation-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Name/email/company are read-only (pulled from the real account server-side) - the client only ever supplies phone + what they want to discuss. */
function ConsultationForm({
  name,
  email,
  companyName,
}: {
  name: string;
  email: string;
  companyName?: string | null;
}) {
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await bookConsultation({ phone, message });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <h3 className="text-foreground text-lg font-semibold">Request sent</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Thanks, {name.split(" ")[0]} - our team usually reaches out within a day at {phone}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input value={name} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          {companyName && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Business</Label>
              <Input value={companyName} disabled />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="consultation-phone">Phone</Label>
          <Input
            id="consultation-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Where can we reach you?"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="consultation-message">What would you like to discuss?</Label>
          <Textarea
            id="consultation-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us a bit about your project or question..."
            rows={5}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button loading={isPending} disabled={!phone.trim() || !message.trim()} onClick={handleSubmit} className="self-start">
          Request consultation
        </Button>
      </CardContent>
    </Card>
  );
}

export { ConsultationForm };
