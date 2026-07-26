"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Copy, Check, MessageCircle, Mail, Phone, Share2, ExternalLink } from "lucide-react";
import type { SalesLeadOutreach } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/sections/empty-state";
import { generateOutreach } from "../../actions/outreach-actions";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Digits-only, leading trunk-prefix zeros stripped first (Google Places listings like "099881 15250" store these), then a bare 10-digit number is assumed Indian (this codebase's only market so far - see SalesLead.country's "India" default) and prefixed with 91; anything else is left as-is under the assumption it already carries a country code. */
function toWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

interface SalesLeadOutreachPanelProps {
  salesLeadId: string;
  outreach: SalesLeadOutreach | undefined;
  /** Used to build the wa.me / tel: quick-action links - whatsapp field preferred, falls back to phone. */
  whatsappOrPhone: string | null;
  phone: string;
  email: string | null;
}

/**
 * The "Generate Outreach" feature - one click produces a WhatsApp message,
 * cold email, cold-call script, and (where the lead has a real named
 * contact) a LinkedIn intro, all in one Groq call grounded in this lead's
 * real data. Shared between the admin CRM and the /sales portal (same
 * component SalesLeadDetail already reuses for everything else) - both
 * ADMIN/SUPER_ADMIN and SALES can generate for leads they can see.
 */
function SalesLeadOutreachPanel({ salesLeadId, outreach, whatsappOrPhone, phone, email }: SalesLeadOutreachPanelProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleGenerate() {
    setIsGenerating(true);
    setError(undefined);
    const result = await generateOutreach(salesLeadId);
    setIsGenerating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const waUrl = whatsappOrPhone && outreach ? `https://wa.me/${toWhatsAppDigits(whatsappOrPhone)}?text=${encodeURIComponent(outreach.whatsappMessage)}` : null;
  const mailUrl =
    email && outreach
      ? `mailto:${email}?subject=${encodeURIComponent(outreach.emailSubject)}&body=${encodeURIComponent(outreach.emailBody)}`
      : null;
  const telUrl = phone ? `tel:${phone.replace(/\s+/g, "")}` : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>AI Outreach</CardTitle>
        <Button size="sm" loading={isGenerating} onClick={handleGenerate}>
          <Sparkles className="size-4" aria-hidden="true" />
          {outreach ? "Regenerate" : "Generate Outreach"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {!outreach ? (
          <EmptyState
            icon={Sparkles}
            title="No outreach generated yet"
            description="Generate a personalized WhatsApp message, cold email, call script, and LinkedIn intro for this lead in one click."
          />
        ) : (
          <>
            <p className="text-muted-foreground text-xs">
              Generated {formatDateTime(outreach.createdAt)} · {outreach.modelUsed}
            </p>

            <Tabs defaultValue="whatsapp">
              <TabsList>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="call">Cold call</TabsTrigger>
                <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              </TabsList>

              <TabsContent value="whatsapp" className="flex flex-col gap-3">
                <Textarea readOnly value={outreach.whatsappMessage} rows={5} />
                <div className="flex gap-2">
                  <CopyButton text={outreach.whatsappMessage} />
                  {waUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={waUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="size-3.5" aria-hidden="true" />
                        Open in WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="email" className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs font-medium">Subject</span>
                  <Textarea readOnly value={outreach.emailSubject} rows={1} className="min-h-0 resize-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs font-medium">Body</span>
                  <Textarea readOnly value={outreach.emailBody} rows={9} />
                </div>
                <div className="flex gap-2">
                  <CopyButton text={`Subject: ${outreach.emailSubject}\n\n${outreach.emailBody}`} />
                  {mailUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={mailUrl}>
                        <Mail className="size-3.5" aria-hidden="true" />
                        Open in email
                      </a>
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="call" className="flex flex-col gap-3">
                <Textarea readOnly value={outreach.coldCallScript} rows={6} />
                <div className="flex gap-2">
                  <CopyButton text={outreach.coldCallScript} />
                  {telUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={telUrl}>
                        <Phone className="size-3.5" aria-hidden="true" />
                        Call {phone}
                      </a>
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="linkedin" className="flex flex-col gap-3">
                {outreach.linkedinMessage ? (
                  <>
                    <Textarea readOnly value={outreach.linkedinMessage} rows={4} />
                    <div className="flex gap-2">
                      <CopyButton text={outreach.linkedinMessage} />
                      <Button size="sm" variant="outline" asChild>
                        <a href="https://www.linkedin.com/search/results/all/" target="_blank" rel="noopener noreferrer">
                          <Share2 className="size-3.5" aria-hidden="true" />
                          Find on LinkedIn
                          <ExternalLink className="size-3 opacity-60" aria-hidden="true" />
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Not generated - this lead has no named contact person on file, so a genuine LinkedIn intro can&apos;t be written for them.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesLeadOutreachPanel };
