import "server-only";

import type Groq from "groq-sdk";
import type { SalesLead } from "@prisma/client";

const PERSONA_RULES = `You are Stively's AI Sales Outreach assistant. Stively is a software development company offering website development, web applications, CRM development, AI automation, SEO, digital marketing, branding, and cloud solutions.

Hard rules, no exceptions:
- Base every message ONLY on the real lead data provided below. Never invent facts about the business or its owner (no fabricated employee counts, revenue, pain points, or anything not given to you).
- Do not claim Stively has already looked at their website, done an audit, or spoken to them before, unless that is explicitly stated in the data.
- Write like a real salesperson reaching out for the first time - concise, specific, no generic marketing filler ("Hi there! Hope you're doing well!"), no over-promising.
- Every message must reference something real and specific from the data provided (business name, industry, city, source of the lead) - never a generic template with only the name swapped in.
- Recommend only Stively's real services listed above; never invent a service Stively doesn't offer.`;

function buildResponseFormatRules(hasNamedContact: boolean, firstName: string | null): string {
  const linkedinInstruction = hasNamedContact
    ? `a short LinkedIn connection-request note (under 300 characters, no greeting like 'Dear'), addressed to ${firstName} by first name`
    : "a short LinkedIn connection-request note addressed generically to the business (this copy will not actually be sent - write it anyway)";

  return `Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "whatsappMessage": "a short, casual, ready-to-send WhatsApp opening message (2-4 sentences, no email-style greeting/signoff)",
  "emailSubject": "a short, specific email subject line - no clickbait, no excessive punctuation",
  "emailBody": "a professional cold email, 3-5 short paragraphs, with a greeting and a signoff placeholder '[Your name]', ending in one clear call to action",
  "coldCallScript": "a short phone call opening script (what to say in the first 30-45 seconds), written as spoken lines a salesperson would actually say, including a natural opening question",
  "linkedinMessage": "${linkedinInstruction}"
}`;
}

/**
 * Whether this lead has a real named person to address (not the generic
 * "Unknown" placeholder promoteToSalesLead sets when Google Places gives no
 * owner name). Exported so callers can enforce the "no LinkedIn note
 * addressed to nobody" rule themselves rather than trusting a small model
 * to reliably emit a conditional null - see actions/outreach-actions.ts,
 * which nulls out linkedinMessage post-hoc when this is false.
 */
export function leadHasNamedContact(lead: SalesLead): boolean {
  return lead.ownerName.trim().length > 0 && lead.ownerName.trim().toLowerCase() !== "unknown";
}

function formatLeadContext(lead: SalesLead, hasNamedContact: boolean): string {
  return [
    `Business name: ${lead.businessName}`,
    hasNamedContact ? `Contact person: ${lead.ownerName}` : "Contact person: not known by name - do not invent one",
    lead.industry ? `Industry: ${lead.industry}` : "Industry: unknown",
    lead.city || lead.state ? `Location: ${[lead.city, lead.state, lead.country].filter(Boolean).join(", ")}` : `Country: ${lead.country}`,
    lead.website ? `Website: ${lead.website}` : "Has no website on file",
    `How this lead was found: ${lead.source.replace(/_/g, " ").toLowerCase()}`,
    lead.estimatedValue != null ? `Estimated deal size: ~₹${Math.round(lead.estimatedValue / 100).toLocaleString("en-IN")}` : "Estimated deal size: unknown",
    `Contact channels on file: phone ${lead.phone ? "yes" : "no"}, WhatsApp ${lead.whatsapp ? "yes" : "no"}, email ${lead.email ? "yes" : "no"}`,
    `HAS_NAMED_CONTACT: ${hasNamedContact}`,
  ].join("\n");
}

/**
 * Builds the single message array for generateOutreach (one Groq call
 * produces all four channels together, same "single comprehensive pass"
 * discipline used by the Lead Intelligence and Interview evaluators).
 * hasNamedContact drives both the prompt and the "where appropriate" rule
 * for the LinkedIn message - a real ownerName ("Rajesh Kumar") gets one, a
 * placeholder like "Unknown" (set by promoteToSalesLead when no owner name
 * was discoverable) does not, since a LinkedIn connection note has to be
 * addressed to a real person to not read as spam. Never called from a
 * component - see actions/outreach-actions.ts.
 */
export function buildOutreachMessages(lead: SalesLead): Groq.Chat.Completions.ChatCompletionMessageParam[] {
  const hasNamedContact = leadHasNamedContact(lead);
  const firstName = hasNamedContact ? lead.ownerName.trim().split(/\s+/)[0] : null;

  const userContent = [formatLeadContext(lead, hasNamedContact), "", buildResponseFormatRules(hasNamedContact, firstName)].join("\n");

  return [
    { role: "system", content: PERSONA_RULES },
    { role: "user", content: userContent },
  ];
}
